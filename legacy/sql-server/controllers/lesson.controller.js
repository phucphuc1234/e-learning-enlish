/**
 * Controller xử lý các yêu cầu liên quan đến bài học (Lessons)
 */

const LessonService = require('../services/lesson.service');
const { successResponse } = require('../utils/response');

class LessonController {
  /**
   * Lấy danh sách bài học theo khóa học
   * GET /api/lessons/course/:courseId
   */
  static async getLessonsByCourse(req, res, next) {
    try {
      const lessons = await LessonService.getLessonsByCourse(req.params.courseId, req.query.is_published);
      return successResponse(res, lessons, 'Lấy danh sách bài học thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy chi tiết bài học theo ID
   * GET /api/lessons/:id
   */
  static async getLessonById(req, res, next) {
    try {
      const lesson = await LessonService.getLessonById(req.params.id);
      return successResponse(res, lesson, 'Lấy chi tiết bài học thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tạo bài học mới (Teacher/Admin)
   * POST /api/lessons
   */
  static async createLesson(req, res, next) {
    try {
      const newLesson = await LessonService.createLesson(req.body, req.user);
      return successResponse(res, newLesson, 'Tạo bài học thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cập nhật thông tin bài học (Teacher/Admin)
   * PUT /api/lessons/:id
   */
  static async updateLesson(req, res, next) {
    try {
      const updatedLesson = await LessonService.updateLesson(req.params.id, req.body, req.user);
      return successResponse(res, updatedLesson, 'Cập nhật bài học thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Xóa bài học (Teacher/Admin)
   * DELETE /api/lessons/:id
   */
  static async deleteLesson(req, res, next) {
    try {
      const result = await LessonService.deleteLesson(req.params.id, req.user);
      return successResponse(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LessonController;
