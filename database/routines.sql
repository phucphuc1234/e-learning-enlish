-- Stored procedures are an integration API for a trusted backend.
-- Actor/student IDs must come from authenticated server sessions, never a client claim.
-- End users must not receive direct SQL access, question answer keys or password hashes.
CREATE OR ALTER VIEW dbo.v_ProgramCatalog
AS
SELECT p.id AS program_id,p.name,p.slug,p.description,p.is_active,
 (SELECT COUNT(*) FROM dbo.courses c WHERE c.program_id=p.id AND c.is_published=1) AS published_courses,
 (SELECT COUNT(*) FROM dbo.lessons l JOIN dbo.courses c ON c.id=l.course_id WHERE c.program_id=p.id AND c.is_published=1 AND l.is_published=1) AS published_lessons
FROM dbo.programs p;
GO
CREATE OR ALTER VIEW dbo.v_CourseCatalog
AS
SELECT c.id AS course_id,c.title,c.slug,c.description,c.level,c.price,c.is_free,c.thumbnail,
 c.teacher_id,u.full_name AS teacher_name,c.program_id,p.name AS program_name,
 (SELECT COUNT(*) FROM dbo.lessons l WHERE l.course_id=c.id AND l.is_published=1) AS lessons,
 (SELECT COUNT(*) FROM dbo.exams x WHERE x.course_id=c.id AND x.is_published=1) AS exams,
 (SELECT COUNT(*) FROM dbo.enrollments e WHERE e.course_id=c.id AND e.status IN ('active','completed')) AS students
FROM dbo.courses c JOIN dbo.users u ON u.id=c.teacher_id LEFT JOIN dbo.programs p ON p.id=c.program_id
WHERE c.is_published=1;
GO
CREATE OR ALTER VIEW dbo.v_StudentCourseProgress
AS
SELECT e.student_id,u.full_name AS student_name,e.course_id,c.title,c.teacher_id,e.status,e.enrolled_at,
 COUNT(l.id) AS total_lessons,COALESCE(SUM(CONVERT(INT,pr.is_completed)),0) AS completed_lessons,
 CONVERT(DECIMAL(5,2),COALESCE(100.0*SUM(CONVERT(INT,pr.is_completed))/NULLIF(COUNT(l.id),0),0)) AS completion_percent,
 COALESCE(SUM(CONVERT(BIGINT,pr.time_spent)),0) AS study_seconds,
 (SELECT AVG(a.score) FROM dbo.attempts a WHERE a.student_id=e.student_id AND a.course_id=e.course_id AND a.status='graded') AS average_score
FROM dbo.enrollments e JOIN dbo.users u ON u.id=e.student_id JOIN dbo.courses c ON c.id=e.course_id
LEFT JOIN dbo.lessons l ON l.course_id=c.id AND l.is_published=1
LEFT JOIN dbo.progress pr ON pr.student_id=e.student_id AND pr.lesson_id=l.id
GROUP BY e.student_id,u.full_name,e.course_id,c.title,c.teacher_id,e.status,e.enrolled_at;
GO
CREATE OR ALTER VIEW dbo.v_TeacherDashboard
AS
SELECT u.id AS teacher_id,u.full_name,
 (SELECT COUNT(*) FROM dbo.courses c WHERE c.teacher_id=u.id) AS courses,
 (SELECT COUNT(DISTINCT e.student_id) FROM dbo.enrollments e JOIN dbo.courses c ON c.id=e.course_id WHERE c.teacher_id=u.id AND e.status IN ('active','completed')) AS students,
 (SELECT COUNT(*) FROM dbo.enrollments e JOIN dbo.courses c ON c.id=e.course_id WHERE c.teacher_id=u.id AND e.status='pending') AS pending_enrollments,
 (SELECT COUNT(*) FROM dbo.attempts a JOIN dbo.courses c ON c.id=a.course_id WHERE c.teacher_id=u.id AND a.status='pending_grading') AS pending_grading,
 (SELECT AVG(a.score) FROM dbo.attempts a JOIN dbo.courses c ON c.id=a.course_id WHERE c.teacher_id=u.id AND a.status='graded') AS average_score
FROM dbo.users u WHERE u.role='teacher';
GO
CREATE OR ALTER VIEW dbo.v_AdminDashboard
AS
SELECT
 (SELECT COUNT(*) FROM dbo.users WHERE role='student') AS students,
 (SELECT COUNT(*) FROM dbo.users WHERE role='teacher') AS teachers,
 (SELECT COUNT(*) FROM dbo.programs) AS programs,
 (SELECT COUNT(*) FROM dbo.courses) AS courses,
 (SELECT COUNT(*) FROM dbo.lessons) AS lessons,
 (SELECT COUNT(*) FROM dbo.attempts WHERE submitted_at IS NOT NULL) AS submitted_attempts,
 (SELECT COUNT(*) FROM dbo.attempts WHERE status='pending_grading') AS pending_grading;
