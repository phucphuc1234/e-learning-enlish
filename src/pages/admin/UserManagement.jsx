import React, { useState, useEffect } from "react";
import { HiPlus, HiPencilSquare, HiTrash, HiUserCircle } from "react-icons/hi2";
import toast from "react-hot-toast";
import userApi from "../../api/userApi";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import Badge from "../../components/common/Badge";
import SearchBar from "../../components/common/SearchBar";
import Pagination from "../../components/common/Pagination";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { USER_ROLES, ROLE_LABELS } from "../../utils/constants";
import { formatDate } from "../../utils/helpers";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: USER_ROLES.STUDENT,
    is_active: 1,
  });

  // Delete confirm dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await userApi.getUsers({
        page: currentPage,
        limit: 10,
        search,
        role: roleFilter || undefined,
      });

      if (!res?.success || !Array.isArray(res.data)) {
        throw new Error("Dữ liệu người dùng không hợp lệ");
      }

      setUsers(res.data);
      setTotalPages(res.pagination?.totalPages ?? 1);
      setTotalItems(res.pagination?.total ?? res.data.length);
    } catch (err) {
      setUsers([]);
      setTotalPages(1);
      setTotalItems(0);
      setError(err.message || "Không tải được danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search, roleFilter]);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      password: "",
      role: USER_ROLES.STUDENT,
      is_active: 1,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "", // Leave blank unless updating
      role: user.role || USER_ROLES.STUDENT,
      is_active: user.is_active ? 1 : 0,
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim()) {
      toast.error("Vui lòng điền đầy đủ họ tên và email!");
      return;
    }

    setFormLoading(true);
    try {
      if (editingUser) {
        await userApi.updateUser(editingUser.id, formData);
        toast.success("Cập nhật người dùng thành công!");
      } else {
        if (!formData.password) {
          toast.error("Vui lòng nhập mật khẩu cho tài khoản mới!");
          setFormLoading(false);
          return;
        }
        await userApi.createUser(formData);
        toast.success("Tạo tài khoản người dùng mới thành công!");
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Lỗi khi lưu thông tin người dùng");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    try {
      await userApi.deleteUser(userToDelete.id);
      toast.success("Đã xóa người dùng thành công!");
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Lỗi khi xóa người dùng");
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: "full_name",
      header: "Người dùng",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
            {row.full_name ? (
              row.full_name.charAt(0)
            ) : (
              <HiUserCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-xs">
              {row.full_name}
            </p>
            <p className="text-[11px] text-gray-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Vai trò",
      render: (role) => {
        const variants = {
          admin: "purple",
          teacher: "info",
          student: "primary",
        };
        return (
          <Badge variant={variants[role] || "gray"} size="sm">
            {ROLE_LABELS[role] || role}
          </Badge>
        );
      },
    },
    {
      key: "phone",
      header: "Số điện thoại",
      render: (phone) =>
        phone || <span className="text-gray-400 italic">Chưa cập nhật</span>,
    },
    {
      key: "is_active",
      header: "Trạng thái",
      render: (isActive) => (
        <Badge variant={isActive ? "success" : "danger"} dot size="sm">
          {isActive ? "Hoạt động" : "Tạm khóa"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Ngày tạo",
      render: (date) => formatDate(date),
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEditModal(row)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Chỉnh sửa"
          >
            <HiPencilSquare className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteClick(row)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa người dùng"
          >
            <HiTrash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Quản Lý Người Dùng
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Quản lý danh sách học viên, giảng viên và phân quyền trong hệ thống
          </p>
        </div>

        <Button
          variant="primary"
          icon={HiPlus}
          size="sm"
          onClick={handleOpenAddModal}
        >
          Thêm người dùng mới
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <SearchBar
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Tìm theo tên, email..."
          containerClassName="flex-1 w-full"
        />

        <div className="w-full sm:w-56">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
          >
            <option value="">Tất cả vai trò</option>
            <option value={USER_ROLES.STUDENT}>Học viên</option>
            <option value={USER_ROLES.TEACHER}>Giáo viên</option>
            <option value={USER_ROLES.ADMIN}>Quản trị viên</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchUsers}
            className="mt-2 text-sm text-blue-600 font-semibold"
          >
            Thử tải lại
          </button>
        </div>
      )}

      {/* Users Table */}
      <Table
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="Không tìm thấy người dùng phù hợp với tiêu chí tìm kiếm"
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
      />

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? "Chỉnh Sửa Người Dùng" : "Thêm Người Dùng Mới"}
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
              onClick={handleFormSubmit}
            >
              {editingUser ? "Lưu thay đổi" : "Tạo người dùng"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Họ và tên"
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
            placeholder="Nhập họ và tên..."
            required
          />

          <Input
            label="Địa chỉ Email"
            disabled={Boolean(editingUser)}
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="name@example.com"
            required
          />

          <Input
            label="Số điện thoại"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="0912345678"
          />

          <Input
            label={
              editingUser
                ? "Mật khẩu mới (bỏ trống nếu giữ nguyên)"
                : "Mật khẩu"
            }
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="••••••••"
            required={!editingUser}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Vai trò hệ thống
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
              >
                <option value={USER_ROLES.STUDENT}>Học viên</option>
                <option value={USER_ROLES.TEACHER}>Giáo viên</option>
                <option value={USER_ROLES.ADMIN}>Quản trị viên</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Trạng thái tài khoản
              </label>
              <select
                value={formData.is_active}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_active: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
              >
                <option value={1}>Hoạt động</option>
                <option value={0}>Tạm khóa</option>
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
        title="Xóa người dùng"
        message={`Bạn có chắc chắn muốn xóa tài khoản "${userToDelete?.full_name}" (${userToDelete?.email}) không? Dữ liệu tiến độ và kết quả liên quan sẽ bị ảnh hưởng.`}
        confirmText="Xóa vĩnh viễn"
      />
    </div>
  );
};

export default UserManagement;
