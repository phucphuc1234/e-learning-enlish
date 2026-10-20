import axiosClient from './axiosClient';

const courseApi = {
  getCourses: (params) => axiosClient.get('/courses', { params }),
  getCourseById: (id) => axiosClient.get(`/courses/${id}`),
  getCourseBySlug: (slug) => axiosClient.get(`/courses/slug/${slug}`),
  createCourse: (data) => axiosClient.post('/courses', data),
  updateCourse: (id, data) => axiosClient.put(`/courses/${id}`, data),
  deleteCourse: (id) => axiosClient.delete(`/courses/${id}`),
};

export default courseApi;
