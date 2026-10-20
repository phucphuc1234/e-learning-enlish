import axiosClient from './axiosClient';

const exerciseApi = {
  getExercises: (params) => axiosClient.get('/exercises', { params }),
  getExercisesByLesson: (lessonId, params = {}) =>
    axiosClient.get(`/exercises/lesson/${lessonId}`, { params }),
  getExerciseById: (id) => axiosClient.get(`/exercises/${id}`),
  createExercise: (data) => axiosClient.post('/exercises', data),
  updateExercise: (id, data) => axiosClient.put(`/exercises/${id}`, data),
  deleteExercise: (id) => axiosClient.delete(`/exercises/${id}`),
  submitExercise: (id, data) => axiosClient.post(`/exercises/${id}/submit`, data),
  getMyAttempts: () =>
    axiosClient.get('/exercises/my-attempts'),

  getMyAttemptDetail: (attemptId) =>
    axiosClient.get(`/exercises/my-attempts/${attemptId}`),
};

export default exerciseApi;
