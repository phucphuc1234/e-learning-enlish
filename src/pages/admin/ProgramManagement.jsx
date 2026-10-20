import React, { useState, useEffect } from "react";
import {
  HiPlus,
  HiAcademicCap,
  HiPencilSquare,
  HiTrash,
  HiCheckCircle,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import programApi from "../../api/programApi";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import Badge from "../../components/common/Badge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Loading from "../../components/common/Loading";
import { slugify } from "../../utils/helpers";

const ProgramManagement = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    is_active: 1,
  });

  // Delete dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPrograms = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await programApi.getPrograms({
        page: 1,
        limit: 100,
      });

      if (!res?.success || !Array.isArray(res.data)) {
        throw new Error("Dữ liệu chương trình không hợp lệ");
      }

      setPrograms(res.data);
    } catch (err) {
      setPrograms([]);
      setError(err.message || "Không thể tải chương trình từ máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleOpenAdd = () => {
    setEditingProgram(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      is_active: 1,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (prog) => {
    setEditingProgram(prog);
    setFormData({
      name: prog.name || "",
      slug: prog.slug || "",
      description: prog.description || "",
      is_active: prog.is_active ? 1 : 0,
    });
    setModalOpen(true);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingProgram ? prev.slug : slugify(name),
    }));
  };

  const handleSaveProgram = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên chương trình!");
      return;
    }

    setFormLoading(true);
    try {
      if (editingProgram) {
        await programApi.updateProgram(editingProgram.id, formData);
        toast.success("Cập nhật chương trình thành công!");
      } else {
        await programApi.createProgram(formData);
        toast.success("Thêm chương trình đào tạo mới thành công!");
      }
      setModalOpen(false);
      fetchPrograms();
    } catch (err) {
      toast.error(err.message || "Lỗi khi lưu chương trình");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = (prog) => {
    setProgramToDelete(prog);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!programToDelete) return;
    setDeleteLoading(true);
    try {
      await programApi.deleteProgram(programToDelete.id);
      toast.success("Xóa chương trình đào tạo thành công!");
      setDeleteConfirmOpen(false);
      setProgramToDelete(null);
      fetchPrograms();
    } catch (err) {
      toast.error(err.message || "Lỗi khi xóa chương trình");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Chương Trình Đào Tạo
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Tổ chức các chương trình và nhóm khóa học của hệ thống
          </p>
        </div>

        <Button
          variant="primary"
          icon={HiPlus}
          size="sm"
          onClick={handleOpenAdd}
        >
          Thêm chương trình mới
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={fetchPrograms}
            className="mt-2 text-sm font-semibold text-blue-600"
          >
            Thử tải lại
          </button>
        </div>
      )}

      {loading ? (
        <Loading text="Đang tải danh sách chương trình đào tạo..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs.map((program) => (
            <div
              key={program.id}
              className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-inner">
                      <HiAcademicCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {program.name}
                      </h3>
                      <span className="text-[11px] text-gray-400 font-mono">
                        #{program.slug}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={program.is_active ? "success" : "gray"}
                    dot
                    size="sm"
                  >
                    {program.is_active ? "Kích hoạt" : "Ẩn"}
                  </Badge>
                </div>

                <p className="mt-3.5 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {program.description ||
                    "Chương trình đào tạo chuyên sâu theo chuẩn đầu ra."}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                  <HiCheckCircle className="w-4 h-4 text-emerald-500" />
                  {program.course_count ?? 0} Khóa học trực thuộc
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(program)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Chỉnh sửa"
                  >
                    <HiPencilSquare className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(program)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa chương trình"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Program Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingProgram ? "Chỉnh Sửa Chương Trình" : "Thêm Chương Trình Mới"
        }
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
              onClick={handleSaveProgram}
            >
              {editingProgram ? "Lưu thay đổi" : "Thêm chương trình"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveProgram} className="space-y-4">
          <Input
            label="Tên chương trình"
            value={formData.name}
            onChange={handleNameChange}
            placeholder="Ví dụ: IELTS 7.0, CEFR B2, v.v."
            required
          />

          <Input
            label="Đường dẫn tĩnh (Slug)"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="ielts-7-0"
            required
          />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Mô tả chi tiết chương trình
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Mô tả mục tiêu, đối tượng và chuẩn đầu ra của chương trình..."
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Trạng thái hiển thị
            </label>
            <select
              value={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: Number(e.target.value) })
              }
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
            >
              <option value={1}>Hoạt động / Công khai</option>
              <option value={0}>Tạm dừng / Ẩn</option>
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
        title="Xóa chương trình đào tạo"
        message={`Bạn có chắc chắn muốn xóa chương trình "${programToDelete?.name}" không? Toàn bộ khóa học thuộc chương trình này có thể bị ảnh hưởng.`}
        confirmText="Xóa chương trình"
      />
    </div>
  );
};

export default ProgramManagement;
