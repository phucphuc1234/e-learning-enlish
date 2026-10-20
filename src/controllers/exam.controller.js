/**
 * Controller xử lý các yêu cầu liên quan đến bài thi và lượt thi (Exams)
 */

const ExamService = require('../services/exam.service');
const { successResponse, paginatedResponse } = require('../utils/response');

class ExamController {
  /**
   * Lấy danh sách bài thi
   * GET /api/exams
   */
  static async getAllExams(req, res, next) {
    try {
      const { exams, pagination } = await ExamService.getAllExams(req.query);
      return paginatedResponse(res, exams, pagination, 'Lấy danh sách bài thi thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy chi tiết bài thi theo ID
   * GET /api/exams/:id
   */
  static async getExamById(req, res, next) {
    try {
      const exam = await ExamService.getExamById(req.params.id, req.user);
      return successResponse(res, exam, 'Lấy chi tiết bài thi thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tạo bài thi mới (Teacher/Admin)
   * POST /api/exams
   */
  static async createExam(req, res, next) {
    try {
      const newExam = await ExamService.createExam(req.body, req.user);
      return successResponse(res, newExam, 'Tạo bài thi thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cập nhật thông tin bài thi (Teacher/Admin)
   * PUT /api/exams/:id
   */
  static async updateExam(req, res, next) {
    try {
      const updatedExam = await ExamService.updateExam(req.params.id, req.body, req.user);
      return successResponse(res, updatedExam, 'Cập nhật bài thi thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Xóa bài thi (Teacher/Admin)
   * DELETE /api/exams/:id
   */
  static async deleteExam(req, res, next) {
    try {
      const result = await ExamService.deleteExam(req.params.id, req.user);
      return successResponse(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Thêm câu hỏi vào bài thi (Teacher/Admin)
   * POST /api/exams/:id/questions
   */
  static async addQuestionsToExam(req, res, next) {
    try {
      const { question_ids } = req.body;
      const updatedExam = await ExamService.addQuestionsToExam(req.params.id, question_ids, req.user);
      return successResponse(res, updatedExam, 'Thêm câu hỏi vào bài thi thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Xóa câu hỏi khỏi bài thi (Teacher/Admin)
   * DELETE /api/exams/:id/questions/:questionId
   */
  static async removeQuestionFromExam(req, res, next) {
    try {
      const result = await ExamService.removeQuestionFromExam(req.params.id, req.params.questionId, req.user);
      return successResponse(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Học viên bắt đầu làm bài thi
   * POST /api/exams/:id/start
   */
  static async startExam(req, res, next) {
    try {
      const examSession = await ExamService.startExam(req.params.id, req.user.id);
      return successResponse(res, examSession, 'Bắt đầu làm bài thi thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Học viên nộp bài thi
   * POST /api/exams/:id/submit
   */
  static async submitExam(req, res, next) {
    try {
      const { exam_result_id, answers, time_taken } = req.body;
      const submissionResult = await ExamService.submitExam(exam_result_id, req.user.id, answers, time_taken);
      return successResponse(res, submissionResult, 'Nộp bài thi và chấm điểm thành công');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ExamController;
