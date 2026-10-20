import { useState } from "react";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import authApi from "../api/authApi";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { ROLE_LABELS } from "../utils/constants";
export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    full_name: user.full_name,
    phone: user.phone || "",
    avatar: user.avatar || "",
  });
  const [passwords, setPasswords] = useState({
      currentPassword: "",
      newPassword: "",
      confirm: "",
    }),
    [busy, setBusy] = useState("");
  async function saveProfile(e) {
    e.preventDefault();
    setBusy("profile");
    try {
      const res = await authApi.updateProfile(profile);
      updateUser(res.data);
      toast.success("Đã cập nhật hồ sơ");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy("");
    }
  }
  async function savePassword(e) {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm)
      return toast.error("Mật khẩu xác nhận chưa khớp");
    setBusy("password");
    try {
      await authApi.changePassword(passwords);
      setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success("Đã đổi mật khẩu và kết thúc các phiên đăng nhập khác");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">TÀI KHOẢN CỦA BẠN</p>
        <h1 className="text-3xl font-bold">Hồ sơ cá nhân</h1>
        <p className="mt-2 text-sm text-slate-500">
          {user.email} · {ROLE_LABELS[user.role]}
        </p>
      </div>
      <form className="surface space-y-4" onSubmit={saveProfile}>
        <h2 className="text-lg font-semibold">Thông tin cá nhân</h2>
        {[
          ["full_name", "Họ và tên"],
          ["phone", "Số điện thoại"],
          ["avatar", "Đường dẫn ảnh đại diện"],
        ].map(([key, label]) => (
          <Input
            key={key}
            label={label}
            value={profile[key]}
            onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
            required={key === "full_name"}
          />
        ))}
        <Button type="submit" loading={busy === "profile"}>
          Lưu hồ sơ
        </Button>
      </form>
      <form className="surface space-y-4" onSubmit={savePassword}>
        <h2 className="text-lg font-semibold">Đổi mật khẩu</h2>
        {[
          ["currentPassword", "Mật khẩu hiện tại"],
          ["newPassword", "Mật khẩu mới"],
          ["confirm", "Xác nhận mật khẩu mới"],
        ].map(([key, label]) => (
          <Input
            key={key}
            type="password"
            label={label}
            autoComplete={
              key === "currentPassword" ? "current-password" : "new-password"
            }
            minLength={key === "currentPassword" ? undefined : 8}
            required
            value={passwords[key]}
            onChange={(e) =>
              setPasswords({ ...passwords, [key]: e.target.value })
            }
          />
        ))}
        <Button type="submit" loading={busy === "password"}>
          Đổi mật khẩu
        </Button>
      </form>
    </div>
  );
}