GO

CREATE OR ALTER PROCEDURE dbo.usp_EnrollStudent @StudentId INT,@CourseId INT
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF NOT EXISTS(SELECT 1 FROM dbo.users WHERE id=@StudentId AND role='student' AND is_active=1) THROW 51001,N'Học viên không hợp lệ.',1;
 DECLARE @Free BIT;
 SELECT @Free=is_free FROM dbo.courses WHERE id=@CourseId AND is_published=1;
 IF @Free IS NULL THROW 51002,N'Khóa học chưa mở đăng ký.',1;
 BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @Existing VARCHAR(24);
  SELECT @Existing=status FROM dbo.enrollments WITH(UPDLOCK,HOLDLOCK) WHERE student_id=@StudentId AND course_id=@CourseId;
  IF @Existing IS NULL
   INSERT dbo.enrollments(student_id,course_id,status) VALUES(@StudentId,@CourseId,CASE WHEN @Free=1 THEN 'active' ELSE 'pending' END);
  ELSE IF @Existing='dropped'
   UPDATE dbo.enrollments SET status=CASE WHEN @Free=1 THEN 'active' ELSE 'pending' END,enrolled_at=SYSUTCDATETIME() WHERE student_id=@StudentId AND course_id=@CourseId;
  COMMIT TRANSACTION;
  SELECT id,student_id,course_id,status,enrolled_at FROM dbo.enrollments WHERE student_id=@StudentId AND course_id=@CourseId;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; THROW;
 END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_ApproveEnrollment @ActorId INT,@EnrollmentId INT
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF NOT EXISTS(SELECT 1 FROM dbo.enrollments e JOIN dbo.courses c ON c.id=e.course_id JOIN dbo.users u ON u.id=@ActorId
  WHERE e.id=@EnrollmentId AND u.is_active=1 AND (u.role='admin' OR (u.role='teacher' AND c.teacher_id=u.id)))
  THROW 51003,N'Chỉ quản trị hoặc giáo viên phụ trách được duyệt.',1;
 -- Manual enrollment approval only; this is not proof of a payment transaction.
 UPDATE dbo.enrollments SET status='active' WHERE id=@EnrollmentId AND status='pending';
 SELECT id,student_id,course_id,status FROM dbo.enrollments WHERE id=@EnrollmentId;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_RecordLessonProgress
 @StudentId INT,@LessonId INT,@SessionId UNIQUEIDENTIFIER,@Seconds INT,@Complete BIT=0
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF @SessionId IS NULL OR @Seconds IS NULL OR @Seconds NOT BETWEEN 0 AND 21600 THROW 51004,N'Phiên học không hợp lệ (0–21600 giây).',1;
 IF NOT EXISTS(SELECT 1 FROM dbo.lessons l JOIN dbo.courses c ON c.id=l.course_id JOIN dbo.enrollments e ON e.course_id=c.id
  JOIN dbo.users u ON u.id=e.student_id WHERE l.id=@LessonId AND l.is_published=1 AND c.is_published=1 AND e.student_id=@StudentId AND e.status IN ('active','completed') AND u.role='student' AND u.is_active=1)
  THROW 51005,N'Học viên chưa được học bài này.',1;
 BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @OldSeconds INT,@OldStudent INT,@OldLesson INT,@Delta INT;
  SELECT @OldSeconds=seconds,@OldStudent=student_id,@OldLesson=lesson_id FROM dbo.study_sessions WITH(UPDLOCK,HOLDLOCK) WHERE id=@SessionId;
  IF @OldSeconds IS NOT NULL AND (@OldStudent<>@StudentId OR @OldLesson<>@LessonId) THROW 51006,N'Mã phiên học đã thuộc bài hoặc học viên khác.',1;
  SET @Delta=CASE WHEN @Seconds>COALESCE(@OldSeconds,0) THEN @Seconds-COALESCE(@OldSeconds,0) ELSE 0 END;
  IF @OldSeconds IS NULL INSERT dbo.study_sessions(id,student_id,lesson_id,seconds) VALUES(@SessionId,@StudentId,@LessonId,@Seconds);
  ELSE UPDATE dbo.study_sessions SET seconds=seconds+@Delta,updated_at=SYSUTCDATETIME() WHERE id=@SessionId;
  IF EXISTS(SELECT 1 FROM dbo.progress WITH(UPDLOCK,HOLDLOCK) WHERE student_id=@StudentId AND lesson_id=@LessonId)
   UPDATE dbo.progress SET time_spent=time_spent+@Delta,is_completed=CASE WHEN @Complete=1 THEN 1 ELSE is_completed END,
    completed_at=CASE WHEN @Complete=1 THEN COALESCE(completed_at,SYSUTCDATETIME()) ELSE completed_at END,updated_at=SYSUTCDATETIME()
   WHERE student_id=@StudentId AND lesson_id=@LessonId;
  ELSE INSERT dbo.progress(student_id,lesson_id,is_completed,time_spent,completed_at) VALUES(@StudentId,@LessonId,@Complete,@Delta,CASE WHEN @Complete=1 THEN SYSUTCDATETIME() END);
  UPDATE e SET status='completed' FROM dbo.enrollments e JOIN dbo.lessons current_lesson ON current_lesson.course_id=e.course_id AND current_lesson.id=@LessonId
   WHERE e.student_id=@StudentId AND e.status='active' AND NOT EXISTS(SELECT 1 FROM dbo.lessons l LEFT JOIN dbo.progress p ON p.lesson_id=l.id AND p.student_id=@StudentId WHERE l.course_id=e.course_id AND l.is_published=1 AND COALESCE(p.is_completed,0)=0);
  COMMIT TRANSACTION;
  SELECT * FROM dbo.progress WHERE student_id=@StudentId AND lesson_id=@LessonId;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; THROW;
 END CATCH;
