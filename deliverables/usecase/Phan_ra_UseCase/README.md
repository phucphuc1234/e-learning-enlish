# Phân rã Use Case – E-Learning dạy và luyện thi tiếng Anh

Đã vẽ đủ **28 sơ đồ**, từ UC01 đến UC28, theo chức năng trong giao diện và API hiện tại. Màu và bố cục theo ảnh mẫu: hình elip vàng nhạt, viền hồng, liên kết nét đứt, tác nhân bên trái. Không sửa mã ứng dụng hoặc file Word.

## Chọn tệp cần dùng

- **Phan_ra_UseCase_Elearning.drawio**: mở bằng draw.io → File → Open From → Device; chọn các tab UC01…UC28 ở cạnh dưới.
- **Phan_ra_UseCase_Elearning.xml**: cùng tài liệu nhiều trang; mở từ tệp như trên, không dán toàn bộ vào hộp XML của một trang.
- **xml/UC01.xml … xml/UC28.xml**: mã của từng trang; tạo sơ đồ trống → Extras → Edit Diagram → thay mã → Apply.
- **png/**: 28 ảnh riêng để nhìn vẽ theo hoặc chèn Word.
- **svg/**: 28 sơ đồ vector để phóng to; có thể nhập vào trình vẽ vector.
- **Tat_ca_28_so_do.pdf**: xem lần lượt toàn bộ 28 hình.
- **Doi_chieu_chuc_nang_con.md**: giải thích từng nhánh và dẫn chứng source file:dòng.
- **Phan_ra_UseCase_Data.json**: dữ liệu chức năng, actor, quan hệ, điều kiện và nguồn đối chiếu.

## Đọc đúng các quan hệ

- Nét liền đen nối tác nhân với use case cha; không có mũi tên.
- «include»: mũi tên nét đứt từ use case cha tới hành vi được bao gồm; bắt buộc trong luồng thành công tương ứng.
- «extend»: mũi tên nét đứt từ hành vi tùy chọn tới use case cha; chỉ xảy ra khi điều kiện bên dưới hình đúng.
- Với các màn quản lý, luồng cơ sở là mở/xem danh sách trong phạm vi được quản lý. Các thao tác thêm, sửa, xóa, công bố là lựa chọn tại điểm mở rộng, không phải tất cả đều bắt buộc trong một lần quản lý.
- Các quan hệ này không biểu diễn thứ tự thực hiện như Activity hoặc Sequence.
- Các chức năng con là phân rã hành vi đã có, không khẳng định mỗi nút là một màn hình/API độc lập.
- UC19 trong UC18 và UC25 trong UC24 là tham chiếu các UC đã có, không phải chức năng mới có cùng tên.

## Những điểm giữ đúng theo code

- Khách cũng có Đăng nhập. UC02 nối đủ Khách, Học viên, Giáo viên và Admin; các vai trò tài khoản được xét trước khi đăng nhập.
- Đăng ký công khai chỉ tạo học viên; không có quy trình tự đăng ký để nhận quyền giáo viên. Quyền giáo viên do admin tạo/cấp trong quản lý tài khoản.
- Giáo viên quản lý nội dung trong phạm vi phụ trách; admin có quyền toàn cục. Không suy diễn admin/teacher kế thừa mọi hoạt động học và thi của học viên.
- Duyệt khóa có phí là thủ công; chấm bài là điểm tổng và nhận xét; tiến độ lưu khi người học bấm hoàn thành.
- Không bổ sung cổng thanh toán, AI, ghi âm/upload, chứng chỉ hoặc tạo báo cáo định kỳ tự động như chức năng đã có.
- Code cho mở một số route học viên đối với giáo viên/admin nhưng không đồng nghĩa mọi thao tác đều được backend cho phép. Xem notes nguồn cho các giới hạn cụ thể.

## Danh sách 28 hình

| UC | Tên sơ đồ | Ảnh | XML từng trang |
| --- | --- | --- | --- |
| UC01 | Đăng ký tài khoản | [PNG](png/UC01.png) | [XML](xml/UC01.xml) |
| UC02 | Đăng nhập | [PNG](png/UC02.png) | [XML](xml/UC02.xml) |
| UC03 | Đăng xuất | [PNG](png/UC03.png) | [XML](xml/UC03.xml) |
| UC04 | Quản lý hồ sơ cá nhân | [PNG](png/UC04.png) | [XML](xml/UC04.xml) |
| UC05 | Đổi mật khẩu | [PNG](png/UC05.png) | [XML](xml/UC05.xml) |
| UC06 | Tra cứu khóa học | [PNG](png/UC06.png) | [XML](xml/UC06.xml) |
| UC07 | Đăng ký khóa học | [PNG](png/UC07.png) | [XML](xml/UC07.xml) |
| UC08 | Duyệt đăng ký khóa học | [PNG](png/UC08.png) | [XML](xml/UC08.xml) |
| UC09 | Học bài và ghi nhận tiến độ | [PNG](png/UC09.png) | [XML](xml/UC09.xml) |
| UC10 | Làm bài tập | [PNG](png/UC10.png) | [XML](xml/UC10.xml) |
| UC11 | Làm bài kiểm tra/thi thử | [PNG](png/UC11.png) | [XML](xml/UC11.xml) |
| UC12 | Xem kết quả và lời giải | [PNG](png/UC12.png) | [XML](xml/UC12.xml) |
| UC13 | Theo dõi tiến độ học tập | [PNG](png/UC13.png) | [XML](xml/UC13.xml) |
| UC14 | Xem lộ trình học tập | [PNG](png/UC14.png) | [XML](xml/UC14.xml) |
| UC15 | Xem và đánh dấu thông báo | [PNG](png/UC15.png) | [XML](xml/UC15.xml) |
| UC16 | Quản lý khóa học | [PNG](png/UC16.png) | [XML](xml/UC16.xml) |
| UC17 | Quản lý bài học | [PNG](png/UC17.png) | [XML](xml/UC17.xml) |
| UC18 | Quản lý bài tập | [PNG](png/UC18.png) | [XML](xml/UC18.xml) |
| UC19 | Quản lý câu hỏi và đáp án | [PNG](png/UC19.png) | [XML](xml/UC19.xml) |
| UC20 | Quản lý bài kiểm tra | [PNG](png/UC20.png) | [XML](xml/UC20.xml) |
| UC21 | Xem tiến độ học viên | [PNG](png/UC21.png) | [XML](xml/UC21.xml) |
| UC22 | Chấm bài và nhận xét | [PNG](png/UC22.png) | [XML](xml/UC22.xml) |
| UC23 | Quản lý lộ trình học tập | [PNG](png/UC23.png) | [XML](xml/UC23.xml) |
| UC24 | Quản lý tài khoản | [PNG](png/UC24.png) | [XML](xml/UC24.xml) |
| UC25 | Cấp và thay đổi vai trò | [PNG](png/UC25.png) | [XML](xml/UC25.xml) |
| UC26 | Quản lý chương trình đào tạo | [PNG](png/UC26.png) | [XML](xml/UC26.xml) |
| UC27 | Xem thống kê giảng dạy | [PNG](png/UC27.png) | [XML](xml/UC27.xml) |
| UC28 | Xem thống kê toàn hệ thống | [PNG](png/UC28.png) | [XML](xml/UC28.xml) |
