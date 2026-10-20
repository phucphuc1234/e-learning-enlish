# Kết nối bản web với database SQL Server đã tạo

Áp dụng cho database **ELearningEnglish_Demo** từ file `EnglishStudio_Full.sql`. Không chạy lại file SQL hoặc `npm run seed:demo` để làm bước kết nối này. Dữ liệu SQL đã tạo sẽ được sử dụng trực tiếp; backend không tự tạo/ghi đè database.

## 1. Copy code thay thế

Dừng `npm run dev` bằng **Ctrl+C**. Sao lưu code bạn tự sửa nếu có. Tải `downloads/SQLServer_Update.zip` ở nhánh `codex/sqlserver-connection`, giải nén rồi copy **toàn bộ các mục bên trong** vào thư mục dự án cũ, cùng cấp với `package.json`; chọn **Replace the files in the destination**. Không copy nguyên thư mục ZIP thành một thư mục con của dự án.

Gói chỉ chứa các file cần cập nhật: backend `server/`, một số script/test, `package.json`, `package-lock.json`, `.env.example`, trang bài học `src/pages/student/LessonView.jsx` và tài liệu này. Gói không chứa `.env`, mật khẩu SQL, `.data`, `node_modules` hay file database. Bạn có thể mở từng file trong gói và copy nội dung vào file có cùng đường dẫn nếu muốn làm thủ công.

Chỉ đổi `.env` hoặc chỉ copy `server/database.js` sẽ chưa đủ: API trước đây dùng SQLite đồng bộ, còn driver SQL Server dùng Promise. Gói đã sửa cả phần gọi truy vấn, kiểm tra quyền, startup, seed và các lệnh liên quan.

## 2. Tạo/sửa `.env` trong thư mục có `package.json`

Tên file đúng là **`.env`**, không phải `.env.txt`. Nội dung mẫu để chạy trên cùng máy Windows với SQL Server:

```dotenv
NODE_ENV=development
PORT=5000
HOST=127.0.0.1
DB_DRIVER=mssql
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=ELearningEnglish_Demo
DB_USER=sa
DB_PASSWORD="DIEN_MAT_KHAU_SQL_SERVER_CUA_BAN_VAO_DAY"
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
```

Bạn cần thay **DB_PASSWORD** bằng mật khẩu đã dùng để đăng nhập SSMS. Nếu dùng tài khoản khác `sa`, sửa cả `DB_USER`. Không gửi mật khẩu cho người khác hoặc đưa `.env` lên GitHub. Dùng dấu nháy để ký tự `#` không bị hiểu là comment; nếu mật khẩu có dấu nháy kép, dùng dấu nháy đơn bao ngoài phù hợp với cú pháp dotenv.

`DB_SERVER=localhost` đúng khi web và SQL Server chạy trên cùng máy. Có thể dùng tên máy thấy trong SSMS thay `localhost`. Không ghi tên database vào `DB_SERVER`, không thêm `http://`. Tên database phải là **ELearningEnglish_Demo**, không phải database `ELearningEnglish` cũ.

Nếu dùng instance có tên và không đặt cổng cố định, dùng `DB_SERVER=localhost` + `DB_INSTANCE=SQLEXPRESS` (thay bằng instance thật); SQL Server Browser phải chạy để tìm cổng. Cách cấu hình TCP cổng 1433 bên dưới dễ kiểm tra hơn cho máy local.

## 3. Bật TCP/IP cho SQL Server

SSMS có thể kết nối bằng Shared Memory khi Node.js chưa kết nối được TCP. Với SQL Server 2022 (phiên bản 16.x trong ảnh):

1. Nhấn **Win+R**, nhập `SQLServerManager16.msc`, Enter.
2. Mở **SQL Server Network Configuration → Protocols for MSSQLSERVER**. Nếu instance có tên, chọn đúng instance của bạn.
3. Bật **TCP/IP → Enable**.
4. Mở **TCP/IP → Properties → IP Addresses → IPAll**: xóa giá trị **TCP Dynamic Ports**, đặt **TCP Port = 1433**. Bấm OK.
5. Vào **SQL Server Services**, chọn **SQL Server (MSSQLSERVER) → Restart**. Nếu máy đã chạy SQL Server ở một cổng cố định khác, dùng cổng đó trong `DB_PORT` thay vì đổi cổng đang hoạt động.

Trong SSMS, thử đăng nhập bằng server name **`tcp:localhost,1433`** với cùng tài khoản SQL. Nếu cách này chưa kết nối được thì Node.js cũng chưa kết nối được. Không cần đổi port Vite 3000 hay API 5000; 1433 là cổng database.

