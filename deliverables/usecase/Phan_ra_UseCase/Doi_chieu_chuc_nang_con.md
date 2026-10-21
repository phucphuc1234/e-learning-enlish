# Đối chiếu các chức năng con với mã nguồn

Bộ phân rã gồm 28 use case nghiệp vụ của hệ thống E-Learning tiếng Anh. Dẫn chứng lấy từ source ứng dụng đang có trong repository, không từ code legacy. Các mã UCxx.n là mã phân tích, không phải tên trang hoặc endpoint mới.

Quan hệ include thể hiện phần bắt buộc của luồng thành công đã nêu. Quan hệ extend có điều kiện và đi từ phần mở rộng tới use case cơ sở. Các sơ đồ không biểu diễn thứ tự bước hoặc đầy đủ mọi nhánh lỗi; xem đặc tả để phân tích Activity/Sequence.

## UC01 – Đăng ký tài khoản

Tác nhân: Khách.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC01.1 | Nhập thông tin đăng ký | include | Phần bắt buộc của luồng thành công. | src/pages/auth/RegisterPage.jsx:22 — Biểu mẫu họ tên, email, điện thoại, password/confirm và điều khoản; vai trò mặc định student. |
| UC01.2 | Kiểm tra thông tin đăng ký | include | Phần bắt buộc của luồng thành công. | src/pages/auth/RegisterPage.jsx:35 — Validate trường bắt buộc, email, password >=8, confirm và agreeTerms.<br>server/app.js:335 — userInput chuẩn hóa email và kiểm tra dữ liệu server. |
| UC01.3 | Tạo tài khoản học viên | include | Phần bắt buộc của luồng thành công. | server/app.js:372 — POST register từ chối tự cấp quyền khác student, insert users với role student.<br>server/database.js:5 — Hash mật khẩu bằng scrypt có salt trước khi lưu. |
| UC01.4 | Tạo thông báo chào mừng | include | Phần bắt buộc của luồng thành công. | server/app.js:381 — Ghi notification nội bộ cho tài khoản vừa tạo; không phải gửi email. |
| UC01.5 | Tạo phiên và mở bàn học | include | Phần bắt buộc của luồng thành công. | server/app.js:386 — Trả newSession ngay sau đăng ký.<br>src/contexts/AuthContext.jsx:69 — Lưu token/user trả về khi đăng ký thành công.<br>src/pages/auth/RegisterPage.jsx:86 — Chuyển tới /student/dashboard. |

Phạm vi và giới hạn:

- «include» thể hiện hành vi bắt buộc trong luồng thành công, không diễn tả thứ tự thực hiện. Các nút con là phân tích hành vi của code hiện tại, không khẳng định mỗi nút có trang hoặc API riêng.
- Không thêm OTP, xác minh email, đăng ký giáo viên/admin hoặc bắt người vừa đăng ký gửi POST login lần nữa.
- Thao tác tạo user, thông báo và phiên không được bao bởi một transaction chung; lỗi giữa chừng có thể đã tạo tài khoản.

## UC02 – Đăng nhập

Tác nhân: Khách, Học viên, Giáo viên, Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC02.1 | Nhập email và mật khẩu | include | Phần bắt buộc của luồng thành công. | src/pages/auth/LoginPage.jsx:50 — Biểu mẫu đăng nhập gửi email/password sau validate. |
| UC02.2 | Kiểm tra thông tin đăng nhập | include | Phần bắt buộc của luồng thành công. | server/app.js:389 — Tìm user theo email, verify password; sai thông tin trả 401. |
| UC02.3 | Kiểm tra trạng thái tài khoản | include | Phần bắt buộc của luồng thành công. | server/app.js:399 — Tài khoản không active bị từ chối 403; API login không giới hạn role. |
| UC02.4 | Tạo phiên đăng nhập | include | Phần bắt buộc của luồng thành công. | server/app.js:355 — Token random base64url; lưu hash và hạn dùng trong sessions.<br>server/app.js:400 — Trả newSession sau khi xác minh thành công. |
| UC02.5 | Lưu phiên và điều hướng | include | Phần bắt buộc của luồng thành công. | src/contexts/AuthContext.jsx:44 — Lưu token/user vào localStorage và cập nhật auth state.<br>src/pages/auth/LoginPage.jsx:61 — Điều hướng về đường dẫn yêu cầu hoặc dashboard theo role. |

Phạm vi và giới hạn:

- «include» thể hiện hành vi bắt buộc trong luồng thành công, không diễn tả thứ tự thực hiện. Các nút con là phân tích hành vi của code hiện tại, không khẳng định mỗi nút có trang hoặc API riêng.
- Khách, học viên, giáo viên và admin đều có thể thực hiện Đăng nhập khi chưa có phiên hợp lệ; các vai trò tài khoản được xét theo người sử dụng trước khi xác thực.
- Không có JWT/refresh token/OTP; ô ghi nhớ không thay đổi thời hạn phiên. Đăng nhập lỗi là luồng thay thế, không phải một chức năng bắt buộc phải xảy ra.

## UC03 – Đăng xuất

Tác nhân: Học viên, Giáo viên, Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC03.1 | Yêu cầu thu hồi phiên hiện tại | include | Phần bắt buộc của luồng thành công. | src/contexts/AuthContext.jsx:89 — logout gửi authApi.logout và bỏ qua lỗi mạng.<br>server/app.js:450 — Nếu nhận yêu cầu xác thực hợp lệ, server xóa session của req.tokenHash. |
| UC03.2 | Xóa phiên cục bộ và về đăng nhập | include | Phần bắt buộc của luồng thành công. | src/contexts/AuthContext.jsx:91 — Xóa localStorage token/user và auth state ngay, không chờ server.<br>src/components/layout/Header.jsx:79 — handleLogout gọi logout rồi navigate /login. |

Phạm vi và giới hạn:

- «include» thể hiện hành vi bắt buộc trong luồng thành công, không diễn tả thứ tự thực hiện. Các nút con là phân tích hành vi của code hiện tại, không khẳng định mỗi nút có trang hoặc API riêng.
- Chỉ có hai hành vi chính, không thêm chức năng để đủ số nút.
- Không khẳng định server luôn thu hồi được token khi mất mạng; giao diện vẫn đăng xuất cục bộ. Không đăng xuất mọi thiết bị.

## UC04 – Quản lý hồ sơ cá nhân

Tác nhân: Học viên, Giáo viên, Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC04.1 | Xem thông tin hồ sơ | include | Phần bắt buộc của luồng thành công. | src/pages/ProfilePage.jsx:9 — Lấy thông tin user đã xác thực từ context, hiển thị email/role và các trường hồ sơ.<br>src/contexts/AuthContext.jsx:25 — GET profile làm mới user khi khởi tạo auth với token. |
| UC04.2 | Cập nhật thông tin hồ sơ | extend | Người dùng sửa thông tin và chọn Lưu hồ sơ. | src/pages/ProfilePage.jsx:21 — saveProfile gửi updateProfile, cập nhật auth user và hiển thị kết quả.<br>server/app.js:454 — Chỉ cập nhật họ tên, phone và avatar URL; không nhận đổi email/role. |

Phạm vi và giới hạn:

- «include» thể hiện hành vi bắt buộc trong luồng thành công, không diễn tả thứ tự thực hiện. Các nút con là phân tích hành vi của code hiện tại, không khẳng định mỗi nút có trang hoặc API riêng.
- Xem hồ sơ không bắt buộc phải sửa hoặc lưu hồ sơ; vì thế cập nhật là «extend».
- Một chức năng cập nhật chứa kiểm tra dữ liệu và lưu; không tách các bước optional đó thành include bắt buộc của việc xem. Ảnh đại diện là URL, không upload tệp.
- Đổi mật khẩu là UC05 riêng; không nối như bước bắt buộc của quản lý hồ sơ.

## UC05 – Đổi mật khẩu

Tác nhân: Học viên, Giáo viên, Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC05.1 | Nhập mật khẩu hiện tại và mới | include | Phần bắt buộc của luồng thành công. | src/pages/ProfilePage.jsx:77 — Form có currentPassword, newPassword, confirm; bắt buộc nhập và min length password mới. |
| UC05.2 | Kiểm tra yêu cầu đổi mật khẩu | include | Phần bắt buộc của luồng thành công. | src/pages/ProfilePage.jsx:34 — Giao diện kiểm tra xác nhận khớp.<br>server/app.js:470 — Verify mật khẩu hiện tại và yêu cầu password mới tối thiểu 8 ký tự. |
| UC05.3 | Lưu mật khẩu mới | include | Phần bắt buộc của luồng thành công. | server/app.js:478 — Transaction update users.password_hash = hashPassword(password). |
| UC05.4 | Thu hồi các phiên khác | include | Phần bắt buộc của luồng thành công. | server/app.js:482 — Xóa sessions cùng user trừ token_hash hiện tại, trong cùng transaction cập nhật hash. |