END;
GO

-- JSON answer format: {"questionId":answerId,"anotherQuestionId":"text"}.
-- Internal grader uses the saved question snapshot; later teacher edits cannot change a submitted exam.
CREATE OR ALTER PROCEDURE dbo.usp_GradeAttempt @StudentId INT,@AttemptId INT,@AnswersJson NVARCHAR(MAX)
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF @AnswersJson IS NULL OR ISJSON(@AnswersJson)<>1 OR LEFT(LTRIM(@AnswersJson),1)<>N'{' THROW 51007,N'Câu trả lời phải là JSON object.',1;
 BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @Snapshot NVARCHAR(MAX),@Status VARCHAR(24),@Deadline DATETIME2(3),@Kind VARCHAR(16),@Exam INT,@Show BIT=1,@Expired BIT=0;
  SELECT @Snapshot=questions_json,@Status=status,@Deadline=deadline,@Kind=kind,@Exam=exam_id FROM dbo.attempts WITH(UPDLOCK,HOLDLOCK) WHERE id=@AttemptId AND student_id=@StudentId;
  IF @Snapshot IS NULL THROW 51008,N'Không tìm thấy bài làm của học viên.',1;
  IF @Status<>'in_progress' THROW 51009,N'Bài này đã nộp. Không được nộp lại cùng lượt.',1;
  IF NOT EXISTS(SELECT 1 FROM dbo.users WHERE id=@StudentId AND role='student' AND is_active=1) THROW 51010,N'Tài khoản không được hoạt động.',1;
  IF @Kind='exam' AND SYSUTCDATETIME()>@Deadline
  BEGIN
   SET @Expired=1;
   SELECT @AnswersJson=answers_json FROM dbo.attempts WHERE id=@AttemptId;
  END;
  DECLARE @Q TABLE(id INT PRIMARY KEY,content NVARCHAR(MAX),type VARCHAR(32),points DECIMAL(8,2),explanation NVARCHAR(MAX),correct_text NVARCHAR(MAX),answers NVARCHAR(MAX));
  INSERT @Q SELECT id,content,type,points,explanation,correct_text,answers FROM OPENJSON(@Snapshot)
   WITH(id INT,content NVARCHAR(MAX),type VARCHAR(32),points DECIMAL(8,2),explanation NVARCHAR(MAX),correct_text NVARCHAR(MAX),answers NVARCHAR(MAX) AS JSON);
  IF NOT EXISTS(SELECT 1 FROM @Q) THROW 51011,N'Bài làm không có câu hỏi.',1;
  IF EXISTS(SELECT [key] FROM OPENJSON(@AnswersJson) GROUP BY [key] HAVING COUNT(*)>1)
   OR EXISTS(SELECT 1 FROM OPENJSON(@AnswersJson) a WHERE a.type NOT IN(0,1,2) OR NOT EXISTS(SELECT 1 FROM @Q q WHERE CONVERT(NVARCHAR(20),q.id)=a.[key]))
   THROW 51012,N'JSON có câu hỏi lạ, khóa trùng hoặc kiểu dữ liệu không hợp lệ.',1;
  DECLARE @D TABLE(questionId INT PRIMARY KEY,question_content NVARCHAR(MAX),type VARCHAR(32),points DECIMAL(8,2),selectedAnswerId INT,selected_answer NVARCHAR(MAX),correctAnswerId INT,correct_answer NVARCHAR(MAX),isCorrect BIT,explanation NVARCHAR(MAX),earnedPoints DECIMAL(8,2),needs_grading BIT);
  INSERT @D
  SELECT q.id,q.content,q.type,q.points,CASE WHEN correct_choice.id IS NOT NULL THEN TRY_CONVERT(INT,submitted.value) END,
   COALESCE(selected_choice.content,submitted.value,N''),correct_choice.id,COALESCE(correct_choice.content,q.correct_text),
   CONVERT(BIT,CASE WHEN q.type IN('essay','speaking') THEN 0 ELSE scored.ok END),q.explanation,
   CASE WHEN q.type IN('essay','speaking') THEN 0 WHEN scored.ok=1 THEN q.points ELSE 0 END,
   CONVERT(BIT,CASE WHEN q.type IN('essay','speaking') THEN 1 ELSE 0 END)
  FROM @Q q
  OUTER APPLY(SELECT value FROM OPENJSON(@AnswersJson) a WHERE a.[key]=CONVERT(NVARCHAR(20),q.id)) submitted
  OUTER APPLY(SELECT TOP(1) id,content FROM OPENJSON(q.answers) WITH(id INT,content NVARCHAR(MAX),is_correct BIT) a WHERE is_correct=1) correct_choice
  OUTER APPLY(SELECT TOP(1) content FROM OPENJSON(q.answers) WITH(id INT,content NVARCHAR(MAX)) a WHERE id=TRY_CONVERT(INT,submitted.value)) selected_choice
  CROSS APPLY(SELECT CASE WHEN correct_choice.id IS NOT NULL AND TRY_CONVERT(INT,submitted.value)=correct_choice.id THEN 1
   WHEN correct_choice.id IS NULL AND q.type NOT IN('essay','speaking') AND submitted.value IS NOT NULL
    AND EXISTS(SELECT 1 FROM STRING_SPLIT(q.correct_text,N'|') s WHERE LOWER(LTRIM(RTRIM(s.value))) COLLATE Latin1_General_100_CI_AS_SC=LOWER(LTRIM(RTRIM(submitted.value))) COLLATE Latin1_General_100_CI_AS_SC) THEN 1 ELSE 0 END AS ok) scored;
  DECLARE @Total DECIMAL(12,2),@Earned DECIMAL(12,2),@Pending BIT,@Score DECIMAL(5,2),@Details NVARCHAR(MAX),@Result NVARCHAR(MAX);
  SELECT @Total=SUM(points),@Earned=SUM(earnedPoints),@Pending=MAX(CONVERT(INT,needs_grading)) FROM @D;
  SET @Score=CONVERT(DECIMAL(5,2),100.0*@Earned/NULLIF(@Total,0));
  SET @Details=(SELECT questionId,questionId AS question_id,question_content,type,points,selectedAnswerId,selected_answer,correctAnswerId,correct_answer,isCorrect,isCorrect AS is_correct,explanation,earnedPoints,needs_grading FROM @D ORDER BY questionId FOR JSON PATH,INCLUDE_NULL_VALUES);
  SET @Result=(SELECT @Score AS scorePercentage,(SELECT COUNT(*) FROM @D WHERE isCorrect=1) AS correctCount,(SELECT COUNT(*) FROM @D) AS totalQuestions,@Earned AS earnedPoints,@Total AS totalPoints,@Pending AS pending_grading,JSON_QUERY(@Details) AS details,JSON_QUERY(@Details) AS questions FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
  UPDATE dbo.attempts SET answers_json=@AnswersJson,result_json=@Result,status=CASE WHEN @Pending=1 THEN 'pending_grading' ELSE 'graded' END,score=CASE WHEN @Pending=0 THEN @Score END,submitted_at=SYSUTCDATETIME() WHERE id=@AttemptId;
  IF @Exam IS NOT NULL SELECT @Show=show_answer_after FROM dbo.exams WHERE id=@Exam;
  COMMIT TRANSACTION;
  SELECT id,status,score,submitted_at,@Expired AS deadline_reached,CASE WHEN @Show=1 THEN result_json END AS result_json FROM dbo.attempts WHERE id=@AttemptId;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; THROW;
 END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_SubmitExercise @StudentId INT,@ExerciseId INT,@AnswersJson NVARCHAR(MAX)
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 DECLARE @Course INT,@Title NVARCHAR(300),@Snapshot NVARCHAR(MAX),@AttemptId INT;
 SELECT @Course=c.id,@Title=x.title FROM dbo.exercises x JOIN dbo.lessons l ON l.id=x.lesson_id JOIN dbo.courses c ON c.id=l.course_id
  JOIN dbo.enrollments e ON e.course_id=c.id AND e.student_id=@StudentId JOIN dbo.users u ON u.id=e.student_id
  WHERE x.id=@ExerciseId AND x.is_published=1 AND l.is_published=1 AND c.is_published=1 AND e.status IN('active','completed') AND u.role='student' AND u.is_active=1;
 IF @Course IS NULL THROW 51013,N'Không được làm bài tập này.',1;
 SET @Snapshot=(SELECT q.id,q.exercise_id,q.content,q.type,q.points,q.explanation,q.correct_text,q.order_index,
  JSON_QUERY((SELECT a.id,a.question_id,a.content,a.is_correct FROM dbo.answers a WHERE a.question_id=q.id ORDER BY a.id FOR JSON PATH)) AS answers
  FROM dbo.questions q WHERE q.exercise_id=@ExerciseId ORDER BY q.order_index,q.id FOR JSON PATH);
 IF @Snapshot=N'[]' THROW 51014,N'Bài tập chưa có câu hỏi.',1;
 BEGIN TRY
  BEGIN TRANSACTION;
  INSERT dbo.attempts(student_id,course_id,exercise_id,kind,title,started_at,questions_json) VALUES(@StudentId,@Course,@ExerciseId,'exercise',@Title,SYSUTCDATETIME(),@Snapshot);
  SET @AttemptId=CONVERT(INT,SCOPE_IDENTITY());
  EXEC dbo.usp_GradeAttempt @StudentId=@StudentId,@AttemptId=@AttemptId,@AnswersJson=@AnswersJson;
  COMMIT TRANSACTION;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; THROW;
 END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_StartExam @StudentId INT,@ExamId INT
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 DECLARE @Course INT,@Title NVARCHAR(300),@Minutes INT,@Max INT,@Attempt INT,@Snapshot NVARCHAR(MAX),@LockResult INT,@Resource NVARCHAR(255);
 SELECT @Course=c.id,@Title=x.title,@Minutes=x.time_limit,@Max=x.max_attempts FROM dbo.exams x JOIN dbo.courses c ON c.id=x.course_id
  JOIN dbo.enrollments e ON e.course_id=c.id AND e.student_id=@StudentId JOIN dbo.users u ON u.id=e.student_id
  WHERE x.id=@ExamId AND x.is_published=1 AND c.is_published=1 AND e.status IN('active','completed') AND u.role='student' AND u.is_active=1;
 IF @Course IS NULL THROW 51015,N'Không được thi bài này.',1;
 BEGIN TRY
  BEGIN TRANSACTION;
  SET @Resource=CONCAT(N'exam:',@StudentId,N':',@ExamId);
  EXEC @LockResult=sys.sp_getapplock @Resource=@Resource,@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;
  IF @LockResult<0 THROW 51016,N'Bài thi đang được mở ở phiên khác. Thử lại.',1;
  SELECT @Attempt=id FROM dbo.attempts WITH(UPDLOCK,HOLDLOCK) WHERE student_id=@StudentId AND exam_id=@ExamId AND status='in_progress';
  IF @Attempt IS NULL
  BEGIN
   IF (SELECT COUNT(*) FROM dbo.attempts WHERE student_id=@StudentId AND exam_id=@ExamId)>=@Max THROW 51017,N'Đã hết số lượt thi.',1;
   SET @Snapshot=(SELECT q.id,q.exercise_id,q.content,q.type,q.points,q.explanation,q.correct_text,eq.order_index,
    JSON_QUERY((SELECT a.id,a.question_id,a.content,a.is_correct FROM dbo.answers a WHERE a.question_id=q.id ORDER BY a.id FOR JSON PATH)) AS answers
    FROM dbo.exam_questions eq JOIN dbo.questions q ON q.id=eq.question_id WHERE eq.exam_id=@ExamId ORDER BY eq.order_index,q.id FOR JSON PATH);
   IF @Snapshot=N'[]' THROW 51018,N'Bài thi chưa có câu hỏi.',1;
   INSERT dbo.attempts(student_id,course_id,exam_id,kind,title,started_at,deadline,questions_json)
    VALUES(@StudentId,@Course,@ExamId,'exam',@Title,SYSUTCDATETIME(),DATEADD(MINUTE,@Minutes,SYSUTCDATETIME()),@Snapshot);
   SET @Attempt=CONVERT(INT,SCOPE_IDENTITY());
  END;
  COMMIT TRANSACTION;
  -- Return public questions only; never send correct_text, is_correct or explanations before submission.
  SELECT a.id,a.exam_id,a.status,a.started_at,a.deadline,a.answers_json,
   (SELECT q.id,q.content,q.type,q.points,q.order_index,JSON_QUERY((SELECT o.id,o.content FROM OPENJSON(q.answers) WITH(id INT,content NVARCHAR(MAX)) o FOR JSON PATH)) AS answers
    FROM OPENJSON(a.questions_json) WITH(id INT,content NVARCHAR(MAX),type VARCHAR(32),points DECIMAL(8,2),order_index INT,answers NVARCHAR(MAX) AS JSON) q ORDER BY q.order_index,q.id FOR JSON PATH) AS public_questions_json
   FROM dbo.attempts a WHERE a.id=@Attempt;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; THROW;
 END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_SaveExamAnswers @StudentId INT,@AttemptId INT,@AnswersJson NVARCHAR(MAX)
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF @AnswersJson IS NULL OR ISJSON(@AnswersJson)<>1 OR LEFT(LTRIM(@AnswersJson),1)<>N'{' THROW 51019,N'Câu trả lời phải là JSON object.',1;
 BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @Snapshot NVARCHAR(MAX);
  SELECT @Snapshot=a.questions_json FROM dbo.attempts a WITH(UPDLOCK,HOLDLOCK) JOIN dbo.users u ON u.id=a.student_id
   WHERE a.id=@AttemptId AND a.student_id=@StudentId AND a.kind='exam' AND a.status='in_progress' AND a.deadline>=SYSUTCDATETIME() AND u.is_active=1 AND u.role='student';
  IF @Snapshot IS NULL THROW 51020,N'Bài thi không hợp lệ hoặc đã hết giờ.',1;
  IF EXISTS(SELECT [key] FROM OPENJSON(@AnswersJson) GROUP BY [key] HAVING COUNT(*)>1)
   OR EXISTS(SELECT 1 FROM OPENJSON(@AnswersJson) a WHERE a.type NOT IN(0,1,2) OR NOT EXISTS(SELECT 1 FROM OPENJSON(@Snapshot) WITH(id INT) q WHERE CONVERT(NVARCHAR(20),q.id)=a.[key]))
   THROW 51021,N'Câu trả lời có câu hỏi lạ hoặc giá trị không hợp lệ.',1;
  UPDATE dbo.attempts SET answers_json=@AnswersJson WHERE id=@AttemptId;
  COMMIT TRANSACTION;
  SELECT @AttemptId AS attempt_id,N'Đã lưu' AS result;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; THROW;
 END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_SubmitExam @StudentId INT,@AttemptId INT,@AnswersJson NVARCHAR(MAX)
AS
BEGIN
 SET NOCOUNT ON;
 IF NOT EXISTS(SELECT 1 FROM dbo.attempts WHERE id=@AttemptId AND student_id=@StudentId AND kind='exam') THROW 51022,N'Không tìm thấy lượt thi.',1;
 EXEC dbo.usp_GradeAttempt @StudentId=@StudentId,@AttemptId=@AttemptId,@AnswersJson=@AnswersJson;
END;
GO

-- Grade payload: [{"questionId":123,"earnedPoints":2.5,"feedback":"Nhận xét"},...].
-- All manual questions must be graded; objective points cannot be overridden here.
CREATE OR ALTER PROCEDURE dbo.usp_GradeManualAttempt @ActorId INT,@AttemptId INT,@GradesJson NVARCHAR(MAX),@Feedback NVARCHAR(MAX)=N''
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF @GradesJson IS NULL OR ISJSON(@GradesJson)<>1 OR LEFT(LTRIM(@GradesJson),1)<>N'[' THROW 51023,N'Điểm phải là JSON array.',1;
 IF NOT EXISTS(SELECT 1 FROM dbo.attempts a JOIN dbo.courses c ON c.id=a.course_id JOIN dbo.users u ON u.id=@ActorId WHERE a.id=@AttemptId AND u.is_active=1 AND (u.role='admin' OR (u.role='teacher' AND c.teacher_id=u.id)))
  THROW 51024,N'Không có quyền chấm bài này.',1;
 BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @Result NVARCHAR(MAX),@Status VARCHAR(24),@Details NVARCHAR(MAX),@Total DECIMAL(12,2),@Earned DECIMAL(12,2),@Score DECIMAL(5,2);
  SELECT @Result=result_json,@Status=status FROM dbo.attempts WITH(UPDLOCK,HOLDLOCK) WHERE id=@AttemptId;
  IF @Status<>'pending_grading' THROW 51025,N'Bài không ở trạng thái chờ chấm.',1;
  DECLARE @Grades TABLE(questionId INT PRIMARY KEY,earnedPoints DECIMAL(8,2),feedback NVARCHAR(MAX));
  INSERT @Grades SELECT questionId,earnedPoints,feedback FROM OPENJSON(@GradesJson) WITH(questionId INT,earnedPoints DECIMAL(8,2),feedback NVARCHAR(MAX));
  DECLARE @D TABLE(idx INT PRIMARY KEY,questionId INT,points DECIMAL(8,2),earnedPoints DECIMAL(8,2),needs_grading BIT,detail NVARCHAR(MAX));
  INSERT @D SELECT CONVERT(INT,j.[key]),d.questionId,d.points,d.earnedPoints,d.needs_grading,j.value FROM OPENJSON(@Result,'$.details') j
   CROSS APPLY OPENJSON(j.value) WITH(questionId INT,points DECIMAL(8,2),earnedPoints DECIMAL(8,2),needs_grading BIT) d;
  IF EXISTS(SELECT 1 FROM @D d LEFT JOIN @Grades g ON g.questionId=d.questionId WHERE d.needs_grading=1 AND (g.questionId IS NULL OR g.earnedPoints IS NULL OR g.earnedPoints<0 OR g.earnedPoints>d.points))
   OR EXISTS(SELECT 1 FROM @Grades g LEFT JOIN @D d ON d.questionId=g.questionId WHERE d.questionId IS NULL OR d.needs_grading<>1)
   THROW 51026,N'Cần chấm đủ phần tự luận/nói và điểm trong giới hạn từng câu.',1;
  UPDATE d SET earnedPoints=g.earnedPoints,needs_grading=0,
   detail=JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(d.detail,'$.earnedPoints',g.earnedPoints),'$.needs_grading',CONVERT(BIT,0)),'$.teacher_feedback',COALESCE(g.feedback,N''))
   FROM @D d JOIN @Grades g ON g.questionId=d.questionId;
  SELECT @Total=SUM(points),@Earned=SUM(earnedPoints) FROM @D;
  SET @Score=CONVERT(DECIMAL(5,2),100.0*@Earned/NULLIF(@Total,0));
  SELECT @Details=N'['+STRING_AGG(CONVERT(NVARCHAR(MAX),detail),N',') WITHIN GROUP(ORDER BY idx)+N']' FROM @D;
  SET @Result=JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(@Result,'$.details',JSON_QUERY(@Details)),'$.questions',JSON_QUERY(@Details)),'$.earnedPoints',@Earned),'$.scorePercentage',@Score),'$.pending_grading',CONVERT(BIT,0));
  UPDATE dbo.attempts SET result_json=@Result,status='graded',score=@Score,feedback=@Feedback,graded_by=@ActorId WHERE id=@AttemptId;
  INSERT dbo.notifications(user_id,title,message,type) SELECT student_id,N'Giáo viên đã chấm bài',CONCAT(title,N': ',CONVERT(NVARCHAR(20),@Score),N'/100. Xem nhận xét để ôn tập.'),'result' FROM dbo.attempts WHERE id=@AttemptId;
  COMMIT TRANSACTION;
  SELECT id,status,score,feedback,graded_by,result_json FROM dbo.attempts WHERE id=@AttemptId;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; THROW;
 END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_GenerateLearningReport
 @StudentId INT,@ReportType VARCHAR(16),@PeriodStart DATE,@ReturnResult BIT=1
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON;
 IF @ReportType IS NULL OR @ReportType NOT IN('weekly','monthly') OR @PeriodStart IS NULL THROW 51027,N'Kỳ báo cáo không hợp lệ.',1;
 IF NOT EXISTS(SELECT 1 FROM dbo.users WHERE id=@StudentId AND role='student') THROW 51028,N'Không tìm thấy học viên.',1;
 IF (@ReportType='monthly' AND DAY(@PeriodStart)<>1) OR (@ReportType='weekly' AND DATEDIFF(DAY,CONVERT(DATE,'19000101',112),@PeriodStart)%7<>0)
  THROW 51029,N'Kỳ tuần bắt đầu thứ Hai; kỳ tháng bắt đầu ngày 1.',1;
 DECLARE @End DATE=CASE WHEN @ReportType='weekly' THEN DATEADD(DAY,7,@PeriodStart) ELSE DATEADD(MONTH,1,@PeriodStart) END;
 DECLARE @From DATETIME2(3)=DATEADD(HOUR,-7,CONVERT(DATETIME2(3),@PeriodStart)),@To DATETIME2(3)=DATEADD(HOUR,-7,CONVERT(DATETIME2(3),@End));
 DECLARE @Study BIGINT,@Lessons INT,@Attempts INT,@Pending INT,@Average DECIMAL(5,2),@Graded INT,@Data NVARCHAR(MAX),@Id INT;
 SELECT @Study=COALESCE(SUM(CONVERT(BIGINT,seconds)),0) FROM dbo.study_sessions WHERE student_id=@StudentId AND created_at>=@From AND created_at<@To;
 SELECT @Lessons=COUNT(*) FROM dbo.progress WHERE student_id=@StudentId AND is_completed=1 AND completed_at>=@From AND completed_at<@To;
 SELECT @Attempts=COUNT(*),@Pending=COALESCE(SUM(CASE WHEN status='pending_grading' THEN 1 ELSE 0 END),0),@Graded=COALESCE(SUM(CASE WHEN status='graded' THEN 1 ELSE 0 END),0),@Average=AVG(CASE WHEN status='graded' THEN score END)
  FROM dbo.attempts WHERE student_id=@StudentId AND submitted_at>=@From AND submitted_at<@To;
 SET @Data=(SELECT @StudentId AS student_id,@ReportType AS report_type,@PeriodStart AS period_start,DATEADD(DAY,-1,@End) AS period_end,@Study AS study_seconds,@Lessons AS completed_lessons,@Attempts AS submitted_attempts,@Graded AS graded_attempts,@Pending AS pending_grading,@Average AS average_score,
  CASE WHEN @Attempts=0 THEN N'Hoàn thành bài tập sau mỗi bài học để có dữ liệu đánh giá.' WHEN @Pending>0 THEN N'Đọc lời giải; một số phần viết/nói đang chờ giáo viên chấm.' WHEN @Average<60 THEN N'Ôn lại câu chưa đúng và luyện lại từng chủ đề.' WHEN @Average>=80 THEN N'Duy trì học đều và thử bài có độ khó cao hơn.' ELSE N'Tiếp tục lộ trình, kết hợp đọc, nghe, viết và nói.' END AS recommendation,
  JSON_QUERY((SELECT a.id,a.title,a.kind,a.status,a.score,a.submitted_at FROM dbo.attempts a WHERE a.student_id=@StudentId AND a.submitted_at>=@From AND a.submitted_at<@To ORDER BY a.submitted_at FOR JSON PATH,INCLUDE_NULL_VALUES)) AS attempts
  FOR JSON PATH,WITHOUT_ARRAY_WRAPPER,INCLUDE_NULL_VALUES);
 BEGIN TRY
  BEGIN TRANSACTION;
  SELECT @Id=id FROM dbo.learning_reports WITH(UPDLOCK,HOLDLOCK) WHERE student_id=@StudentId AND report_type=@ReportType AND period_start=@PeriodStart AND course_id IS NULL;
  IF @Id IS NULL
  BEGIN
   INSERT dbo.learning_reports(student_id,report_type,period_start,period_end,data_json) VALUES(@StudentId,@ReportType,@PeriodStart,DATEADD(DAY,-1,@End),@Data);
   SET @Id=CONVERT(INT,SCOPE_IDENTITY());
   INSERT dbo.notifications(user_id,title,message,type) VALUES(@StudentId,CASE WHEN @ReportType='weekly' THEN N'Báo cáo tuần đã sẵn sàng' ELSE N'Báo cáo tháng đã sẵn sàng' END,CONCAT(N'Kỳ ',CONVERT(NVARCHAR(10),@PeriodStart,23),N': ',@Lessons,N' bài học hoàn thành, ',@Attempts,N' bài đã nộp.'),'result');
  END
  ELSE UPDATE dbo.learning_reports SET period_end=DATEADD(DAY,-1,@End),data_json=@Data,generated_at=SYSUTCDATETIME() WHERE id=@Id;
  COMMIT TRANSACTION;
  IF @ReturnResult=1 SELECT * FROM dbo.learning_reports WHERE id=@Id;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; THROW;
 END CATCH;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_GenerateDueReports @AsOf DATE=NULL
