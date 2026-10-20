/**
 * Controller xử lý các yêu cầu liên quan đến lộ trình học (Learning Paths)
 */

const LearningPathService = require('../services/learningPath.service');
const { successResponse, paginatedResponse } = require('../utils/response');

class LearningPathController {
  /**
   * Lấy danh sách lộ trình học
   * GET /api/learning-paths
   */
  static async getAllLearningPaths(req, res, next) {
    try {
      const { learningPaths, pagination } = await LearningPathService.getAllLearningPaths(req.query);
      return paginatedResponse(res, learningPaths, pagination, 'Lấy danh sách lộ trình học thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy chi tiết lộ trình học theo ID
   * GET /api/learning-paths/:id
   */
  static async getLearningPathById(req, res, next) {
    try {
      const path = await LearningPathService.getLearningPathById(req.params.id);
      return successResponse(res, path, 'Lấy chi tiết lộ trình học thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tạo lộ trình học mới (Teacher/Admin)
   * POST /api/learning-paths
   */
  static async createLearningPath(req, res, next) {
    try {
      const { course_ids, ...pathData } = req.body;
      const newPath = await LearningPathService.createLearningPath(pathData, course_ids, req.user);
      return successResponse(res, newPath, 'Tạo lộ trình học thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cập nhật lộ trình học (Teacher/Admin)
   * PUT /api/learning-paths/:id
   */
  static async updateLearningPath(req, res, next) {
    try {
      const { course_ids, ...pathData } = req.body;
      const updatedPath = await LearningPathService.updateLearningPath(req.params.id, pathData, course_ids, req.user);
      return successResponse(res, updatedPath, 'Cập nhật lộ trình học thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Xóa lộ trình học (Teacher/Admin)
   * DELETE /api/learning-paths/:id
   */
  static async deleteLearningPath(req, res, next) {
    try {
      const result = await LearningPathService.deleteLearningPath(req.params.id, req.user);
      return successResponse(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LearningPathController;
