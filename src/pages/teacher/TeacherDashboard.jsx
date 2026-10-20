import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HiBookOpen,
  HiUserGroup,
  HiClipboardDocumentCheck,
  HiPlus,
  HiChartBar,
  HiArrowRight,
  HiEye,
} from "react-icons/hi2";
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
  ArcElement,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import StatsCard from "../../components/common/StatsCard";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import Badge from "../../components/common/Badge";
import dashboardApi from "../../api/dashboardApi";
import courseApi from "../../api/courseApi";
import { LEVEL_LABELS, LEVEL_COLORS } from "../../utils/constants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
);

const TeacherDashboard = () => {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, courseRes] = await Promise.allSettled([
          dashboardApi.getTeacherStats(),
          courseApi.getCourses({ limit: 4 }),
        ]);

        if (dashRes.status === "fulfilled") {
          setStats(dashRes.value?.data || dashRes.value);
        } else {
          setStats({});
        }

        if (courseRes.status === "fulfilled") {
          const list = courseRes.value?.data || courseRes.value || [];
          setCourses(Array.isArray(list) ? list : list.courses || []);
        } else {
          setCourses([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loading text="Đang tải dữ liệu giảng viên..." />;
  }

  const lineChartData = {
    labels: stats?.weeklySubmissions?.map((w) => w.day) || [
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
      "CN",
    ],
    datasets: [
      {
        label: "Bài nộp trong ngày",
        data: stats?.weeklySubmissions?.map((w) => w.count) || [
          0, 0, 0, 0, 0, 0, 0,
        ],
        borderColor: "#2563EB",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        tension: 0.35,
        fill: true,
        pointBackgroundColor: "#2563EB",
      },
    ],
  };

  const doughnutData = {
    labels: [
      "Xuất sắc (>=8.0)",
      "Khá (6.5 - 7.9)",
      "Trung bình (5.0 - 6.4)",
      "Cần cố gắng (<5.0)",
    ],
    datasets: [
      {
        data: [
          stats?.scoreDistribution?.excellent ?? 0,
          stats?.scoreDistribution?.good ?? 0,
          stats?.scoreDistribution?.average ?? 0,
          stats?.scoreDistribution?.below ?? 0,
        ],
        backgroundColor: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Tổng Quan Giảng Dạy
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Chào mừng Thầy/Cô, theo dõi tình hình học tập và quản lý lớp học tại
            đây
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/teacher/courses">
            <Button variant="primary" size="sm" icon={HiPlus}>
              Tạo khóa học mới
            </Button>
          </Link>
          <Link to="/teacher/exams">
            <Button variant="outline" size="sm" icon={HiClipboardDocumentCheck}>
              Tạo bài kiểm tra
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Khóa học đang dạy"
          value={stats?.totalCourses ?? 0}
          icon={HiBookOpen}
          changeType="increase"
          subtitle="học kỳ hiện tại"
          color="blue"
        />
        <StatsCard
          title="Học viên theo học"
          value={stats?.totalStudents ?? 0}
          icon={HiUserGroup}
          changeType="increase"
          subtitle="tuần này"
          color="green"
        />
        <StatsCard
          title="Bài thi đã tạo"
          value={stats?.totalExams ?? 0}
          icon={HiClipboardDocumentCheck}
          subtitle="gồm kiểm tra & thi thử"
          color="purple"
        />
        <StatsCard
          title="Tỷ lệ đạt chuẩn"
          value={stats?.averagePassRate ?? "0%"}
          icon={HiChartBar}
          changeType="increase"
          subtitle="trên các bài đã chấm"
          color="amber"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Lượng Bài Nộp Hàng Ngày"
          subtitle="Số lượt học viên hoàn thành bài tập / bài thi trong tuần"
          className="lg:col-span-2"
        >
          <div className="h-72">
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: "#f3f4f6" },
                  },
                  x: {
                    grid: { display: false },
                  },
                },
              }}
            />
          </div>
        </Card>

        <Card
          title="Phổ Điểm Học Viên"
          subtitle="Tỷ lệ kết quả kiểm tra gần nhất"
        >
          <div className="h-56 flex items-center justify-center">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { boxWidth: 10, font: { size: 10 } },
                  },
                },
                cutout: "65%",
              }}
            />
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <Link
              to="/teacher/progress"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
            >
              Xem chi tiết tiến độ học viên &rarr;
            </Link>
          </div>
        </Card>
      </div>

      {/* Courses List Section */}
      <Card
        title="Khóa Học Của Thầy/Cô"
        subtitle="Danh sách các khóa học phụ trách gần đây"
        action={
          <Link
            to="/teacher/courses"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
          >
            Quản lý tất cả khóa học <HiArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <div className="divide-y divide-gray-100">
          {courses.map((course) => (
            <div
              key={course.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 rounded-xl px-2 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <HiBookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">
                    {course.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                        LEVEL_COLORS[course.level] ||
                        "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {LEVEL_LABELS[course.level] || course.level}
                    </span>
                    <span className="text-[11px] text-gray-400">•</span>
                    <span className="text-[11px] text-gray-500">
                      {course.total_lessons || 0} bài học
                    </span>
                    <span className="text-[11px] text-gray-400">•</span>
                    <span className="text-[11px] text-gray-500">
                      {course.student_count || 0} học viên
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Badge
                  variant={course.is_published ? "success" : "gray"}
                  dot
                  size="sm"
                >
                  {course.is_published ? "Đang mở" : "Bản nháp"}
                </Badge>
                <Link to={`/teacher/lessons?course_id=${course.id}`}>
                  <Button variant="outline" size="sm" icon={HiEye}>
                    Bài học
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
