# English studio — Nền tảng học tiếng Anh

Ứng dụng gồm React 18, Vite 7, Tailwind CSS 4, Express 5 trên Node.js 24;
hỗ trợ **SQL Server** qua `mssql` và SQLite cho phát triển/kiểm thử.
Frontend và backend cùng repository; dữ liệu được lưu thật, không dùng dữ liệu giả
để thay thế lỗi API. Bản SQL Server cũ được giữ trong `legacy/` để tham khảo;
driver SQL Server đang dùng nằm ở `server/sqlserver-store.js`.

**Đã chạy `EnglishStudio_Full.sql` trên Windows?** Làm theo
[hướng dẫn copy code, cấu hình .env và kết nối SQL Server](docs/SQLSERVER_WINDOWS.md).
Đặt `DB_DRIVER=mssql`, dùng database `ELearningEnglish_Demo`, chạy `npm install`,
`npm run db:check`, rồi `npm run dev`. Không chạy `npm run seed:demo` với SQL Server.

## Chạy để phát triển

Yêu cầu **Node.js 24** và npm. Để chạy bản SQLite khi không cấu hình `.env`,
hoặc khi đặt `DB_DRIVER=sqlite`, chạy trong thư mục repository:

```bash
npm ci
npm run seed:demo
npm run dev
```

`dev` chạy frontend ở cổng **3000** và API ở cổng **5000**. Cả hai tiến trình dừng
khi nhấn Ctrl+C. Frontend gọi API qua proxy cùng nguồn. API mặc định chỉ lắng nghe
trên giao diện loopback; frontend phát triển lắng nghe trên các giao diện mạng.

Lệnh seed chỉ dành cho phát triển: tạo ba khóa học, sáu bài học, bài luyện tập,
ba đề kiểm tra và một lộ trình. Chạy lại không ghi đè dữ liệu hiện có.

| Vai trò   | Email dùng thử          | Mật khẩu dùng thử  |
| --------- | ----------------------- | ------------------ |
| Admin     | `admin@elearning.com`   | `EnglishDemo!2026` |
| Giáo viên | `teacher@elearning.com` | `EnglishDemo!2026` |
| Học viên  | `student@elearning.com` | `EnglishDemo!2026` |

Các tài khoản trên là dữ liệu mẫu công khai cho máy phát triển. Server từ chối
khởi động ở chế độ production nếu các tài khoản đó vẫn dùng mật khẩu mẫu.

## Các luồng đã có

- **Khách:** trang giới thiệu, danh mục, tìm kiếm và lọc khóa học, đăng ký học viên.
- **Học viên:** đăng nhập/đăng xuất, hồ sơ và đổi mật khẩu, đăng ký khóa học, học
  theo thứ tự, nội dung Markdown/video/audio, hoàn thành bài học, bài tập, bài thi
  có giờ và lưu nháp, lịch sử kết quả, lộ trình, thông báo.
- **Giáo viên:** quản lý các khóa học của mình, bài học, bài tập và câu hỏi/đáp án;
  xuất bản, chọn câu hỏi vào đề thi; duyệt đăng ký có học phí; theo dõi học viên,
  chấm tự luận và gửi nhận xét; tạo lộ trình có thứ tự khóa học.
- **Admin:** tạo/khóa tài khoản, cấp quyền giáo viên, đặt lại mật khẩu, quản lý
  chương trình và toàn bộ nội dung, xem số liệu thực tế của hệ thống.

Tự đăng ký luôn tạo **học viên**. Giáo viên do admin cấp tài khoản. Quyền sở hữu
khóa học và quyền truy cập nội dung được kiểm tra trên server, không chỉ ẩn menu.

Điểm bài tập và bài thi được chấm trên server. Lượt thi có thời hạn, giới hạn số
lần làm, lưu câu trả lời và khôi phục khi tải lại. Phần tự luận/luyện nói chờ giáo
viên chấm. Khóa có học phí chờ giáo viên duyệt sau khi xác nhận thanh toán thủ công.

## Cấu hình và dữ liệu

Có thể sao chép `.env.example` thành `.env` để cấu hình **SQL Server**; thay mật khẩu
SQL chỉ trên máy của bạn. Các lệnh khởi động và seed đọc file
này bằng chức năng native của Node 24; biến đã export trong tiến trình được ưu tiên.

