import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-medium text-gray-700">
              © {new Date().getFullYear()} Hệ Thống E-Learning Tiếng Anh. Toàn bộ quyền được bảo lưu.
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Phát triển theo chuẩn CEFR & Khung năng lực ngoại ngữ 6 bậc Việt Nam.
            </p>
          </div>
          <div className="flex items-center gap-6 text-gray-500 text-xs">
            <span className="hover:text-blue-600 cursor-pointer">Điều khoản sử dụng</span>
            <span className="hover:text-blue-600 cursor-pointer">Chính sách bảo mật</span>
            <span className="hover:text-blue-600 cursor-pointer">Hỗ trợ kỹ thuật</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
