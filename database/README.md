# SQL Server — dữ liệu English Studio

Bạn chỉ cần tải **EnglishStudio_Full.sql**; không cần Node.js, npm hay các file nguồn bên cạnh để chạy SQL.

1. Mở SQL Server Management Studio (SSMS), đăng nhập vào SQL Server của bạn bằng SQL Server Authentication.
2. Chọn **File → Open → File…**, mở `EnglishStudio_Full.sql`.
3. Bấm **Execute / F5** để chạy **toàn bộ file**. Tài khoản SQL cần quyền tạo database; nếu không có quyền, nhờ quản trị tạo database trống tên `ELearningEnglish_Demo` trước.
4. Khi chạy xong, trong Object Explorer bấm **Refresh → Databases → ELearningEnglish_Demo**. Phần Results hiển thị số bản ghi; Messages không được có lỗi màu đỏ.

Hỗ trợ SQL Server 2017 trở lên (Express/Developer/Standard); khuyến nghị SQL Server 2022. Chạy bằng SSMS vì file dùng dấu phân tách batch `GO`. File UTF-8 có BOM để giữ nguyên tiếng Việt. Database, bảng, khóa ngoại, chỉ mục, dữ liệu mẫu, view và stored procedure đều nằm trong một file.

Script tạo database riêng và không xóa database/bảng nào. Chạy lại trên database đã tạo bởi script sẽ giữ nguyên dữ liệu học tập, cập nhật định nghĩa view/procedure và không nhân đôi dữ liệu mẫu. Nếu `ELearningEnglish_Demo` đang chứa bảng của hệ thống khác, script dừng. Hãy kiểm tra lỗi thay vì bỏ qua các bước bảo vệ.

## Dữ liệu ban đầu

| Nội dung | Số lượng |
| --- | ---: |
| Chương trình | 11 |
| Khóa học | 33 |
| Bài học | 198 |
| Bài tập | 396 |
| Câu hỏi | 1.980 |
| Phương án trả lời | 3.564 |
| Bài kiểm tra / thi thử | 99 |
| Tài khoản | 100: 1 admin, 11 giáo viên, 88 học viên |
| Đăng ký khóa học | 264 |
| Tiến độ bài học | 1.038 |
| Bài làm đã nộp | 703 |
| Phiên học | 2.076 |
| Lộ trình | 11 |
| Báo cáo tuần / tháng | 528 |

11 chương trình: CEFR B1, CEFR B2, IELTS 6.0, IELTS 6.5, IELTS 7.0, IELTS 7.5+, luyện thi chuyên Anh, tiếng Anh THCS, THPT, học thuật và giao tiếp.

Bài học có đoạn đọc/kịch bản luyện nghe, từ vựng, ngữ pháp, nhiệm vụ viết/nói. Câu hỏi gồm trắc nghiệm, đúng/sai, điền từ, sắp xếp câu, viết và nói; có đáp án/lời giải. Nội dung tự biên soạn dùng minh họa, không phải đề thi chính thức hoặc cam kết đạt trình độ/band IELTS. Chưa kèm tệp video/âm thanh; URL để trống, không tạo đường dẫn media giả.

Dữ liệu mô phỏng có khóa miễn phí/trả phí chờ duyệt, đăng ký đang học/hoàn thành/chờ duyệt/đã rời, lịch sử trả lời đúng/sai, bài viết/nói đã chấm và chờ giáo viên. Điểm và báo cáo được tính từ bài làm/hoạt động tương ứng. Kỳ báo cáo theo giờ Việt Nam, ngày giờ sự kiện lưu UTC.

## Tài khoản ứng dụng mẫu

| Vai trò | Email |
| --- | --- |
| Admin | `admin@elearning.com` |
| Giáo viên | `teacher@elearning.com` |
| Học viên | `student@elearning.com` |

Mật khẩu ứng dụng mẫu chung: **`EnglishDemo!2026`**. Các tài khoản còn lại dùng email `@example.test` và cùng mật khẩu demo. `password_hash` dùng scrypt tương thích hàm hiện tại của dự án. Đây không phải tài khoản đăng nhập SQL Server; script không tạo SQL login và không thay mật khẩu SQL Server. Không đưa các tài khoản demo công khai này lên môi trường thật.

