# Use Case đối chiếu mã nguồn

Đối chiếu ngày 21/10/2026, source ứng dụng tại a85ded9 (các commit tài liệu sau đó không thay đổi src/server). Mã UC là mã phân tích, không phải hằng số trong code.

Có 28 mục tiêu nghiệp vụ chính. Khách được mở trang Đăng nhập; học viên, giáo viên và admin dùng chung chức năng này. Các actor chỉ có tài khoản, không cần đã xác thực trước khi đăng nhập. Mỗi UC xuất hiện một lần, nối tất cả actor liên quan. Đăng ký công khai chỉ tạo student. Không có quy trình tự đăng ký để nhận role teacher.

## Dẫn chứng từng use case

| UC | Chức năng | Actor nghiệp vụ | Giao diện/thành phần | HTTP API thật |
| --- | --- | --- | --- | --- |
| UC01 | Đăng ký tài khoản | Khách | src/pages/auth/RegisterPage.jsx | POST /api/auth/register |
| UC02 | Đăng nhập | Khách, Học viên, Giáo viên, Admin | src/pages/auth/LoginPage.jsx | POST /api/auth/login<br>GET /api/auth/profile |
| UC03 | Đăng xuất | Học viên, Giáo viên, Admin | src/contexts/AuthContext.jsx | POST /api/auth/logout |
| UC04 | Quản lý hồ sơ cá nhân | Học viên, Giáo viên, Admin | src/pages/ProfilePage.jsx | GET /api/auth/profile<br>PUT /api/auth/profile |
| UC05 | Đổi mật khẩu | Học viên, Giáo viên, Admin | src/pages/ProfilePage.jsx | PUT /api/auth/change-password |
| UC06 | Tra cứu khóa học | Khách, Học viên | src/pages/LandingPage.jsx; src/pages/student/CourseList.jsx | GET /api/catalog<br>GET /api/courses<br>GET /api/programs<br>GET /api/courses/:id<br>GET /api/lessons/course/:courseId |
| UC07 | Đăng ký khóa học | Học viên | src/pages/student/CourseDetail.jsx | GET /api/enrollments/check/:courseId<br>POST /api/enrollments |
| UC08 | Duyệt đăng ký khóa học | Giáo viên, Admin | src/pages/teacher/StudentProgress.jsx | GET /api/enrollments<br>PUT /api/enrollments/:id |
| UC09 | Học bài và ghi nhận tiến độ | Học viên | src/pages/student/LessonView.jsx | GET /api/lessons/:id<br>GET /api/progress<br>GET /api/exercises/lesson/:id<br>POST /api/progress |
| UC10 | Làm bài tập | Học viên | src/pages/student/ExercisePage.jsx; src/pages/student/Practice.jsx | GET /api/exercises/:id<br>GET /api/questions/exercise/:id<br>POST /api/exercises/:id/submit |
| UC11 | Làm bài kiểm tra/thi thử | Học viên | src/pages/student/ExamPage.jsx; src/pages/student/Practice.jsx | GET /api/exams/:id<br>POST /api/exams/:id/start<br>PUT /api/exams/:id/draft<br>POST /api/exams/:id/submit |
| UC12 | Xem kết quả và lời giải | Học viên | src/pages/student/ExerciseHistory.jsx; src/pages/student/MyProgress.jsx | GET /api/exercises/my-attempts<br>GET /api/exercises/my-attempts/:id<br>GET /api/exams/results/:id<br>GET /api/dashboard/student |
| UC13 | Theo dõi tiến độ học tập | Học viên | src/pages/student/MyProgress.jsx | GET /api/dashboard/student |
| UC14 | Xem lộ trình học tập | Học viên | src/pages/student/LearningPathPage.jsx | GET /api/learning-paths<br>GET /api/enrollments |
| UC15 | Xem và đánh dấu thông báo | Học viên, Giáo viên, Admin | src/pages/student/NotificationPage.jsx; src/components/layout/Header.jsx | GET /api/notifications<br>PUT /api/notifications/:id/read<br>PUT /api/notifications/read-all |
| UC16 | Quản lý khóa học | Giáo viên, Admin | src/pages/teacher/CourseManagement.jsx | GET /api/courses<br>POST /api/courses<br>PUT /api/courses/:id<br>DELETE /api/courses/:id |
| UC17 | Quản lý bài học | Giáo viên, Admin | src/pages/teacher/LessonManagement.jsx | GET /api/lessons/course/:courseId<br>POST /api/lessons<br>PUT /api/lessons/:id<br>DELETE /api/lessons/:id |
| UC18 | Quản lý bài tập | Giáo viên, Admin | src/pages/teacher/ExerciseManagement.jsx | GET /api/exercises<br>POST /api/exercises<br>PUT /api/exercises/:id<br>DELETE /api/exercises/:id |
| UC19 | Quản lý câu hỏi và đáp án | Giáo viên, Admin | src/pages/teacher/ExerciseManagement.jsx | GET /api/questions/exercise/:id<br>POST /api/questions<br>PUT /api/questions/:id<br>DELETE /api/questions/:id |
| UC20 | Quản lý bài kiểm tra | Giáo viên, Admin | src/pages/teacher/ExamManagement.jsx | GET /api/exams<br>GET /api/questions<br>POST /api/exams<br>PUT /api/exams/:id<br>DELETE /api/exams/:id |
| UC21 | Xem tiến độ học viên | Giáo viên, Admin | src/pages/teacher/StudentProgress.jsx | GET /api/courses<br>GET /api/enrollments |
| UC22 | Chấm bài và nhận xét | Giáo viên, Admin | src/pages/teacher/Submissions.jsx | GET /api/submissions<br>GET /api/submissions/:id<br>PUT /api/submissions/:id/grade |
| UC23 | Quản lý lộ trình học tập | Giáo viên, Admin | src/pages/teacher/LearningPathManagement.jsx | GET /api/learning-paths<br>POST /api/learning-paths<br>PUT /api/learning-paths/:id<br>DELETE /api/learning-paths/:id |
| UC24 | Quản lý tài khoản | Admin | src/pages/admin/UserManagement.jsx | GET /api/users<br>POST /api/users<br>PUT /api/users/:id<br>DELETE /api/users/:id |
| UC25 | Cấp và thay đổi vai trò | Admin | src/pages/admin/UserManagement.jsx | GET /api/users<br>PUT /api/users/:id |
| UC26 | Quản lý chương trình đào tạo | Admin | src/pages/admin/ProgramManagement.jsx | GET /api/programs<br>POST /api/programs<br>PUT /api/programs/:id<br>DELETE /api/programs/:id |
| UC27 | Xem thống kê giảng dạy | Giáo viên, Admin | src/pages/teacher/TeacherDashboard.jsx | GET /api/dashboard/teacher<br>GET /api/courses |
| UC28 | Xem thống kê toàn hệ thống | Admin | src/pages/admin/AdminDashboard.jsx | GET /api/dashboard/admin |

