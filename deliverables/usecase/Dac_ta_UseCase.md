# Đặc tả Use Case – E-Learning dạy và luyện thi tiếng Anh

Đối chiếu mã nguồn a85ded9 ngày 20/10/2026. 28 use case; vai trò nghiệp vụ và giới hạn theo bản hiện tại.

| UCID | Tên | Actor chính |
| --- | --- | --- |
| UC01 | Đăng ký tài khoản | Khách |
| UC02 | Đăng nhập | Khách |
| UC03 | Đăng xuất | Học viên, Giáo viên, Quản trị viên |
| UC04 | Quản lý hồ sơ cá nhân | Học viên, Giáo viên, Quản trị viên |
| UC05 | Đổi mật khẩu | Học viên, Giáo viên, Quản trị viên |
| UC06 | Tra cứu khóa học | Khách, Học viên |
| UC07 | Đăng ký khóa học | Học viên |
| UC08 | Duyệt đăng ký khóa học | Giáo viên, Quản trị viên |
| UC09 | Học bài và ghi nhận tiến độ | Học viên |
| UC10 | Làm bài tập | Học viên |
| UC11 | Làm bài kiểm tra/thi thử | Học viên |
| UC12 | Xem kết quả và lời giải | Học viên |
| UC13 | Theo dõi tiến độ học tập | Học viên |
| UC14 | Xem lộ trình học tập | Học viên |
| UC15 | Xem và đánh dấu thông báo | Học viên, Giáo viên, Quản trị viên |
| UC16 | Quản lý khóa học | Giáo viên, Quản trị viên |
| UC17 | Quản lý bài học | Giáo viên, Quản trị viên |
| UC18 | Quản lý bài tập | Giáo viên, Quản trị viên |
| UC19 | Quản lý câu hỏi và đáp án | Giáo viên, Quản trị viên |
| UC20 | Quản lý bài kiểm tra | Giáo viên, Quản trị viên |
| UC21 | Xem tiến độ học viên | Giáo viên, Quản trị viên |
| UC22 | Chấm bài và nhận xét | Giáo viên, Quản trị viên |
| UC23 | Quản lý lộ trình học tập | Giáo viên, Quản trị viên |
| UC24 | Quản lý tài khoản | Quản trị viên |
| UC25 | Cấp và thay đổi vai trò | Quản trị viên |
| UC26 | Quản lý chương trình đào tạo | Quản trị viên |
| UC27 | Xem thống kê giảng dạy | Giáo viên, Quản trị viên |
| UC28 | Xem thống kê toàn hệ thống | Quản trị viên |

## UC01 – Đăng ký tài khoản

| Trường | Nội dung |
| --- | --- |
| UCID | UC01 |
| Name | Đăng ký tài khoản |
| Summary | Khách tạo tài khoản học viên để tham gia học tập trên hệ thống. |
| Preconditions | Khách chưa đăng nhập; có thể truy cập trang Đăng ký. |
| Postconditions | Thành công: tạo tài khoản vai trò học viên, thông báo chào mừng và phiên đăng nhập; giao diện chuyển đến bàn học. Khi lỗi, không khẳng định toàn bộ các bước đã được hoàn tác. |
| Primary Actor(s) | Khách |
| Secondary Actor(s) | Không có. |
| Trigger | Khách chọn Đăng ký tài khoản. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Khách mở biểu mẫu đăng ký. |
| 2 | Khách nhập họ tên, email, số điện thoại tùy chọn, mật khẩu và xác nhận; đồng ý điều khoản trên giao diện. |
| 3 | Giao diện kiểm tra trường bắt buộc, email, mật khẩu tối thiểu 8 ký tự và xác nhận trùng khớp; gửi yêu cầu đăng ký. |
| 4 | Hệ thống chuẩn hóa email, kiểm tra dữ liệu và chỉ chấp nhận vai trò học viên; mật khẩu được băm trước khi lưu. |
| 5 | Hệ thống tạo tài khoản, ghi thông báo chào mừng và tạo phiên xác thực. |
| 6 | Giao diện lưu thông tin phiên, thông báo thành công và chuyển đến bàn học học viên. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 3a | Thiếu dữ liệu, email sai, mật khẩu ngắn hoặc xác nhận khác nhau: thông báo lỗi để khách sửa; chưa gửi hoặc chưa chấp nhận yêu cầu. |
| 4a | Email đã tồn tại: từ chối tạo trùng và yêu cầu dùng email khác hoặc đăng nhập. |
| 4b | Yêu cầu tự đăng ký quyền giáo viên/admin: từ chối; quyền này do admin cấp. |
| 5a | Lỗi ở bước thông báo hoặc tạo phiên: trả lỗi; cần kiểm tra tài khoản có thể đã được tạo trước đó trước khi thử lại. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC01-I1 | Chưa tích hợp xác minh email/OTP. Việc đồng ý điều khoản mới được kiểm tra tại giao diện, chưa lưu thành hồ sơ chấp thuận riêng. |

Yêu cầu: FR01.

API đối chiếu:

- `POST /api/auth/register`

## UC02 – Đăng nhập

| Trường | Nội dung |
| --- | --- |
| UCID | UC02 |
| Name | Đăng nhập |
| Summary | Người chưa xác thực dùng tài khoản đã có để truy cập chức năng theo vai trò. |
| Preconditions | Có tài khoản và mật khẩu; chưa có phiên đăng nhập hợp lệ trên giao diện đang dùng. Khách ở đây có thể là người sở hữu tài khoản học viên, giáo viên hoặc admin. |
| Postconditions | Thành công: có phiên xác thực còn hạn; người dùng được chuyển đến trang phù hợp vai trò hoặc đường dẫn được phép đã yêu cầu. Thất bại: không cấp phiên mới. |
| Primary Actor(s) | Khách |
| Secondary Actor(s) | Không có. |
| Trigger | Người dùng chọn Đăng nhập. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Người dùng mở trang Đăng nhập. |
| 2 | Người dùng nhập email và mật khẩu rồi gửi biểu mẫu. |
| 3 | Hệ thống tìm tài khoản theo email và kiểm tra mật khẩu đã băm. |
| 4 | Hệ thống kiểm tra tài khoản đang hoạt động. |
| 5 | Hệ thống tạo token phiên ngẫu nhiên, chỉ lưu hash token và hạn sử dụng trong database. |
| 6 | Giao diện lưu phiên, lấy vai trò và điều hướng người dùng đến chức năng được cấp quyền. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 3a | Email hoặc mật khẩu không đúng: trả thông báo đăng nhập thất bại, không tiết lộ riêng email có tồn tại hay không. |
| 4a | Tài khoản bị khóa: từ chối truy cập và thông báo trạng thái tài khoản. |
| 2a | Vượt giới hạn yêu cầu của nhóm API xác thực: yêu cầu chờ và thử lại. |
| 6a | Phiên không hợp lệ khi tải lại trang: xóa thông tin đăng nhập cục bộ và chuyển về trang Đăng nhập. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC02-I1 | Ô “Ghi nhớ đăng nhập” chưa làm thay đổi cơ chế lưu hoặc thời hạn phiên; không có quy trình email khôi phục mật khẩu tự phục vụ. |

Yêu cầu: FR01.

API đối chiếu:

- `POST /api/auth/login`
- `GET /api/auth/profile`

## UC03 – Đăng xuất

