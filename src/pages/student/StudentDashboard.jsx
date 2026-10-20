import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiBookOpen,
  HiClock,
  HiClipboardDocumentCheck,
  HiArrowRight,
  HiPlay,
  HiBell,
  HiAcademicCap,
} from 'react-icons/hi2';
import useAuth from '../../hooks/useAuth';
import StatsCard from '../../components/common/StatsCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import enrollmentApi from '../../api/enrollmentApi';
import examApi from '../../api/examApi';
import notificationApi from '../../api/notificationApi';
import { formatDuration } from '../../utils/helpers';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enRes, exRes, notifRes] = await Promise.allSettled([
          enrollmentApi.getEnrollments(),
          examApi.getExams({ limit: 3 }),
          notificationApi.getNotifications({ limit: 3 }),
        ]);

        if (enRes.status === 'fulfilled') {
          const list = enRes.value?.data || enRes.value || [];
          setEnrollments(Array.isArray(list) ? list : list.enrollments || []);
        } else {
          // Mock enrolled courses
          setEnrollments([
            {
              id: 1,
              course_id: 1,
              course_title: 'Luyện thi IELTS 6.5 - Listening & Speaking',
              thumbnail: '',
              level: 'intermediate',
              progress_percent: 65,
              lessons_completed: 15,
              total_lessons: 24,
              last_lesson_id: 1,
              last_lesson_title: 'Bài 1: Kỹ năng nghe chép chính tả số và địa chỉ',
            },
            {
              id: 2,
              course_id: 2,
              course_title: 'Ngữ pháp & Từ vựng CEFR B2 Trọng tâm',
              thumbnail: '',
              level: 'intermediate',
              progress_percent: 30,
              lessons_completed: 6,
              total_lessons: 18,
              last_lesson_id: 2,
              last_lesson_title: 'Bài 6: Cấu trúc câu điều kiện hỗn hợp Mixed Conditionals',
            },
          ]);
        }

        if (exRes.status === 'fulfilled') {
          const list = exRes.value?.data || exRes.value || [];
          setUpcomingExams(Array.isArray(list) ? list : list.exams || []);
        } else {
          setUpcomingExams([
            {
              id: 1,
              title: 'IELTS Mock Test Listening - Test 1',
              time_limit: 40,
              total_questions: 40,
              due_date: '20:00 Hôm nay',
            },
            {
              id: 2,
              title: 'Mini Quiz Kiểm Tra Từ Vựng Tuần 3',
              time_limit: 15,
              total_questions: 15,
              due_date: 'Ngày mai',
            },
          ]);
        }

        if (notifRes.status === 'fulfilled') {
          const list = notifRes.value?.data || notifRes.value || [];
          setRecentNotifications(Array.isArray(list) ? list : list.notifications || []);
        } else {
          setRecentNotifications([
            {
              id: 1,
              title: 'Bài tập mới đã được giao',
              message: 'Giáo viên vừa thêm bài tập phần Maps & Plan cho bài học 2.',
              created_at: '1 giờ trước',
            },
            {
              id: 2,
              title: 'Kết quả bài kiểm tra Mini Quiz 1',
              message: 'Chúc mừng bạn đã đạt 9/10 điểm trong bài thi tuần vừa rồi.',
              created_at: '1 ngày trước',
            },
          ]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loading text="Đang tải dữ liệu bàn học của bạn..." />;
  }

  const activeCourse = enrollments[0];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <Badge variant="warning" size="sm" className="bg-amber-400 text-amber-950 font-bold mb-3 border-none">
            Mục tiêu học tập hôm nay: 45 phút
          </Badge>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            Chào mừng trở lại, {user?.full_name || 'Học viên'}!
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-blue-100 leading-relaxed">
            Hôm nay là thời điểm lý tưởng để nâng cao vốn từ vựng và luyện phản xạ nghe tiếng Anh. Hãy tiếp tục duy trì chuỗi học tập đều đặn nhé!
          </p>

          {activeCourse && (
            <div className="mt-5 flex items-center gap-3">
              <Link to={`/student/lesson/${activeCourse.last_lesson_id || 1}`}>
                <Button
                  variant="secondary"
                  size="md"
                  icon={HiPlay}
                  className="bg-white text-blue-600 hover:bg-blue-50 font-bold shadow-md"
                >
                  Tiếp tục học ngay
                </Button>
              </Link>
              <span className="text-xs text-blue-200">
                Khóa: {activeCourse.course_title}
              </span>
            </div>
          )}
        </div>

        {/* Decorative circle graphic */}
        <div className="absolute -right-8 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Khóa học đang theo"
          value={enrollments.length}
          icon={HiBookOpen}
          subtitle="đang duy trì tiến độ"
          color="blue"
        />
        <StatsCard
          title="Tổng thời gian học"
          value="38 giờ"
          icon={HiClock}
          change="+3.5 giờ"
          changeType="increase"
          subtitle="trong tuần này"
          color="green"
        />
        <StatsCard
          title="Bài kiểm tra đã nộp"
          value="12 bài"
          icon={HiClipboardDocumentCheck}
          subtitle="tỷ lệ qua 88%"
          color="purple"
        />
        <StatsCard
          title="Điểm kiểm tra TB"
          value="8.4"
          icon={HiAcademicCap}
          change="+0.6"
          changeType="increase"
          subtitle="thang điểm 10"
          color="amber"
        />
      </div>

      {/* Main Enrolled Courses Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Khóa Học Của Tôi ({enrollments.length})
          </h2>
          <Link
            to="/student/courses"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            Khám phá thêm khóa học <HiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {enrollments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <EmptyState
              title="Bạn chưa đăng ký khóa học nào"
              message="Khám phá ngay danh mục khóa học chuẩn CEFR, IELTS để bắt đầu hành trình học tập."
              action={
                <Link to="/student/courses">
                  <Button variant="primary" size="sm">
                    Xem danh sách khóa học
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {enrollments.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="primary" size="sm">
                      Tiến độ: {item.progress_percent}%
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {item.lessons_completed || 0}/{item.total_lessons || 24} bài học
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-sm mt-3 line-clamp-1">
                    {item.course_title}
                  </h3>

                  {item.last_lesson_title && (
                    <p className="mt-1 text-xs text-gray-500 line-clamp-1">
                      Đang học: {item.last_lesson_title}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mt-4 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.progress_percent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <Link
                    to={`/student/course/${item.course_id}`}
                    className="text-xs text-gray-500 hover:text-blue-600 font-medium"
                  >
                    Xem giáo trình
                  </Link>

                  <Link to={`/student/lesson/${item.last_lesson_id || 1}`}>
                    <Button variant="primary" size="sm" icon={HiPlay}>
                      Học tiếp
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two columns: Upcoming Exams & Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <Card
          title="Bài Kiểm Tra Cần Hoàn Thành"
          subtitle="Danh sách bài Quiz và Mock Test được giao"
        >
          <div className="divide-y divide-gray-100">
            {upcomingExams.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">
                Không có bài kiểm tra nào sắp tới
              </p>
            ) : (
              upcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  className="py-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <HiClipboardDocumentCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{exam.title}</p>
                      <div className="flex items-center gap-2 text-gray-400 mt-0.5 text-[11px]">
                        <span>{formatDuration(exam.time_limit)}</span>
                        <span>•</span>
                        <span>{exam.total_questions || 30} câu hỏi</span>
                      </div>
                    </div>
                  </div>

                  <Link to={`/student/exam/${exam.id}`}>
                    <Button variant="outline" size="sm">
                      Vào thi
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Notifications */}
        <Card
          title="Thông Báo Mới"
          subtitle="Cập nhật bài tập và kết quả chấm điểm"
          action={
            <Link
              to="/student/notifications"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Xem tất cả
            </Link>
          }
        >
          <div className="divide-y divide-gray-100">
            {recentNotifications.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">
                Chưa có thông báo mới nào
              </p>
            ) : (
              recentNotifications.map((notif) => (
                <div key={notif.id} className="py-3.5 flex items-start gap-3 text-xs">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                    <HiBell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{notif.title}</p>
                    <p className="text-gray-500 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {notif.created_at || 'Gần đây'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
