import React, { useState, useEffect } from "react";
import {
  HiPlus,
  HiMap,
  HiPencilSquare,
  HiTrash,
  HiClock,
  HiBookOpen,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import learningPathApi from "../../api/learningPathApi";
import programApi from "../../api/programApi";
import courseApi from "../../api/courseApi";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import Badge from "../../components/common/Badge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import {
  COURSE_LEVELS,
  LEVEL_LABELS,
  DEFAULT_PROGRAMS,
} from "../../utils/constants";

const LearningPathManagement = () => {
  const [paths, setPaths] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  useEffect(() => {
    courseApi
      .getCourses({ limit: 200 })
      .then((res) => setCourses(res.data))
      .catch((e) => toast.error(e.message));
  }, []);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPath, setEditingPath] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    program_id: "",
    level: COURSE_LEVELS.BEGINNER,
    estimated_duration: 90,
    description: "",
    is_published: 1,
  });

  // Delete dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pathToDelete, setPathToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pathRes, progRes] = await Promise.allSettled([
        learningPathApi.getLearningPaths(),
        programApi.getPrograms(),
      ]);

      if (progRes.status === "fulfilled") {
        const pList = progRes.value?.data || progRes.value || [];
        if (Array.isArray(pList) && pList.length > 0) {
          setPrograms(pList);
        }
      }

      if (pathRes.status === "fulfilled") {
        const list = pathRes.value?.data || pathRes.value || [];
        setPaths(Array.isArray(list) ? list : list.learning_paths || []);
      } else {
        setPaths([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingPath(null);
    setSelectedCourses([]);
    setFormData({
      title: "",
      program_id: programs[0]?.id || "",
      level: COURSE_LEVELS.BEGINNER,
      estimated_duration: 90,
      description: "",
      is_published: 1,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPath(p);
    setSelectedCourses(p.course_ids || []);
    setFormData({
      title: p.title || "",
      program_id: p.program_id || programs[0]?.id || "",
      level: p.level || COURSE_LEVELS.BEGINNER,
      estimated_duration: p.estimated_duration || 90,
      description: p.description || "",
      is_published: p.is_published ? 1 : 0,
    });
    setModalOpen(true);
  };

  const handleSavePath = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tên lộ trình!");
      return;
    }

    setFormLoading(true);
    try {
      if (editingPath) {
        await learningPathApi.updateLearningPath(editingPath.id, {
          ...formData,
          course_ids: selectedCourses,
        });
        toast.success("Cập nhật lộ trình học thành công!");
      } else {
        await learningPathApi.createLearningPath({
          ...formData,
          course_ids: selectedCourses,
        });
        toast.success("Tạo lộ trình học mới thành công!");
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Lỗi khi lưu lộ trình");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = (p) => {
    setPathToDelete(p);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pathToDelete) return;
    setDeleteLoading(true);
    try {
      await learningPathApi.deleteLearningPath(pathToDelete.id);
      toast.success("Xóa lộ trình thành công!");
      setDeleteConfirmOpen(false);
      setPathToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Lỗi khi xóa lộ trình");
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
            Quản Lý Lộ Trình Học Tập
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Xây dựng các chuỗi khóa học theo mục tiêu đầu ra giúp học viên có
            định hướng rõ ràng
          </p>
        </div>

        <Button
          variant="primary"
          icon={HiPlus}
          size="sm"
          onClick={handleOpenAdd}
        >
          Tạo lộ trình mới
        </Button>
      </div>

      {/* Path List */}
      {loading ? (
        <Loading text="Đang tải danh sách lộ trình..." />
      ) : paths.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <EmptyState
            title="Chưa có lộ trình học nào"
            message="Tạo lộ trình học có định hướng để giúp học viên theo học hiệu quả hơn."
            action={
              <Button
                variant="primary"
                size="sm"
                icon={HiPlus}
                onClick={handleOpenAdd}
              >
                Tạo lộ trình ngay
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paths.map((p) => {
            const prog = programs.find((pr) => pr.id === p.program_id);
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="info" size="sm">
                      {prog?.name || "Chương trình đào tạo"}
                    </Badge>
                    <Badge
                      variant={p.is_published ? "success" : "gray"}
                      dot
                      size="sm"
                    >
                      {p.is_published ? "Công khai" : "Bản nháp"}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-gray-900 text-sm mt-3 line-clamp-2">
                    {p.title}
                  </h3>

                  <p className="mt-2 text-xs text-gray-500 line-clamp-3 leading-relaxed">
                    {p.description || "Chưa có phần giới thiệu chi tiết."}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                    <span className="flex items-center gap-1.5">
                      <HiClock className="w-4 h-4 text-blue-500" />
                      {p.estimated_duration || 90} ngày
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-gray-700">
                      <HiBookOpen className="w-4 h-4 text-emerald-500" />
                      {p.course_count || 0} khóa học
                    </span>
                    <span className="capitalize text-blue-600 font-semibold">
                      {LEVEL_LABELS[p.level] || p.level}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Chỉnh sửa lộ trình"
                  >
                    <HiPencilSquare className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(p)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa lộ trình"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPath ? "Chỉnh Sửa Lộ Trình" : "Tạo Lộ Trình Mới"}
        size="md"
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
              onClick={handleSavePath}
            >
              {editingPath ? "Lưu thay đổi" : "Tạo lộ trình"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSavePath} className="space-y-4">
          <fieldset className="rounded-xl border p-4">
            <legend className="px-2 text-sm font-semibold">
              Khóa học theo thứ tự ({selectedCourses.length})
            </legend>
            <p className="mb-3 text-xs text-slate-500">
              Chọn khóa học theo thứ tự mong muốn. Bỏ chọn và chọn lại để đổi
              thứ tự.
            </p>
            {courses.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedCourses.includes(c.id)}
                  onChange={(e) =>
                    setSelectedCourses(
                      e.target.checked
                        ? [...selectedCourses, c.id]
                        : selectedCourses.filter((id) => id !== c.id),
                    )
                  }
                />
                {selectedCourses.includes(c.id) && (
                  <span className="text-blue-700">
                    {selectedCourses.indexOf(c.id) + 1}.
                  </span>
                )}
                {c.title}
              </label>
            ))}
          </fieldset>
          <Input
            label="Tiêu đề lộ trình học"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Ví dụ: Lộ trình Chinh phục IELTS 6.5 từ con số 0"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Chương trình
              </label>
              <select
                value={formData.program_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    program_id: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-700"
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
                Trình độ yêu cầu
              </label>
              <select
                value={formData.level}
                onChange={(e) =>
                  setFormData({ ...formData, level: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-700"
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
            label="Thời gian hoàn thành ước tính (ngày)"
            type="number"
            value={formData.estimated_duration}
            onChange={(e) =>
              setFormData({
                ...formData,
                estimated_duration: Number(e.target.value),
              })
            }
            required
          />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Mô tả lộ trình học
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Mô tả mục tiêu, lộ trình qua từng giai đoạn..."
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Trạng thái xuất bản
            </label>
            <select
              value={formData.is_published}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  is_published: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-700"
            >
              <option value={1}>Công khai cho học viên</option>
              <option value={0}>Bản nháp (ẩn)</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Xóa lộ trình học"
        message={`Bạn có chắc chắn muốn xóa lộ trình "${pathToDelete?.title}" không?`}
        confirmText="Xóa lộ trình"
      />
    </div>
  );
};

export default LearningPathManagement;