| Trường | Nội dung |
| --- | --- |
| UCID | UC03 |
| Name | Đăng xuất |
| Summary | Người dùng kết thúc phiên đăng nhập hiện tại trên thiết bị đang sử dụng. |
| Preconditions | Người dùng đã đăng nhập hoặc giao diện đang giữ thông tin phiên trước đó. |
| Postconditions | Giao diện xóa token và thông tin người dùng cục bộ. Nếu yêu cầu đến server thành công, phiên hiện tại bị thu hồi; các phiên ở thiết bị khác không bị đăng xuất bởi thao tác này. |
| Primary Actor(s) | Học viên, Giáo viên, Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Người dùng chọn Đăng xuất. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Người dùng chọn chức năng Đăng xuất. |
| 2 | Giao diện gửi yêu cầu thu hồi phiên hiện tại đến hệ thống. |
| 3 | Giao diện xóa token, thông tin tài khoản cục bộ ngay, không chờ phản hồi server, và chuyển về trạng thái chưa đăng nhập. |
| 4 | Khi nhận yêu cầu hợp lệ, server thu hồi phiên tương ứng; việc hoàn tất phía server không phải điều kiện để giao diện đăng xuất cục bộ. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 4a | Phiên đã hết hạn hoặc không tồn tại: server từ chối xác thực; giao diện vẫn xóa thông tin cục bộ. |
| 2a | Không liên lạc được server: giao diện vẫn đăng xuất cục bộ; không bảo đảm token phía server đã bị thu hồi ngay. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC03-I1 | Khi mất mạng, phiên phía server có thể còn hiệu lực đến khi hết hạn; không mô tả đây là “đăng xuất mọi thiết bị”. |

Yêu cầu: FR01.

API đối chiếu:

- `POST /api/auth/logout`

## UC04 – Quản lý hồ sơ cá nhân

| Trường | Nội dung |
| --- | --- |
| UCID | UC04 |
| Name | Quản lý hồ sơ cá nhân |
| Summary | Người dùng xem và cập nhật thông tin hồ sơ của chính mình. |
| Preconditions | Đã đăng nhập bằng tài khoản đang hoạt động. |
| Postconditions | Thành công: họ tên, điện thoại và URL ảnh đại diện được cập nhật; email và vai trò không thay đổi qua chức năng hồ sơ cá nhân. |
| Primary Actor(s) | Học viên, Giáo viên, Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Người dùng mở trang Hồ sơ cá nhân. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Người dùng mở hồ sơ; giao diện hiển thị thông tin tài khoản hiện tại. |
| 2 | Người dùng sửa họ tên, số điện thoại hoặc đường dẫn ảnh đại diện. |
| 3 | Người dùng chọn lưu; giao diện gửi yêu cầu cập nhật hồ sơ của phiên hiện tại. |
| 4 | Hệ thống kiểm tra họ tên và định dạng URL được phép, cập nhật các trường cho phép. |
| 5 | Hệ thống trả hồ sơ đã cập nhật; giao diện làm mới thông tin và thông báo thành công. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 4a | Họ tên không hợp lệ hoặc URL không dùng http/https: yêu cầu sửa dữ liệu, không chấp nhận cập nhật đó. |
| 3a | Phiên hết hạn hoặc tài khoản đã bị khóa: yêu cầu đăng nhập lại hoặc từ chối truy cập. |
| 4b | Client gửi kèm email/vai trò: các trường này không được cập nhật qua API hồ sơ cá nhân. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC04-I1 | Ảnh đại diện được khai báo bằng URL; chưa có chức năng tải tệp ảnh lên hệ thống. |

Yêu cầu: FR02.

API đối chiếu:

- `GET /api/auth/profile`
- `PUT /api/auth/profile`

## UC05 – Đổi mật khẩu

| Trường | Nội dung |
| --- | --- |
| UCID | UC05 |
| Name | Đổi mật khẩu |
| Summary | Người dùng thay đổi mật khẩu của mình và thu hồi các phiên đăng nhập khác. |
| Preconditions | Đã đăng nhập; biết mật khẩu hiện tại. |
| Postconditions | Thành công: lưu hash mật khẩu mới, thu hồi các phiên khác và giữ phiên hiện tại. Hai thao tác ghi này nằm trong cùng giao dịch. |
| Primary Actor(s) | Học viên, Giáo viên, Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Người dùng chọn Đổi mật khẩu trong trang Hồ sơ. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Người dùng mở phần đổi mật khẩu. |
| 2 | Người dùng nhập mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới. |
| 3 | Giao diện kiểm tra xác nhận; hệ thống kiểm tra mật khẩu hiện tại và mật khẩu mới tối thiểu 8 ký tự. |
| 4 | Hệ thống băm mật khẩu mới và cập nhật tài khoản trong giao dịch. |
| 5 | Hệ thống xóa các phiên khác của tài khoản, hoàn tất giao dịch và thông báo thành công. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 3a | Mật khẩu hiện tại không đúng: từ chối thay đổi. |
| 3b | Mật khẩu mới không hợp lệ hoặc xác nhận không khớp: yêu cầu nhập lại. |
| 4a | Không lưu được giao dịch: hoàn tác cập nhật trong giao dịch và thông báo lỗi. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC05-I1 | Chức năng này cần mật khẩu hiện tại; quên mật khẩu được xử lý bằng admin đặt lại, chưa có email khôi phục tự động. |

Yêu cầu: FR02.

API đối chiếu:

- `PUT /api/auth/change-password`

## UC06 – Tra cứu khóa học

| Trường | Nội dung |
| --- | --- |
| UCID | UC06 |
| Name | Tra cứu khóa học |
| Summary | Khách hoặc học viên tìm khóa học đã xuất bản theo thông tin và bộ lọc được cung cấp. |
| Preconditions | Truy cập được trang danh mục; xem chi tiết khóa ở giao diện học viên cần đăng nhập. |
| Postconditions | Hiển thị danh sách phù hợp và thông tin được phép xem; chưa phát sinh ghi danh hoặc mở quyền học nội dung. |
| Primary Actor(s) | Khách, Học viên |
| Secondary Actor(s) | Không có. |
| Trigger | Khách mở trang chủ hoặc học viên mở Khám phá khóa học. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Người dùng mở trang danh mục; hệ thống tải khóa học đã xuất bản. |
| 2 | Người dùng nhập từ khóa hoặc chọn bộ lọc được trang hỗ trợ; học viên có thể lọc thêm chương trình và trình độ. |
| 3 | Hệ thống/giao diện áp dụng bộ lọc, hiển thị các khóa phù hợp cùng giáo viên, học phí và số bài học. |
| 4 | Người dùng chọn một khóa để xem chi tiết. |
| 5 | Nếu đã đăng nhập, hệ thống hiển thị mô tả, danh sách bài học dạng giới thiệu và trạng thái ghi danh; nội dung học vẫn được kiểm tra quyền riêng. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 3a | Không có khóa phù hợp: hiển thị trạng thái không có kết quả; người dùng đổi bộ lọc. |
| 4a | Khách chọn chi tiết khóa: chuyển đến đăng nhập trước khi vào trang chi tiết được bảo vệ. |
| 5a | Khóa không tồn tại hoặc chưa xuất bản đối với người học: thông báo không thể truy cập. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC06-I1 | Một số trang chỉ tải một trang dữ liệu API; không khẳng định giao diện đã hiển thị toàn bộ khóa khi số lượng vượt giới hạn tải. |

Yêu cầu: FR03.

API đối chiếu:

- `GET /api/catalog`
- `GET /api/courses`
- `GET /api/programs`
- `GET /api/courses/:id`
- `GET /api/lessons/course/:courseId`

## UC07 – Đăng ký khóa học

| Trường | Nội dung |
| --- | --- |
| UCID | UC07 |
| Name | Đăng ký khóa học |
| Summary | Học viên ghi danh một khóa đã xuất bản; khóa miễn phí được mở học, khóa có phí chờ giáo viên/admin duyệt. |
| Preconditions | Học viên đã đăng nhập; khóa đã xuất bản; chưa có ghi danh còn hiệu lực hoặc ghi danh trước đã ở trạng thái dropped. |
| Postconditions | Thành công: tạo hoặc cập nhật ghi danh; miễn phí thành active, có phí thành pending; tạo thông báo liên quan. Không tạo giao dịch thanh toán trực tuyến. |
| Primary Actor(s) | Học viên |
| Secondary Actor(s) | Không có. |
| Trigger | Học viên chọn Đăng ký tại trang chi tiết khóa học. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Học viên mở chi tiết khóa và xem thông tin học phí, nội dung giới thiệu. |
| 2 | Học viên chọn đăng ký khóa học. |
| 3 | Hệ thống kiểm tra quyền truy cập khóa và ghi danh đã có của chính học viên. |
| 4 | Hệ thống ghi danh active nếu miễn phí; nếu có phí, ghi pending để chờ duyệt. |
| 5 | Hệ thống tạo thông báo cho học viên; với khóa có phí, thông báo giáo viên phụ trách có yêu cầu cần duyệt. |
| 6 | Giao diện hiển thị quyền bắt đầu học hoặc trạng thái chờ duyệt tương ứng. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 3a | Đã có ghi danh khác dropped: từ chối tạo trùng; giao diện hiển thị trạng thái hiện tại. |
| 3b | Ghi danh trước là dropped: tái sử dụng bản ghi và cập nhật về active/pending theo loại khóa. |
| 4a | Khóa có phí: học viên chưa được mở nội dung cho đến khi được duyệt. |
| 5a | Lỗi tạo thông báo: ghi danh có thể đã được lưu; cần tải lại trạng thái trước khi gửi lại yêu cầu. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC07-I1 | Hệ thống chưa có cổng thanh toán, hóa đơn hoặc kiểm chứng tự động việc đã thu tiền. Việc xác nhận phí được thực hiện thủ công ngoài luồng thanh toán của phần mềm. |