## Phạm vi và điểm cần mô tả chính xác

- Giáo viên chỉ quản lý khóa/lộ trình trong phạm vi phụ trách. Admin có quyền quản lý toàn cục; không suy diễn admin kế thừa mọi hoạt động học/thi của học viên.
- UC25 là thao tác chọn Vai trò trong form quản lý tài khoản, không có trang hay quy trình xét hồ sơ giáo viên riêng.
- UC19 được thực hiện trong quản lý bài tập, phương án/lời giải lưu kèm câu hỏi; không có màn hình quản lý đáp án độc lập.
- UC08 hiện có nút Duyệt đăng ký khi trạng thái pending; không mô tả có nút từ chối/hủy vì backend nhận dropped nhưng UI chưa có thao tác đó.
- UC22 nhập điểm tổng 0–100 và nhận xét, có thể chấm lại; chưa có giao diện rubric hoặc chấm điểm từng câu.
- UC09 lưu tiến độ/thời gian khi bấm hoàn thành, không đo liên tục quá trình xem video. Chỉ bài thi có start/resume, lưu nháp và deadline; bài tập thường không có cơ chế tương đương.
- UC27: admin được API và route cho phép vào tổng quan giảng dạy, nhưng sidebar admin không có shortcut đó. Không mô tả admin có sẵn nút Tổng quan giảng dạy trên menu.
- Frontend cho student/teacher/admin mở /student/*; một số API ghi danh/làm bài tập không chặn riêng role student. Vì vậy association trong sơ đồ là các mục tiêu nghiệp vụ chính, không phải danh sách allow/deny tuyệt đối. API bắt đầu thi và thủ tục ghi tiến độ SQL có kiểm tra student rõ ràng.
- Không thêm các chức năng chưa tích hợp hoàn chỉnh: tự đăng ký giáo viên, cổng thanh toán online, OTP/email khôi phục, AI chấm nói, upload/ghi âm trực tiếp, cấp chứng chỉ, tự sinh báo cáo tuần/tháng hoặc xuất PDF/Excel.
- Trang hướng dẫn /help hiện có; được xem là chức năng hỗ trợ, không tách thành một trong 28 use case nghiệp vụ chính trên sơ đồ này.

## Mở sơ đồ

- Muốn dán mã: mở UseCase_Theo_Code_Copy.txt, sao chép toàn bộ; tạo sơ đồ trống trên draw.io → Extras → Edit Diagram → thay mã → Apply.
- Muốn mở tệp: File → Open From → Device → UseCase_Theo_Code.drawio.
- Bản phác thảo bằng dấu gạch nằm trong UseCase_Theo_Code_Phac_thao.txt.
