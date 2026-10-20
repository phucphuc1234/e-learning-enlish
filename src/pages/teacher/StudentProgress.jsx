import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { HiBookOpen, HiEye, HiCheckBadge, HiClock } from "react-icons/hi2";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import SearchBar from "../../components/common/SearchBar";
import Modal from "../../components/common/Modal";
import Loading from "../../components/common/Loading";
import enrollmentApi from "../../api/enrollmentApi";
import courseApi from "../../api/courseApi";
import { formatDate } from "../../utils/helpers";
import { ENROLLMENT_STATUS_LABELS } from "../../utils/constants";

const StudentProgress = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Detail modal
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, eRes] = await Promise.allSettled([
        courseApi.getCourses(),
        enrollmentApi.getEnrollments({
          course_id: selectedCourse || undefined,
        }),
      ]);

      if (cRes.status === "fulfilled") {
        const cList = cRes.value?.data || cRes.value || [];
        setCourses(Array.isArray(cList) ? cList : cList.courses || []);
      }

      if (eRes.status === "fulfilled") {
        const eList = eRes.value?.data || eRes.value || [];
        setEnrollments(Array.isArray(eList) ? eList : eList.enrollments || []);
      } else {
        setEnrollments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCourse]);

  const filteredEnrollments = enrollments.filter((item) => {
    const term = search.toLowerCase();
    const nameMatch = (item.student_name || item.user?.full_name || "")
      .toLowerCase()
      .includes(term);
    const emailMatch = (item.student_email || item.user?.email || "")
      .toLowerCase()
      .includes(term);
    return nameMatch || emailMatch;
  });

  const changeStatus = async (enrollment, status) => {
    try {
      await enrollmentApi.updateEnrollmentStatus(enrollment.id, status);
      setDetailModalOpen(false);
      await fetchData();
      toast.success("Đã cập nhật đăng ký");
    } catch (error) {
      toast.error(error.message);
    }
  };
  const handleOpenDetail = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setDetailModalOpen(true);
  };

  const columns = [
    {
      key: "student",
      header: "Học viên",
      render: (_, row) => (
        <div>
          <p className="font-semibold text-gray-900 text-xs">
            {row.student_name || row.user?.full_name || "Học viên"}
          </p>
          <p className="text-[11px] text-gray-400">
            {row.student_email || row.user?.email || "N/A"}
          </p>
        </div>
      ),
    },
    {
      key: "course",
      header: "Khóa học",
      render: (_, row) => (
        <span className="text-xs text-gray-700 font-medium">
          {row.course_title || row.course?.title || "Khóa học tiếng Anh"}
        </span>
      ),
    },
    {
      key: "progress_percent",
      header: "Tiến độ học tập",
      render: (percent, row) => {
        const val = Math.min(100, Math.round(percent || 0));
        return (
          <div className="w-36">
            <div className="flex justify-between text-[11px] font-medium mb-1">
              <span className="text-gray-600">{val}%</span>
              <span className="text-gray-400">
                {row.lessons_completed || 0}/{row.total_lessons || 0} bài
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${
                  val >= 80
                    ? "bg-emerald-500"
                    : val >= 40
                      ? "bg-blue-600"
                      : "bg-amber-500"
                }`}
                style={{ width: `${val}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "average_score",
      header: "Điểm TB bài thi",
      render: (score) => (
        <span className="text-xs font-bold text-gray-800">
          {score != null ? `${score}/10` : "Chưa có"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (status) => (
        <Badge
          variant={
            status === "completed"
              ? "success"
              : status === "active"
                ? "primary"
                : "gray"
          }
          dot
          size="sm"
        >
          {ENROLLMENT_STATUS_LABELS[status] || status || "Đang học"}
        </Badge>
      ),
    },
    {
      key: "enrolled_at",
      header: "Ngày tham gia",
      render: (date) => formatDate(date),
    },
    {
      key: "actions",
      header: "Chi tiết",
      align: "right",
      render: (_, row) => (
        <div className="flex gap-2">
          {row.status === "pending" && (
            <Button size="sm" onClick={() => changeStatus(row, "active")}>
              Duyệt đăng ký
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            icon={HiEye}
            onClick={() => handleOpenDetail(row)}
          >
            Xem
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Theo Dõi Tiến Độ Học Viên
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Báo cáo chi tiết tiến độ hoàn thành bài giảng và kết quả kiểm tra của
          học sinh
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo tên hoặc email học viên..."
          containerClassName="flex-1 w-full"
        />

        <div className="w-full sm:w-80">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700"
          >
            <option value="">Tất cả các khóa học</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filteredEnrollments}
        loading={loading}
        emptyMessage="Không tìm thấy dữ liệu học viên đăng ký nào"
      />

      {/* Detail Modal */}
      {selectedEnrollment && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Hồ Sơ Học Tập: ${selectedEnrollment.student_name || "Học viên"}`}
          size="md"
          footer={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setDetailModalOpen(false)}
            >
              Đóng lại
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-900">
                  {selectedEnrollment.course_title}
                </p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Đăng ký ngày: {formatDate(selectedEnrollment.enrolled_at)}
                </p>
              </div>
              <Badge
                variant={
                  selectedEnrollment.status === "completed"
                    ? "success"
                    : "primary"
                }
                size="sm"
              >
                {ENROLLMENT_STATUS_LABELS[selectedEnrollment.status] ||
                  "Đang học"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-400">Tiến độ bài học</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {selectedEnrollment.progress_percent}%
                </p>
                <p className="text-[11px] text-gray-500">
                  {selectedEnrollment.lessons_completed || 0}/
                  {selectedEnrollment.total_lessons || 0} bài
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-400">Điểm trung bình</p>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  {selectedEnrollment.average_score == null
                    ? "Chưa có"
                    : `${selectedEnrollment.average_score}/10`}
                </p>
                <p className="text-[11px] text-emerald-600 font-medium">
                  Đạt yêu cầu
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-800 mb-2">
                Nhận xét & Đánh giá năng lực:
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                Học viên duy trì thái độ học tập tích cực, tỷ lệ hoàn thành đúng
                hạn các bài kiểm tra nghe chép chính tả đạt trên 80%. Cần bổ
                sung thêm vốn từ vựng học thuật cho phần kiểm tra giữa kỳ.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StudentProgress;
