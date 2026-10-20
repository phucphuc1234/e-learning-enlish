/**
 * Controller xử lý theo dõi tiến độ học tập (Progress)
 */

const ProgressService = require('../services/progress.service');
const { successResponse } = require('../utils/response');

class ProgressController {
  /**
   * Lấy tiến độ toàn bộ khóa học của học viên
   * GET /api/progress/course/:courseId
   */
  static async getCourseProgress(req, res, next) {
    try {
      const progress = await ProgressService.getCourseProgress(req.user.id, req.params.courseId);
      return successResponse(res, progress, 'Lấy tiến độ khóa học thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy tiến độ một bài học cụ thể
   * GET /api/progress/lesson/:lessonId
   */
  static async getLessonProgress(req, res, next) {
    try {
      const progress = await ProgressService.getLessonProgress(req.user.id, req.params.lessonId);
      return successResponse(res, progress, 'Lấy tiến độ bài học thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cập nhật tiến độ hoàn thành bài học
   * POST /api/progress/lesson/:lessonId
   */
  static async updateLessonProgress(req, res, next) {
    try {
      const { is_completed, time_spent } = req.body;
      const result = await ProgressService.updateLessonProgress(req.user.id, req.params.lessonId, {
        is_completed,
        time_spent
      });
      return successResponse(res, result, 'Cập nhật tiến độ học tập thành công');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ProgressController;