## 4. Cài thư viện và kiểm tra

Mở CMD/terminal trong thư mục có `package.json`, chạy lần lượt:

```bat
npm install
npm run db:check
```

Nếu cấu hình đúng, kết quả ban đầu tương tự:

```text
SQL Server connected.
Database: ELearningEnglish_Demo | users: 100 | courses: 33 | lessons: 198
Demo student password hash: OK.
```

Số lượng có thể thay đổi khi bạn thêm/xóa dữ liệu. Lệnh kiểm tra dùng kết nối TDS thật tới SQL Server, đọc dữ liệu/schema/procedure, không tạo database hoặc seed. Nếu không kết nối được, lệnh trả exit code khác 0; không âm thầm chuyển sang SQLite.

Sau khi kiểm tra thành công:

```bat
npm run dev
```

Terminal API phải báo **SQL Server connected**. Mở web ở cổng 3000 như trước. Đăng nhập bằng một trong ba tài khoản sau, mật khẩu ứng dụng chung **EnglishDemo!2026**:

- `admin@elearning.com`
- `teacher@elearning.com`
- `student@elearning.com`

Đây là mật khẩu ứng dụng mẫu, khác với mật khẩu SQL Server trong `.env`. Hãy đăng xuất/đăng nhập lại nếu trình duyệt còn giữ token từ database SQLite cũ. SQLite và SQL Server có phiên đăng nhập riêng.

## Nếu gặp lỗi

| Thông báo | Kiểm tra |
| --- | --- |
| Missing script: db:check | Chưa copy `package.json` mới hoặc đang chạy CMD ở sai thư mục |
| Cannot find package mssql | Chạy `npm install` trong đúng thư mục dự án |
| Chưa có DB_PASSWORD | Sai tên/vị trí `.env`, chưa điền mật khẩu hoặc đang mở nhầm thư mục |
| ETIMEOUT / ESOCKET / ECONNREFUSED | Bật TCP/IP, đúng instance/cổng, restart dịch vụ; thử SSMS với `tcp:localhost,1433` |
| Login failed / ELOGIN | Sai user/mật khẩu; kiểm tra SQL Server Authentication, SQL login có bị khóa không |
| Không mở được database / 4060 | Sai `DB_DATABASE` hoặc SQL login chưa được cấp quyền vào database |
| Chứng chỉ không tin cậy trên máy local | `DB_TRUST_SERVER_CERTIFICATE=true`, khởi động lại API |
| Invalid object / chưa có schema | Chọn `ELearningEnglish_Demo`, kiểm tra đã chạy toàn bộ file SQL trước đó |
| API vẫn báo SQLite connected | `.env` thiếu `DB_DRIVER=mssql`, chưa restart, hoặc có biến DB_DRIVER đã export trong terminal ghi đè `.env` |
| Web báo cần đăng nhập sau khi chuyển DB | Đăng xuất rồi đăng nhập lại để lấy token SQL Server |

## Phạm vi và kiểm thử

Backend đọc/ghi SQL Server qua `mssql`, truyền tham số an toàn và dùng pool kết nối/transaction. Ngày giờ và BIT được chuyển về định dạng frontend đang dùng. Lưu tiến độ gọi procedure `usp_RecordLessonProgress` từ file SQL đã gửi; lịch sử bài làm và báo cáo mẫu được đọc từ database mới. Nội dung đã có bài làm sẽ được bảo vệ khi xóa để giữ quan hệ và lịch sử; có thể ẩn nội dung bằng trường xuất bản. Backend không tự tạo SQL login, cài SQL Server hay cài lịch tạo báo cáo.

Không có thông tin kết nối/mật khẩu máy Windows của bạn trong cloud. Kiểm thử API/UI ở cloud dùng SQLite tạm để kiểm tra logic chung; các kiểm thử adapter SQL dùng pool mô phỏng để kiểm tra bind tham số, transaction, ánh xạ dữ liệu và cấu hình. Những kiểm tra đó không thay thế chạy tích hợp trên SQL Server thật. `npm run db:check` là bước xác nhận kết nối trên máy của bạn; chỉ báo đã kết nối sau khi lệnh này thành công.

Mặc định khi không đặt `DB_DRIVER`, cloud/test vẫn dùng SQLite. Đặt `DB_DRIVER=mssql` bắt buộc dùng SQL Server; kết nối lỗi sẽ dừng, không tự tạo SQLite để che lỗi.
