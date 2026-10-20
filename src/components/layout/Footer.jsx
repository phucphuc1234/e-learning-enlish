import { Link } from "react-router-dom";
export default function Footer() {
  return (
    <footer className="flex flex-wrap justify-between gap-3 border-t border-slate-200 py-5 text-xs text-slate-400">
      <span>
        © {new Date().getFullYear()} English studio. Học tập, mỗi ngày.
      </span>
      <Link to="/help" className="hover:text-blue-700">
        Hỗ trợ & thông tin sử dụng
      </Link>
    </footer>
  );
}
