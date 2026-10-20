/**
 * Controller xử lý các yêu cầu liên quan đến đăng ký khóa học (Enrollments)
 */

const EnrollmentService = require('../services/enrollment.service');
const { successResponse, paginatedResponse } = require('../utils/response');

class EnrollmentController {
  /**
   * Đăng ký khóa học
   * POST /api/enrollments
   */
  static async enrollCourse(req, res, next) {
    try {
      const { course_id } = req.body;
      const enrollment = await EnrollmentService.enrollCourse(req.user.id, course_id);
      return successResponse(res, enrollment, 'Đăng ký khóa học thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy danh sách khóa học học viên đã đăng ký
   * GET /api/enrollments/my-courses
   */
  static async getMyEnrollments(req, res, next) {
    try {
      const { enrollments, pagination } = await EnrollmentService.getStudentEnrollments(req.user.id, req.query);
      return paginatedResponse(res, enrollments, pagination, 'Lấy danh sách khóa học của tôi thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy danh sách học viên trong một khóa học (Teacher/Admin)
   * GET /api/enrollments/course/:courseId
   */
  static async getCourseStudents(req, res, next) {
    try {
      const result = await EnrollmentService.getCourseStudents(req.params.courseId, req.query, req.user);
      return successResponse(res, result.students, 'Lấy danh sách học viên của khóa học thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Kiểm tra tình trạng đăng ký của người dùng với khóa học
   * GET /api/enrollments/check/:courseId
   */
  static async checkEnrollment(req, res, next) {
    try {
      const status = await EnrollmentService.checkEnrollment(req.user.id, req.params.courseId);
      return successResponse(res, status, 'Kiểm tra trạng thái đăng ký thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Hủy tham gia khóa học
   * POST /api/enrollments/drop/:courseId
   */
  static async dropCourse(req, res, next) {
    try {
      const result = await EnrollmentService.dropCourse(req.user.id, req.params.courseId);
      return successResponse(res, result.enrollment, result.message);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = EnrollmentController;
