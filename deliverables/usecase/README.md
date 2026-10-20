# Bộ phân tích Use Case – E-Learning English

Tài liệu cho đồ án **Hệ thống E-Learning dạy và luyện thi tiếng Anh**, đối chiếu mã nguồn `a85ded9268a850f8e852bcfaa9de031bd855f024` ngày 20/10/2026, profile SQL Server. Các tài liệu này không thay đổi chức năng của ứng dụng.

## Các tệp

| Tệp | Nội dung |
| --- | --- |
| [Phan_tich_he_thong_Elearning_English.docx](Phan_tich_he_thong_Elearning_English.docx) | Báo cáo Word ba chương theo cấu trúc mẫu, 28 bảng đặc tả đầy đủ và các vị trí chèn sơ đồ. |
| [UseCase_Elearning_English.drawio](UseCase_Elearning_English.drawio) | Sơ đồ Use Case chỉnh sửa trực tiếp bằng draw.io, gồm năm trang. |
| [UseCase_Elearning_English.xml](UseCase_Elearning_English.xml) | Cùng nội dung với tệp `.drawio`, XML không nén để xem/copy mã. |
| [Dac_ta_UseCase.md](Dac_ta_UseCase.md) | Đặc tả dạng văn bản Markdown, thuận tiện đọc/copy. |
| [UseCase_Data.json](UseCase_Data.json) | Dữ liệu 28 use case: mã, tên, actor, luồng, nhánh, giới hạn, API và bảng liên quan. |
| [Bo_UseCase_Elearning_English.zip](Bo_UseCase_Elearning_English.zip) | Gói chứa các tệp trên và hướng dẫn này. |

## Mở sơ đồ draw.io

1. Tải tệp `.drawio` hoặc `.xml` về máy. Nếu GitHub hiển thị nội dung XML, bấm **Download raw file** hoặc mở **Raw**, rồi nhấn `Ctrl+S`; giữ đuôi `.xml`.
2. Mở [app.diagrams.net](https://app.diagrams.net/), chọn lưu trên **Device** nếu được hỏi.
3. Chọn **File → Open From → Device**, rồi chọn tệp vừa tải. Đây là mở tài liệu nhiều trang, không cần dán vào hộp chỉnh XML của một trang riêng.
4. Chọn các tab ở cạnh dưới:
   - `00 - Tổng quan`: đủ 28 use case và bốn tác nhân.
   - `01 - Khách và dùng chung`: đăng ký, đăng nhập, tra cứu và các chức năng cá nhân.
   - `02 - Học viên`: toàn bộ chức năng của học viên.
   - `03 - Giáo viên`: chức năng cá nhân và nghiệp vụ trong phạm vi phụ trách.
   - `04 - Quản trị viên`: chức năng cá nhân, quản trị và quản lý nghiệp vụ toàn cục.
5. Nhấn `Ctrl+S` để lưu chỉnh sửa. Khi cần ảnh đưa vào Word, chọn từng tab rồi **File → Export as → PNG/SVG**. Các trang theo vai trò dễ đọc hơn khi đặt trên trang A4.

Hai tệp `.xml` và `.drawio` là hai cách đóng gói **cùng một mô hình**. Chỉ cần chọn một tệp để chỉnh sửa, tránh duy trì hai bản khác nhau.

## Nội dung Word

- **Chương I:** hiện trạng, yêu cầu chức năng/phi chức năng, vai trò, quy tắc nghiệp vụ, biểu mẫu, mục tiêu và phạm vi.
- **Chương II:** mô hình Use Case, actor, danh sách UC01–UC28 và đặc tả. Mỗi đặc tả có đúng các trường `UCID`, `Name`, `Summary`, `Preconditions`, `Postconditions`, `Primary Actor(s)`, `Secondary Actor(s)`, `Trigger`; tiếp theo là `Main Scenario`, `Extensions`, `Open Issues`.
- **Chương III:** cơ sở phân tích mô hình lớp miền, hoạt động và tương tác cho cùng 28 use case. Các hình Class/Activity/Sequence sẽ được bổ sung sau, chưa được dựng trong gói này.
- **Phụ lục:** đối chiếu UC–yêu cầu–API–dữ liệu và những phần cần hoàn thiện so với yêu cầu đề tài.

Word dùng A4, lề trái 3 cm, các lề còn lại 2 cm, Times New Roman và bảng có đường viền theo mẫu. Không nhúng ảnh từ tài liệu mẫu. Có 63 vị trí `[Chèn hình: ...]` kèm chú thích cho sơ đồ tổ chức, năm góc nhìn Use Case, một mô hình lớp, 28 Activity và 28 Sequence. Khi chèn ảnh, thay dòng giữ chỗ, giữ lại chú thích và đặt chiều rộng không vượt 16 cm. Số trang có thể khác nhẹ giữa các phiên bản Word và font trên máy.

## Quy ước quan trọng

- **Khách** là trạng thái chưa đăng nhập, có thể đã có tài khoản của bất kỳ vai trò nào. Người có tài khoản giáo viên/admin cũng thực hiện UC02 khi đang là khách. Khách không phải role lưu trong SQL.
- Đăng ký công khai chỉ tạo **học viên**; quyền giáo viên do **admin tạo/cấp**. Giáo viên quản lý dữ liệu trong phạm vi phụ trách; admin có phạm vi toàn hệ thống.
- Đường nối là quan hệ actor–use case, không có ý nghĩa trình tự. Các tab là các góc nhìn của cùng 28 UC. Không thêm quan hệ `include/extend` chỉ vì cần đăng nhập hoặc vì chức năng xuất hiện cùng một màn hình.
- Duyệt đăng ký khóa có phí là thao tác thủ công; chưa có cổng thanh toán. Bài tập không có cơ chế deadline/lưu nháp tương đương bài thi.
- Phần báo cáo định kỳ mới có dữ liệu và API đọc, chưa có màn hình/tác vụ tạo tự động đầy đủ. Không coi phần này là một UC giao diện đã hoàn thiện.
- Mô hình lớp được phân tích ở mức miền khái niệm. Không khẳng định các lớp MVC/ORM hoặc bảng của `legacy` đang được dùng trong bản hiện tại.

Phân tích phản ánh phiên bản nguồn nêu trên. Nếu bổ sung hoặc sửa tính năng, cần cập nhật đặc tả và sơ đồ tương ứng. Gói này không chứa bản sửa ứng dụng hay dữ liệu SQL mới.
