import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiBars3,
  HiBell,
  HiArrowRightOnRectangle,
  HiUser,
  HiCheckCircle,
  HiExclamationCircle,
  HiAcademicCap,
} from 'react-icons/hi2';
import useAuth from '../../hooks/useAuth';
import { getInitials } from '../../utils/helpers';
import { ROLE_LABELS } from '../../utils/constants';
import notificationApi from '../../api/notificationApi';

const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  // Fetch notifications
  useEffect(() => {
    let isMounted = true;
    const fetchNotifs = async () => {
      try {
        const res = await notificationApi.getNotifications({ limit: 5 });
        if (isMounted) {
          const list = res?.data || res || [];
          const notifs = Array.isArray(list) ? list : list.notifications || [];
          setNotifications(notifs);
          setUnreadCount(notifs.filter((n) => !n.is_read).length);
        }
      } catch {
        // Fallback or empty if not implemented yet
      }
    };

    if (user) {
      fetchNotifs();
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setNotificationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/95 px-4 sm:px-6 backdrop-blur transition-all">
      {/* Left section: Toggle button & Logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
          title="Thu gọn menu"
        >
          <HiBars3 className="h-6 w-6" />
        </button>

        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <HiAcademicCap className="h-6 w-6" />
          </div>
          <div className="hidden sm:block">
            <span className="text-base font-bold tracking-tight text-gray-900 block leading-tight">
              E-Learning <span className="text-blue-600">English</span>
            </span>
            <span className="text-[10px] font-medium text-gray-400 block tracking-wider uppercase">
              Luyện thi & Đào tạo chuẩn Quốc tế
            </span>
          </div>
        </Link>
      </div>

      {/* Right section: Notifications & User profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={() => setNotificationDropdownOpen((prev) => !prev)}
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors focus:outline-none"
            title="Thông báo"
          >
            <HiBell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white py-2 shadow-xl ring-1 ring-black/5 animate-fade-in border border-gray-100 z-50">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <span className="text-sm font-semibold text-gray-900">Thông báo</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">
                    Không có thông báo mới nào
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 text-sm transition-colors hover:bg-gray-50 ${
                        !n.is_read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {n.type === 'success' || n.type === 'result' ? (
                          <HiCheckCircle className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <HiExclamationCircle className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-900">{n.title}</p>
                        <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gray-100 px-4 py-2 text-center">
                <Link
                  to="/student/notifications"
                  onClick={() => setNotificationDropdownOpen(false)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Xem tất cả thông báo &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-full p-1 sm:px-2.5 sm:py-1 hover:bg-gray-100 transition-colors focus:outline-none"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.full_name}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-blue-500/30"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
                {getInitials(user?.full_name)}
              </div>
            )}
            <div className="hidden text-left sm:block">
              <span className="block text-xs font-semibold text-gray-800 leading-tight">
                {user?.full_name || 'Người dùng'}
              </span>
              <span className="block text-[11px] text-gray-500 leading-tight">
                {ROLE_LABELS[user?.role] || user?.role || 'Học viên'}
              </span>
            </div>
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white py-1.5 shadow-xl ring-1 ring-black/5 animate-fade-in border border-gray-100 z-50">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-xs font-semibold text-gray-900 truncate">{user?.full_name}</p>
                <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <HiUser className="h-4 w-4 text-gray-400" />
                  Hồ sơ cá nhân
                </Link>
              </div>

              <div className="border-t border-gray-100 py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <HiArrowRightOnRectangle className="h-4 w-4 text-red-500" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
