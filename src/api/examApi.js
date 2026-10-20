import axiosClient from "./axiosClient";

const examApi = {
  getExams: (params) => axiosClient.get("/exams", { params }),
  getExamById: (id) => axiosClient.get(`/exams/${id}`),
  createExam: (data) => axiosClient.post("/exams", data),
  updateExam: (id, data) => axiosClient.put(`/exams/${id}`, data),
  deleteExam: (id) => axiosClient.delete(`/exams/${id}`),
  startExam: (id) => axiosClient.post(`/exams/${id}/start`),
  submitExam: (id, data) => axiosClient.post(`/exams/${id}/submit`, data),
  getExamResults: (params) => axiosClient.get("/exams/results", { params }),
  getExamResultById: (id) => axiosClient.get(`/exams/results/${id}`),
};

export default examApi;
