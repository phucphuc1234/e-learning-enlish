/**
 * Controller xử lý các yêu cầu liên quan đến bài tập (Exercises)
 */

const ExerciseService = require('../services/exercise.service');
const { successResponse, paginatedResponse } = require('../utils/response');
const ExerciseSubmissionService =
  require('../services/exerciseSubmission.service');
class ExerciseController {
  /**
   * Lấy danh sách bài tập theo bài học
   * GET /api/exercises/lesson/:lessonId
   */
  static async getExercisesByLesson(req, res, next) {
    try {
      const exercises = await ExerciseService.getExercisesByLesson(req.params.lessonId, req.query.is_published);
      return successResponse(res, exercises, 'Lấy danh sách bài tập thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy tất cả bài tập có lọc và phân trang (Admin/Teacher)
   * GET /api/exercises
   */
  static async getAllExercises(req, res, next) {
    try {
      const { exercises, pagination } = await ExerciseService.getAllExercises(req.query);
      return paginatedResponse(res, exercises, pagination, 'Lấy danh sách bài tập thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy chi tiết bài tập theo ID
   * GET /api/exercises/:id
   */
  static async getExerciseById(req, res, next) {
    try {
      const exercise = await ExerciseService.getExerciseById(req.params.id);
      return successResponse(res, exercise, 'Lấy chi tiết bài tập thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tạo bài tập mới (Teacher/Admin)
   * POST /api/exercises
   */
  static async createExercise(req, res, next) {
    try {
      const newExercise = await ExerciseService.createExercise(req.body, req.user);
      return successResponse(res, newExercise, 'Tạo bài tập thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cập nhật thông tin bài tập (Teacher/Admin)
   * PUT /api/exercises/:id
   */
  static async updateExercise(req, res, next) {
    try {
      const updatedExercise = await ExerciseService.updateExercise(req.params.id, req.body, req.user);
      return successResponse(res, updatedExercise, 'Cập nhật bài tập thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Xóa bài tập (Teacher/Admin)
   * DELETE /api/exercises/:id
   */
  static async deleteExercise(req, res, next) {
    try {
      const result = await ExerciseService.deleteExercise(req.params.id, req.user);
      return successResponse(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Học viên nộp bài tập và nhận kết quả
   * POST /api/exercises/:id/submit
   */
  static async submitExercise(req, res, next) {
    try {
      const result = await ExerciseSubmissionService.submit(
        req.params.id,
        req.body.answers,
        req.user
      );

      return successResponse(
        res,
        result,
        'Nộp bài và chấm điểm thành công',
        201
      );
    } catch (err) {
      next(err);
    }
  }

}

module.exports = ExerciseController;
