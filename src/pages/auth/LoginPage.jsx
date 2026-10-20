import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { HiEnvelope, HiLockClosed, HiEye, HiEyeSlash } from "react-icons/hi2";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import useAuth from "../../hooks/useAuth";
import { USER_ROLES } from "../../utils/constants";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = "Vui lòng nhập email";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = "Email không hợp lệ";
    }
    if (!formData.password) {
      errs.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      errs.password = "Mật khẩu tối thiểu 6 ký tự";
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
      const user = await login({
        email: formData.email,
        password: formData.password,
      });

      // Redirect based on previous location or role
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (user?.role === USER_ROLES.ADMIN) {
        navigate("/admin/dashboard", { replace: true });
      } else if (user?.role === USER_ROLES.TEACHER) {
        navigate("/teacher/dashboard", { replace: true });
      } else {
        navigate("/student/dashboard", { replace: true });
      }
    } catch {
      // Toast handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (email, password) => {
    setFormData({
      email,
      password,
      rememberMe: true,
    });
    setErrors({});
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Đăng Nhập
        </h2>
        <p className="mt-1.5 text-xs text-gray-500">
          Nhập thông tin tài khoản của bạn để tiếp tục
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Địa chỉ Email"
          name="email"
          type="email"
          placeholder="name@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          icon={HiEnvelope}
          required
        />

        <Input
          label="Mật khẩu"
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          icon={HiLockClosed}
          rightIcon={showPassword ? HiEyeSlash : HiEye}
          onRightIconClick={() => setShowPassword(!showPassword)}
          required
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-gray-600">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <Link to="/help" className="text-blue-600">
            Quên mật khẩu?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
          className="mt-2"
        >
          Đăng nhập ngay
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-gray-500">
        Chưa có tài khoản?{" "}
        <Link
          to="/register"
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
