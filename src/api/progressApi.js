import axiosClient from './axiosClient';

const progressApi = {
  getProgress: (params) => axiosClient.get('/progress', { params }),
  updateProgress: (data) => axiosClient.post('/progress', data),
  getCourseProgress: (courseId) => axiosClient.get(`/progress/course/${courseId}`),
};

export default progressApi;