Phạm vi và giới hạn:

- «include» thể hiện hành vi bắt buộc trong luồng thành công, không diễn tả thứ tự thực hiện. Các nút con là phân tích hành vi của code hiện tại, không khẳng định mỗi nút có trang hoặc API riêng.
- Phiên đang dùng được giữ; không thêm bước đăng xuất bắt buộc sau đổi mật khẩu.
- Không có khôi phục bằng email/OTP trong UC này; quên mật khẩu do admin đặt lại qua UC quản lý tài khoản.

## UC06 – Tra cứu khóa học

Tác nhân: Khách, Học viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC06.1 | Tải danh mục khóa học | include | Phần bắt buộc của luồng thành công. | src/pages/LandingPage.jsx:23 — Khách tải /catalog.<br>src/pages/student/CourseList.jsx:35 — Học viên tải courses và programs.<br>server/app.js:138 — Public catalog lấy khóa đã xuất bản. |
| UC06.2 | Hiển thị thông tin khóa học | include | Phần bắt buộc của luồng thành công. | src/pages/LandingPage.jsx:227 — Render các course card từ danh mục.<br>src/pages/student/CourseList.jsx:192 — Render danh sách khóa phù hợp.<br>server/app.js:257 — courseInfo bổ sung giáo viên, chương trình, số bài/thời lượng/học viên. |
| UC06.3 | Tìm kiếm và lọc khóa học | extend | Người dùng nhập từ khóa hoặc chọn bộ lọc. | src/pages/LandingPage.jsx:30 — Khách lọc keyword/level tại client.<br>src/pages/student/CourseList.jsx:29 — Học viên chọn search/program/level/price; không bắt buộc khi mở danh sách. |
| UC06.4 | Xem chi tiết khóa học | extend | Người dùng chọn một khóa học; khách cần đăng nhập trước trang chi tiết được bảo vệ. | src/routes/AppRoutes.jsx:96 — Các route chi tiết khóa nằm sau PrivateRoute.<br>src/routes/AppRoutes.jsx:128 — Route /student/course/:id dùng CourseDetail.<br>server/app.js:642 — GET course id kiểm tra accessCourse, không tự ghi danh. |

Phạm vi và giới hạn:

- «include» thể hiện hành vi bắt buộc trong luồng thành công, không diễn tả thứ tự thực hiện. Các nút con là phân tích hành vi của code hiện tại, không khẳng định mỗi nút có trang hoặc API riêng.
- Tìm kiếm/lọc và mở chi tiết là lựa chọn, không phải bước buộc mọi lần xem danh mục.
- Không gộp đăng ký khóa học vào tra cứu; UC07 chỉ phát sinh khi học viên chủ động đăng ký.
- Khách được xem danh mục công khai, không được đọc nội dung bài học qua đó.

## UC07 – Đăng ký khóa học

Tác nhân: Học viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC07.1 | Kiểm tra điều kiện ghi danh | include | Phần bắt buộc của luồng thành công. | server/app.js:795 — Kiểm accessCourse và tìm enrollment của chính user/course; non-dropped tồn tại thì 409.<br>src/pages/student/CourseDetail.jsx:42 — Trang chi tiết kiểm tra trạng thái enrollment trước khi cho thao tác. |
| UC07.2 | Lưu đăng ký theo loại khóa | include | Phần bắt buộc của luồng thành công. | server/app.js:804 — Free -> active; paid -> pending; update enrollment dropped hoặc insert mới. |
| UC07.3 | Thông báo trạng thái đăng ký | include | Phần bắt buộc của luồng thành công. | server/app.js:815 — Luôn ghi notification nội bộ cho học viên sau khi ghi danh.<br>src/pages/student/CourseDetail.jsx:71 — Giao diện phân nhánh pending và active sau đăng ký. |
| UC07.4 | Gửi yêu cầu duyệt cho giáo viên | extend | Khóa có phí nên đăng ký được ghi ở trạng thái pending. | server/app.js:821 — Chỉ pending mới tạo notification cho course.teacher_id. |

Phạm vi và giới hạn:

- «include» thể hiện hành vi bắt buộc trong luồng thành công, không diễn tả thứ tự thực hiện. Các nút con là phân tích hành vi của code hiện tại, không khẳng định mỗi nút có trang hoặc API riêng.
- Không bắt buộc include UC08 Duyệt đăng ký: khóa miễn phí mở học ngay, còn duyệt là tác vụ khác do giáo viên/admin làm sau.
- Không có cổng thanh toán, hóa đơn hoặc thu tiền tự động. Yêu cầu duyệt ở đây là notification trong hệ thống.
- Tái đăng ký dropped dùng lại dòng cũ; dữ liệu đã ghi không tự rollback nếu bước tạo thông báo sau đó lỗi.

## UC08 – Duyệt đăng ký khóa học

Tác nhân: Giáo viên, Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC08.1 | Hiển thị danh sách đăng ký | include | Phần bắt buộc của luồng thành công. | src/pages/teacher/StudentProgress.jsx:26 — Tải khóa và enrollments để hiển thị bảng; GV chỉ khóa sở hữu, admin toàn bộ.<br>server/app.js:783 — API lọc enrollment theo role và course_id. |
| UC08.2 | Kiểm tra quyền duyệt đăng ký | include | Phần bắt buộc của luồng thành công. | server/app.js:829 — PUT enrollment gọi ownedCourse trước khi ghi; chỉ GV phụ trách hoặc admin.<br>src/pages/teacher/StudentProgress.jsx:174 — Chỉ dòng pending hiện nút Duyệt đăng ký. |
| UC08.3 | Mở quyền học cho học viên | include | Phần bắt buộc của luồng thành công. | src/pages/teacher/StudentProgress.jsx:175 — Nút duyệt gửi active.<br>server/app.js:832 — Cập nhật enrollment.status; active cho phép truy cập nội dung khi publication hợp lệ. |
| UC08.4 | Thông báo kết quả duyệt | include | Phần bắt buộc của luồng thành công. | server/app.js:836 — Ghi notification cập nhật enrollment cho học viên.<br>src/pages/teacher/StudentProgress.jsx:67 — Tải lại danh sách và toast khi cập nhật thành công. |
| UC08.5 | Tìm kiếm hoặc lọc đăng ký | extend | Người quản lý muốn tìm tên/email hoặc lọc một khóa. | src/pages/teacher/StudentProgress.jsx:31 — selectedCourse truyền vào truy vấn.<br>src/pages/teacher/StudentProgress.jsx:56 — Lọc tên/email tại client. |

Phạm vi và giới hạn:

- «include» thể hiện hành vi bắt buộc trong luồng thành công, không diễn tả thứ tự thực hiện. Các nút con là phân tích hành vi của code hiện tại, không khẳng định mỗi nút có trang hoặc API riêng.
- API còn nhận dropped nhưng UI hiện tại không có nút từ chối/hủy; không vẽ thêm tác vụ từ chối qua giao diện.
- Không thêm xác minh thanh toán tự động; giáo viên xác nhận phí thủ công ngoài luồng cổng thanh toán.
- API cập nhật và notification không chung transaction, không khẳng định lỗi notification đã rollback việc duyệt.

## UC09 – Học bài và ghi nhận tiến độ

Tác nhân: Học viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC09.1 | Kiểm tra quyền truy cập bài học | include | Phần bắt buộc của luồng thành công. | server/app.js:181 — lessonAccess kiểm course access/enrollment và publication.<br>server/app.js:716 — GET lesson đi qua lessonAccess, trả previous/next cùng khóa. |
| UC09.2 | Hiển thị nội dung bài học | include | Phần bắt buộc của luồng thành công. | src/pages/student/LessonView.jsx:40 — Tải lesson, exercises và own progress.<br>src/pages/student/LessonView.jsx:183 — Hiển thị Markdown nội dung bài giảng. |
| UC09.3 | Xem hoặc nghe học liệu | extend | Bài có URL video/audio và học viên chọn sử dụng học liệu đó. | src/pages/student/LessonView.jsx:149 — Video chỉ render nếu lesson.video_url có giá trị.<br>src/pages/student/LessonView.jsx:166 — Audio chỉ render nếu lesson.audio_url có giá trị. |
| UC09.4 | Chuyển bài trước hoặc sau | extend | Học viên chọn điều hướng và có bài tương ứng trong cùng khóa. | src/pages/student/LessonView.jsx:237 — Các nút previous/next chỉ điều hướng nếu ID có; không yêu cầu xong bài trước. |
| UC09.5 | Ghi nhận tiến độ và thời gian học | extend | Học viên chọn Đánh dấu đã học cho bài chưa hoàn thành. | src/pages/student/LessonView.jsx:73 — Gửi is_completed, session_id UUID và số giây lũy kế khi bấm nút.<br>server/app.js:870 — POST progress kiểm enrollment và chuyển recordProgress khi SQL Server.<br>database/routines.sql:91 — Procedure chống cộng trùng thời gian, lưu completion và có thể hoàn thành enrollment. |

