import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiPlus,
  HiBookOpen,
  HiPencilSquare,
  HiTrash,
  HiDocumentText,
  HiClipboardDocumentCheck,
  HiPhoto,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import courseApi from "../../api/courseApi";
import programApi from "../../api/programApi";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import Badge from "../../components/common/Badge";
import SearchBar from "../../components/common/SearchBar";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import useAuth from "../../hooks/useAuth";
import {
  COURSE_LEVELS,
  LEVEL_LABELS,
  LEVEL_COLORS,
} from "../../utils/constants";
import { formatCurrency, slugify } from "../../utils/helpers";

const CourseManagement = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const { user } = useAuth();
  const [error, setError] = useState("");
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    program_id: "",
    level: COURSE_LEVELS.BEGINNER,
    description: "",
    thumbnail: "",
    price: 0,
    is_free: 1,
    is_published: 1,
  });

  // Delete dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError("");

    try {
      const [coursesRes, programsRes] = await Promise.all([
        courseApi.getCourses({
          page: 1,
          limit: 100,
          search: search.trim() || undefined,
          program_id: programFilter || undefined,
          teacher_id: user.role === "teacher" ? user.id : undefined,
        }),

        programApi.getPrograms({
          page: 1,
          limit: 100,
        }),
      ]);

      if (!coursesRes?.success || !Array.isArray(coursesRes.data)) {
        throw new Error("Dữ liệu khóa học không hợp lệ");
      }

      if (!programsRes?.success || !Array.isArray(programsRes.data)) {
        throw new Error("Dữ liệu chương trình không hợp lệ");
      }

      setCourses(coursesRes.data);
      setPrograms(programsRes.data);
    } catch (err) {
      setCourses([]);
      setPrograms([]);
      setError(err.message || "Không tải được dữ liệu từ server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [search, programFilter, user?.id, user?.role]);

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormData({
      title: "",
      slug: "",
      program_id: programs[0]?.id || "",
      level: COURSE_LEVELS.BEGINNER,
      description: "",
      thumbnail: "",
      price: 0,
      is_free: 1,
      is_published: 1,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || "",
      slug: course.slug || "",
      program_id: course.program_id || programs[0]?.id || "",
      level: course.level || COURSE_LEVELS.BEGINNER,
      description: course.description || "",
      thumbnail: course.thumbnail || "",
      price: course.price || 0,
      is_free: course.is_free ? 1 : 0,
      is_published: course.is_published ? 1 : 0,
    });
    setModalOpen(true);
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: editingCourse ? prev.slug : slugify(title),
    }));
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tên khóa học!");
      return;
    }

    setFormLoading(true);
    try {
      if (editingCourse) {
        await courseApi.updateCourse(editingCourse.id, formData);
        toast.success("Cập nhật khóa học thành công!");
      } else {
        await courseApi.createCourse(formData);
        toast.success("Tạo khóa học mới thành công!");
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Lỗi khi lưu khóa học");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    setDeleteLoading(true);
    try {
      await courseApi.deleteCourse(courseToDelete.id);
      toast.success("Xóa khóa học thành công!");
      setDeleteConfirmOpen(false);
      setCourseToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Lỗi khi xóa khóa học");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Quản Lý Khóa Học
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Tạo mới, chỉnh sửa nội dung bài giảng và thiết lập bài thi cho từng
            khóa
          </p>
        </div>

        <Button
          variant="primary"
          icon={HiPlus}
          size="sm"
          onClick={handleOpenAdd}
        >
          Tạo khóa học mới
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo tiêu đề khóa học..."
          containerClassName="flex-1 w-full"
        />

        <div className="w-full sm:w-64">
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
          >
            <option value="">Tất cả chương trình</option>
            <option value="">Chưa phân loại</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-red-700">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="mt-2 text-blue-600 font-semibold"
          >
            Thử lại
          </button>
        </div>
      )}
      {/* Course Grid */}
      {loading ? (
        <Loading text="Đang tải danh sách khóa học..." />
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <EmptyState
            title="Chưa có khóa học nào"
            message="Bắt đầu tạo khóa học đầu tiên của Thầy/Cô ngay hôm nay."
            action={
              <Button
                variant="primary"
                size="sm"
                icon={HiPlus}
                onClick={handleOpenAdd}
              >
                Tạo khóa học ngay
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => {
            const program = programs.find((p) => p.id === course.program_id);
            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Thumbnail / Header Banner */}
                <div className="relative h-40 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center text-white overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-80">
                      <HiBookOpen className="w-12 h-12" />
                      <span className="text-xs font-semibold tracking-wider uppercase">
                        {program?.name || "Khóa học tiếng Anh"}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex gap-2">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold shadow-sm ${
                        LEVEL_COLORS[course.level] || "bg-white text-gray-800"
                      }`}
                    >
                      {LEVEL_LABELS[course.level] || course.level}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <Badge
                      variant={course.is_published ? "success" : "gray"}
                      dot
                      size="sm"
                    >
                      {course.is_published ? "Đang mở" : "Bản nháp"}
                    </Badge>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {course.description ||
                        "Chưa có phần giới thiệu chi tiết cho khóa học này."}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      <span className="font-semibold text-gray-800">
                        {course.total_lessons || 0}
                      </span>{" "}
                      bài học
                    </span>
                    <span className="font-bold text-blue-600">
                      {course.is_free
                        ? "Miễn phí"
                        : formatCurrency(course.price)}
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="bg-gray-50/80 px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/teacher/lessons?course_id=${course.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                      title="Quản lý bài học"
                    >
                      <HiDocumentText className="w-3.5 h-3.5" />
                      Bài học
                    </Link>

                    <Link
                      to={`/teacher/exams?course_id=${course.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg transition-colors"
                      title="Quản lý đề thi"
                    >
                      <HiClipboardDocumentCheck className="w-3.5 h-3.5" />
                      Đề thi
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(course)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Chỉnh sửa khóa học"
                    >
                      <HiPencilSquare className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(course)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa khóa học"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Course Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCourse ? "Chỉnh Sửa Khóa Học" : "Tạo Khóa Học Mới"}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={formLoading}
              onClick={handleSaveCourse}
            >
              {editingCourse ? "Lưu cập nhật" : "Tạo khóa học"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveCourse} className="space-y-4">
          <Input
            label="Tiêu đề khóa học"
            value={formData.title}
            onChange={handleTitleChange}
            placeholder="Ví dụ: Luyện thi IELTS 6.5 - Listening & Speaking"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Chương trình đào tạo
              </label>
              <select
                value={formData.program_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    program_id: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
              >
                <option value="">Chưa phân loại</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Trình độ (Level)
              </label>
              <select
                value={formData.level}
                onChange={(e) =>
                  setFormData({ ...formData, level: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
              >
                <option value={COURSE_LEVELS.BEGINNER}>
                  Cơ bản (Beginner)
                </option>
                <option value={COURSE_LEVELS.INTERMEDIATE}>
                  Trung cấp (Intermediate)
                </option>
                <option value={COURSE_LEVELS.ADVANCED}>
                  Nâng cao (Advanced)
                </option>
              </select>
            </div>
          </div>

          <Input
            label="Đường dẫn ảnh bìa (Thumbnail URL)"
            value={formData.thumbnail}
            onChange={(e) =>
              setFormData({ ...formData, thumbnail: e.target.value })
            }
            placeholder="https://example.com/images/course.jpg"
            icon={HiPhoto}
          />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Mô tả chi tiết khóa học
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Giới thiệu nội dung bài học, kết quả đầu ra, yêu cầu đầu vào..."
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Hình thức học phí
              </label>
              <select
                value={formData.is_free}
                onChange={(e) => {
                  const isFree = Number(e.target.value);
                  setFormData({
                    ...formData,
                    is_free: isFree,
                    price: isFree ? 0 : formData.price || 200000,
                  });
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
              >
                <option value={1}>Miễn phí</option>
                <option value={0}>Có phí</option>
              </select>
            </div>

            <div>
              <Input
                label="Học phí (VNĐ)"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                disabled={Boolean(formData.is_free)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Trạng thái hiển thị
              </label>
              <select
                value={formData.is_published}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_published: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
              >
                <option value={1}>Xuất bản (Công khai)</option>
                <option value={0}>Bản nháp (Ẩn)</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Xóa khóa học"
        message={`Bạn có chắc chắn muốn xóa khóa học "${courseToDelete?.title}" không? Tất cả bài học và bài kiểm tra thuộc khóa này sẽ bị xóa theo.`}
        confirmText="Xóa khóa học"
      />
    </div>
  );
};

export default CourseManagement;
