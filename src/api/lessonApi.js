
import axiosClient from './axiosClient';

const lessonApi = {
  getLessons: ({ course_id, is_published } = {}) => {
    if (!course_id) {
      throw new Error('Chưa chọn khóa học');
    }

    return axiosClient.get(`/lessons/course/${course_id}`, {
      params: is_published === undefined
        ? {}
        : { is_published },
    });
  },

  getLessonById: (id) =>
    axiosClient.get(`/lessons/${id}`),

  createLesson: (data) =>
    axiosClient.post('/lessons', data),

  updateLesson: (id, data) =>
    axiosClient.put(`/lessons/${id}`, data),

  deleteLesson: (id) =>
    axiosClient.delete(`/lessons/${id}`),
};

export default lessonApi;