Phạm vi và giới hạn:

- «include» thể hiện hành vi bắt buộc trong luồng thành công, không diễn tả thứ tự thực hiện. Các nút con là phân tích hành vi của code hiện tại, không khẳng định mỗi nút có trang hoặc API riêng.
- Chỉ mở/xem bài không bắt buộc phải đánh dấu hoàn thành, xem audio/video hoặc chuyển bài; các tác vụ đó là «extend».
- Ghi thời gian chỉ xảy ra khi gửi hoàn thành; không có heartbeat theo dõi liên tục. Hoàn thành khóa là cập nhật có điều kiện bên trong lưu tiến độ, không bước bắt buộc mọi bài.
- Không khóa bài sau theo hoàn thành bài trước; không sinh media/audio tự động.

## UC10 – Làm bài tập

Tác nhân: Học viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC10.1 | Hiển thị câu hỏi bài tập | include | Phần bắt buộc của luồng thành công. | src/pages/student/Practice.jsx:35 — Tải exercise metadata và GET questions/exercise cho nhánh bài tập.<br>server/app.js:1148 — sendExerciseQuestions loại correct_text/explanation/is_correct khỏi payload người học. |
| UC10.2 | Tiếp nhận và kiểm tra bài nộp | include | Phần bắt buộc của luồng thành công. | src/pages/student/Practice.jsx:71 — Người học chọn đáp án/nhập text và gửi answers; có xác nhận nếu chưa đủ câu.<br>server/app.js:1362 — validateAnswers chấp nhận object có thể chưa đủ câu, kiểm ID/options/type/length.<br>server/app.js:1410 — Submit exercise kiểm quyền và phải có câu hỏi trước tạo lượt. |
| UC10.3 | Lưu lượt làm và bộ câu hỏi | include | Phần bắt buộc của luồng thành công. | server/app.js:1415 — Trong transaction tạo attempt kind exercise với questions_json snapshot tại thời điểm nộp. |
| UC10.4 | Chấm phần khách quan và lưu kết quả | include | Phần bắt buộc của luồng thành công. | server/grading.js:1 — Chấm câu khách quan; essay/speaking tạo needs_grading/pending_grading.<br>server/app.js:1381 — finishAttempt lưu answers/result/score/status và ghi thông báo trong transaction. |
| UC10.5 | Hiển thị điểm hoặc trạng thái chờ chấm | include | Phần bắt buộc của luồng thành công. | src/pages/student/Practice.jsx:91 — Nhận result từ server và thông báo kết quả hoặc chờ giáo viên chấm.<br>src/pages/student/Practice.jsx:193 — Kết quả hiển thị điểm tự động/tạm tính và thông tin chi tiết được phép. |

Phạm vi và giới hạn:

- «include» thể hiện hành vi bắt buộc trong luồng thành công, không diễn tả thứ tự thực hiện. Các nút con là phân tích hành vi của code hiện tại, không khẳng định mỗi nút có trang hoặc API riêng.
- Không bắt buộc trả lời hết mọi câu; sau xác nhận, payload có thể thiếu câu hoặc rỗng. Vì vậy nút tiếp nhận/kiểm tra bài nộp không mang nghĩa mọi câu phải có đáp án.
- Đây là bài tập, không phải UC11: không có autosave nháp, resume lượt thi, đồng hồ deadline hoặc giới hạn số lượt bài tập.
- Không include chấm tay UC22 như bước luôn hoàn tất ngay lúc nộp; hệ thống chỉ ghi pending_grading và giáo viên xử lý riêng sau đó. Không chấm AI/ghi âm trực tiếp.
- Các handler chấm bài tập đang dùng JavaScript gradeQuestions, không gọi procedure SQL chấm bài.

## UC11 – Làm bài kiểm tra/thi thử

Tác nhân: Học viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC11.1 | Bắt đầu hoặc tiếp tục lượt thi | include | Phần bắt buộc của luồng thành công. | src/pages/student/Practice.jsx:35 — Tải thông tin đề rồi POST start để nhận lượt mới hoặc lượt đang làm.<br>server/app.js:1429 — Kiểm tra quyền học viên; tiếp tục lượt in_progress hoặc tạo lượt trong transaction, giới hạn số lượt. |
| UC11.2 | Xem câu hỏi và thời gian còn lại | include | Phần bắt buộc của luồng thành công. | src/pages/student/Practice.jsx:48 — Hiển thị câu hỏi và khôi phục câu trả lời của lượt thi.<br>src/pages/student/Practice.jsx:106 — Đồng hồ tính theo deadline/server_now đã trả về; cập nhật mỗi giây. |
| UC11.3 | Lưu nháp câu trả lời | extend | Trong lượt thi đang mở và còn thời gian, khi giao diện nạp hoặc thay đổi câu trả lời và gửi bản nháp. | src/pages/student/Practice.jsx:123 — Sau khi nạp/thay đổi đáp án, debounce 500ms rồi PUT draft nếu lượt còn mở.<br>server/app.js:1479 — Chỉ lưu draft khi đúng chủ lượt, đúng đề, còn in_progress và chưa quá deadline. |
| UC11.4 | Hoàn tất lượt thi khi nộp hoặc hết giờ | include | Phần bắt buộc của luồng thành công. | src/pages/student/Practice.jsx:71 — Nút nộp gửi answers và exam_result_id; hỏi xác nhận khi còn câu chưa trả lời.<br>src/pages/student/Practice.jsx:114 — Khi giao diện đang mở và đồng hồ về 0, tự gửi submit(true) một lần.<br>server/app.js:1490 — Xác minh chủ lượt/đề, trả kết quả cũ nếu đã nộp; quá hạn dùng đáp án đã lưu theo quy tắc server.<br>server/app.js:429 — Request xác thực tiếp theo kết thúc các lượt in_progress đã quá deadline từ bản nháp đã lưu. |
| UC11.5 | Nhận kết quả theo quyền xem đáp án | include | Phần bắt buộc của luồng thành công. | src/pages/student/Practice.jsx:194 — Hiển thị phần trăm, điểm, đạt/chưa đạt hoặc trạng thái chờ giáo viên chấm.<br>server/app.js:1503 — Nếu show_answer_after tắt, loại details và questions trước khi trả kết quả. |

Phạm vi và giới hạn:

- Các quan hệ include trong hình này mô tả các thành phần của một lượt thi hoàn tất thành công; người học vẫn có thể rời trang để giữ lượt đang làm và tiếp tục sau.
- Lưu nháp là extend theo điều kiện lượt còn mở và đáp án được nạp/thay đổi; không phải nút người dùng chủ động chọn ở mọi lượt. Tự nộp khi hết giờ gộp trong chức năng hoàn tất lượt thi, không tách thành node trùng mục đích nộp bài.
- Việc ghi snapshot là chi tiết nội bộ của bắt đầu lượt thi, không tách thành chức năng nghiệp vụ của học viên.
- Nếu có câu viết/nói, kết quả có thể là tạm tính và pending_grading. Chấm thủ công thuộc UC22 của giáo viên/admin, không gán cho học viên trong phân rã này.
- Không có proctoring, lịch mở/đóng kỳ thi, quy đổi band IELTS hay daemon luôn chạy để tự chấm chính xác deadline khi trình duyệt đã đóng; request xác thực tiếp theo xử lý lượt quá hạn.

## UC12 – Xem kết quả và lời giải