AS
BEGIN
 SET NOCOUNT ON;
 SET @AsOf=COALESCE(@AsOf,CONVERT(DATE,DATEADD(HOUR,7,SYSUTCDATETIME())));
 DECLARE @Week DATE=DATEADD(DAY,-7-DATEDIFF(DAY,CONVERT(DATE,'19000101',112),@AsOf)%7,@AsOf);
 DECLARE @Month DATE=DATEADD(MONTH,-1,DATEFROMPARTS(YEAR(@AsOf),MONTH(@AsOf),1)),@Student INT,@Count INT=0;
 DECLARE Students CURSOR LOCAL FAST_FORWARD FOR SELECT id FROM dbo.users WHERE role='student' AND is_active=1;
 OPEN Students;
 FETCH NEXT FROM Students INTO @Student;
 WHILE @@FETCH_STATUS=0
 BEGIN
  EXEC dbo.usp_GenerateLearningReport @StudentId=@Student,@ReportType='weekly',@PeriodStart=@Week,@ReturnResult=0;
  EXEC dbo.usp_GenerateLearningReport @StudentId=@Student,@ReportType='monthly',@PeriodStart=@Month,@ReturnResult=0;
  SET @Count+=2;
  FETCH NEXT FROM Students INTO @Student;
 END;
 CLOSE Students;
 DEALLOCATE Students;
 SELECT @Count AS reports_refreshed;
END;
GO
