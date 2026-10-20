import axiosClient from "./axiosClient";

const reportApi = {
  getReports: (params) => axiosClient.get("/reports", { params }),
  getReportById: (id) => axiosClient.get(`/reports/${id}`),
  generateReport: (data) => axiosClient.post("/reports/generate", data),
};

export default reportApi;
