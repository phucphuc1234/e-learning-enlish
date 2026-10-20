import React from "react";
import { NavLink } from "react-router-dom";
import {
  HiChartBar,
  HiUsers,
  HiAcademicCap,
  HiBookOpen,
  HiDocumentText,
  HiPencilSquare,
  HiClipboardDocumentCheck,
  HiUserGroup,
  HiMap,
  HiHome,
  HiChartPie,
  HiBell,
  HiXMark,
} from "react-icons/hi2";
import useAuth from "../../hooks/useAuth";
import { USER_ROLES } from "../../utils/constants";

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role;

  const adminMenu = [
    { name: "Bảng điều khiển", path: "/admin/dashboard", icon: HiChartBar },
    { name: "Quản lý người dùng", path: "/admin/users", icon: HiUsers },
    {
      name: "Chương trình đào tạo",
      path: "/admin/programs",
      icon: HiAcademicCap,
    },
  ];

  const teacherMenu = [
    {
      name: "Tổng quan giảng dạy",
      path: "/teacher/dashboard",
      icon: HiChartBar,
    },
    { name: "Quản lý khóa học", path: "/teacher/courses", icon: HiBookOpen },
    { name: "Quản lý bài học", path: "/teacher/lessons", icon: HiDocumentText },
    {
      name: "Quản lý bài tập",
      path: "/teacher/exercises",
      icon: HiPencilSquare,
    },
    {
      name: "Quản lý bài kiểm tra",
      path: "/teacher/exams",
      icon: HiClipboardDocumentCheck,
    },
    { name: "Tiến độ học viên", path: "/teacher/progress", icon: HiUserGroup },
    {
      name: "Bài nộp & chấm điểm",
      path: "/teacher/submissions",
      icon: HiClipboardDocumentCheck,
    },
    { name: "Lộ trình học tập", path: "/teacher/learning-paths", icon: HiMap },
  ];

  const studentMenu = [
    { name: "Bàn học của tôi", path: "/student/dashboard", icon: HiHome },
    { name: "Khám phá khóa học", path: "/student/courses", icon: HiBookOpen },
    { name: "Lộ trình học tập", path: "/student/learning-paths", icon: HiMap },
    { name: "Tiến độ & Kết quả", path: "/student/progress", icon: HiChartPie },
    {
      name: "Lịch sử bài tập",
      path: "/student/exercise-history",
      icon: HiClipboardDocumentCheck,
    },
    { name: "Thông báo", path: "/student/notifications", icon: HiBell },
  ];

  let menuItems = studentMenu;
  let roleTitle = "Khu vực Học viên";

  if (role === USER_ROLES.ADMIN) {
    menuItems = [
      ...adminMenu,
      ...teacherMenu.filter((item) => item.path !== "/teacher/dashboard"),
    ];
    roleTitle = "Khu vực Quản trị";
  } else if (role === USER_ROLES.TEACHER) {
    menuItems = teacherMenu;
    roleTitle = "Khu vực Giảng viên";
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header (Mobile close button) */}
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-6 lg:hidden">
          <span className="text-sm font-semibold text-gray-900">
            Danh mục chức năng
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <HiXMark className="h-6 w-6" />
          </button>
        </div>

        {/* Section title */}
        <div className="px-6 pt-5 pb-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            {roleTitle}
          </p>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1.5 px-3 py-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold"
                      : "text-gray-600 hover:bg-blue-50/60 hover:text-blue-600"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`h-5 w-5 transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-gray-400 group-hover:text-blue-600"
                      }`}
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="border-t border-gray-100 p-4">
          <div className="rounded-xl bg-blue-50/60 p-3 text-center border border-blue-100/60">
            <NavLink to="/help" className="text-xs font-semibold text-blue-900">
              Cần trợ giúp học tập?
            </NavLink>
            <p className="mt-1 text-[11px] text-blue-700/80">
              Xem hướng dẫn sử dụng hệ thống
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