Tác nhân: Học viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC12.1 | Xem lịch sử bài làm | include | Phần bắt buộc của luồng thành công. | src/pages/student/ExerciseHistory.jsx:16 — Tải danh sách bài tập đã nộp của tài khoản.<br>src/pages/student/MyProgress.jsx:120 — Trang Tiến độ & Kết quả hiển thị chung lịch sử bài tập và bài thi. |
| UC12.2 | Xem điểm và trạng thái bài làm | include | Phần bắt buộc của luồng thành công. | src/pages/student/MyProgress.jsx:144 — Danh sách hiển thị điểm và trạng thái chờ giáo viên chấm/đã chấm.<br>src/pages/student/ExerciseHistory.jsx:126 — Thẻ lịch sử bài tập hiển thị điểm phần trăm. |
| UC12.3 | Mở kết quả chi tiết | extend | Học viên chọn Xem kết quả hoặc Xem chi tiết của một lượt làm đã nộp thuộc tài khoản mình. | src/pages/student/MyProgress.jsx:25 — Chọn Xem kết quả sẽ tải đúng endpoint bài thi hoặc bài tập theo loại lượt.<br>src/pages/student/ExerciseHistory.jsx:41 — Chọn Xem chi tiết để tải/lần nữa để đóng phần chi tiết bài tập. |
| UC12.4 | Xem đáp án và lời giải được phép | extend | Đang mở kết quả chi tiết và dữ liệu lời giải được phép công bố; bài thi phải bật quyền xem đáp án. | src/pages/student/MyProgress.jsx:199 — Chỉ hiển thị đáp án/lời giải từ chi tiết được server cung cấp.<br>src/pages/student/MyProgress.jsx:211 — Nếu không có chi tiết câu hỏi, UI thông báo giáo viên đã tắt xem đáp án.<br>server/app.js:1327 — studentResult loại thông tin lời giải của bài thi không cho xem đáp án. |
| UC12.5 | Xem nhận xét của giáo viên | extend | Đang mở kết quả chi tiết tại Tiến độ & Kết quả và bài có nhận xét đã được giáo viên lưu. | src/pages/student/MyProgress.jsx:183 — Khối nhận xét chỉ render khi detail.feedback có nội dung. |

Phạm vi và giới hạn:

- Không tạo hoặc sửa điểm trong use case này; chỉ xem kết quả của lượt làm đã nộp thuộc chính học viên.
- Trang lịch sử bài tập và trang Tiến độ & Kết quả là hai điểm vào có thật. Các con liệt kê năng lực tổng hợp của use case, không khẳng định từng màn đều có mọi khối giao diện.
- Bài tập và bài thi dùng endpoint chi tiết khác nhau. Quyền xem lời giải bài thi do server kiểm tra; không thể suy lời giải luôn có trong mọi kết quả.
- Cờ chờ chấm và điểm có thể chưa đồng bộ từng chi tiết câu hỏi sau khi giáo viên sửa điểm tổng; không tự bổ sung rubric/chấm từng câu vào hình.

## UC13 – Theo dõi tiến độ học tập

Tác nhân: Học viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC13.1 | Xem tổng quan học tập | include | Phần bắt buộc của luồng thành công. | src/pages/student/MyProgress.jsx:14 — Tải dashboard của chính học viên.<br>src/pages/student/MyProgress.jsx:53 — Hiển thị số bài hoàn thành, số lượt đã nộp và điểm trung bình bài graded. |
| UC13.2 | Xem tiến độ từng khóa học | include | Phần bắt buộc của luồng thành công. | src/pages/student/MyProgress.jsx:65 — Hiển thị khóa đã đăng ký, số bài hoàn thành/tổng bài và thanh phần trăm. |
| UC13.3 | Xem thời gian học trong tuần | include | Phần bắt buộc của luồng thành công. | src/pages/student/MyProgress.jsx:94 — Biểu đồ thời gian học ghi nhận 7 ngày, nhãn giải thích tính theo UTC. |
| UC13.4 | Xem lịch sử và điểm bài làm | include | Phần bắt buộc của luồng thành công. | src/pages/student/MyProgress.jsx:120 — Bảng lịch sử bài tập và bài thi, thời gian nộp, điểm và trạng thái. |
| UC13.5 | Mở kết quả chi tiết bài làm | extend | Học viên chọn Xem kết quả trên một dòng lịch sử. | src/pages/student/MyProgress.jsx:151 — Nút Xem kết quả mở chi tiết bài đã chọn.<br>src/pages/student/MyProgress.jsx:25 — Tải chi tiết đúng loại bài tập/bài thi. |

Phạm vi và giới hạn:

- Bốn chức năng include là các phần cùng hiện trên trang Tiến độ & Kết quả; không phải bốn trang báo cáo mới.
- Chỉ tính điểm trung bình trên các bài graded; chưa có điểm thì hiển thị Chưa có.
- Thời gian là thời gian đã ghi nhận khi lưu hoàn thành bài học, không phải toàn bộ thời gian mở trình duyệt.
- Không thêm tạo/xuất báo cáo tuần-tháng hoặc lịch tự động vào phân rã: trang này GET /dashboard/student, không gọi reportApi.

## UC14 – Xem lộ trình học tập

Tác nhân: Học viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC14.1 | Xem danh sách lộ trình đã xuất bản | include | Phần bắt buộc của luồng thành công. | src/pages/student/LearningPathPage.jsx:13 — Tải lộ trình và các ghi danh hiện có; server trả phạm vi được phép. |
| UC14.2 | Xem thông tin lộ trình được chọn | include | Phần bắt buộc của luồng thành công. | src/pages/student/LearningPathPage.jsx:22 — Mặc định chọn lộ trình đầu khi có dữ liệu.<br>src/pages/student/LearningPathPage.jsx:49 — Người học có thể đổi lộ trình được chọn.<br>src/pages/student/LearningPathPage.jsx:65 — Hiển thị tiêu đề, mô tả, trình độ, thời lượng dự kiến của lộ trình được chọn. |
| UC14.3 | Xem các khóa theo thứ tự lộ trình | include | Phần bắt buộc của luồng thành công. | src/pages/student/LearningPathPage.jsx:75 — Danh sách ol hiển thị các khóa theo thứ tự server trả. |
| UC14.4 | Xem tiến độ từng khóa trong lộ trình | include | Phần bắt buộc của luồng thành công. | src/pages/student/LearningPathPage.jsx:77 — Đối chiếu enrollment theo course_id để hiển thị phần trăm hoặc Chưa tham gia. |
| UC14.5 | Mở chi tiết khóa học trong lộ trình | extend | Học viên chọn Xem khóa học tại một khóa trong lộ trình. | src/pages/student/LearningPathPage.jsx:95 — Liên kết Xem khóa học dẫn đến trang chi tiết khóa đã chọn. |

Phạm vi và giới hạn:

- Nếu chưa có lộ trình hoặc khóa được xuất bản, hiển thị trạng thái rỗng; các thành phần include về chi tiết mô tả nhánh thành công khi có lộ trình để chọn.
- Không có ghi danh riêng vào lộ trình, tự động đăng ký mọi khóa, AI cá nhân hóa hoặc điều kiện tiên quyết bắt buộc học xong khóa trước.
- Thứ tự khóa là hướng dẫn học được giáo viên cấu hình, không phải cơ chế khóa/mở khóa tự động.

## UC15 – Xem và đánh dấu thông báo

Tác nhân: Học viên, Giáo viên, Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC15.1 | Xem danh sách thông báo cá nhân | include | Phần bắt buộc của luồng thành công. | src/pages/student/NotificationPage.jsx:24 — Tải danh sách thông báo của tài khoản đang đăng nhập.<br>src/components/layout/Header.jsx:33 — Header tải tối đa 5 thông báo để xem nhanh. |
| UC15.2 | Lọc thông báo đã đọc hoặc chưa đọc | extend | Người dùng chọn tab Chưa đọc hoặc Đã đọc trên trang thông báo. | src/pages/student/NotificationPage.jsx:64 — Lọc client theo all/unread/read.<br>src/pages/student/NotificationPage.jsx:114 — Các tab cho phép chọn bộ lọc. |
| UC15.3 | Đánh dấu một thông báo đã đọc | extend | Người dùng mở hoặc bấm nút đánh dấu một thông báo đang chưa đọc của mình. | src/pages/student/NotificationPage.jsx:42 — PUT đánh dấu một thông báo rồi cập nhật danh sách local.<br>src/pages/student/NotificationPage.jsx:178 — Nhấn một thông báo chưa đọc gọi handleMarkAsRead. |
| UC15.4 | Đánh dấu tất cả thông báo đã đọc | extend | Người dùng chọn Đánh dấu tất cả đã đọc khi còn thông báo chưa đọc. | src/pages/student/NotificationPage.jsx:54 — Gọi API markAllAsRead và cập nhật cờ đã đọc.<br>src/pages/student/NotificationPage.jsx:102 — Nút chỉ hiện khi có ít nhất một thông báo chưa đọc trong dữ liệu đang tải. |

Phạm vi và giới hạn:

- Đây là thông báo nội bộ lưu trong database; không có email, WebSocket hoặc push realtime.
- Học viên có menu riêng, giáo viên/admin có thể mở trang chung /notifications qua header.
- Bộ đếm header chỉ dựa vào tối đa 5 bản ghi đã tải ở đó; không coi là tổng unread toàn hệ thống. Dữ liệu mới cần tải lại.

## UC16 – Quản lý khóa học

Tác nhân: Giáo viên, Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC16.1 | Xem danh sách khóa học được quản lý | include | Phần bắt buộc của luồng thành công. | src/pages/teacher/CourseManagement.jsx:61 — Tải danh sách khóa trong phạm vi quản lý cùng các chương trình. |
| UC16.2 | Tìm kiếm hoặc lọc khóa học | extend | Người quản lý nhập từ khóa hoặc chọn chương trình để thu hẹp danh sách khóa đã tải trong phạm vi quyền. | src/pages/teacher/CourseManagement.jsx:224 — Ô tìm kiếm theo tiêu đề; bộ lọc chương trình ở cùng thanh công cụ. |
| UC16.3 | Thêm khóa học | extend | Giáo viên hoặc admin chọn Thêm khóa học và nhập dữ liệu khóa mới. | src/pages/teacher/CourseManagement.jsx:108 — Mở form khóa mới.<br>src/pages/teacher/CourseManagement.jsx:162 — Nhánh tạo gọi createCourse với dữ liệu biểu mẫu. |
| UC16.4 | Sửa thông tin khóa học | extend | Người quản lý chọn sửa một khóa trong phạm vi được cấp quyền. | src/pages/teacher/CourseManagement.jsx:124 — Nạp khóa vào form chỉnh sửa.<br>src/pages/teacher/CourseManagement.jsx:159 — Nhánh sửa gọi updateCourse của khóa được chọn. |
| UC16.5 | Ẩn hoặc xuất bản khóa học | extend | Người quản lý thay đổi trạng thái bản nháp/đang mở khi thêm hoặc sửa khóa. | src/pages/teacher/CourseManagement.jsx:544 — Form có lựa chọn is_published; lưu cùng yêu cầu tạo/sửa. |
| UC16.6 | Xóa khóa học | extend | Người quản lý chọn Xóa và xác nhận xóa khóa. | src/pages/teacher/CourseManagement.jsx:179 — Sau xác nhận mới DELETE khóa được chọn.<br>src/pages/teacher/CourseManagement.jsx:562 — Có hộp thoại xác nhận xóa. |

Phạm vi và giới hạn:

- include là phần luôn cần khi vào màn quản lý; các thao tác Thêm/Sửa/Xóa/Xuất bản là lựa chọn theo mục tiêu cụ thể, không phải đều bắt buộc chạy trong một lần quản lý.
- Giáo viên chỉ quản lý khóa mình phụ trách, admin có phạm vi toàn hệ thống.
- Ẩn/xuất bản được thực hiện trong form thêm/sửa, không có workflow admin duyệt xuất bản.
- Không có ô giao/chuyển giáo viên phụ trách trên UI hiện tại; học phí không tự tạo giao dịch thanh toán.
- SQL driver chặn xóa khóa có lịch sử bài làm; đây là ngoại lệ từ chối xóa, không mô tả luôn xóa sạch kết quả.

## UC17 – Quản lý bài học

Tác nhân: Giáo viên, Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC17.1 | Chọn khóa và xem danh sách bài học | include | Phần bắt buộc của luồng thành công. | src/pages/teacher/LessonManagement.jsx:57 — Tải các khóa được quản lý, chọn khóa mặc định khi cần.<br>src/pages/teacher/LessonManagement.jsx:77 — Khi chọn khóa, tải bài học thuộc khóa theo thứ tự. |
| UC17.2 | Thêm bài học | extend | Người quản lý đã chọn khóa và chọn thêm bài học. | src/pages/teacher/LessonManagement.jsx:100 — Mở form tạo bài học trong khóa đã chọn.<br>src/pages/teacher/LessonManagement.jsx:132 — Handler lưu phân nhánh createLesson hoặc updateLesson. |
| UC17.3 | Sửa nội dung bài học | extend | Người quản lý chọn sửa một bài học thuộc khóa được phép quản lý. | src/pages/teacher/LessonManagement.jsx:116 — Mở bài học trong form chỉnh sửa.<br>src/pages/teacher/LessonManagement.jsx:132 — Lưu tiêu đề, nội dung, liên kết media, thời lượng và các trường cho phép. |
| UC17.4 | Sắp xếp thứ tự bài học | extend | Người quản lý chọn chuyển bài lên hoặc xuống khi còn vị trí liền kề hợp lệ. | src/pages/teacher/LessonManagement.jsx:178 — Nút lên/xuống đổi thứ tự qua hai PUT chạy Promise.all.<br>src/pages/teacher/LessonManagement.jsx:341 — Nút chuyển bài lên/xuống ở danh sách bài học. |
| UC17.5 | Ẩn hoặc xuất bản bài học | extend | Người quản lý đổi trạng thái nháp/công khai khi thêm hoặc sửa bài học. | src/pages/teacher/LessonManagement.jsx:483 — Form cho chọn is_published và lưu cùng thay đổi bài học. |
| UC17.6 | Xóa bài học | extend | Người quản lý chọn Xóa và xác nhận xóa bài học. | src/pages/teacher/LessonManagement.jsx:162 — Handler DELETE sau khi người dùng xác nhận.<br>src/pages/teacher/LessonManagement.jsx:500 — Hộp thoại xác nhận xóa bài. |

Phạm vi và giới hạn:

- Không bắt buộc chạy đồng thời Thêm/Sửa/Xóa/Sắp xếp; mỗi nhánh extend chỉ xảy ra khi người quản lý chọn thao tác tương ứng.
- Sắp xếp dùng hai yêu cầu cập nhật, chưa phải giao dịch swap nguyên tử giữa hai request. Nếu một lỗi, UI tải lại danh sách.
- Video/audio là URL do người quản lý cung cấp, không có upload media. document_url có schema/state nhưng chưa có ô nhập và hiển thị tài liệu đầy đủ.
- SQL driver từ chối xóa khi bài tập con đã có lượt làm; có thể ẩn bài để giữ lịch sử.

## UC18 – Quản lý bài tập

Tác nhân: Giáo viên, Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC18.1 | Chọn bài học và xem các bộ bài tập | include | Phần bắt buộc của luồng thành công. | src/pages/teacher/ExerciseManagement.jsx:92 — Tải khóa được quản lý để chọn bối cảnh.<br>src/pages/teacher/ExerciseManagement.jsx:135 — Đổi khóa để lấy bài học.<br>src/pages/teacher/ExerciseManagement.jsx:160 — Tải các bộ bài tập của bài học đã chọn. |
| UC18.2 | Thêm bộ bài tập | extend | Người quản lý chọn một bài học và chọn Thêm bộ bài tập. | src/pages/teacher/ExerciseManagement.jsx:231 — Mở form bộ bài tập mới, mặc định chưa xuất bản.<br>src/pages/teacher/ExerciseManagement.jsx:266 — Lưu bộ bài tập qua createExercise/updateExercise. |
| UC18.3 | Sửa thông tin bộ bài tập | extend | Người quản lý chọn sửa một bộ bài tập trong phạm vi quản lý. | src/pages/teacher/ExerciseManagement.jsx:253 — Nạp bài tập được chọn vào form.<br>src/pages/teacher/ExerciseManagement.jsx:266 — Lưu tiêu đề, mô tả, loại, độ khó, thời lượng và trạng thái. |
| UC18.4 | Ẩn hoặc xuất bản bộ bài tập | extend | Người quản lý thay đổi lựa chọn công khai khi thêm hoặc sửa bộ bài tập. | src/pages/teacher/ExerciseManagement.jsx:848 — Checkbox Công khai điều khiển is_published trong form bài tập.<br>src/pages/teacher/ExerciseManagement.jsx:285 — Trạng thái xuất bản đi kèm dữ liệu lưu bài tập. |
| UC18.5 | Xóa bộ bài tập | extend | Người quản lý chọn Xóa bộ bài tập và xác nhận thao tác. | src/pages/teacher/ExerciseManagement.jsx:423 — Chọn đối tượng bộ bài tập muốn xóa.<br>src/pages/teacher/ExerciseManagement.jsx:435 — Hộp thoại dùng chung phân biệt exercise/question rồi gọi endpoint xóa phù hợp. |
| UC19 | Quản lý câu hỏi và đáp án (tham chiếu UC đã có) | extend | Người quản lý chọn thao tác thêm, sửa hoặc xóa câu hỏi trong một bộ bài tập. | src/pages/teacher/ExerciseManagement.jsx:298 — Các handler soạn câu hỏi nằm cùng màn quản lý bộ bài tập.<br>src/pages/teacher/ExerciseManagement.jsx:647 — Nút Thêm câu hỏi thuộc từng bộ bài tập; các thao tác sửa/xóa nằm tại danh sách câu hỏi. |

