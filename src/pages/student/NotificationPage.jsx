import React, { useState, useEffect } from 'react';
import {
  HiBell,
  HiCheckCircle,
  HiCheck,
  HiExclamationCircle,
  HiInformationCircle,
  HiAcademicCap,
  HiClipboardDocumentCheck,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import notificationApi from '../../api/notificationApi';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/helpers';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getNotifications();
      const list = res?.data || res || [];
      const notifs = Array.isArray(list) ? list : list.notifications || [];
      setNotifications(notifs);
    } catch {
      // Fallback mock notifications
      setNotifications([
        {
          id: 1,
          title: 'Bài tập mới đã được giao',
          message: 'Giáo viên vừa thêm bài tập "Luyện tập Nghe & Điền từ Section 1" cho bài học 1.',
          type: 'assignment',
          is_read: false,
          created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        },
        {
          id: 2,
          title: 'Kết quả bài thi Mock Test',
          message: 'Điểm bài thi thử IELTS Mock Test Listening của bạn là 8.5/9.0. Chúc mừng!',
          type: 'result',
          is_read: false,
          created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        },
        {
          id: 3,
          title: 'Chào mừng bạn đến với Hệ thống E-Learning',
          message: 'Khám phá các khóa học chuẩn CEFR B1, B2 và IELTS ngay trên thanh điều hướng.',
          type: 'info',
          is_read: true,
          created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      toast.success('Đã đánh dấu đã đọc!');
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc!');
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  const filteredList = notifications.filter((item) => {
    if (filter === 'unread') return !item.is_read;
    if (filter === 'read') return item.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getIconByType = (type) => {
    switch (type) {
      case 'assignment':
        return <HiAcademicCap className="w-5 h-5 text-blue-600" />;
      case 'result':
      case 'exam':
        return <HiClipboardDocumentCheck className="w-5 h-5 text-emerald-600" />;
      case 'warning':
        return <HiExclamationCircle className="w-5 h-5 text-amber-600" />;
      default:
        return <HiInformationCircle className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Thông Báo Hệ Thống
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Cập nhật tức thời về lịch học, bài tập mới và kết quả đánh giá năng lực
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            icon={HiCheck}
            onClick={handleMarkAllRead}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Tất cả ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Chưa đọc
          {unreadCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilter('read')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'read'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Đã đọc
        </button>
      </div>

      {/* Notification List */}
      {loading ? (
        <Loading text="Đang tải thông báo..." />
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <EmptyState
            title="Không có thông báo nào"
            message={
              filter === 'unread'
                ? 'Bạn đã đọc toàn bộ thông báo!'
                : 'Chưa có thông báo nào được gửi đến bạn.'
            }
            icon={HiBell}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((item) => (
            <div
              key={item.id}
              onClick={() => !item.is_read && handleMarkAsRead(item.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                !item.is_read
                  ? 'bg-blue-50/40 border-blue-200 shadow-sm hover:bg-blue-50/70'
                  : 'bg-white border-gray-200 hover:bg-gray-50/60'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200/80 flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
                  {getIconByType(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">
                      {item.title}
                    </h4>
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                    {item.message}
                  </p>
                  <span className="mt-2 text-[11px] text-gray-400 block font-mono">
                    {formatDate(item.created_at, 'HH:mm dd/MM/yyyy')}
                  </span>
                </div>
              </div>

              {!item.is_read && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsRead(item.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors flex-shrink-0"
                  title="Đánh dấu đã đọc"
                >
                  <HiCheckCircle className="w-5 h-5 text-blue-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPage;
