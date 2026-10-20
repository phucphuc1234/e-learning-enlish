/**
 * Controller xử lý các thống kê Dashboard cho từng phân quyền
 */

const DashboardService = require('../services/dashboard.service');
const { successResponse } = require('../utils/response');

class DashboardController {
  /**
   * Lấy số liệu thống kê dành cho Quản trị viên (Admin)
   * GET /api/dashboard/admin
   */
  static async getAdminStats(req, res, next) {
    try {
      const stats = await DashboardService.getAdminStats();
      return successResponse(res, stats, 'Lấy dữ liệu thống kê Admin thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy số liệu thống kê dành cho Giảng viên (Teacher)
   * GET /api/dashboard/teacher
   */
  static async getTeacherStats(req, res, next) {
    try {
      const stats = await DashboardService.getTeacherStats(req.user.id);
      return successResponse(res, stats, 'Lấy dữ liệu thống kê Giáo viên thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy số liệu thống kê dành cho Học viên (Student)
   * GET /api/dashboard/student
   */
  static async getStudentStats(req, res, next) {
    try {
      const stats = await DashboardService.getStudentStats(req.user.id);
      return successResponse(res, stats, 'Lấy dữ liệu thống kê Học viên thành công');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DashboardController;
