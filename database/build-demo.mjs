// Generates the one-file SSMS deliverable; no npm packages or live DB required.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash, scryptSync } from 'node:crypto';
import assert from 'node:assert/strict';
import { PROGRAMS, CONTEXTS, GRAMMAR } from './demo-curriculum.mjs';
import { gradeQuestions } from './demo-grading.mjs';

const root = new URL('./', import.meta.url);
const tables = Object.fromEntries(['users','programs','courses','lessons','exercises','questions','answers','exams','exam_questions','enrollments','progress','attempts','notifications','learning_paths','path_courses','study_sessions'].map(t=>[t,[]]));
const raw = value => ({ sql: value });
const date = (days, minutes=0) => raw(`DATEADD(MINUTE,${minutes},DATEADD(DAY,-${days},@SeedNow))`);
const add = (table, values) => { const row = { id: tables[table].length+1, ...values }; tables[table].push(row); return row; };
const qOptions = new Map();
const courseLessons = new Map();
const lessonExercises = new Map();
const exerciseQuestions = new Map();
const courseExams = new Map();
const examQuestions = new Map();
const teacherNames=['Trần Minh Anh','Nguyễn Hoàng Nam','Lê Thu Hà','Phạm Quốc Huy','Đỗ Ngọc Linh','Vũ Thanh Tâm','Bùi Mai Phương','Đặng Anh Khoa','Hồ Bảo Trâm','Dương Tuấn Kiệt','Ngô Khánh Vy'];
const surnames=['Nguyễn','Trần','Lê','Phạm','Hoàng','Vũ','Đặng','Bùi','Đỗ','Hồ','Ngô'];
const given=['Minh Anh','Quang Huy','Thu Hà','Gia Bảo','Ngọc Linh','Tuấn Anh','Khánh Vy','Đức Minh'];
const password='EnglishDemo!2026';
function account(email, full_name, role) {
  const salt=createHash('sha256').update(`english-studio-public-demo-v1:${email}`).digest('hex').slice(0,32);
  return add('users',{full_name,email,password_hash:`${salt}:${scryptSync(password,salt,64).toString('hex')}`,role,phone:'',avatar:'',is_active:1,created_at:date(100)});
}
account('admin@elearning.com','Quản trị English Studio','admin');
const teachers=teacherNames.map((name,i)=>account(i===0?'teacher@elearning.com':`teacher${String(i+1).padStart(2,'0')}@example.test`,name,'teacher'));
const students=Array.from({length:88},(_,i)=>account(i===0?'student@elearning.com':`student${String(i+1).padStart(3,'0')}@example.test`,i===0?'Nguyễn An':`${surnames[i%11]} ${given[Math.floor(i/11)]}`,'student'));
const trueStatements=[
 'The library closes at eight on weekdays.', 'Mai now drives to work every day.',
 'The club reviews common mistakes after each meeting.', 'Visitors may walk anywhere on the protected island.',
 'The team uses a shared calendar.', 'Linh needed a larger budget to reduce waste.',
 'The school collected feedback before choosing an approach.', 'The survey measured how much coffee every participant drank.',
 'The agent offered the customer a refund.', 'An kept every detail she knew in her presentation.',
 'The reflection asked learners to explain a correction.', 'Minh chose the article with unnamed sources.'
];
function question(exercise, content, type, explanation, options=null, correct=0, correct_text='', points=1) {
  const row=add('questions',{exercise_id:exercise.id,content,type,points,explanation,correct_text,order_index:(exerciseQuestions.get(exercise.id)||[]).length+1,created_at:date(92)});
  if(!exerciseQuestions.has(exercise.id))exerciseQuestions.set(exercise.id,[]);
  exerciseQuestions.get(exercise.id).push(row);
  const answers=(options||[]).map((content,i)=>add('answers',{question_id:row.id,content,is_correct:Number(i===correct)}));
  qOptions.set(row.id,answers);
  return row;
}
for(const [pi,p] of PROGRAMS.entries()) {
  const program=add('programs',{name:p.name,slug:p.slug,description:`${p.goal} ${p.focus}`,is_active:1,created_at:date(98)});
  const teacher=teachers[pi];
  const path=add('learning_paths',{teacher_id:teacher.id,program_id:program.id,title:`Lộ trình ${p.name} — từng bước tiến bộ`,description:`${p.goal} Học lần lượt ba khóa, hoàn thành bài tập và xem phản hồi của giáo viên.`,level:p.level,estimated_duration:90,is_published:1,created_at:date(95)});
  for(const [ci,title] of p.courses.entries()) {
    const course=add('courses',{teacher_id:teacher.id,program_id:program.id,title,slug:`${p.slug}-${ci+1}`,description:`${p.goal}\n\n${p.focus}\n\nGồm 6 bài học theo chủ đề, 12 bài tập và 3 bài đánh giá. Nội dung luyện tập do dự án biên soạn; không phải đề thi chính thức. Phần nghe có kịch bản cho giáo viên đọc; phần nói nhận bản chép lời hoặc liên kết bản ghi âm.`,thumbnail:'',level:p.level,price:ci===0?0:ci===1?499000:799000,is_free:Number(ci===0),is_published:1,created_at:date(94)});
    tables.path_courses.push({path_id:path.id,course_id:course.id,order_index:ci+1});
    courseLessons.set(course.id,[]);
    for(let li=0;li<6;li++) {
      const contextIndex=(pi*3+ci*2+li)%CONTEXTS.length;
      const ctx=CONTEXTS[contextIndex],grammar=GRAMMAR[p.level][li],next=GRAMMAR[p.level][(li+1)%6];
      const vocab=ctx.vocabulary.map(([en,vi])=>`- **${en}**: ${vi}`).join('\n');
      const content=`# ${ctx.title}\n\n## Mục tiêu\n${p.goal}\n\n## Read & listen\n${ctx.passage}\n\nGiáo viên đọc đoạn trên hai lần; lần đầu tìm ý chính, lần sau ghi chi tiết. Đây là kịch bản luyện nghe, chưa kèm tệp âm thanh.\n\n## Vocabulary\n${vocab}\n\n## Language focus\n${grammar.q}\n${grammar.why}\n\n## Writing\nWrite ${p.level==='beginner'?'60–90':'120–180'} words about the topic. State your main idea and give two examples.\n\n## Speaking\nSpeak for one minute about the topic. Explain your opinion and give an example. Submit a transcript or a recording link for teacher feedback.\n\n## Tự kiểm tra\n${p.focus}\nHoàn thành cả hai bài tập, đọc lời giải và ghi lại một lỗi cần sửa.`;
      const lesson=add('lessons',{course_id:course.id,title:`Bài ${li+1}: ${ctx.title}`,content,video_url:'',audio_url:'',document_url:'',duration:25+li*5,order_index:li+1,is_published:1,created_at:date(93)});
      courseLessons.get(course.id).push(lesson);
      const first=add('exercises',{lesson_id:lesson.id,title:`${ctx.title} · Reading & language`,description:'Đọc đoạn văn trong bài học. Chọn đáp án hoặc điền từ; lời giải xuất hiện sau khi nộp.',type:'mixed',difficulty:p.level==='advanced'?'hard':p.level==='beginner'?'easy':'medium',time_limit:15,is_published:1,created_at:date(92)});
      const second=add('exercises',{lesson_id:lesson.id,title:`${ctx.title} · Writing & speaking`,description:'Luyện cấu trúc, viết và nói. Tự luận và nói cần giáo viên chấm; không dùng điểm tự động làm điểm cuối cùng.',type:'mixed',difficulty:first.difficulty,time_limit:25,is_published:1,created_at:date(92)});
      lessonExercises.set(lesson.id,[first,second]);
      question(first,`${ctx.passage}\n\n${ctx.question}`,'multiple_choice',`Đối chiếu thông tin trong đoạn văn: ${ctx.choices[ctx.correct]}`,ctx.choices,ctx.correct);
      const [word,meaning]=ctx.vocabulary[li%3];
      const meanings=[meaning,...CONTEXTS[(contextIndex+1)%12].vocabulary.map(v=>v[1])];
      const rotation=li%4;
      const shuffled=meanings.map((_,i)=>meanings[(i+rotation)%4]);
      question(first,`Trong ngữ cảnh bài đọc, “${word}” có nghĩa là gì?`,'multiple_choice',`“${word}” có nghĩa là “${meaning}” trong đoạn văn.`,shuffled,shuffled.indexOf(meaning));
      question(first,grammar.q,'multiple_choice',grammar.why,grammar.a,grammar.c);
      question(first,grammar.fill,'fill_blank',`Đáp án chấp nhận: ${grammar.answer.replaceAll('|',' hoặc ')}. Kiểm tra thì, cấu trúc và dạng từ trong câu.`,null,0,grammar.answer);
      question(first,`Dựa vào đoạn văn, nhận định sau đúng hay sai?\n${trueStatements[contextIndex]}`,'true_false',`Kiểm tra chi tiết trực tiếp trong đoạn văn về “${ctx.title}”.`,['True','False'],contextIndex%2===0?0:1);
      question(second,next.q,'multiple_choice',next.why,next.a,next.c);
      question(second,next.fill,'fill_blank',`Đáp án: ${next.answer.replaceAll('|',' hoặc ')}. Đọc lại toàn bộ câu sau khi điền.`,null,0,next.answer);
      question(second,'Sắp xếp các từ thành câu hoàn chỉnh: every day / English / I / practise','ordering','Câu khẳng định: chủ ngữ + động từ + tân ngữ + trạng ngữ. Chấp nhận có hoặc không có dấu chấm.',null,0,'I practise English every day.|I practise English every day');
      question(second,`Write ${p.level==='beginner'?'60–90':'120–180'} words about “${ctx.title}”. Give an opinion and two supporting examples.`,'essay','Tiêu chí: hoàn thành yêu cầu, tổ chức ý, từ vựng và ngữ pháp. Giáo viên đọc bài và phản hồi; không chấm chỉ bằng độ dài.',null,0,'',3);
      question(second,`Speak for one minute about “${ctx.title}”. Give your opinion and one example. Submit a transcript or a recording link.`,'speaking','Tiêu chí: mạch lạc, từ vựng, cấu trúc và phát âm nếu có bản ghi âm. Với bản chép lời, giáo viên chỉ nhận xét nội dung/ngôn ngữ.',null,0,'',2);
    }
    const objective=courseLessons.get(course.id).flatMap(l=>lessonExercises.get(l.id).flatMap(e=>exerciseQuestions.get(e.id))).filter(q=>!['essay','speaking'].includes(q.type));
    courseExams.set(course.id,[]);
    for(const [ei,count] of [10,20,30].entries()) {
      const exam=add('exams',{course_id:course.id,title:`${title} · ${['Kiểm tra nhanh','Đánh giá giữa khóa','Thi thử tổng hợp'][ei]}`,description:'Bài đánh giá nội bộ theo nội dung đã học, có giới hạn thời gian. Điểm phần trăm dùng để theo dõi tiến bộ; không phải chứng chỉ hoặc band điểm thi chính thức.',type:['quiz','midterm','mock'][ei],time_limit:[15,30,45][ei],pass_score:60,max_attempts:3,shuffle_questions:0,show_answer_after:1,is_published:1,created_at:date(90)});
      courseExams.get(course.id).push(exam);
      const selected=Array.from({length:count},(_,i)=>objective[(i+ei*7)%objective.length]);
      examQuestions.set(exam.id,selected);
      selected.forEach((q,i)=>tables.exam_questions.push({exam_id:exam.id,question_id:q.id,order_index:i+1}));
    }
  }
}
function snapshot(qs) {return qs.map(q=>({...q,created_at:undefined,answers:qOptions.get(q.id)}));}
function sampleAttempt(student,course,source,kind,qs,seed,days) {
  const snapshotQs=snapshot(qs),answers={};
  for(const [i,q] of snapshotQs.entries()) {
    const correct=(seed+i)%5!==0;
    if(q.answers.length)answers[q.id]=q.answers.find(a=>Boolean(a.is_correct)===correct)?.id ?? q.answers[0].id;
    else if(q.type==='essay')answers[q.id]='In my opinion, small changes can improve the way we learn and work. For example, planning a short activity every day makes a large goal easier to manage. It also helps us notice problems early. In our study group, we compare ideas and explain our answers instead of memorising a list. This is useful because a clear example often reveals what we do not understand. However, the plan should remain flexible: people have different schedules and need time to rest. I would review the plan each week and choose one thing to improve.';
    else if(q.type==='speaking')answers[q.id]='Transcript: I think this topic matters because it affects daily decisions. For example, our class tried a short discussion before each lesson. We listened to different opinions and asked for examples. I became more confident when I prepared three key words first. Next time I would speak more slowly and explain my reason clearly.';
    else answers[q.id]=correct?q.correct_text.split('|')[0]:'incorrect sample answer';
  }
  const result=gradeQuestions(snapshotQs,answers);
  let grader=null;
  if(result.pending_grading && seed%3!==0) {
    grader=course.teacher_id;
    for(const d of result.details)if(d.needs_grading){d.earnedPoints=+(d.points*(seed%2?0.75:0.9)).toFixed(2);d.needs_grading=false;d.teacher_feedback='Ý rõ và có ví dụ. Tiếp tục sửa cách liên kết câu và dùng từ chính xác hơn.';}
    result.pending_grading=false;
    result.earnedPoints=+result.details.reduce((s,d)=>s+d.earnedPoints,0).toFixed(2);
    result.scorePercentage=+(result.earnedPoints/result.totalPoints*100).toFixed(2);
  }
  return add('attempts',{student_id:student.id,course_id:course.id,exercise_id:kind==='exercise'?source.id:null,exam_id:kind==='exam'?source.id:null,kind,title:source.title,status:result.pending_grading?'pending_grading':'graded',started_at:date(days,5),deadline:kind==='exam'?date(days,5+source.time_limit):null,submitted_at:date(days,kind==='exam'?14:12),questions_json:JSON.stringify(snapshotQs),answers_json:JSON.stringify(answers),result_json:JSON.stringify(result),score:result.pending_grading?null:result.scorePercentage,feedback:grader?'Bài đã được xem. Xem nhận xét từng phần và ôn lại câu chưa đúng.':'',graded_by:grader});
}
for(const [si,student] of students.entries()) {
  for(let slot=0;slot<3;slot++) {
    const course=tables.courses[(si+slot*11)%33];
    const status=si===0?'active':slot===2&&si%9===0?'pending':slot===2&&si%13===0?'dropped':slot===0&&si%4===0?'completed':'active';
    add('enrollments',{student_id:student.id,course_id:course.id,status,enrolled_at:date(80-slot*7)});
    if(!['active','completed'].includes(status))continue;
    const completed=status==='completed'?6:1+(si+slot)%5;
    const studied=Math.min(6,completed+1);
    for(let li=0;li<studied;li++) {
      const lesson=courseLessons.get(course.id)[li],isCompleted=li<completed,days=65-slot*8-li*7-(si%5);
      const seconds=1200+(si%7)*120+li*90;
      tables.progress.push({student_id:student.id,lesson_id:lesson.id,is_completed:Number(isCompleted),time_spent:seconds,completed_at:isCompleted?date(days,40):null,updated_at:date(days,40)});
      for(let part=0;part<2;part++) {
        const hex=createHash('sha256').update(`session:${student.id}:${lesson.id}:${part}`).digest('hex').slice(0,32);
        const uuid=`${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
        tables.study_sessions.push({id:uuid,student_id:student.id,lesson_id:lesson.id,seconds:part?seconds-Math.floor(seconds/2):Math.floor(seconds/2),created_at:date(days,part*20),updated_at:date(days,part*20+15)});
      }
      if(li===0||li===completed-1) {
        const exercise=lessonExercises.get(lesson.id)[li===0?0:1];
        sampleAttempt(student,course,exercise,'exercise',exerciseQuestions.get(exercise.id),si+slot+li,Math.max(1,days));
      }
    }
    const exam=courseExams.get(course.id)[status==='completed'?2:si%2];
    sampleAttempt(student,course,exam,'exam',examQuestions.get(exam.id),si+slot,2+(si*3+slot*9)%45);
  }
  add('notifications',{user_id:student.id,title:'Chào mừng đến English Studio',message:'Chọn lộ trình phù hợp, học từng bài và đọc lời giải sau khi nộp bài. Đây là dữ liệu minh họa của dự án.',type:'info',is_read:1,created_at:date(79)});
  add('notifications',{user_id:student.id,title:'Kế hoạch học tuần này',message:'Dành 20 phút mỗi ngày: ôn từ mới, hoàn thành một bài tập và luyện nói về chủ đề đã học.',type:'reminder',is_read:Number(si%3===0),created_at:date(2)});
  add('notifications',{user_id:student.id,title:'Xem lại kết quả học tập',message:'Bạn có thể xem bài đã nộp và phản hồi của giáo viên. Các phần viết, nói chưa chấm chưa có điểm cuối cùng.',type:'result',is_read:0,created_at:date(1)});
}
teachers.forEach((t,i)=>add('notifications',{user_id:t.id,title:'Lớp học của bạn đã sẵn sàng',message:`Bạn phụ trách chương trình ${PROGRAMS[i].name}. Xem bài cần chấm, học viên chờ duyệt và thống kê tiến độ.`,type:'info',is_read:0,created_at:date(1)}));
add('notifications',{user_id:1,title:'Dữ liệu minh họa đã được tạo',message:'11 chương trình, 33 khóa học và các tài khoản demo. Không sử dụng mật khẩu demo cho hệ thống công khai.',type:'info',is_read:0,created_at:date(0)});

// Relational and grading checks fail generation before a broken SQL file is written.
const fk={courses:{teacher_id:'users',program_id:'programs'},lessons:{course_id:'courses'},exercises:{lesson_id:'lessons'},questions:{exercise_id:'exercises'},answers:{question_id:'questions'},exams:{course_id:'courses'},exam_questions:{exam_id:'exams',question_id:'questions'},enrollments:{student_id:'users',course_id:'courses'},progress:{student_id:'users',lesson_id:'lessons'},attempts:{student_id:'users',course_id:'courses',exercise_id:'exercises',exam_id:'exams',graded_by:'users'},notifications:{user_id:'users'},learning_paths:{teacher_id:'users',program_id:'programs'},path_courses:{path_id:'learning_paths',course_id:'courses'},study_sessions:{student_id:'users',lesson_id:'lessons'}};
for(const [table,columns] of Object.entries(fk))for(const row of tables[table])for(const [column,target] of Object.entries(columns))if(row[column]!=null)assert(tables[target].some(r=>r.id===row[column]),`${table}.${column} FK`);
for(const [table,cols] of Object.entries({users:['email'],programs:['slug'],courses:['slug'],exam_questions:['exam_id','question_id'],enrollments:['student_id','course_id'],progress:['student_id','lesson_id'],path_courses:['path_id','course_id'],study_sessions:['id']}))assert.equal(new Set(tables[table].map(r=>JSON.stringify(cols.map(c=>r[c])))).size,tables[table].length,`${table} unique`);
for(const q of tables.questions)if(['multiple_choice','true_false'].includes(q.type))assert.equal(qOptions.get(q.id).filter(a=>a.is_correct).length,1);
for(const a of tables.attempts){const result=JSON.parse(a.result_json);assert.equal(a.status==='pending_grading',result.pending_grading);assert.equal(a.score,a.status==='graded'?result.scorePercentage:null);assert.equal(result.totalPoints,JSON.parse(a.questions_json).reduce((s,q)=>s+q.points,0));assert(Math.abs(result.details.reduce((s,d)=>s+d.earnedPoints,0)-result.earnedPoints)<0.00001);assert(a.score===null||(a.score>=0&&a.score<=100));const enrollment=tables.enrollments.find(e=>e.student_id===a.student_id&&e.course_id===a.course_id);assert(['active','completed'].includes(enrollment.status));}
for(const p of tables.progress)assert.equal(p.time_spent,tables.study_sessions.filter(s=>s.student_id===p.student_id&&s.lesson_id===p.lesson_id).reduce((n,s)=>n+s.seconds,0));
for(const e of tables.enrollments.filter(e=>e.status==='completed'))assert.equal(tables.progress.filter(p=>p.student_id===e.student_id&&p.is_completed&&courseLessons.get(e.course_id).some(l=>l.id===p.lesson_id)).length,6);
for(const link of tables.exam_questions){const exam=tables.exams.find(e=>e.id===link.exam_id),q=tables.questions.find(q=>q.id===link.question_id),ex=tables.exercises.find(e=>e.id===q.exercise_id),lesson=tables.lessons.find(l=>l.id===ex.lesson_id);assert.equal(exam.course_id,lesson.course_id);}

function literal(value) {
  if(value===null)return 'NULL';
  if(typeof value==='object'&&value.sql)return value.sql;
  if(typeof value==='number')return String(value);
  return `N'${String(value).replaceAll("'","''")}'`;
}
function inserts(table,rows) {
  const columns=Object.keys(rows[0]);
  const identity=table!=='study_sessions'&&columns.includes('id');
  const lines=[identity?`SET IDENTITY_INSERT dbo.[${table}] ON;`:''];
  for(let start=0;start<rows.length;start+=200)lines.push(`INSERT dbo.[${table}] (${columns.map(c=>`[${c}]`).join(',')}) VALUES\n${rows.slice(start,start+200).map(row=>`(${columns.map(c=>literal(row[c])).join(',')})`).join(',\n')};`);
  if(identity)lines.push(`SET IDENTITY_INSERT dbo.[${table}] OFF;`);
  return lines.filter(Boolean).join('\n');
}
const header=`/*
ENGLISH STUDIO — SQL SERVER DEMO, v1
Chạy TOÀN BỘ file bằng SSMS (F5), SQL Server 2017+; khuyến nghị 2022.
File UTF-8 có BOM, hỗ trợ tiếng Việt. Tạo database riêng ELearningEnglish_Demo.
Không DROP/TRUNCATE, không tạo SQL login, không cần sửa mật khẩu SQL Server trong file.
Chạy lại giữ nguyên dữ liệu đã tạo; database lạ/có dữ liệu khác sẽ bị từ chối.
Tài khoản ứng dụng demo: admin@elearning.com / teacher@elearning.com / student@elearning.com
Mật khẩu ứng dụng demo công khai: EnglishDemo!2026 (KHÔNG phải mật khẩu SQL Server).
Hash scrypt salt:hash tương thích hàm hashPassword hiện tại của dự án.
Đây là dữ liệu học tập minh họa, không phải đề thi/chứng chỉ chính thức.
Web hiện tại vẫn dùng SQLite: cần tích hợp backend SQL Server riêng để dùng database này.
Ngày giờ lưu UTC; báo cáo tính kỳ học theo múi giờ Việt Nam UTC+7.
*/
USE [master];
GO
SET NOCOUNT ON;
IF CAST(SERVERPROPERTY('ProductMajorVersion') AS INT)<14
BEGIN
 RAISERROR(N'Cần SQL Server 2017 trở lên.',16,1);
 SET NOEXEC ON;
END;
IF DB_ID(N'ELearningEnglish_Demo') IS NULL
BEGIN TRY
 EXEC(N'CREATE DATABASE [ELearningEnglish_Demo] COLLATE Latin1_General_100_CI_AS_SC');
END TRY
BEGIN CATCH
 PRINT N'Không tạo được database. Cần quyền CREATE DATABASE hoặc nhờ quản trị tạo database ELearningEnglish_Demo trước.';
 SET NOEXEC ON;
 THROW;
END CATCH;
GO
USE [ELearningEnglish_Demo];
GO
IF DB_NAME()<>N'ELearningEnglish_Demo'
BEGIN
 RAISERROR(N'Dừng: không ở đúng database ELearningEnglish_Demo.',16,1);
 SET NOEXEC ON;
END;
GO
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
SET NOCOUNT ON;
SET XACT_ABORT ON;
-- Refuse unrelated/partially populated databases before adding anything.
DECLARE @KnownSeed BIT=0;
BEGIN TRY
IF OBJECT_ID(N'dbo.app_settings',N'U') IS NOT NULL
 EXEC sys.sp_executesql N'SELECT @Found=CASE WHEN EXISTS(SELECT 1 FROM dbo.app_settings WHERE [key]=''demo_seed_version'' AND value=''english-studio-sql-v1'') THEN 1 ELSE 0 END',N'@Found BIT OUTPUT',@Found=@KnownSeed OUTPUT;
IF @KnownSeed=0 AND EXISTS(SELECT 1 FROM sys.tables WHERE is_ms_shipped=0)
BEGIN
 RAISERROR(N'Database đã chứa bảng/dữ liệu khác. Dừng để bảo vệ dữ liệu. Hãy dùng một database demo trống.',16,1);
 SET NOEXEC ON;
END;
END TRY
BEGIN CATCH
 PRINT N'Không nhận diện được database. Dừng để bảo vệ dữ liệu có sẵn.';
 SET NOEXEC ON;
 THROW;
END CATCH;
GO
BEGIN TRY
 BEGIN TRANSACTION;
${readFileSync(new URL('schema.sql',root),'utf8')}
 IF NOT EXISTS(SELECT 1 FROM dbo.app_settings WHERE [key]='demo_seed_version')
 BEGIN
 DECLARE @SeedNow DATETIME2(3)=SYSUTCDATETIME();
${Object.entries(tables).map(([t,rows])=>inserts(t,rows)).join('\n\n')}
 INSERT dbo.app_settings([key],value) VALUES('demo_seed_version','english-studio-sql-v1');
 PRINT N'Đã tạo dữ liệu mẫu. Mật khẩu ứng dụng demo: EnglishDemo!2026';
 END
 ELSE PRINT N'Dữ liệu mẫu đã tồn tại; giữ nguyên dữ liệu.';
 COMMIT TRANSACTION;
END TRY
BEGIN CATCH
 IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
 PRINT N'Tạo dữ liệu thất bại; giao dịch đã hoàn tác. Xem lỗi trước khi chạy tiếp.';
 SET NOEXEC ON;
 THROW;
END CATCH;
GO
`;
const footer=`
-- Initial periodic reports are computed from the sample activity, not random scores.
BEGIN TRY
 BEGIN TRANSACTION;
 IF NOT EXISTS(SELECT 1 FROM dbo.app_settings WHERE [key]='demo_reports_version')
 BEGIN
 DECLARE @Today DATE=CONVERT(DATE,DATEADD(HOUR,7,SYSUTCDATETIME()));
 DECLARE @Monday DATE=DATEADD(DAY,-(DATEDIFF(DAY,CONVERT(DATE,'19000101',112),@Today)%7),@Today);
 DECLARE @Month DATE=DATEFROMPARTS(YEAR(@Today),MONTH(@Today),1);
 DECLARE @Student INT,@Offset INT,@Start DATE;
 DECLARE ReportStudents CURSOR LOCAL FAST_FORWARD FOR SELECT id FROM dbo.users WHERE role='student' AND is_active=1;
 OPEN ReportStudents;
 FETCH NEXT FROM ReportStudents INTO @Student;
 WHILE @@FETCH_STATUS=0
 BEGIN
  SET @Offset=1;
  WHILE @Offset<=4
  BEGIN
   SET @Start=DATEADD(DAY,-7*@Offset,@Monday);
   EXEC dbo.usp_GenerateLearningReport @StudentId=@Student,@ReportType='weekly',@PeriodStart=@Start,@ReturnResult=0;
   SET @Offset+=1;
  END;
  SET @Offset=1;
  WHILE @Offset<=2
  BEGIN
   SET @Start=DATEADD(MONTH,-@Offset,@Month);
   EXEC dbo.usp_GenerateLearningReport @StudentId=@Student,@ReportType='monthly',@PeriodStart=@Start,@ReturnResult=0;
   SET @Offset+=1;
  END;
  FETCH NEXT FROM ReportStudents INTO @Student;
 END;
 CLOSE ReportStudents;
 DEALLOCATE ReportStudents;
 INSERT dbo.app_settings([key],value) VALUES('demo_reports_version','1');
 END;
 COMMIT TRANSACTION;
END TRY
BEGIN CATCH
 IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
 THROW;
END CATCH;
GO
-- Successful completion summary in SSMS Results. Empty sessions table is intentional.
SELECT N'ELearningEnglish_Demo' AS database_name,N'Hoàn tất' AS result;
${Object.keys(tables).map(t=>`SELECT N'${t}' AS entity,COUNT_BIG(*) AS records FROM dbo.[${t}]`).concat("SELECT N'learning_reports',COUNT_BIG(*) FROM dbo.learning_reports").join('\nUNION ALL\n')};
SELECT TOP(11) * FROM dbo.v_ProgramCatalog ORDER BY program_id;
-- Examples (uncomment only the operation you intend to perform):
-- SELECT * FROM dbo.v_TeacherDashboard;
-- SELECT * FROM dbo.v_StudentCourseProgress WHERE student_id=13;
-- SELECT * FROM dbo.learning_reports WHERE student_id=13 ORDER BY period_start DESC;
-- EXEC dbo.usp_GenerateDueReports; -- schedule with SQL Agent/Task Scheduler if needed
-- No scheduler or web connection is installed by this SQL file.
GO
SET NOEXEC OFF;
`;
const sql=header+readFileSync(new URL('routines.sql',root),'utf8')+footer;
writeFileSync(new URL('EnglishStudio_Full.sql',root),'\ufeff'+sql,'utf8');
const counts=Object.fromEntries(Object.entries(tables).map(([t,rows])=>[t,rows.length]));
writeFileSync(new URL('demo-counts.json',root),JSON.stringify({...counts,learning_reports:students.length*6},null,2)+'\n');
console.log(JSON.stringify({file:'database/EnglishStudio_Full.sql',bytes:Buffer.byteLength(sql),counts,expectedInitialReports:students.length*6,validation:'FK, uniqueness, grading, enrollment, exam ownership, study totals and completed-course checks passed'},null,2));