Phạm vi và giới hạn:

- Chức năng câu hỏi/đáp án thuộc UC19, không khẳng định mọi lần quản lý bài tập đều phải tạo hoặc sửa câu hỏi.
- time_limit của bộ bài tập là metadata, không có đồng hồ cưỡng chế hoặc lưu nháp như luồng bài thi.
- Một số record SQL có type=mixed nhưng dropdown/nhãn chưa đầy đủ, dù backend chấp nhận mixed.
- Xóa bộ đã có lượt làm bị SQL driver từ chối nhằm giữ lịch sử; không giả định luôn xóa toàn bộ kết quả.
- UC19 được tham chiếu như một nhánh mở rộng khi soạn câu hỏi trong bộ bài tập; cùng UC19 được phân rã riêng ở trang của nó.

## UC19 – Quản lý câu hỏi và đáp án

Tác nhân: Giáo viên, Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC19.1 | Xem câu hỏi và đáp án của bộ bài tập | include | Phần bắt buộc của luồng thành công. | src/pages/teacher/ExerciseManagement.jsx:160 — Tải câu hỏi cho các bộ bài tập của bài học.<br>src/pages/teacher/ExerciseManagement.jsx:670 — Khi mở bộ bài tập, hiện danh sách câu hỏi và thông tin đáp án/lời giải cho người soạn. |
| UC19.2 | Thêm câu hỏi và đáp án | extend | Người quản lý chọn Thêm câu hỏi trong một bộ bài tập được phép quản lý. | src/pages/teacher/ExerciseManagement.jsx:299 — Form thêm câu hỏi gắn exercise_id.<br>src/pages/teacher/ExerciseManagement.jsx:367 — Validate rồi gửi createQuestion cùng answers hoặc correct_text. |
| UC19.3 | Sửa câu hỏi, đáp án và lời giải | extend | Người quản lý chọn sửa một câu hỏi của bộ bài tập. | src/pages/teacher/ExerciseManagement.jsx:318 — Nạp câu hỏi/phương án vào modal.<br>src/pages/teacher/ExerciseManagement.jsx:367 — Cập nhật nội dung, điểm, lời giải và đáp án qua updateQuestion. |
| UC19.4 | Xóa câu hỏi | extend | Người quản lý chọn Xóa câu hỏi và xác nhận. | src/pages/teacher/ExerciseManagement.jsx:429 — Chọn câu hỏi cần xóa.<br>src/pages/teacher/ExerciseManagement.jsx:435 — Sau xác nhận, gọi deleteQuestion cho trường hợp đối tượng là question. |

Phạm vi và giới hạn:

- Đáp án được gửi kèm yêu cầu lưu câu hỏi; các wrapper /answers riêng không có caller/backend hiện thực và không được thêm thành thao tác độc lập.
- Trắc nghiệm/đúng-sai cần 2–10 phương án, đúng một phương án đúng theo server; điền/nối/sắp xếp dùng correct_text, nhiều phương án ngăn bởi |.
- Viết/nói là dạng câu hỏi cần giáo viên chấm, không có recorder hoặc AI scoring; nối/sắp xếp vẫn là văn bản, không kéo-thả.
- Chỉnh đáp án ngân hàng không tự thay snapshot của lượt làm đã nộp; xóa câu hỏi gỡ các liên kết đề có liên quan.

## UC20 – Quản lý bài kiểm tra

Tác nhân: Giáo viên, Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC20.1 | Xem danh sách đề được quản lý | include | Phần bắt buộc của luồng thành công. | server/app.js:1190 — Danh sách chỉ trả đề quản lý được hoặc truy cập được.<br>src/pages/teacher/ExamManagement.jsx:65 — Mở trang tải khóa và danh sách đề. |
| UC20.2 | Tạo bài kiểm tra | extend | Người quản lý chọn Thêm bài kiểm tra tại danh sách; có khóa được quản lý. | src/pages/teacher/ExamManagement.jsx:94 — Mở biểu mẫu thêm mới.<br>server/app.js:1290 — Tạo đề cùng liên kết câu hỏi trong transaction. |
| UC20.3 | Sửa cấu hình và câu hỏi của đề | extend | Người quản lý chọn Sửa một đề thuộc quyền quản lý. | src/pages/teacher/ExamManagement.jsx:113 — Form sửa nạp các câu đã chọn.<br>server/app.js:1304 — Kiểm tra quyền và lưu metadata/câu hỏi trong transaction. |
| UC20.4 | Xuất bản hoặc đưa đề về nháp | extend | Người quản lý thay đổi trạng thái xuất bản trong form; xuất bản cần có câu hỏi. | src/pages/teacher/ExamManagement.jsx:144 — Xuất bản đề rỗng bị giao diện chặn.<br>src/pages/teacher/ExamManagement.jsx:529 — Checkbox is_published nằm trong form thêm/sửa. |
| UC20.5 | Xóa bài kiểm tra | extend | Người quản lý chọn Xóa và xác nhận; đề chưa có lượt làm. | src/pages/teacher/ExamManagement.jsx:177 — Hộp thoại xác nhận gọi xóa đề.<br>server/sqlserver-store.js:282 — Không xóa đề đã có attempts; còn lại gỡ exam_questions. |

Phạm vi và giới hạn:

- Luồng cơ sở của sơ đồ là mở danh sách quản lý trong phạm vi được cấp. Điểm mở rộng là chọn thao tác trên danh sách; chỉ thêm/sửa/xóa khi điều kiện tương ứng đúng. Không hiểu extend là quan hệ phân cấp hay bắt buộc thực hiện mọi thao tác.
- Giáo viên chỉ thao tác tài nguyên thuộc phạm vi phụ trách; admin có phạm vi toàn hệ thống. Đăng nhập là tiền điều kiện, không thêm include Đăng nhập.
- Xuất bản/nháp là biến thể của form thêm/sửa, không phải một module độc lập. Bản nháp có thể chưa chọn câu. Câu phải cùng khóa, không trùng, tối đa 200; bộ chọn hiện chỉ tải 200 câu.
- Loại đề mẫu mock chưa thống nhất với validator mock_test; không thêm lịch mở/đóng kỳ thi, giám sát thi hoặc quy đổi band.

## UC21 – Xem tiến độ học viên

Tác nhân: Giáo viên, Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC21.1 | Xem danh sách tiến độ học viên | include | Phần bắt buộc của luồng thành công. | server/app.js:783 — Giáo viên được lọc enrollments theo khóa phụ trách; admin toàn bộ.<br>src/pages/teacher/StudentProgress.jsx:26 — Trang tải khóa và ghi danh trước khi hiển thị tiến độ. |
| UC21.2 | Tìm học viên hoặc lọc theo khóa | extend | Người quản lý nhập từ khóa hoặc chọn một khóa trên màn hình tiến độ. | src/pages/teacher/StudentProgress.jsx:56 — Lọc tên/email trong danh sách đã tải.<br>src/pages/teacher/StudentProgress.jsx:216 — Chọn khóa để tải lại danh sách. |
| UC21.3 | Xem chi tiết tiến độ một học viên | extend | Người quản lý chọn Xem ở một dòng ghi danh. | src/pages/teacher/StudentProgress.jsx:77 — Nút Xem mở modal của ghi danh được chọn.<br>src/pages/teacher/StudentProgress.jsx:278 — Modal hiển thị mức hoàn thành và điểm trung bình hiện có. |

Phạm vi và giới hạn:

- Luồng cơ sở là hiển thị danh sách tiến độ; tìm/lọc và mở chi tiết là các điểm mở rộng do người quản lý chọn.
- Giáo viên chỉ thao tác tài nguyên thuộc phạm vi phụ trách; admin có phạm vi toàn hệ thống. Đăng nhập là tiền điều kiện, không thêm include Đăng nhập.
- Duyệt đăng ký là UC08 đã có, không tạo thêm một mục đích Duyệt với ID UC21.x.
- Một số nhận xét trong modal là nội dung tĩnh; không mô hình hóa phân tích năng lực/điểm danh tự động hoặc báo cáo tuần/tháng hoàn chỉnh.

## UC22 – Chấm bài và nhận xét