| Biến            | Mặc định               | Công dụng                              |
| --------------- | ---------------------- | -------------------------------------- |
| `PORT`          | `5000`                 | Cổng API; proxy dev dùng cùng giá trị  |
| `HOST`          | `127.0.0.1`            | Địa chỉ API lắng nghe                  |
| `DATABASE_PATH` | `.data/english.sqlite` | File SQLite, tính từ thư mục chạy lệnh |
| `DB_DRIVER`     | `sqlite`               | `mssql` để sử dụng SQL Server          |
| `DB_SERVER`     | `localhost`            | Máy chạy SQL Server                   |
| `DB_PORT`       | `1433`                 | Cổng TCP của SQL Server                |
| `DB_DATABASE`   | `ELearningEnglish_Demo` | Database SQL đã khởi tạo               |
| `DB_USER`       | `sa`                   | SQL login do bạn cấu hình              |
| `DB_PASSWORD`   | không có               | Điền trên máy, không commit            |
| `NODE_ENV`      | phát triển             | Đặt `production` khi triển khai        |

Chế độ SQLite không cần SQL Server hoặc dịch vụ bên ngoài. Chế độ `mssql` cần SQL
Server đã khởi tạo từ file SQL; kết nối thất bại sẽ dừng, không tự chuyển driver.
Mật khẩu
được băm bằng scrypt có salt; token phiên được lưu dưới dạng hash, có hạn dùng và
có thể thu hồi. Đăng xuất thu hồi phiên; đổi mật khẩu thu hồi các phiên khác.

Giữ `.data/` trên ổ lưu trữ bền vững. Không commit `.env`, `.data`, log, token hoặc
file database vào Git. Để sao lưu khi server đang chạy, dùng SQLite online backup
qua công cụ phù hợp; không chỉ copy riêng file `.sqlite` khi WAL còn hoạt động.

## Kiểm thử

```bash
npm test
npm run build
npm run test:e2e
npm audit
```

API tests dùng database độc lập, kiểm tra phân quyền, đăng ký, tiến độ, chấm điểm,
thời gian thi, lưu nháp, quyền xem đáp án, chấm tự luận và lưu dữ liệu sau khởi động
lại. Browser tests chạy trên desktop và mobile, dùng database tạm riêng; không làm
thay đổi dữ liệu phát triển. Cần build trước browser tests vì chúng kiểm tra bản
production đã biên dịch.

API/browser tests mặc định dùng SQLite tạm; kiểm thử adapter SQL dùng pool mô phỏng.
Chúng không xác nhận kết nối TDS tới SQL Server thật. Dùng `npm run db:check` trên
máy có SQL Server và `.env` phù hợp để kiểm tra kết nối/dữ liệu thực tế.

Trên Linux cloud, Chromium được cung cấp trong dependency kiểm thử, không cần tải
browser từ CDN. Trên Windows/macOS, chạy `npx playwright install chromium` một lần.
Có thể chỉ định `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` cho browser đã cài.

## Chạy bản production

Dùng database mới, không chạy seed demo. Sau `npm ci` và `npm run build`, cung cấp
`ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` qua môi trường an toàn, rồi chạy
`npm run admin:create` đúng một lần. Mật khẩu admin cần ít nhất 12 ký tự. Sau đó
bỏ các biến tạo admin khỏi môi trường vận hành, đặt `NODE_ENV=production` và chạy:

```bash
npm start
```

Server phục vụ cả API và giao diện trong `dist/`. Cấu hình `HOST` phù hợp với reverse
proxy, TLS, ổ dữ liệu và sao lưu của nơi triển khai. Kiểm tra `/api/health`: phải
trả về `success: true` và `database: connected`.

Cloud task đã có môi trường cô lập: dùng checkout hiện tại, không tạo Git worktree
trừ khi người dùng yêu cầu. Khi khôi phục snapshot, file và dependency có thể còn,
nhưng tiến trình phải khởi động lại bằng `npm run dev` hoặc `npm start`.

## Giới hạn hiện tại

Chưa tích hợp cổng thanh toán, email xác minh/khôi phục mật khẩu, tải media lên,
ghi âm trực tiếp, lớp video trực tuyến hay chứng chỉ được công nhận. Luyện nói nhận
link bản ghi hoặc bản chép lời để giáo viên chấm; nối cặp/sắp xếp dùng đáp án văn bản.
Nội dung mẫu cần được giáo viên phát triển thành chương trình hoàn chỉnh.

Không có bước tự động nhập dữ liệu từ SQL Server cũ. Xem
[chi tiết triển khai và phạm vi](docs/IMPLEMENTATION.md). Chưa triển khai lên dịch vụ hosting. Mã nguồn đã sửa được cung cấp trên nhánh
`codex/english-studio` để tải và chạy trên máy.