Yêu cầu: FR04.

API đối chiếu:

- `GET /api/enrollments/check/:courseId`
- `POST /api/enrollments`

## UC08 – Duyệt đăng ký khóa học

| Trường | Nội dung |
| --- | --- |
| UCID | UC08 |
| Name | Duyệt đăng ký khóa học |
| Summary | Giáo viên phụ trách hoặc admin duyệt học viên đang chờ vào khóa học. |
| Preconditions | Đã đăng nhập với quyền quản lý khóa; để duyệt một bản ghi, ghi danh đó phải đang pending trên giao diện. |
| Postconditions | Thành công: ghi danh thành active, học viên có quyền học nội dung đã xuất bản và nhận thông báo cập nhật. |
| Primary Actor(s) | Giáo viên, Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Người quản lý chọn Duyệt đăng ký tại Tiến độ học viên. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Người quản lý mở Tiến độ học viên, lọc khóa hoặc tìm tên/email học viên. |
| 2 | Giao diện hiển thị trạng thái và nút Duyệt đăng ký cho bản ghi pending. |
| 3 | Người quản lý chọn duyệt; giao diện gửi trạng thái active cho ghi danh. |
| 4 | Hệ thống kiểm tra giáo viên phụ trách khóa hoặc quyền admin, rồi cập nhật ghi danh. |
| 5 | Hệ thống ghi thông báo cho học viên; giao diện tải lại danh sách và báo cập nhật thành công. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 2a | Chưa có ghi danh chờ duyệt: không có nút duyệt ở dòng đang học/hoàn thành. |
| 4a | Giáo viên không phụ trách khóa: từ chối thao tác. |
| 4b | Ghi danh không tồn tại: trả lỗi và tải lại danh sách. |
| 5a | Không tạo được thông báo sau cập nhật: cần kiểm tra trạng thái đã lưu; không giả định duyệt đã bị hoàn tác. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC08-I1 | API còn nhận trạng thái dropped, nhưng trang hiện tại chưa có nút từ chối/hủy tương ứng. Nút duyệt không phải chứng từ thanh toán. |

Yêu cầu: FR04.

API đối chiếu:

- `GET /api/enrollments`
- `PUT /api/enrollments/:id`

## UC09 – Học bài và ghi nhận tiến độ

| Trường | Nội dung |
| --- | --- |
| UCID | UC09 |
| Name | Học bài và ghi nhận tiến độ |
| Summary | Học viên xem nội dung bài học và chủ động đánh dấu đã học để ghi tiến độ, thời gian học. |
| Preconditions | Đã đăng nhập; ghi danh active/completed; khóa và bài học đã xuất bản. |
| Postconditions | Khi lưu thành công: tiến độ bài và phiên học được ghi; hoàn thành được giữ; ghi danh có thể chuyển completed nếu đã hoàn thành mọi bài được xuất bản. |
| Primary Actor(s) | Học viên |
| Secondary Actor(s) | Không có. |
| Trigger | Học viên chọn một bài trong khóa được phép học. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Học viên mở bài học; hệ thống kiểm tra ghi danh và trạng thái xuất bản. |
| 2 | Hệ thống trả nội dung, media URL nếu có, danh sách bài tập và bài trước/sau trong cùng khóa. |
| 3 | Học viên đọc nội dung, xem/nghe media được giáo viên cung cấp hoặc chuyển bài. |
| 4 | Học viên chọn Đánh dấu đã học; giao diện gửi mã phiên học UUID và số giây lũy kế từ lúc mở bài. |
| 5 | Hệ thống gọi thủ tục ghi tiến độ SQL Server, kiểm tra phiên và chỉ cộng phần thời gian tăng thêm của cùng phiên. |
| 6 | Hệ thống cập nhật hoàn thành bài/khóa khi đủ điều kiện; giao diện hiển thị đã hoàn thành. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 1a | Ghi danh chưa được duyệt, bài bị ẩn hoặc không tồn tại: từ chối mở nội dung. |
| 3a | Không có media URL hoặc media ngoài không phát được: vẫn có thể đọc nội dung; hệ thống không tự sinh tệp âm thanh/video. |
| 5a | Gửi lại cùng mã phiên với số giây không tăng: không cộng trùng thời gian. |
| 5b | Mã phiên thuộc học viên/bài khác hoặc thời gian ngoài giới hạn: từ chối lưu. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC09-I1 | Thời gian chỉ được gửi khi bấm hoàn thành, không có theo dõi liên tục/video heartbeat. Thứ tự bài là gợi ý điều hướng, không khóa bài sau theo điều kiện hoàn thành bài trước. |

Yêu cầu: FR05.

API đối chiếu:

- `GET /api/lessons/:id`
- `GET /api/progress`
- `GET /api/exercises/lesson/:id`
- `POST /api/progress`

## UC10 – Làm bài tập

| Trường | Nội dung |
| --- | --- |
| UCID | UC10 |
| Name | Làm bài tập |
| Summary | Học viên trả lời bài tập, nộp bài và nhận điểm tự động hoặc trạng thái chờ chấm cho phần viết/nói. |
| Preconditions | Đã đăng nhập; được học bài chứa bài tập; bài tập đã xuất bản và có câu hỏi. |
| Postconditions | Thành công: lưu lượt làm bài, snapshot câu hỏi, câu trả lời và kết quả; bài khách quan thành graded, có viết/nói thành pending_grading và có thông báo. |
| Primary Actor(s) | Học viên |
| Secondary Actor(s) | Không có. |
| Trigger | Học viên chọn Làm bài tập từ bài học. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Học viên mở bài tập; hệ thống trả câu hỏi và lựa chọn đã loại thông tin đáp án đúng/lời giải. |
| 2 | Học viên chọn đáp án hoặc nhập câu trả lời văn bản; phần nói dùng liên kết bản ghi âm hoặc bản chép lời. |
| 3 | Học viên chọn Nộp bài và xác nhận nếu giao diện phát hiện còn câu chưa trả lời. |
| 4 | Hệ thống kiểm tra câu trả lời thuộc bài, tạo lượt làm với snapshot câu hỏi và đáp án tại thời điểm nộp. |
| 5 | Hệ thống chấm câu khách quan theo đáp án; viết/nói được đánh dấu cần giáo viên chấm; lưu kết quả và thông báo trong giao dịch. |
| 6 | Giao diện hiển thị điểm, lời giải hoặc thông báo đang chờ chấm; học viên có thể xem lại trong lịch sử. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 1a | Không đủ quyền, bài chưa xuất bản hoặc chưa có câu hỏi: không mở được bài làm hợp lệ. |
| 3a | Học viên hủy xác nhận nộp thiếu câu: quay lại làm bài. |
| 4a | Câu hỏi/phương án không thuộc snapshot hoặc dữ liệu sai: từ chối nộp. |
| 5a | Có câu viết/nói: điểm khách quan chỉ là tạm tính, chưa xác nhận kết quả cuối cùng. |
| 5b | Lỗi giao dịch lưu bài: hoàn tác phần ghi trong giao dịch và báo lỗi. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC10-I1 | Bài tập không có đồng hồ cưỡng chế hoặc lưu nháp như bài thi. Nối/sắp xếp dùng trả lời bằng văn bản; chưa có kéo-thả, ghi âm trực tiếp hoặc AI chấm nói. |

