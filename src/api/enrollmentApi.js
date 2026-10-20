import axiosClient from "./axiosClient";

const enrollmentApi = {
  getEnrollments: (params) => axiosClient.get("/enrollments", { params }),
  enrollCourse: (courseId) =>
    axiosClient.post("/enrollments", { course_id: courseId }),
  checkEnrollment: (courseId) =>
    axiosClient.get(`/enrollments/check/${courseId}`),
  updateEnrollmentStatus: (id, status) =>
    axiosClient.put(`/enrollments/${id}`, { status }),
};

export default enrollmentApi;
