import axiosClient from "./axiosClient";

const notificationApi = {
  getNotifications: (params) => axiosClient.get("/notifications", { params }),
  markAsRead: (id) => axiosClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => axiosClient.put("/notifications/read-all"),
};

export default notificationApi;