## Các truy vấn và thao tác có sẵn

Các view `v_ProgramCatalog`, `v_CourseCatalog`, `v_StudentCourseProgress`, `v_TeacherDashboard`, `v_AdminDashboard` phục vụ danh mục và thống kê.

Các procedure:

| Procedure | Chức năng |
| --- | --- |
| `usp_EnrollStudent` | Đăng ký; khóa miễn phí mở học, khóa trả phí chờ duyệt |
| `usp_ApproveEnrollment` | Admin/giáo viên phụ trách duyệt học viên |
| `usp_RecordLessonProgress` | Ghi phiên học, tổng thời gian, hoàn thành bài/khóa; gửi lại cùng phiên không cộng thời gian trùng |
| `usp_SubmitExercise` | Nộp bài tập; chấm khách quan, chuyển viết/nói sang chờ chấm |
| `usp_StartExam` | Mở/tiếp tục lượt thi, giới hạn số lượt, lưu bộ câu hỏi và hạn nộp |
| `usp_SaveExamAnswers` | Lưu nháp trong thời gian thi |
| `usp_SubmitExam` | Nộp thi; quá giờ chỉ chấm câu trả lời đã lưu trước hạn |
| `usp_GradeAttempt` | Hàm chấm dùng nội bộ backend; không cung cấp trực tiếp cho người học |
| `usp_GradeManualAttempt` | Giáo viên phụ trách/admin chấm đủ phần viết/nói và gửi nhận xét |
| `usp_GenerateLearningReport` | Tính/cập nhật báo cáo một học viên theo kỳ |
| `usp_GenerateDueReports` | Tính/cập nhật tuần và tháng vừa kết thúc cho toàn bộ học viên |

```sql
USE ELearningEnglish_Demo;
SELECT * FROM dbo.v_ProgramCatalog;
SELECT * FROM dbo.v_TeacherDashboard;
SELECT * FROM dbo.v_StudentCourseProgress WHERE student_id=13;
SELECT * FROM dbo.learning_reports WHERE student_id=13 ORDER BY period_start DESC;
EXEC dbo.usp_GenerateDueReports;
```

Script khởi tạo 4 báo cáo tuần và 2 báo cáo tháng cho mỗi học viên. Để tạo định kỳ sau này, lập lịch gọi `usp_GenerateDueReports` bằng SQL Agent hoặc Windows Task Scheduler/backend; SQL Server Express không kèm SQL Agent. File không cài lịch chạy tự động.

**Bản web đã tải trước đây vẫn dùng SQLite.** Chạy file này tạo cơ sở dữ liệu SQL Server; muốn web đọc dữ liệu này phải tích hợp kết nối/truy vấn SQL Server trong backend. Các ID người dùng truyền vào procedure phải do backend lấy từ phiên đăng nhập đã xác thực. Không cho trình duyệt/người dùng cuối truy cập thẳng SQL hoặc đọc hash mật khẩu, snapshot chứa đáp án. Duyệt khóa trả phí là thao tác thủ công, chưa tích hợp cổng thanh toán.

## Tạo lại file và kiểm tra

Chỉ cần cho người phát triển muốn sửa dữ liệu mẫu:

```sh
node database/build-demo.mjs
```

Không có phụ thuộc npm ngoài thư viện chuẩn Node.js. Generator kiểm tra khóa ngoại, tính duy nhất, điểm bài làm, quyền học theo đăng ký, câu hỏi cùng khóa, tổng thời gian học và khóa đã hoàn thành trước khi ghi file. `demo-counts.json` ghi số lượng dữ liệu trước khi SQL tạo báo cáo/thông báo báo cáo. Schema và từng batch procedure đã được kiểm tra cú pháp bằng parser T-SQL; chưa kiểm thử thực thi trên một SQL Server đang chạy trong môi trường cloud này.
