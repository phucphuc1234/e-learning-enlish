/**
 * Controller xử lý các yêu cầu liên quan đến chương trình đào tạo (Programs)
 */

const ProgramService = require('../services/program.service');
const { successResponse, paginatedResponse } = require('../utils/response');

class ProgramController {
  /**
   * Lấy danh sách chương trình đào tạo
   * GET /api/programs
   */
  static async getAllPrograms(req, res, next) {
    try {
      const { programs, pagination } = await ProgramService.getAllPrograms(req.query);
      return paginatedResponse(res, programs, pagination, 'Lấy danh sách chương trình thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy chi tiết chương trình theo ID
   * GET /api/programs/:id
   */
  static async getProgramById(req, res, next) {
    try {
      const program = await ProgramService.getProgramById(req.params.id);
      return successResponse(res, program, 'Lấy thông tin chương trình thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy chi tiết chương trình theo slug
   * GET /api/programs/slug/:slug
   */
  static async getProgramBySlug(req, res, next) {
    try {
      const program = await ProgramService.getProgramBySlug(req.params.slug);
      return successResponse(res, program, 'Lấy thông tin chương trình thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tạo chương trình đào tạo mới (Admin)
   * POST /api/programs
   */
  static async createProgram(req, res, next) {
    try {
      const newProgram = await ProgramService.createProgram(req.body);
      return successResponse(res, newProgram, 'Tạo chương trình đào tạo thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cập nhật chương trình đào tạo (Admin)
   * PUT /api/programs/:id
   */
  static async updateProgram(req, res, next) {
    try {
      const updatedProgram = await ProgramService.updateProgram(req.params.id, req.body);
      return successResponse(res, updatedProgram, 'Cập nhật chương trình đào tạo thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Xóa chương trình đào tạo (Admin)
   * DELETE /api/programs/:id
   */
  static async deleteProgram(req, res, next) {
    try {
      const result = await ProgramService.deleteProgram(req.params.id);
      return successResponse(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ProgramController;
