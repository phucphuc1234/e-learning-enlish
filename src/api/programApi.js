import axiosClient from "./axiosClient";

const programApi = {
  getPrograms: (params) => axiosClient.get("/programs", { params }),
  getProgramById: (id) => axiosClient.get(`/programs/${id}`),
  createProgram: (data) => axiosClient.post("/programs", data),
  updateProgram: (id, data) => axiosClient.put(`/programs/${id}`, data),
  deleteProgram: (id) => axiosClient.delete(`/programs/${id}`),
};

export default programApi;
