/**
 * Controller xử lý các yêu cầu liên quan đến khóa học (Courses)
 */

const CourseService = require('../services/course.service');
const { successResponse, paginatedResponse } = require('../utils/response');

class CourseController {
  /**
   * Lấy danh sách khóa học có bộ lọc và phân trang
   * GET /api/courses
   */
  static async getAllCourses(req, res, next) {
    try {
      const { courses, pagination } = await CourseService.getAllCourses(req.query);
      return paginatedResponse(res, courses, pagination, 'Lấy danh sách khóa học thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy chi tiết khóa học theo ID
   * GET /api/courses/:id
   */
  static async getCourseById(req, res, next) {
    try {
      const course = await CourseService.getCourseById(req.params.id);
      return successResponse(res, course, 'Lấy chi tiết khóa học thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy chi tiết khóa học theo Slug
   * GET /api/courses/slug/:slug
   */
  static async getCourseBySlug(req, res, next) {
    try {
      const course = await CourseService.getCourseBySlug(req.params.slug);
      return successResponse(res, course, 'Lấy chi tiết khóa học thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy danh sách khóa học theo chương trình
   * GET /api/courses/program/:programId
   */
  static async getCoursesByProgram(req, res, next) {
    try {
      const { courses, pagination } = await CourseService.getCoursesByProgram(req.params.programId, req.query);
      return paginatedResponse(res, courses, pagination, 'Lấy danh sách khóa học theo chương trình thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy danh sách khóa học theo giáo viên
   * GET /api/courses/teacher/:teacherId
   */
  static async getCoursesByTeacher(req, res, next) {
    try {
      const { courses, pagination } = await CourseService.getCoursesByTeacher(req.params.teacherId, req.query);
      return paginatedResponse(res, courses, pagination, 'Lấy danh sách khóa học của giáo viên thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tạo khóa học mới (Teacher/Admin)
   * POST /api/courses
   */
  static async createCourse(req, res, next) {
    try {
      const newCourse = await CourseService.createCourse(req.body, req.user);
      return successResponse(res, newCourse, 'Tạo khóa học thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cập nhật thông tin khóa học (Teacher/Admin)
   * PUT /api/courses/:id
   */
  static async updateCourse(req, res, next) {
    try {
      const updatedCourse = await CourseService.updateCourse(req.params.id, req.body, req.user);
      return successResponse(res, updatedCourse, 'Cập nhật khóa học thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Xóa khóa học (Teacher/Admin)
   * DELETE /api/courses/:id
   */
  static async deleteCourse(req, res, next) {
    try {
      const result = await CourseService.deleteCourse(req.params.id, req.user);
      return successResponse(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Xuất bản hoặc hủy xuất bản khóa học (Teacher/Admin)
   * PATCH /api/courses/:id/publish
   */
  static async publishCourse(req, res, next) {
    try {
      const { is_published } = req.body;
      const updatedCourse = await CourseService.publishCourse(req.params.id, is_published, req.user);
      return successResponse(res, updatedCourse, `Đã ${is_published ? 'xuất bản' : 'hủy xuất bản'} khóa học thành công`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CourseController;