Yêu cầu: FR06.

API đối chiếu:

- `GET /api/exercises/:id`
- `GET /api/questions/exercise/:id`
- `POST /api/exercises/:id/submit`

## UC11 – Làm bài kiểm tra/thi thử

| Trường | Nội dung |
| --- | --- |
| UCID | UC11 |
| Name | Làm bài kiểm tra/thi thử |
| Summary | Học viên thực hiện bài kiểm tra có giới hạn lượt, hạn nộp theo server và khả năng lưu nháp/tiếp tục. |
| Preconditions | Tài khoản có vai trò học viên và đang hoạt động; được ghi danh vào khóa; đề đã xuất bản, có câu hỏi và còn lượt hoặc có lượt đang làm để tiếp tục. |
| Postconditions | Thành công: lưu hoặc tiếp tục một lượt thi hợp lệ; khi nộp, lưu kết quả graded/pending_grading theo loại câu hỏi. Nộp lại cùng lượt không tạo bài mới. |
| Primary Actor(s) | Học viên |
| Secondary Actor(s) | Không có. |
| Trigger | Học viên mở một bài kiểm tra từ bàn học. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Học viên mở đề; hệ thống kiểm tra quyền, trạng thái xuất bản và thông tin đề. |
| 2 | Hệ thống tiếp tục lượt in_progress còn phù hợp; nếu tạo lượt mới, kiểm tra số lượt rồi lưu snapshot và deadline theo server. |
| 3 | Giao diện khôi phục câu trả lời đã lưu và hiển thị đồng hồ; học viên bắt đầu trả lời. |
| 4 | Sau thay đổi đáp án, giao diện gửi lưu nháp; hệ thống chỉ nhận khi lượt còn in_progress và chưa quá hạn. |
| 5 | Học viên nộp bài hoặc giao diện tự gửi nộp khi đồng hồ về 0. |
| 6 | Hệ thống kiểm tra chủ lượt, đúng đề, trạng thái và hạn nộp; chấm snapshot, lưu kết quả và thông báo trong giao dịch. |
| 7 | Giao diện hiển thị kết quả; chi tiết đáp án/lời giải chỉ được trả khi đề cho phép xem. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 2a | Đã hết lượt hoặc đề không có câu hỏi: từ chối bắt đầu lượt mới. |
| 3a | Tải lại trang khi lượt còn hiệu lực: tiếp tục đúng lượt, đáp án đã lưu và deadline cũ. |
| 4a | Lượt quá hạn: từ chối lưu nháp mới; phần xử lý API xác thực có thể đã kết thúc lượt bằng đáp án đã lưu. |
| 5a | Học viên hủy xác nhận nộp thiếu câu: tiếp tục làm nếu còn thời gian. |
| 6a | Lượt không thuộc học viên hoặc không đúng đề: từ chối; không dùng câu trả lời gửi cho đề khác. |
| 6b | Lượt đã nộp: trả kết quả cũ; không tính thành một lượt mới. Với lượt quá hạn, không chấp nhận tùy ý đáp án đến muộn. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC11-I1 | Khi không có request, không có daemon nền tự chấm đúng thời điểm deadline; request xác thực tiếp theo sẽ xử lý lượt quá hạn. Không có giám sát thi, lịch mở/đóng kỳ thi hoặc quy đổi band IELTS. |

Yêu cầu: FR07.

API đối chiếu:

- `GET /api/exams/:id`
- `POST /api/exams/:id/start`
- `PUT /api/exams/:id/draft`
- `POST /api/exams/:id/submit`

## UC12 – Xem kết quả và lời giải

| Trường | Nội dung |
| --- | --- |
| UCID | UC12 |
| Name | Xem kết quả và lời giải |
| Summary | Học viên xem bài đã nộp, điểm, câu trả lời, lời giải được phép và nhận xét giáo viên. |
| Preconditions | Đã đăng nhập; khi mở chi tiết, lượt làm phải đã nộp và thuộc chính tài khoản. |
| Postconditions | Hiển thị kết quả được phép xem; không thay đổi bài làm hay điểm. |
| Primary Actor(s) | Học viên |
| Secondary Actor(s) | Không có. |
| Trigger | Học viên chọn Xem kết quả ở lịch sử bài tập hoặc Tiến độ & Kết quả. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Học viên mở lịch sử bài làm hoặc trang tiến độ. |
| 2 | Hệ thống tải danh sách bài đã nộp của tài khoản, kèm điểm và trạng thái. |
| 3 | Học viên chọn một bài để xem chi tiết. |
| 4 | Hệ thống kiểm tra chủ bài và loại bài; với bài thi, kiểm tra quyền xem lời giải của đề. |
| 5 | Giao diện hiển thị điểm, câu trả lời và lời giải nếu được phép; hiển thị chờ chấm hoặc nhận xét khi có. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 2a | Chưa có bài nộp: hiển thị chưa có lịch sử. |
| 4a | Yêu cầu xem bài người khác hoặc nhầm loại bài: từ chối truy cập. |
| 4b | Đề không cho xem đáp án sau thi: chỉ trả các trường kết quả được phép, không trả chi tiết lời giải. |
| 5a | Bài đang pending_grading: hiển thị chờ giáo viên; điểm có thể là tạm tính hoặc chưa có đối với dữ liệu mẫu. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC12-I1 | Lời giải bài đã nộp lấy từ snapshot; sửa đáp án ngân hàng sau đó không tự sửa lịch sử. Chi tiết chấm từng câu có thể chưa đồng bộ khi giáo viên chỉ sửa điểm tổng. |

Yêu cầu: FR08.

API đối chiếu:

- `GET /api/exercises/my-attempts`
- `GET /api/exercises/my-attempts/:id`
- `GET /api/exams/results/:id`
- `GET /api/dashboard/student`

## UC13 – Theo dõi tiến độ học tập

| Trường | Nội dung |
| --- | --- |
| UCID | UC13 |
| Name | Theo dõi tiến độ học tập |
| Summary | Học viên theo dõi số bài hoàn thành, tiến độ khóa, lịch sử bài làm, điểm và thời gian học được ghi nhận. |
| Preconditions | Đã đăng nhập; không bắt buộc đã có bài học hoặc bài làm để mở trang. |
| Postconditions | Hiển thị thống kê của tài khoản theo dữ liệu hiện có; không tạo báo cáo định kỳ mới từ màn hình này. |
| Primary Actor(s) | Học viên |
| Secondary Actor(s) | Không có. |
| Trigger | Học viên mở Tiến độ & Kết quả hoặc bàn học. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Học viên mở trang theo dõi tiến độ. |
| 2 | Hệ thống đọc ghi danh, các bài đã hoàn thành và lượt làm đã nộp của học viên. |
| 3 | Hệ thống tính phần trăm theo số bài học đã xuất bản và điểm trung bình từ các bài graded. |
| 4 | Hệ thống tổng hợp thời gian học ghi nhận theo 7 ngày UTC gần nhất. |
| 5 | Giao diện hiển thị các khóa, thanh tiến độ, biểu đồ thời gian và lịch sử; học viên có thể chuyển đến kết quả chi tiết. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 2a | Chưa có dữ liệu: hiển thị 0 hoặc trạng thái chưa có, không tự tạo điểm giả. |
| 3a | Bài còn chờ chấm: không đưa vào điểm trung bình cuối cùng của các bài graded. |
| 4a | Không có phiên học được lưu trong ngày: thời gian ghi nhận của ngày là 0, không suy ra thời gian mở trình duyệt thực tế. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC13-I1 | Database và API có thể đọc báo cáo tuần/tháng đã lưu, nhưng hiện chưa có trang báo cáo định kỳ riêng hoặc lịch tự tạo báo cáo trong ứng dụng. |

Yêu cầu: FR09.

API đối chiếu:

- `GET /api/dashboard/student`

## UC14 – Xem lộ trình học tập

