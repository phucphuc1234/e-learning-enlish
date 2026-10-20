import React, { useState, useEffect } from 'react';
import {
  HiChartBar,
  HiClock,
  HiCheckBadge,
  HiBookOpen,
  HiSparkles,
  HiArrowTrendingUp,
} from 'react-icons/hi2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import Card from '../../components/common/Card';
import StatsCard from '../../components/common/StatsCard';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import reportApi from '../../api/reportApi';
import enrollmentApi from '../../api/enrollmentApi';
import { formatDate } from '../../utils/helpers';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MyProgress = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [enRes, repRes] = await Promise.allSettled([
          enrollmentApi.getEnrollments(),
          reportApi.getReports(),
        ]);

        if (enRes.status === 'fulfilled') {
          const list = enRes.value?.data || enRes.value || [];
          setEnrollments(Array.isArray(list) ? list : list.enrollments || []);
        } else {
          setEnrollments([
            {
              id: 1,
              course_title: 'Luyện thi IELTS 6.5 - Listening & Speaking',
              progress_percent: 75,
              lessons_completed: 18,
              total_lessons: 24,
            },
            {
              id: 2,
              course_title: 'Ngữ pháp & Từ vựng CEFR B2 Trọng tâm',
              progress_percent: 40,
              lessons_completed: 7,
              total_lessons: 18,
            },
          ]);
        }

        if (repRes.status === 'fulfilled') {
          const list = repRes.value?.data || repRes.value || [];
          setReports(Array.isArray(list) ? list : list.reports || []);
        } else {
          setReports([
            {
              id: 1,
              report_type: 'weekly',
              period_start: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
              period_end: new Date().toISOString(),
              total_lessons_completed: 5,
              total_exercises_done: 8,
              average_score: 8.5,
              time_spent: 320,
              strengths: 'Khả năng nghe bắt từ khóa và ngữ âm trọng âm câu cải thiện rõ rệt.',
              weaknesses: 'Cần chú ý lỗi chia thì quá khứ hoàn thành và liên từ phức.',
              recommendations: 'Dành thêm 15 phút mỗi ngày làm bài tập trắc nghiệm ngữ pháp Unit 4.',
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
    return <Loading text="Đang tổng hợp báo cáo tiến độ học tập..." />;
  }

  // Weekly study time chart data
  const weeklyStudyData = {
    labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    datasets: [
      {
        label: 'Thời gian học (phút)',
        data: [45, 60, 30, 80, 50, 90, 75],
        backgroundColor: '#3B82F6',
        borderRadius: 8,
      },
    ],
  };

  // Test score trends chart data
  const scoreTrendData = {
    labels: ['Quiz 1', 'Quiz 2', 'Midterm 1', 'Quiz 3', 'Quiz 4', 'Mock 1'],
    datasets: [
      {
        label: 'Điểm bài thi (%)',
        data: [65, 75, 70, 85, 90, 88],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#10B981',
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Tiến Độ Học Tập & Báo Cáo
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Theo dõi hành trình nâng cao năng lực tiếng Anh, điểm số và nhận xét từ giảng viên
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Tổng giờ học tích lũy"
          value="46.5 giờ"
          icon={HiClock}
          change="+6.2 giờ"
          changeType="increase"
          subtitle="tuần này"
          color="blue"
        />
        <StatsCard
          title="Bài học đã xong"
          value="25 bài"
          icon={HiBookOpen}
          subtitle="trên tổng 42 bài"
          color="green"
        />
        <StatsCard
          title="Điểm kiểm tra TB"
          value="8.2"
          icon={HiChartBar}
          change="+0.5"
          changeType="increase"
          subtitle="xu hướng tăng"
          color="amber"
        />
        <StatsCard
          title="Huy hiệu & Chuỗi ngày"
          value="7 ngày"
          icon={HiSparkles}
          subtitle="Học tập liên tục"
          color="purple"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Thời Lượng Học Trong Tuần"
          subtitle="Số phút học tập mỗi ngày (mục tiêu 45 phút/ngày)"
        >
          <div className="h-64">
            <Bar
              data={weeklyStudyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                  x: { grid: { display: false } },
                },
              }}
            />
          </div>
        </Card>

        <Card
          title="Xu Hướng Điểm Kiểm Tra"
          subtitle="Điểm số bài thi cải thiện qua từng tuần"
        >
          <div className="h-64">
            <Line
              data={scoreTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { min: 40, max: 100, grid: { color: '#f3f4f6' } },
                  x: { grid: { display: false } },
                },
              }}
            />
          </div>
        </Card>
      </div>

      {/* Course breakdown progress */}
      <Card
        title="Tiến Độ Từng Khóa Học"
        subtitle="Chi tiết tỷ lệ hoàn thành theo khóa bạn đã ghi danh"
      >
        <div className="space-y-4">
          {enrollments.map((en) => (
            <div
              key={en.id}
              className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">
                  {en.course_title}
                </h4>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Hoàn thành: {en.progress_percent || 0}%</span>
                  <span>
                    {en.lessons_completed || 0}/{en.total_lessons || 20} bài
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${en.progress_percent || 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Periodic AI & Teacher Academic Reports */}
      <Card
        title="Báo Cáo Học Thuật Định Kỳ"
        subtitle="Phân tích điểm mạnh, điểm yếu và lời khuyên phát triển từ chuyên gia"
      >
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-5 rounded-2xl border border-blue-100 bg-blue-50/30 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="purple" size="sm">
                    Báo cáo tuần
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatDate(report.period_start)} - {formatDate(report.period_end)}
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-700">
                  Điểm TB: {report.average_score}/10
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
                  <p className="font-bold text-emerald-800 mb-1 flex items-center gap-1.5">
                    <HiCheckBadge className="w-4 h-4 text-emerald-600" /> Điểm mạnh đã đạt:
                  </p>
                  <p className="text-gray-600 leading-relaxed">{report.strengths}</p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-amber-100">
                  <p className="font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                    <HiArrowTrendingUp className="w-4 h-4 text-amber-600" /> Điểm cần cải thiện:
                  </p>
                  <p className="text-gray-600 leading-relaxed">{report.weaknesses}</p>
                </div>
              </div>

              {report.recommendations && (
                <div className="bg-white p-3.5 rounded-xl border border-blue-100 text-xs">
                  <p className="font-bold text-blue-800 mb-1">
                    Gợi ý lộ trình tiếp theo:
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    {report.recommendations}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default MyProgress;