Tác nhân: Giáo viên, Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC22.1 | Xem danh sách bài đã nộp | include | Phần bắt buộc của luồng thành công. | server/app.js:1510 — Staff xem attempts đã nộp trong các khóa được phép.<br>src/pages/teacher/Submissions.jsx:17 — Mở trang tải danh sách bài nộp. |
| UC22.2 | Xem câu trả lời và kết quả hiện có | include | Phần bắt buộc của luồng thành công. | server/app.js:1526 — Trả chi tiết snapshot của bài trong phạm vi quản lý.<br>src/pages/teacher/Submissions.jsx:33 — Người chấm mở chi tiết trước khi nhập điểm. |
| UC22.3 | Chấm điểm tổng và lưu nhận xét | include | Phần bắt buộc của luồng thành công. | src/pages/teacher/Submissions.jsx:42 — Form gửi score/feedback cho bài được chọn.<br>server/app.js:1534 — Bài phải đã nộp, score 0–100; cập nhật trạng thái graded và người chấm. |
| UC22.4 | Gửi thông báo kết quả chấm | include | Phần bắt buộc của luồng thành công. | server/app.js:1552 — Sau khi lưu điểm, tạo thông báo nội bộ cho học viên. |
| UC22.5 | Điều chỉnh điểm và nhận xét đã chấm | extend | Bài được chọn đã ở trạng thái graded và người quản lý quyết định sửa lại điểm tổng/nhận xét. | src/pages/teacher/Submissions.jsx:37 — Form khởi tạo bằng điểm/nhận xét đã lưu.<br>server/app.js:1537 — Chỉ chặn in_progress nên graded vẫn được chấm lại. |

Phạm vi và giới hạn:

- Luồng cơ sở là hoàn tất chấm một bài đã nộp, không phải chỉ mở danh sách. Việc lọc danh sách là tùy chọn; các include là các phần của một lần chấm thành công.
- Giáo viên chỉ thao tác tài nguyên thuộc phạm vi phụ trách; admin có phạm vi toàn hệ thống. Đăng nhập là tiền điều kiện, không thêm include Đăng nhập.
- Chấm điểm tổng cuối cùng 0–100; không có rubric, nhập điểm từng câu hay AI chấm viết/nói.
- Cập nhật điểm và tạo thông báo là hai thao tác không có transaction bao trùm; nếu thông báo lỗi, điểm có thể đã lưu. Cờ chi tiết từng câu có thể chưa đồng bộ sau chấm tay.

## UC23 – Quản lý lộ trình học tập

Tác nhân: Giáo viên, Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC23.1 | Xem danh sách lộ trình quản lý | include | Phần bắt buộc của luồng thành công. | server/app.js:1629 — Teacher chỉ lấy lộ trình của mình; admin lấy toàn bộ.<br>src/pages/teacher/LearningPathManagement.jsx:58 — Mở trang tải lộ trình và chương trình. |
| UC23.2 | Tạo lộ trình học tập | extend | Người quản lý chọn thêm một lộ trình. | src/pages/teacher/LearningPathManagement.jsx:88 — Nút thêm mới mở form và danh sách khóa chọn.<br>server/app.js:1656 — Tạo lộ trình và các khóa theo thứ tự trong transaction. |
| UC23.3 | Sửa lộ trình và thứ tự khóa | extend | Người quản lý chọn Sửa lộ trình thuộc phạm vi quản lý. | src/pages/teacher/LearningPathManagement.jsx:102 — Mở form sửa lộ trình.<br>src/pages/teacher/LearningPathManagement.jsx:324 — Thứ tự khóa dựa trên thứ tự chọn; bỏ/chọn lại để đổi thứ tự.<br>server/app.js:1670 — Kiểm tra owner và cập nhật lộ trình cùng danh sách khóa. |
| UC23.4 | Công bố hoặc đưa lộ trình về nháp | extend | Người quản lý thay đổi trạng thái công bố trong form thêm/sửa. | src/pages/teacher/LearningPathManagement.jsx:433 — Trạng thái xuất bản là trường trong form.<br>server/app.js:1610 — Lưu is_published của lộ trình. |
| UC23.5 | Xóa lộ trình | extend | Người quản lý chọn Xóa một lộ trình và xác nhận. | src/pages/teacher/LearningPathManagement.jsx:152 — Xác nhận xóa lộ trình.<br>server/app.js:1684 — Chỉ owner/admin được xóa.<br>server/sqlserver-store.js:287 — Gỡ path_courses trước khi xóa, không xóa khóa gốc. |

Phạm vi và giới hạn:

- Luồng cơ sở của sơ đồ là mở danh sách quản lý trong phạm vi được cấp. Điểm mở rộng là chọn thao tác trên danh sách; chỉ thêm/sửa/xóa khi điều kiện tương ứng đúng. Không hiểu extend là quan hệ phân cấp hay bắt buộc thực hiện mọi thao tác.
- Giáo viên chỉ thao tác tài nguyên thuộc phạm vi phụ trách; admin có phạm vi toàn hệ thống. Đăng nhập là tiền điều kiện, không thêm include Đăng nhập.
- Công bố/nháp và chọn lại thứ tự là các biến thể trong form; không thêm module kéo-thả, prerequisite hoặc AI cá nhân hóa.
- Các khóa được đưa vào phải thuộc quyền quản lý; không buộc tất cả cùng chương trình. Không có ghi danh riêng vào lộ trình.

## UC24 – Quản lý tài khoản

Tác nhân: Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC24.1 | Xem danh sách tài khoản | include | Phần bắt buộc của luồng thành công. | server/app.js:490 — Admin xem danh sách, tìm tên/email và lọc vai trò.<br>src/pages/admin/UserManagement.jsx:44 — Giao diện tải danh sách có phân trang/tìm kiếm/lọc. |
| UC24.2 | Tạo tài khoản | extend | Admin chọn Thêm người dùng và điền dữ liệu hợp lệ. | src/pages/admin/UserManagement.jsx:77 — Form tạo có email, password và role ban đầu.<br>server/app.js:508 — Admin được tạo student/teacher/admin. |
| UC24.3 | Sửa thông tin tài khoản | extend | Admin chọn Sửa một tài khoản. | src/pages/admin/UserManagement.jsx:90 — Form sửa tài khoản đã tồn tại.<br>server/app.js:529 — API admin cập nhật thông tin qua userInput và ràng buộc quản trị. |
| UC24.4 | Khóa hoặc mở khóa tài khoản | extend | Admin thay đổi trạng thái hoạt động của tài khoản trong form; không tự khóa chính mình. | src/pages/admin/UserManagement.jsx:416 — Trạng thái is_active nằm trong form sửa.<br>server/app.js:541 — Không được tự khóa mình.<br>server/app.js:555 — Khóa thu hồi phiên; mở khóa riêng không buộc thu hồi. |
| UC24.5 | Đặt lại mật khẩu tài khoản | extend | Admin nhập mật khẩu mới trong form sửa tài khoản và lưu. | src/pages/admin/UserManagement.jsx:96 — Password để trống khi sửa trừ khi muốn đặt mật khẩu mới.<br>src/pages/admin/UserManagement.jsx:384 — Ô mật khẩu trong form admin.<br>server/app.js:555 — Gửi password mới thu hồi phiên tài khoản đích. |
| UC24.6 | Xóa tài khoản | extend | Admin chọn Xóa và xác nhận; tài khoản đích không phải mình và không còn sở hữu nội dung bị ràng buộc. | server/app.js:561 — Admin không tự xóa chính mình.<br>server/sqlserver-store.js:209 — Chặn xóa tài khoản còn phụ trách khóa hoặc lộ trình.<br>src/pages/admin/UserManagement.jsx:138 — Chỉ xóa sau xác nhận. |
| UC25 | Cấp và thay đổi vai trò (tham chiếu UC đã có) | extend | Admin thay đổi trường Vai trò của tài khoản đã có. | src/pages/admin/UserManagement.jsx:399 — Vai trò là một trường của cùng form sửa người dùng.<br>server/app.js:532 — Kiểm tra role và ràng buộc đổi quyền. |

Phạm vi và giới hạn:

- Luồng cơ sở của sơ đồ là mở danh sách quản lý trong phạm vi được cấp. Điểm mở rộng là chọn thao tác trên danh sách; chỉ thêm/sửa/xóa khi điều kiện tương ứng đúng. Không hiểu extend là quan hệ phân cấp hay bắt buộc thực hiện mọi thao tác.
- Chỉ admin có quyền; tài khoản giáo viên do admin tạo hoặc cấp vai trò, không có tự đăng ký giáo viên.
- Khóa/mở khóa và đặt lại mật khẩu là nhánh trong form sửa, không phải các trang riêng. Email tài khoản đã có hiện không sửa được tại giao diện dù API nhận email.
- Tham chiếu UC25 hiện hữu để cấp quyền; không tạo UC24.x có cùng mục đích. Admin không tự khóa/xóa/hạ quyền; chưa có email tự gửi mật khẩu mới hoặc khôi phục email tự phục vụ.

