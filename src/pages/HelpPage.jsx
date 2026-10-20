import { Link } from "react-router-dom";
export default function HelpPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-14">
      <Link to="/" className="text-blue-700">
        ← Trang chủ
      </Link>
      <h1 className="text-3xl font-bold">Hỗ trợ & thông tin sử dụng</h1>
      <section className="surface space-y-3">
        <h2 className="text-lg font-bold">Bắt đầu học</h2>
        <p>
          Đăng ký tài khoản học viên, chọn khóa học và đăng ký tham gia. Khóa
          miễn phí mở ngay; khóa có học phí cần giáo viên xác nhận trước khi
          truy cập nội dung.
        </p>
        <p>
          Tài khoản giáo viên và quản trị viên được quản trị viên cấp. Nếu quên
          mật khẩu, liên hệ người quản trị đơn vị đào tạo để đặt lại.
        </p>
      </section>
      <section className="surface space-y-3">
        <h2 className="text-lg font-bold">Dữ liệu học tập</h2>
        <p>
          Hệ thống lưu thông tin tài khoản, đăng ký khóa học, tiến độ, bài nộp
          và kết quả. Giáo viên xem dữ liệu học viên trong các khóa học mình phụ
          trách; quản trị viên quản lý dữ liệu toàn hệ thống.
        </p>
        <p>
          Bài trắc nghiệm và điền từ được chấm tự động. Phần viết và luyện nói
          chờ giáo viên chấm. Điểm tại đây là kết quả luyện tập nội bộ, không
          phải chứng chỉ ngoại ngữ.
        </p>
      </section>
      <section className="surface space-y-3">
        <h2 className="text-lg font-bold">Sử dụng có trách nhiệm</h2>
        <p>
          Giữ bí mật mật khẩu, chỉ đăng nội dung bạn có quyền sử dụng và không
          chia sẻ dữ liệu cá nhân của người khác. Chủ website cần công bố chính
          sách học phí, hoàn tiền, quyền riêng tư và đầu mối hỗ trợ trước khi
          cung cấp dịch vụ thương mại.
        </p>
      </section>
    </main>
  );
}
