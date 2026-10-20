
import axiosClient from './axiosClient';

const dashboardApi = {
  // Quản trị viên
  getStats: () => axiosClient.get('/dashboard/admin'),

  // Giáo viên
  getTeacherStats: () => axiosClient.get('/dashboard/teacher'),

  // Học viên
  getStudentStats: () => axiosClient.get('/dashboard/student'),
};

export default dashboardApi;
