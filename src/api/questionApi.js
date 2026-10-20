import axiosClient from "./axiosClient";

const questionApi = {
  getQuestions: (params) => axiosClient.get("/questions", { params }),
  getQuestionsByExercise: (exerciseId) =>
    axiosClient.get(`/questions/exercise/${exerciseId}`),
  getQuestionById: (id) => axiosClient.get(`/questions/${id}`),
  createQuestion: (data) => axiosClient.post("/questions", data),
  updateQuestion: (id, data) => axiosClient.put(`/questions/${id}`, data),
  deleteQuestion: (id) => axiosClient.delete(`/questions/${id}`),

  // Answers
  createAnswer: (data) => axiosClient.post("/answers", data),
  updateAnswer: (id, data) => axiosClient.put(`/answers/${id}`, data),
  deleteAnswer: (id) => axiosClient.delete(`/answers/${id}`),
};

export default questionApi;
