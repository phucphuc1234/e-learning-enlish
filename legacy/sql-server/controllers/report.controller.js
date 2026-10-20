/**
 * Controller xử lý các yêu cầu liên quan đến báo cáo học tập (Reports)
 */

const ReportService = require('../services/report.service');
const { successResponse, paginatedResponse } = require('../utils/response');

class ReportController {
  /**
   * Tạo báo cáo học tập định kỳ (Teacher/Admin)
   * POST /api/reports/generate
   */
  static async generateReport(req, res, next) {
    try {
      const { student_id, course_id, report_type, period_start, period_end } = req.body;
      const report = await ReportService.generateReport(student_id, course_id, {
        report_type,
        period_start,
        period_end
      });
      return successResponse(res, report, 'Tạo báo cáo học tập thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy chi tiết báo cáo theo ID
   * GET /api/reports/:id
   */
  static async getReportById(req, res, next) {
    try {
      const report = await ReportService.getReportById(req.params.id);
      return successResponse(res, report, 'Lấy chi tiết báo cáo thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Học viên xem các báo cáo của chính mình
   * GET /api/reports/my-reports
   */
  static async getMyReports(req, res, next) {
    try {
      const { reports, pagination } = await ReportService.getStudentReports(req.user.id, req.query);
      return paginatedResponse(res, reports, pagination, 'Lấy danh sách báo cáo học tập thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Xem danh sách báo cáo theo khóa học (Teacher/Admin)
   * GET /api/reports/course/:courseId
   */
  static async getCourseReports(req, res, next) {
    try {
      const { reports, pagination } = await ReportService.getCourseReports(req.params.courseId, req.query);
      return paginatedResponse(res, reports, pagination, 'Lấy danh sách báo cáo của khóa học thành công');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReportController;