## UC25 – Cấp và thay đổi vai trò

Tác nhân: Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC25.1 | Chọn tài khoản và vai trò mới | include | Phần bắt buộc của luồng thành công. | src/pages/admin/UserManagement.jsx:90 — Chọn tài khoản và nạp vai trò hiện tại vào form.<br>src/pages/admin/UserManagement.jsx:399 — Admin chọn role student/teacher/admin tại form sửa. |
| UC25.2 | Kiểm tra điều kiện thay đổi vai trò | include | Phần bắt buộc của luồng thành công. | server/app.js:530 — Chỉ admin được đổi quyền.<br>server/app.js:541 — Không tự hạ quyền chính mình.<br>server/app.js:543 — Giáo viên còn khóa thì không được đổi sang vai trò khác. |
| UC25.3 | Áp dụng vai trò và cập nhật phiên | include | Phần bắt buộc của luồng thành công. | server/app.js:549 — Cập nhật user và thu hồi phiên trong cùng transaction nếu role thật sự đổi.<br>src/pages/admin/UserManagement.jsx:112 — Lưu bằng thao tác sửa người dùng chung. |

Phạm vi và giới hạn:

- Đây là một mục tiêu riêng được thực hiện trong cùng form Quản lý người dùng, không phải module/quy trình giáo viên tự đăng ký.
- Khi role thay đổi thì thu hồi các phiên của tài khoản đích; gửi lại cùng role không tự thu hồi vì role. Không tự thêm thao tác chuyển giáo viên phụ trách: code chưa có chức năng chuyển owner khóa sau tạo.
- Không dùng include Đăng nhập; admin hoạt động và phiên hợp lệ là tiền điều kiện.

## UC26 – Quản lý chương trình đào tạo

Tác nhân: Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC26.1 | Xem danh sách chương trình | include | Phần bắt buộc của luồng thành công. | server/app.js:568 — Admin được đọc cả chương trình active/inactive.<br>src/pages/admin/ProgramManagement.jsx:39 — Mở trang tải danh mục. |
| UC26.2 | Thêm chương trình đào tạo | extend | Admin chọn Thêm chương trình và cung cấp dữ liệu hợp lệ. | src/pages/admin/ProgramManagement.jsx:66 — Mở form thêm mới.<br>server/app.js:595 — Chỉ admin tạo chương trình với tên/slug/mô tả/trạng thái. |
| UC26.3 | Sửa chương trình đào tạo | extend | Admin chọn Sửa một chương trình có sẵn. | src/pages/admin/ProgramManagement.jsx:77 — Form sửa nạp dữ liệu chương trình.<br>server/app.js:606 — Admin lưu cập nhật; kiểm tra tên và slug. |
| UC26.4 | Kích hoạt hoặc ẩn chương trình | extend | Admin thay đổi trạng thái hoạt động trong form thêm/sửa. | src/pages/admin/ProgramManagement.jsx:314 — is_active được sửa trong cùng form.<br>server/app.js:592 — Lưu cờ hoạt động của chương trình. |
| UC26.5 | Xóa chương trình đào tạo | extend | Admin chọn Xóa chương trình và xác nhận. | src/pages/admin/ProgramManagement.jsx:127 — Xóa qua hộp thoại xác nhận.<br>server/app.js:617 — Admin xóa chương trình tồn tại.<br>server/sqlserver-store.js:232 — Đặt program_id của courses/learning_paths về NULL rồi xóa. |

Phạm vi và giới hạn:

- Luồng cơ sở của sơ đồ là mở danh sách quản lý trong phạm vi được cấp. Điểm mở rộng là chọn thao tác trên danh sách; chỉ thêm/sửa/xóa khi điều kiện tương ứng đúng. Không hiểu extend là quan hệ phân cấp hay bắt buộc thực hiện mọi thao tác.
- Chỉ admin quản lý; kích hoạt/ẩn là biến thể của form thêm/sửa. Ẩn chương trình không tự ẩn mọi khóa.
- Xóa chương trình không bị cấm chỉ vì có khóa, và không xóa nội dung khóa/lộ trình gốc; store gỡ liên kết về NULL.
- Không gán ý nghĩa chứng chỉ hay chứng nhận CEFR/IELTS cho danh mục chương trình.

## UC27 – Xem thống kê giảng dạy

Tác nhân: Giáo viên, Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC27.1 | Xem chỉ số khóa, học viên và đề thi | include | Phần bắt buộc của luồng thành công. | server/app.js:1801 — Staff được đọc thống kê; giới hạn theo visibleCourses.<br>server/app.js:1829 — Trả tổng khóa, số học viên khác nhau và số đề.<br>src/pages/teacher/TeacherDashboard.jsx:53 — Mở trang tải thống kê và một số khóa. |
| UC27.2 | Xem phân bố điểm và tỷ lệ đạt | include | Phần bắt buộc của luồng thành công. | server/app.js:1807 — Chỉ tổng hợp attempts đã graded.<br>server/app.js:1816 — Chia nhóm điểm theo >=80, >=65, >=50, dưới50.<br>server/app.js:1834 — Tỷ lệ đạt thống kê dùng ngưỡng60 chung. |
| UC27.3 | Xem biểu đồ bài nộp trong 7 ngày | include | Phần bắt buộc của luồng thành công. | server/app.js:1836 — Tổng hợp 7 ngày UTC từ attempts đã graded.<br>src/pages/teacher/TeacherDashboard.jsx:85 — Biểu đồ sử dụng weeklySubmissions. |

Phạm vi và giới hạn:

- Giáo viên xem phạm vi khóa phụ trách; admin được phép vào /teacher/dashboard theo route và API.
- Sidebar admin chủ ý bỏ shortcut /teacher/dashboard: src/components/layout/Sidebar.jsx:81; route vẫn cho admin: src/routes/AppRoutes.jsx:105. Không ghi đã có nút menu riêng.
- Tỷ lệ đạt dùng ngưỡng60, không theo từng pass_score. Biểu đồ 7 ngày hiện chỉ đếm bài graded, không phải mọi bài chờ chấm.
- Ba include là các thành phần hiển thị của một lần xem dashboard, không yêu cầu người dùng mở ba trang. Không có thống kê học kỳ thật, doanh thu hoặc báo cáo tuần/tháng có lịch chạy hoàn chỉnh.

## UC28 – Xem thống kê toàn hệ thống

Tác nhân: Quản trị viên.

| Mã chức năng con | Tên | Quan hệ | Điều kiện mở rộng | Dẫn chứng code |
| --- | --- | --- | --- | --- |
| UC28.1 | Xem chỉ số tổng quan toàn hệ thống | include | Phần bắt buộc của luồng thành công. | server/app.js:1776 — Chỉ admin truy cập endpoint.<br>server/app.js:1781 — Tổng hợp người dùng, chương trình, khóa, ghi danh và lượt thi.<br>src/pages/admin/AdminDashboard.jsx:70 — Đọc overview để hiển thị các thẻ thống kê. |
| UC28.2 | Xem người dùng mới | include | Phần bắt buộc của luồng thành công. | server/app.js:1791 — Lấy5 người dùng mới nhất, bỏ hash mật khẩu qua publicUser.<br>src/pages/admin/AdminDashboard.jsx:71 — Đọc recentUsers để hiển thị danh sách. |
| UC28.3 | Xem các khóa có nhiều học viên | include | Phần bắt buộc của luồng thành công. | server/app.js:1794 — Sắp top5 khóa theo student_count.<br>src/pages/admin/AdminDashboard.jsx:72 — Giao diện có khu vực topCourses. |
| UC28.4 | Làm mới số liệu thống kê | extend | Admin chọn Làm mới hoặc Thử tải lại trên trang tổng quan. | src/pages/admin/AdminDashboard.jsx:87 — Nút Làm mới gọi fetchDashboard.<br>src/pages/admin/AdminDashboard.jsx:60 — Khi lỗi có nút Thử tải lại. |

Phạm vi và giới hạn:

- Chỉ admin; các phần tổng quan/người dùng mới/khóa nổi bật cùng tải khi mở dashboard, không phải các trang độc lập.
- Cần đồng bộ student_count của API với total_students ở thẻ khóa nổi bật; không suy số0 hiển thị là số liệu thật.
- Không thêm doanh thu, thanh toán, nhật ký kiểm toán hoặc xuất báo cáo khi source chưa có. Báo cáo tuần/tháng chỉ có nền dữ liệu và API đọc, chưa có UI/scheduler đầy đủ.

