import axiosClient from "./axiosClient";

const authApi = {
  register: (data) => axiosClient.post("/auth/register", data),
  login: (data) => axiosClient.post("/auth/login", data),
  logout: () =>
    axiosClient.post(
      "/auth/logout",
      {},
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } },
    ),
  getProfile: () => axiosClient.get("/auth/profile"),
  updateProfile: (data) => axiosClient.put("/auth/profile", data),
  changePassword: (data) => axiosClient.put("/auth/change-password", data),
};

export default authApi;
