import axiosClient from "./axiosClient";

const learningPathApi = {
  getLearningPaths: (params) => axiosClient.get("/learning-paths", { params }),
  getLearningPathById: (id) => axiosClient.get(`/learning-paths/${id}`),
  createLearningPath: (data) => axiosClient.post("/learning-paths", data),
  updateLearningPath: (id, data) =>
    axiosClient.put(`/learning-paths/${id}`, data),
  deleteLearningPath: (id) => axiosClient.delete(`/learning-paths/${id}`),
  addCourseToPath: (id, data) =>
    axiosClient.post(`/learning-paths/${id}/courses`, data),
  removeCourseFromPath: (id, courseId) =>
    axiosClient.delete(`/learning-paths/${id}/courses/${courseId}`),
};

export default learningPathApi;
