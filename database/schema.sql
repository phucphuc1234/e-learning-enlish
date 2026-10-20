-- English studio, SQL Server 2017+. Run inside the selected application database.
-- Idempotent, additive schema. Existing application records are never cleared.
SET XACT_ABORT ON;
IF OBJECT_ID(N'dbo.users',N'U') IS NULL
CREATE TABLE dbo.users (
 id INT IDENTITY(1,1) CONSTRAINT PK_users PRIMARY KEY,
 full_name NVARCHAR(120) NOT NULL, email NVARCHAR(254) NOT NULL CONSTRAINT UQ_users_email UNIQUE,
 password_hash VARCHAR(200) NOT NULL, role VARCHAR(16) NOT NULL CONSTRAINT CK_users_role CHECK(role IN ('admin','teacher','student')),
 phone NVARCHAR(30) NOT NULL DEFAULT N'', avatar NVARCHAR(2000) NOT NULL DEFAULT N'',
 is_active BIT NOT NULL DEFAULT 1, created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID(N'dbo.sessions',N'U') IS NULL
CREATE TABLE dbo.sessions (
 token_hash CHAR(64) CONSTRAINT PK_sessions PRIMARY KEY,
 user_id INT NOT NULL CONSTRAINT FK_sessions_user REFERENCES dbo.users(id), expires_at DATETIME2(3) NOT NULL
);
IF OBJECT_ID(N'dbo.programs',N'U') IS NULL
CREATE TABLE dbo.programs (
 id INT IDENTITY(1,1) CONSTRAINT PK_programs PRIMARY KEY, name NVARCHAR(200) NOT NULL,
 slug VARCHAR(300) NOT NULL CONSTRAINT UQ_programs_slug UNIQUE, description NVARCHAR(MAX) NOT NULL DEFAULT N'',
 is_active BIT NOT NULL DEFAULT 1, created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID(N'dbo.courses',N'U') IS NULL
CREATE TABLE dbo.courses (
 id INT IDENTITY(1,1) CONSTRAINT PK_courses PRIMARY KEY,
 teacher_id INT NOT NULL CONSTRAINT FK_courses_teacher REFERENCES dbo.users(id),
 program_id INT NULL CONSTRAINT FK_courses_program REFERENCES dbo.programs(id),
 title NVARCHAR(300) NOT NULL, slug VARCHAR(300) NOT NULL CONSTRAINT UQ_courses_slug UNIQUE,
 description NVARCHAR(MAX) NOT NULL DEFAULT N'', thumbnail NVARCHAR(2000) NOT NULL DEFAULT N'',
 level VARCHAR(24) NOT NULL DEFAULT 'beginner', price DECIMAL(12,2) NOT NULL DEFAULT 0 CONSTRAINT CK_courses_price CHECK(price>=0),
 is_free BIT NOT NULL DEFAULT 1, is_published BIT NOT NULL DEFAULT 0,
 created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID(N'dbo.lessons',N'U') IS NULL
CREATE TABLE dbo.lessons (
 id INT IDENTITY(1,1) CONSTRAINT PK_lessons PRIMARY KEY,
 course_id INT NOT NULL CONSTRAINT FK_lessons_course REFERENCES dbo.courses(id),
 title NVARCHAR(300) NOT NULL, content NVARCHAR(MAX) NOT NULL DEFAULT N'',
 video_url NVARCHAR(2000) NOT NULL DEFAULT N'', audio_url NVARCHAR(2000) NOT NULL DEFAULT N'', document_url NVARCHAR(2000) NOT NULL DEFAULT N'',
 duration INT NOT NULL DEFAULT 15 CONSTRAINT CK_lessons_duration CHECK(duration>=0),
 order_index INT NOT NULL DEFAULT 1, is_published BIT NOT NULL DEFAULT 0, created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID(N'dbo.exercises',N'U') IS NULL
CREATE TABLE dbo.exercises (
 id INT IDENTITY(1,1) CONSTRAINT PK_exercises PRIMARY KEY,
 lesson_id INT NOT NULL CONSTRAINT FK_exercises_lesson REFERENCES dbo.lessons(id),
 title NVARCHAR(300) NOT NULL, description NVARCHAR(MAX) NOT NULL DEFAULT N'', type VARCHAR(32) NOT NULL DEFAULT 'multiple_choice',
 difficulty VARCHAR(16) NOT NULL DEFAULT 'medium', time_limit INT NOT NULL DEFAULT 15,
 is_published BIT NOT NULL DEFAULT 0, created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID(N'dbo.questions',N'U') IS NULL
CREATE TABLE dbo.questions (
 id INT IDENTITY(1,1) CONSTRAINT PK_questions PRIMARY KEY,
 exercise_id INT NOT NULL CONSTRAINT FK_questions_exercise REFERENCES dbo.exercises(id),
 content NVARCHAR(MAX) NOT NULL, type VARCHAR(32) NOT NULL DEFAULT 'multiple_choice',
 points DECIMAL(8,2) NOT NULL DEFAULT 1 CONSTRAINT CK_questions_points CHECK(points>0),
 explanation NVARCHAR(MAX) NOT NULL DEFAULT N'', correct_text NVARCHAR(MAX) NOT NULL DEFAULT N'',
 order_index INT NOT NULL DEFAULT 1, created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID(N'dbo.answers',N'U') IS NULL
CREATE TABLE dbo.answers (
 id INT IDENTITY(1,1) CONSTRAINT PK_answers PRIMARY KEY,
 question_id INT NOT NULL CONSTRAINT FK_answers_question REFERENCES dbo.questions(id),
 content NVARCHAR(3000) NOT NULL, is_correct BIT NOT NULL DEFAULT 0
);
IF OBJECT_ID(N'dbo.exams',N'U') IS NULL
CREATE TABLE dbo.exams (
 id INT IDENTITY(1,1) CONSTRAINT PK_exams PRIMARY KEY,
 course_id INT NOT NULL CONSTRAINT FK_exams_course REFERENCES dbo.courses(id),
 title NVARCHAR(300) NOT NULL, description NVARCHAR(MAX) NOT NULL DEFAULT N'', type VARCHAR(24) NOT NULL DEFAULT 'quiz',
 time_limit INT NOT NULL DEFAULT 30 CONSTRAINT CK_exams_time CHECK(time_limit>0),
 pass_score DECIMAL(5,2) NOT NULL DEFAULT 60 CONSTRAINT CK_exams_pass CHECK(pass_score BETWEEN 0 AND 100),
 max_attempts INT NOT NULL DEFAULT 3 CONSTRAINT CK_exams_attempts CHECK(max_attempts>0),
 shuffle_questions BIT NOT NULL DEFAULT 0, show_answer_after BIT NOT NULL DEFAULT 1, is_published BIT NOT NULL DEFAULT 0,
 created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID(N'dbo.exam_questions',N'U') IS NULL
CREATE TABLE dbo.exam_questions (
 exam_id INT NOT NULL CONSTRAINT FK_exam_questions_exam REFERENCES dbo.exams(id),
 question_id INT NOT NULL CONSTRAINT FK_exam_questions_question REFERENCES dbo.questions(id),
 order_index INT NOT NULL DEFAULT 1, CONSTRAINT PK_exam_questions PRIMARY KEY(exam_id,question_id)
);
IF OBJECT_ID(N'dbo.enrollments',N'U') IS NULL
CREATE TABLE dbo.enrollments (
 id INT IDENTITY(1,1) CONSTRAINT PK_enrollments PRIMARY KEY,
 student_id INT NOT NULL CONSTRAINT FK_enrollments_student REFERENCES dbo.users(id),
 course_id INT NOT NULL CONSTRAINT FK_enrollments_course REFERENCES dbo.courses(id),
 status VARCHAR(24) NOT NULL DEFAULT 'active' CONSTRAINT CK_enrollments_status CHECK(status IN ('pending','active','completed','dropped')),
 enrolled_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(), CONSTRAINT UQ_enrollments_student_course UNIQUE(student_id,course_id)
);
IF OBJECT_ID(N'dbo.progress',N'U') IS NULL
CREATE TABLE dbo.progress (
 student_id INT NOT NULL CONSTRAINT FK_progress_student REFERENCES dbo.users(id),
 lesson_id INT NOT NULL CONSTRAINT FK_progress_lesson REFERENCES dbo.lessons(id),
 is_completed BIT NOT NULL DEFAULT 0, time_spent INT NOT NULL DEFAULT 0 CONSTRAINT CK_progress_time CHECK(time_spent>=0), completed_at DATETIME2(3) NULL,
 updated_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(), CONSTRAINT PK_progress PRIMARY KEY(student_id,lesson_id)
);
IF OBJECT_ID(N'dbo.attempts',N'U') IS NULL
CREATE TABLE dbo.attempts (
 id INT IDENTITY(1,1) CONSTRAINT PK_attempts PRIMARY KEY,
 student_id INT NOT NULL CONSTRAINT FK_attempts_student REFERENCES dbo.users(id),
 course_id INT NULL CONSTRAINT FK_attempts_course REFERENCES dbo.courses(id),
 exercise_id INT NULL CONSTRAINT FK_attempts_exercise REFERENCES dbo.exercises(id),
 exam_id INT NULL CONSTRAINT FK_attempts_exam REFERENCES dbo.exams(id),
 kind VARCHAR(16) NOT NULL CONSTRAINT CK_attempts_kind CHECK(kind IN ('exercise','exam')),
 title NVARCHAR(300) NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'in_progress' CONSTRAINT CK_attempts_status CHECK(status IN ('in_progress','pending_grading','graded')),
 started_at DATETIME2(3) NOT NULL, deadline DATETIME2(3) NULL, submitted_at DATETIME2(3) NULL,
 questions_json NVARCHAR(MAX) NOT NULL, answers_json NVARCHAR(MAX) NOT NULL DEFAULT N'{}', result_json NVARCHAR(MAX) NULL,
 score DECIMAL(5,2) NULL CONSTRAINT CK_attempts_score CHECK(score BETWEEN 0 AND 100), feedback NVARCHAR(MAX) NOT NULL DEFAULT N'', graded_by INT NULL CONSTRAINT FK_attempts_grader REFERENCES dbo.users(id),
 CONSTRAINT CK_attempts_source CHECK((kind='exercise' AND exercise_id IS NOT NULL AND exam_id IS NULL) OR (kind='exam' AND exam_id IS NOT NULL AND exercise_id IS NULL)),
 CONSTRAINT CK_attempts_json CHECK(ISJSON(questions_json)=1 AND ISJSON(answers_json)=1 AND (result_json IS NULL OR ISJSON(result_json)=1))
);
IF OBJECT_ID(N'dbo.notifications',N'U') IS NULL
CREATE TABLE dbo.notifications (
 id INT IDENTITY(1,1) CONSTRAINT PK_notifications PRIMARY KEY,
 user_id INT NOT NULL CONSTRAINT FK_notifications_user REFERENCES dbo.users(id),
 title NVARCHAR(300) NOT NULL, message NVARCHAR(MAX) NOT NULL, type VARCHAR(24) NOT NULL DEFAULT 'info',
 is_read BIT NOT NULL DEFAULT 0, created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID(N'dbo.learning_paths',N'U') IS NULL
CREATE TABLE dbo.learning_paths (
 id INT IDENTITY(1,1) CONSTRAINT PK_learning_paths PRIMARY KEY,
 teacher_id INT NOT NULL CONSTRAINT FK_learning_paths_teacher REFERENCES dbo.users(id),
 program_id INT NULL CONSTRAINT FK_learning_paths_program REFERENCES dbo.programs(id),
 title NVARCHAR(300) NOT NULL, description NVARCHAR(MAX) NOT NULL DEFAULT N'', level VARCHAR(24) NOT NULL DEFAULT 'beginner',
 estimated_duration INT NOT NULL DEFAULT 30, is_published BIT NOT NULL DEFAULT 0, created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID(N'dbo.path_courses',N'U') IS NULL
CREATE TABLE dbo.path_courses (
 path_id INT NOT NULL CONSTRAINT FK_path_courses_path REFERENCES dbo.learning_paths(id),
 course_id INT NOT NULL CONSTRAINT FK_path_courses_course REFERENCES dbo.courses(id),
 order_index INT NOT NULL DEFAULT 1, CONSTRAINT PK_path_courses PRIMARY KEY(path_id,course_id)
);
IF OBJECT_ID(N'dbo.study_sessions',N'U') IS NULL
CREATE TABLE dbo.study_sessions (
 id UNIQUEIDENTIFIER CONSTRAINT PK_study_sessions PRIMARY KEY,
 student_id INT NOT NULL CONSTRAINT FK_study_sessions_student REFERENCES dbo.users(id),
 lesson_id INT NOT NULL CONSTRAINT FK_study_sessions_lesson REFERENCES dbo.lessons(id),
 seconds INT NOT NULL DEFAULT 0 CONSTRAINT CK_study_sessions_seconds CHECK(seconds>=0), created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID(N'dbo.learning_reports',N'U') IS NULL
CREATE TABLE dbo.learning_reports (
 id INT IDENTITY(1,1) CONSTRAINT PK_learning_reports PRIMARY KEY,
 student_id INT NOT NULL CONSTRAINT FK_learning_reports_student REFERENCES dbo.users(id),
 course_id INT NULL CONSTRAINT FK_learning_reports_course REFERENCES dbo.courses(id),
 report_type VARCHAR(16) NOT NULL CONSTRAINT CK_learning_reports_type CHECK(report_type IN ('weekly','monthly')),
 period_start DATE NOT NULL, period_end DATE NOT NULL, data_json NVARCHAR(MAX) NOT NULL CONSTRAINT CK_learning_reports_json CHECK(ISJSON(data_json)=1),
 generated_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT UQ_learning_reports_period UNIQUE(student_id,report_type,period_start,course_id)
);
IF OBJECT_ID(N'dbo.app_settings',N'U') IS NULL
CREATE TABLE dbo.app_settings ([key] VARCHAR(80) CONSTRAINT PK_app_settings PRIMARY KEY, value NVARCHAR(MAX) NOT NULL);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'IX_courses_teacher' AND object_id=OBJECT_ID(N'dbo.courses')) CREATE INDEX IX_courses_teacher ON dbo.courses(teacher_id);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'IX_lessons_course' AND object_id=OBJECT_ID(N'dbo.lessons')) CREATE INDEX IX_lessons_course ON dbo.lessons(course_id,order_index);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'IX_exercises_lesson' AND object_id=OBJECT_ID(N'dbo.exercises')) CREATE INDEX IX_exercises_lesson ON dbo.exercises(lesson_id);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'IX_questions_exercise' AND object_id=OBJECT_ID(N'dbo.questions')) CREATE INDEX IX_questions_exercise ON dbo.questions(exercise_id);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'IX_answers_question' AND object_id=OBJECT_ID(N'dbo.answers')) CREATE INDEX IX_answers_question ON dbo.answers(question_id);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'IX_attempts_student' AND object_id=OBJECT_ID(N'dbo.attempts')) CREATE INDEX IX_attempts_student ON dbo.attempts(student_id,exam_id,status,submitted_at);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'IX_attempts_course' AND object_id=OBJECT_ID(N'dbo.attempts')) CREATE INDEX IX_attempts_course ON dbo.attempts(course_id,submitted_at);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'UX_attempts_active_exam' AND object_id=OBJECT_ID(N'dbo.attempts')) CREATE UNIQUE INDEX UX_attempts_active_exam ON dbo.attempts(student_id,exam_id) WHERE kind='exam' AND status='in_progress' AND exam_id IS NOT NULL;
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'IX_notifications_user' AND object_id=OBJECT_ID(N'dbo.notifications')) CREATE INDEX IX_notifications_user ON dbo.notifications(user_id,is_read);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name=N'IX_study_sessions_student_date' AND object_id=OBJECT_ID(N'dbo.study_sessions')) CREATE INDEX IX_study_sessions_student_date ON dbo.study_sessions(student_id,created_at) INCLUDE(seconds,lesson_id);
IF NOT EXISTS(SELECT 1 FROM dbo.app_settings WHERE [key]='schema_version') INSERT dbo.app_settings([key],value) VALUES('schema_version','1');
