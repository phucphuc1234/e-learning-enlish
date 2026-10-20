import { createContext, useState, useEffect, useCallback } from "react";
import authApi from "../api/authApi";
import toast from "react-hot-toast";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Verify and fetch latest profile on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        try {
          const res = await authApi.getProfile();
          // Backend response structure { success, data: user } or user directly
          const userData = res?.data || res;
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        } catch (error) {
          console.error("Lỗi xác thực người dùng:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const res = await authApi.login(credentials);
      // Handles { token, user } or { data: { token, user } }
      const authData = res?.data || res;
      const receivedToken = authData.token;
      const receivedUser = authData.user || authData;

      if (!receivedToken) {
        throw new Error("Không nhận được mã xác thực!");
      }

      localStorage.setItem("token", receivedToken);
      localStorage.setItem("user", JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);

      toast.success(`Chào mừng trở lại, ${receivedUser.full_name || "bạn"}!`);
      return receivedUser;
    } catch (error) {
      toast.error(error.message || "Đăng nhập thất bại!");
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const res = await authApi.register(userData);
      const authData = res?.data || res;

      // Auto login if token returned, else notify
      if (authData.token && authData.user) {
        localStorage.setItem("token", authData.token);
        localStorage.setItem("user", JSON.stringify(authData.user));
        setToken(authData.token);
        setUser(authData.user);
      }
      toast.success(res?.message || "Đăng ký tài khoản thành công!");
      return authData;
    } catch (error) {
      toast.error(error.message || "Đăng ký thất bại!");
      throw error;
    }
  };

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    toast.success("Đã đăng xuất thành công!");
  }, []);

  const updateUser = (newUserData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newUserData };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    role: user?.role || null,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
