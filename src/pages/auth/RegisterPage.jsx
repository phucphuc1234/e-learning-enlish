import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiUser,
  HiEnvelope,
  HiLockClosed,
  HiPhone,
  HiEye,
  HiEyeSlash,
  HiAcademicCap,
  HiUserGroup,
} from "react-icons/hi2";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import useAuth from "../../hooks/useAuth";
import { USER_ROLES } from "../../utils/constants";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: USER_ROLES.STUDENT,
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.full_name.trim()) {
      errs.full_name = "Vui lòng nhập họ và tên";
    }
    if (!formData.email.trim()) {
      errs.email = "Vui lòng nhập email";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = "Email không hợp lệ";
    }
    if (!formData.password) {
      errs.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 8) {
      errs.password = "Mật khẩu tối thiểu 8 ký tự";
    }
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = "Mật khẩu xác nhận không khớp";
    }
    if (!formData.agreeTerms) {
      errs.agreeTerms = "Bạn cần đồng ý với điều khoản dịch vụ";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      });

      // If registered successfully, navigate to login or dashboard
      navigate("/student/dashboard");
    } catch {
      // Handled by context toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-5 text-center">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Tạo Tài Khoản Mới
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Bắt đầu hành trình học tiếng Anh của bạn
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-800">
          Tạo tài khoản học viên. Tài khoản giáo viên được quản trị viên cấp.
        </p>
        <Input
          label="Họ và tên"
          name="full_name"
          placeholder="Nguyễn Văn A"
          value={formData.full_name}
          onChange={handleChange}
          error={errors.full_name}
          icon={HiUser}
          required
        />

        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="email@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          icon={HiEnvelope}
          required
        />

        <Input
          label="Số điện thoại"
          name="phone"
          type="tel"
          placeholder="0912345678"
          value={formData.phone}
          onChange={handleChange}
          icon={HiPhone}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Mật khẩu"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Tối thiểu 6 ký tự"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            icon={HiLockClosed}
            rightIcon={showPassword ? HiEyeSlash : HiEye}
            onRightIconClick={() => setShowPassword(!showPassword)}
            required
          />

          <Input
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Nhập lại mật khẩu"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            icon={HiLockClosed}
            required
          />
        </div>

        <div>
          <label className="flex items-start gap-2 cursor-pointer text-xs text-gray-600 pt-1">
            <input
              type="checkbox"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              Tôi đồng ý với{" "}
              <a
                href="/help"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Điều khoản dịch vụ
              </a>{" "}
              và{" "}
              <a href="#privacy" className="text-blue-600 hover:underline">
                Chính sách bảo mật
              </a>
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="mt-1 text-xs text-red-500">{errors.agreeTerms}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
          className="mt-3"
        >
          Đăng ký tài khoản
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-gray-500">
        Đã có tài khoản?{" "}
        <Link
          to="/login"
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