| Trường | Nội dung |
| --- | --- |
| UCID | UC14 |
| Name | Xem lộ trình học tập |
| Summary | Học viên xem các khóa được giáo viên sắp theo thứ tự và tiến độ tham gia từng khóa. |
| Preconditions | Đã đăng nhập; có thể có hoặc chưa có ghi danh vào các khóa trong lộ trình. |
| Postconditions | Hiển thị lộ trình được xuất bản và liên kết đến khóa; không tự ghi danh hàng loạt hoặc tạo lộ trình cá nhân. |
| Primary Actor(s) | Học viên |
| Secondary Actor(s) | Không có. |
| Trigger | Học viên chọn Lộ trình học tập. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Học viên mở trang lộ trình. |
| 2 | Hệ thống tải các lộ trình đã xuất bản cùng các khóa được phép hiển thị và ghi danh của học viên. |
| 3 | Học viên chọn một lộ trình. |
| 4 | Giao diện hiển thị mô tả, trình độ, số ngày dự kiến, thứ tự khóa và tiến độ tương ứng. |
| 5 | Học viên chọn Xem khóa học để mở chi tiết; đăng ký từng khóa được xử lý bằng chức năng ghi danh riêng. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 2a | Chưa có lộ trình xuất bản: hiển thị chưa có lộ trình. |
| 4a | Một khóa chưa được ghi danh: hiển thị chưa tham gia; không tự mở quyền học. |
| 4b | Không còn khóa được phép hiển thị: thông báo lộ trình đang được bổ sung nội dung. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC14-I1 | Thứ tự là hướng dẫn học, chưa cưỡng chế điều kiện tiên quyết hoặc cá nhân hóa bằng AI. |

Yêu cầu: FR10.

API đối chiếu:

- `GET /api/learning-paths`
- `GET /api/enrollments`

## UC15 – Xem và đánh dấu thông báo

| Trường | Nội dung |
| --- | --- |
| UCID | UC15 |
| Name | Xem và đánh dấu thông báo |
| Summary | Người dùng đọc thông báo nội bộ dành cho mình và đánh dấu đã đọc. |
| Preconditions | Đã đăng nhập bằng tài khoản đang hoạt động. |
| Postconditions | Hiển thị thông báo của tài khoản; khi thao tác thành công, cập nhật cờ đã đọc của một hoặc toàn bộ thông báo của chính tài khoản. |
| Primary Actor(s) | Học viên, Giáo viên, Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Người dùng mở biểu tượng thông báo hoặc trang Thông báo. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Người dùng mở danh sách thông báo. |
| 2 | Hệ thống lấy thông báo thuộc tài khoản và hiển thị trạng thái đọc. |
| 3 | Người dùng chọn bộ lọc hoặc mở một thông báo. |
| 4 | Người dùng chọn đánh dấu đã đọc cho một thông báo hoặc tất cả. |
| 5 | Hệ thống kiểm tra quyền sở hữu, cập nhật trạng thái và giao diện làm mới danh sách. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 2a | Không có thông báo phù hợp: hiển thị danh sách rỗng. |
| 5a | Thông báo thuộc người khác: từ chối cập nhật. |
| 5b | Lỗi cập nhật: thông báo lỗi; không tự coi mọi thông báo đã được đánh dấu. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC15-I1 | Thông báo không dùng WebSocket/push/email; cần tải lại để nhận dữ liệu mới. Bộ đếm ở header chỉ dựa trên nhóm thông báo đã tải tại đó. |

Yêu cầu: FR11.

API đối chiếu:

- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`

## UC16 – Quản lý khóa học

| Trường | Nội dung |
| --- | --- |
| UCID | UC16 |
| Name | Quản lý khóa học |
| Summary | Người quản lý tạo, xem, sửa, ẩn/xuất bản hoặc xóa khóa học trong phạm vi được cấp. |
| Preconditions | Đã đăng nhập với vai trò giáo viên hoặc admin; thao tác với khóa có sẵn cần quyền quản lý khóa đó. |
| Postconditions | Thành công: khóa được tạo/cập nhật/xóa theo thao tác; dữ liệu có lịch sử làm bài được bảo vệ khi xóa. |
| Primary Actor(s) | Giáo viên, Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Người quản lý mở Quản lý khóa học. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Hệ thống hiển thị danh sách khóa trong phạm vi quản lý và bộ lọc. |
| 2 | Người quản lý chọn thêm mới, sửa, đổi xuất bản hoặc xóa một khóa. |
| 3 | Với thêm/sửa, nhập tiêu đề, chương trình tùy chọn, mô tả, ảnh URL, trình độ, miễn phí/học phí và trạng thái xuất bản. |
| 4 | Hệ thống kiểm tra dữ liệu, slug duy nhất và quyền sở hữu; khóa miễn phí được đặt giá 0. |
| 5 | Hệ thống lưu; nếu xóa thì kiểm tra bài làm liên quan trước khi xử lý các bản ghi con trong giao dịch. |
| 6 | Giao diện tải lại danh sách và hiển thị kết quả thao tác. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 2a | Người quản lý hủy xác nhận xóa: không gửi yêu cầu xóa. |
| 4a | Dữ liệu sai, slug trùng hoặc không đúng quyền: từ chối lưu. |
| 5a | Khóa đã có bài làm: từ chối xóa để bảo toàn lịch sử; có thể ẩn bằng trạng thái xuất bản. |
| 5b | Lỗi xử lý xóa trong giao dịch: hoàn tác các bước xóa thuộc giao dịch. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC16-I1 | Giao diện hiện chưa có chọn/chuyển giáo viên phụ trách sau khi tạo. Không có doanh thu/hóa đơn được phát sinh tự động từ giá khóa. |

Yêu cầu: FR12.

API đối chiếu:

- `GET /api/courses`
- `POST /api/courses`
- `PUT /api/courses/:id`
- `DELETE /api/courses/:id`

## UC17 – Quản lý bài học

| Trường | Nội dung |
| --- | --- |
| UCID | UC17 |
| Name | Quản lý bài học |
| Summary | Người quản lý soạn, cập nhật, sắp xếp, xuất bản hoặc xóa bài học trong một khóa được phép quản lý. |
| Preconditions | Đã đăng nhập với quyền quản lý khóa; khóa đã tồn tại. |
| Postconditions | Thành công: dữ liệu bài học hoặc thứ tự hiển thị được cập nhật; xóa chỉ thực hiện khi thỏa điều kiện bảo vệ lịch sử. |
| Primary Actor(s) | Giáo viên, Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Người quản lý mở Quản lý bài học và chọn khóa. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Người quản lý chọn khóa; hệ thống tải bài học theo thứ tự. |
| 2 | Người quản lý chọn thêm/sửa bài, thay đổi xuất bản, chuyển lên/xuống hoặc xóa. |
| 3 | Với thêm/sửa, nhập tiêu đề, nội dung, URL video/audio nếu có, thời lượng, thứ tự và trạng thái xuất bản. |
| 4 | Hệ thống kiểm tra quyền khóa, dữ liệu và URL được phép rồi lưu bài học. |
| 5 | Với xóa, hệ thống kiểm tra bài làm của các bài tập con và xử lý bản ghi liên quan nếu được phép. |
| 6 | Giao diện hiển thị danh sách được cập nhật hoặc tải lại khi thao tác sắp xếp gặp lỗi. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 4a | Bài thuộc khóa khác, URL/dữ liệu không hợp lệ: từ chối cập nhật. |
| 2a | Đổi thứ tự: giao diện gửi hai yêu cầu cập nhật bài; nếu một yêu cầu lỗi, tải lại để phản ánh trạng thái đã lưu. |
| 5a | Có bài làm liên quan: không cho xóa, có thể ẩn bài. |
| 2b | Hủy hộp thoại xóa: kết thúc thao tác mà không xóa. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC17-I1 | Chưa có upload media và việc đổi chỗ hai bài chưa là một giao dịch liên yêu cầu. document_url có ở schema nhưng chưa có ô nhập/hiển thị tài liệu đầy đủ trong giao diện hiện tại. |

Yêu cầu: FR12.

API đối chiếu:

- `GET /api/lessons/course/:courseId`
- `POST /api/lessons`
- `PUT /api/lessons/:id`
- `DELETE /api/lessons/:id`

## UC18 – Quản lý bài tập

| Trường | Nội dung |
| --- | --- |
| UCID | UC18 |
| Name | Quản lý bài tập |
| Summary | Người quản lý tạo, sửa, xuất bản hoặc xóa bộ bài tập gắn với một bài học. |
| Preconditions | Đã đăng nhập; có quyền quản lý khóa chứa bài học. |
| Postconditions | Thành công: bộ bài tập được lưu hoặc xóa khi đủ điều kiện. Nội dung câu hỏi được soạn qua chức năng quản lý câu hỏi riêng. |
| Primary Actor(s) | Giáo viên, Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Người quản lý mở Quản lý bài tập rồi chọn khóa và bài học. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Người quản lý chọn bài học; hệ thống tải các bộ bài tập liên quan. |
| 2 | Người quản lý chọn thêm bộ bài, sửa, đổi xuất bản hoặc xóa. |
| 3 | Với thêm/sửa, nhập tiêu đề, mô tả, loại, độ khó, thời lượng mô tả và trạng thái xuất bản. |
| 4 | Hệ thống kiểm tra quyền và giá trị cho phép, lưu bộ bài tập đúng bài học. |
| 5 | Với xóa, hệ thống kiểm tra lượt làm; nếu được phép thì xử lý câu hỏi, phương án và liên kết đề liên quan. |
| 6 | Giao diện tải lại danh sách; người quản lý có thể mở chức năng soạn câu hỏi cho bộ bài. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 4a | Không có quyền, bài học không tồn tại hoặc dữ liệu sai: từ chối lưu. |
| 5a | Bộ bài đã có lượt làm: từ chối xóa, hướng tới ẩn nội dung để giữ lịch sử. |
| 2a | Người dùng hủy xác nhận xóa: không thay đổi dữ liệu. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC18-I1 | Một số bài mẫu có type=mixed nhưng dropdown/nhãn chưa đầy đủ. time_limit của bài tập không được dùng như deadline cưỡng chế trong luồng làm bài tập. |

Yêu cầu: FR12.

API đối chiếu:

- `GET /api/exercises`
- `POST /api/exercises`
- `PUT /api/exercises/:id`
- `DELETE /api/exercises/:id`

## UC19 – Quản lý câu hỏi và đáp án

| Trường | Nội dung |
| --- | --- |
| UCID | UC19 |
| Name | Quản lý câu hỏi và đáp án |
| Summary | Người quản lý soạn câu hỏi, phương án đúng, đáp án văn bản mẫu, điểm và lời giải cho một bộ bài tập. |
| Preconditions | Đã đăng nhập; bộ bài tập tồn tại trong khóa được phép quản lý. |
| Postconditions | Thành công: câu hỏi/phương án được lưu nhất quán; sửa phương án không thay đổi snapshot của bài làm cũ. |
| Primary Actor(s) | Giáo viên, Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Người quản lý mở một bộ bài tập và chọn thêm/sửa/xóa câu hỏi. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Hệ thống hiển thị câu hỏi hiện có và đáp án cho người có quyền soạn. |
| 2 | Người quản lý chọn dạng câu hỏi và nhập nội dung, điểm, lời giải. |
| 3 | Với trắc nghiệm/đúng-sai, nhập phương án và chọn một đáp án đúng; với điền/nối/sắp xếp, nhập đáp án mẫu; viết/nói không yêu cầu phương án chọn. |
| 4 | Hệ thống kiểm tra dạng câu hỏi, điểm; trắc nghiệm/đúng-sai cần 2–10 phương án và đúng một phương án đúng. |
| 5 | Hệ thống lưu câu hỏi và thay phương án trong cùng giao dịch; xóa câu hỏi sẽ gỡ phương án/liên kết đề liên quan. |
| 6 | Giao diện hiển thị bộ câu hỏi đã cập nhật. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 4a | Thiếu nội dung, điểm không trong giới hạn, đáp án trắc nghiệm sai số lượng hoặc thiếu đáp án mẫu: yêu cầu sửa. |
| 5a | Không đủ quyền với khóa hoặc câu hỏi không tồn tại: từ chối. |
| 5b | Lỗi giao dịch: hoàn tác các bước lưu câu hỏi/phương án thuộc giao dịch. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC19-I1 | Nối và sắp xếp là dạng văn bản, chưa có bộ soạn kéo-thả. Không có API /answers riêng đang được giao diện sử dụng; phương án đi kèm yêu cầu lưu câu hỏi. |

Yêu cầu: FR12.

API đối chiếu:

- `GET /api/questions/exercise/:id`
- `POST /api/questions`
- `PUT /api/questions/:id`
- `DELETE /api/questions/:id`

## UC20 – Quản lý bài kiểm tra

| Trường | Nội dung |
| --- | --- |
| UCID | UC20 |
| Name | Quản lý bài kiểm tra |
| Summary | Người quản lý tạo/cập nhật đề, chọn câu hỏi cùng khóa và thiết lập điều kiện làm bài. |
| Preconditions | Đã đăng nhập và có quyền quản lý khóa; khi chọn câu hỏi, câu hỏi phải tồn tại trong các bộ bài tập của khóa. Có thể lưu bản nháp chưa có câu hỏi. |
| Postconditions | Thành công: metadata đề và danh sách câu hỏi có thứ tự được lưu cùng giao dịch; đề chỉ mở làm khi đủ điều kiện truy cập và có câu hỏi. |
| Primary Actor(s) | Giáo viên, Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Người quản lý mở Quản lý bài kiểm tra. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Người quản lý chọn khóa và mở danh sách đề. |
| 2 | Người quản lý chọn thêm/sửa hoặc xóa đề; với thêm/sửa, nhập tiêu đề, mô tả, loại, thời lượng, điểm đạt và số lượt tối đa. |
| 3 | Với thêm/sửa, người quản lý chọn câu hỏi, thứ tự chọn, trộn câu, cho xem lời giải sau thi và xuất bản/bản nháp. |
| 4 | Hệ thống kiểm tra dữ liệu; danh sách tối đa 200 câu không trùng và mỗi câu phải thuộc cùng khóa của đề. |
| 5 | Hệ thống lưu đề và thay danh sách câu hỏi trong một giao dịch, hoặc xóa đề nếu chưa có lượt làm liên quan. |
| 6 | Giao diện tải lại danh sách và thông báo kết quả. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 3a | Đề xuất bản chưa chọn câu: giao diện yêu cầu chọn câu hỏi; đề không có câu cũng không thể bắt đầu thi. |
| 4a | Câu thuộc khóa khác, ID lặp hoặc giá trị không hợp lệ: từ chối và không lưu dở các bước trong giao dịch. |
| 5a | Đề đã có lượt làm: từ chối xóa để giữ lịch sử. |
| 4b | Đề mẫu dùng type=mock: nếu không đổi về một loại hợp lệ, API cập nhật có thể từ chối vì validator dùng mock_test. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC20-I1 | Cần thống nhất mock/mock_test ở dữ liệu mẫu và form. Bộ chọn hiện chỉ tải tối đa 200 câu rồi lọc tại client; chưa có phân trang toàn bộ ngân hàng câu hỏi. |

Yêu cầu: FR13.

API đối chiếu:

- `GET /api/exams`
- `GET /api/questions`
- `POST /api/exams`
- `PUT /api/exams/:id`
- `DELETE /api/exams/:id`

## UC21 – Xem tiến độ học viên

| Trường | Nội dung |
| --- | --- |
| UCID | UC21 |
| Name | Xem tiến độ học viên |
| Summary | Người quản lý theo dõi ghi danh, mức hoàn thành và điểm tổng hợp của học viên trong các khóa được cấp quyền. |
| Preconditions | Đã đăng nhập với quyền quản lý khóa; có thể chưa có ghi danh. |
| Postconditions | Hiển thị dữ liệu tiến độ trong phạm vi được phép; bản thân việc xem không cập nhật điểm hoặc tiến độ học viên. |
| Primary Actor(s) | Giáo viên, Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Người quản lý mở Tiến độ học viên. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Hệ thống tải danh sách khóa được quản lý và các ghi danh tương ứng. |
| 2 | Người quản lý lọc khóa hoặc nhập tên/email học viên trên danh sách đã tải. |
| 3 | Hệ thống/giao diện hiển thị khóa, số bài hoàn thành, tỷ lệ tiến độ, điểm trung bình, trạng thái và ngày ghi danh. |
| 4 | Người quản lý chọn Xem ở một học viên. |
| 5 | Giao diện mở hồ sơ học tập với các thông tin tiến độ và điểm hiện có. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 2a | Không có bản ghi phù hợp: thông báo không có dữ liệu. |
| 3a | Học viên chưa có bài graded: hiển thị chưa có điểm trung bình. |
| 4a | Đăng ký đang pending: có thể chuyển sang chức năng Duyệt đăng ký; việc xem không tự duyệt. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC21-I1 | Một số câu nhận xét trong modal là nội dung tĩnh, chưa phải kết luận tự động về năng lực/điểm danh. Danh sách cần tải lại để thấy dữ liệu mới. |

Yêu cầu: FR14.

API đối chiếu:

- `GET /api/courses`
- `GET /api/enrollments`

## UC22 – Chấm bài và nhận xét

| Trường | Nội dung |
| --- | --- |
| UCID | UC22 |
| Name | Chấm bài và nhận xét |
| Summary | Người quản lý xem bài đã nộp, đặt điểm tổng cuối cùng và gửi nhận xét cho học viên. |
| Preconditions | Đã đăng nhập với quyền quản lý khóa của bài làm; bài đã nộp, không còn in_progress. |
| Postconditions | Thành công: cập nhật điểm tổng, trạng thái graded, người chấm và nhận xét; tạo thông báo nếu bước thông báo thành công. Không đồng nghĩa đã chấm lại từng chi tiết câu hỏi. |
| Primary Actor(s) | Giáo viên, Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Người quản lý chọn Xem & chấm trong Bài nộp & chấm điểm. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Người quản lý mở danh sách bài nộp, có thể lọc chờ chấm hoặc đã chấm. |
| 2 | Người quản lý chọn bài để xem câu trả lời và kết quả hiện có. |
| 3 | Người quản lý nhập điểm tổng 0–100 và nhận xét. |
| 4 | Hệ thống kiểm tra quyền, trạng thái bài và điểm hợp lệ. |
| 5 | Hệ thống cập nhật điểm tổng, kết quả đạt/chưa đạt theo ngưỡng, trạng thái graded và người chấm. |
| 6 | Hệ thống tạo thông báo cho học viên; giao diện đóng form và tải lại danh sách. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 4a | Bài chưa nộp hoặc không có quyền: từ chối chấm. |
| 4b | Điểm ngoài 0–100 hoặc không phải số hợp lệ: yêu cầu nhập lại. |
| 1a | Chọn bài đã graded: vẫn có thể sửa lại điểm tổng và nhận xét trong phạm vi quyền. |
| 6a | Lỗi tạo thông báo sau lưu điểm: điểm có thể đã cập nhật; cần tải lại kiểm tra trước khi chấm lại. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC22-I1 | Giao diện chấm điểm tổng, chưa có rubric hay nhập điểm từng câu. Cờ cần chấm ở chi tiết có thể chưa được đồng bộ theo điểm tổng; API không gọi thủ tục chấm từng câu có sẵn trong SQL. |

Yêu cầu: FR14.

API đối chiếu:

- `GET /api/submissions`
- `GET /api/submissions/:id`
- `PUT /api/submissions/:id/grade`

## UC23 – Quản lý lộ trình học tập

| Trường | Nội dung |
| --- | --- |
| UCID | UC23 |
| Name | Quản lý lộ trình học tập |
| Summary | Người quản lý tạo lộ trình và sắp thứ tự các khóa trong phạm vi mình được quản lý. |
| Preconditions | Đã đăng nhập với vai trò giáo viên/admin; các khóa đưa vào lộ trình phải thuộc phạm vi quản lý. |
| Postconditions | Thành công: lưu metadata và danh sách khóa có thứ tự trong giao dịch, hoặc gỡ lộ trình cùng liên kết khóa; không xóa khóa học gốc. |
| Primary Actor(s) | Giáo viên, Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Người quản lý mở Lộ trình học tập trong khu vực giảng dạy. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Hệ thống tải lộ trình, chương trình và khóa được quản lý. |
| 2 | Người quản lý chọn thêm mới, sửa hoặc xóa; với thêm/sửa, nhập tiêu đề, mô tả, chương trình tùy chọn, trình độ, số ngày dự kiến và trạng thái xuất bản. |
| 3 | Với thêm/sửa, người quản lý chọn các khóa theo thứ tự mong muốn. |
| 4 | Hệ thống kiểm tra dữ liệu, ID không trùng và quyền quản lý từng khóa. |
| 5 | Hệ thống lưu metadata và thay liên kết thứ tự trong giao dịch; thao tác xóa gỡ liên kết rồi xóa lộ trình. |
| 6 | Giao diện tải lại; học viên có thể thấy lộ trình đã xuất bản. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 4a | Khóa không tồn tại hoặc ngoài quyền quản lý: từ chối, hoàn tác phần lưu trong giao dịch. |
| 4b | ID khóa trùng hoặc dữ liệu sai: yêu cầu điều chỉnh. |
| 3a | Muốn thay thứ tự trong giao diện hiện tại: bỏ chọn và chọn lại theo thứ tự; hệ thống giữ thứ tự mảng được gửi. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC23-I1 | Chưa có yêu cầu cùng chương trình giữa mọi khóa của lộ trình, chưa có điều kiện tiên quyết hay AI cá nhân hóa; không phát sinh ghi danh riêng vào lộ trình. |

Yêu cầu: FR15.

API đối chiếu:

- `GET /api/learning-paths`
- `POST /api/learning-paths`
- `PUT /api/learning-paths/:id`
- `DELETE /api/learning-paths/:id`

## UC24 – Quản lý tài khoản

| Trường | Nội dung |
| --- | --- |
| UCID | UC24 |
| Name | Quản lý tài khoản |
| Summary | Admin tạo, tra cứu, sửa thông tin, khóa/mở khóa, đặt mật khẩu hoặc xóa tài khoản theo ràng buộc. |
| Preconditions | Đã đăng nhập bằng tài khoản admin đang hoạt động. |
| Postconditions | Thành công: dữ liệu tài khoản được lưu hoặc xóa khi hợp lệ; đổi mật khẩu/khóa tài khoản thu hồi phiên liên quan. Thay đổi vai trò được phân tích riêng ở UC25. |
| Primary Actor(s) | Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Admin mở Quản lý người dùng. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Hệ thống hiển thị danh sách tài khoản có tìm kiếm, lọc vai trò và phân trang. |
| 2 | Admin chọn thêm mới, sửa tài khoản, đổi trạng thái, đặt mật khẩu mới hoặc xóa. |
| 3 | Với thêm/sửa, admin nhập các trường được phép; tạo mới có email, mật khẩu và vai trò ban đầu. |
| 4 | Hệ thống kiểm tra dữ liệu, tính duy nhất và ràng buộc tự quản trị. |
| 5 | Hệ thống lưu tài khoản; thu hồi phiên khi đổi mật khẩu/khóa; với xóa, kiểm tra chủ sở hữu nội dung và xử lý dữ liệu liên quan trong giao dịch. |
| 6 | Giao diện làm mới danh sách và hiển thị kết quả. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 4a | Email trùng, mật khẩu tạo mới không hợp lệ hoặc dữ liệu thiếu: từ chối lưu. |
| 4b | Admin tự khóa hoặc tự xóa tài khoản đang dùng: từ chối. |
| 5a | Tài khoản còn phụ trách khóa/lộ trình: từ chối xóa; có thể khóa tài khoản theo quyền. |
| 2a | Admin hủy xác nhận xóa: không thay đổi dữ liệu. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC24-I1 | Chưa có email gửi mật khẩu mới hoặc khôi phục tự phục vụ. Giao diện không cho sửa email tài khoản đã có dù API admin có thể nhận email hợp lệ. |

Yêu cầu: FR16.

API đối chiếu:

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

## UC25 – Cấp và thay đổi vai trò

| Trường | Nội dung |
| --- | --- |
| UCID | UC25 |
| Name | Cấp và thay đổi vai trò |
| Summary | Admin cấp quyền giáo viên hoặc đổi vai trò của một tài khoản đã có. |
| Preconditions | Admin đã đăng nhập; tài khoản đích tồn tại; vai trò thuộc student, teacher hoặc admin. |
| Postconditions | Thành công: lưu vai trò mới và thu hồi các phiên cũ của tài khoản đích để quyền được áp dụng khi xác thực lại. |
| Primary Actor(s) | Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Admin sửa tài khoản trong Quản lý người dùng và thay đổi trường Vai trò. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Admin tìm tài khoản cần cấp/đổi quyền. |
| 2 | Admin mở form sửa và chọn vai trò mới. |
| 3 | Hệ thống kiểm tra vai trò hợp lệ và quyền admin. |
| 4 | Hệ thống kiểm tra ràng buộc: không tự hạ quyền của mình; không đổi giáo viên sang vai trò khác khi vẫn phụ trách khóa. |
| 5 | Hệ thống cập nhật vai trò và thu hồi phiên của tài khoản đích trong cùng giao dịch nếu vai trò thay đổi. |
| 6 | Giao diện thông báo thành công; tài khoản đích đăng nhập lại để dùng quyền mới. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 3a | Người gọi không có quyền admin hoặc role không hợp lệ: từ chối. |
| 4a | Admin tự đổi mình sang vai trò khác admin: từ chối. |
| 4b | Giáo viên còn phụ trách khóa mà bị đổi sang vai trò khác: từ chối và thông báo cần xử lý nội dung trước. |
| 5a | Vai trò không đổi: không thu hồi phiên chỉ vì trường role được gửi lại cùng giá trị; các thay đổi mật khẩu/khóa khác vẫn có quy tắc riêng. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC25-I1 | Chưa có quy trình tự đăng ký làm giáo viên hoặc API chuyển giáo viên phụ trách khóa sau khi tạo. Thông báo cần chuyển khóa không có nghĩa chức năng chuyển đó đã được triển khai. |

Yêu cầu: FR16.

API đối chiếu:

- `GET /api/users`
- `PUT /api/users/:id`

## UC26 – Quản lý chương trình đào tạo

| Trường | Nội dung |
| --- | --- |
| UCID | UC26 |
| Name | Quản lý chương trình đào tạo |
| Summary | Admin quản lý danh mục chương trình như CEFR, IELTS, tiếng Anh phổ thông, học thuật và giao tiếp. |
| Preconditions | Đã đăng nhập bằng tài khoản admin đang hoạt động. |
| Postconditions | Thành công: chương trình được tạo/cập nhật/xóa; khi xóa trên SQL Server, liên kết chương trình ở khóa/lộ trình được đặt NULL, không xóa nội dung gốc. |
| Primary Actor(s) | Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Admin mở Quản lý chương trình. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Hệ thống tải danh mục chương trình. |
| 2 | Admin chọn thêm/sửa/xóa chương trình. |
| 3 | Với thêm/sửa, admin nhập tên, slug, mô tả và trạng thái hoạt động. |
| 4 | Hệ thống kiểm tra tên, chuẩn hóa slug và kiểm tra không trùng. |
| 5 | Hệ thống lưu chương trình; với xóa, gỡ liên kết chương trình khỏi khóa/lộ trình rồi xóa trong giao dịch. |
| 6 | Giao diện tải lại danh mục và thông báo kết quả. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 4a | Tên không hợp lệ hoặc slug trùng: yêu cầu điều chỉnh. |
| 5a | Chương trình không tồn tại hoặc người gọi thiếu quyền: từ chối. |
| 2a | Admin hủy xác nhận xóa: không thay đổi dữ liệu. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC26-I1 | Ẩn chương trình không tự động ẩn tất cả khóa đã xuất bản; trạng thái chương trình và khóa được kiểm tra theo chức năng riêng. Tên chương trình không phải chứng nhận đạt CEFR/band IELTS. |

Yêu cầu: FR17.

API đối chiếu:

- `GET /api/programs`
- `POST /api/programs`
- `PUT /api/programs/:id`
- `DELETE /api/programs/:id`

## UC27 – Xem thống kê giảng dạy

| Trường | Nội dung |
| --- | --- |
| UCID | UC27 |
| Name | Xem thống kê giảng dạy |
| Summary | Người quản lý xem thống kê khóa, học viên, bài kiểm tra và kết quả trong phạm vi quản lý. |
| Preconditions | Đã đăng nhập với vai trò giáo viên/admin. |
| Postconditions | Hiển thị thống kê theo dữ liệu hiện tại; không thay đổi điểm hay ghi danh. |
| Primary Actor(s) | Giáo viên, Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Người quản lý mở Tổng quan giảng dạy. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Người quản lý mở trang tổng quan giảng dạy. |
| 2 | Hệ thống xác định các khóa được phép quản lý. |
| 3 | Hệ thống tổng hợp ghi danh, số đề, bài làm graded, phân bố điểm và tỷ lệ đạt theo ngưỡng thống kê. |
| 4 | Hệ thống tổng hợp số bài nộp theo 7 ngày gần nhất và thông tin một số khóa. |
| 5 | Giao diện hiển thị KPI, biểu đồ và các liên kết quản lý liên quan. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 2a | Giáo viên chưa có khóa: hiển thị thống kê rỗng hoặc 0. |
| 3a | Chưa có bài graded: tỷ lệ/phân bố không có kết quả để tính. |
| 3b | Admin mở trang này: thống kê trong phạm vi toàn bộ khóa mà admin quản lý. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC27-I1 | Tỷ lệ đạt dashboard hiện dùng ngưỡng 60% chung, không phải từng pass_score của đề. Một số nhãn nhắc “học kỳ” nhưng chưa có mô hình học kỳ hoặc bộ lọc tương ứng. |

Yêu cầu: FR18.

API đối chiếu:

- `GET /api/dashboard/teacher`
- `GET /api/courses`

## UC28 – Xem thống kê toàn hệ thống

| Trường | Nội dung |
| --- | --- |
| UCID | UC28 |
| Name | Xem thống kê toàn hệ thống |
| Summary | Admin xem số lượng người dùng, nội dung, ghi danh và lượt thi của toàn nền tảng. |
| Preconditions | Đã đăng nhập bằng tài khoản admin đang hoạt động. |
| Postconditions | Hiển thị số liệu tổng hợp, người dùng mới và khóa được sắp theo lượng ghi danh; không tạo dữ liệu nghiệp vụ mới. |
| Primary Actor(s) | Quản trị viên |
| Secondary Actor(s) | Không có. |
| Trigger | Admin mở Tổng quan hệ thống. |

### Main Scenario

| Step | Action |
| --- | --- |
| 1 | Admin mở trang tổng quan. |
| 2 | Hệ thống kiểm tra quyền admin. |
| 3 | Hệ thống đếm tài khoản theo vai trò, khóa/chương trình, ghi danh và lượt thi. |
| 4 | Hệ thống lấy người dùng mới và các khóa có số học viên active/completed cao. |
| 5 | Giao diện hiển thị số liệu và cho phép làm mới để lấy dữ liệu hiện tại. |

### Extensions

| Step | Hoạt động nhánh |
| --- | --- |
| 2a | Tài khoản không phải admin: từ chối truy cập. |
| 3a | Chưa có dữ liệu của một nhóm: hiển thị 0 hoặc danh sách trống. |
| 5a | Lỗi lấy dữ liệu: hiển thị lỗi/tùy chọn tải lại, không suy số liệu demo thay cho kết quả lỗi. |

### Open Issues

| Issue # | Các vấn đề liên quan cần giải quyết |
| --- | --- |
| UC28-I1 | Cần đồng bộ tên trường student_count của API với total_students mà thẻ top-course đang đọc. Chưa có thống kê doanh thu/thanh toán hoặc nhật ký kiểm toán toàn hệ thống. |

Yêu cầu: FR18.

API đối chiếu:

- `GET /api/dashboard/admin`
