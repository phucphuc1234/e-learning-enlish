/**
 * Controller xử lý các yêu cầu liên quan đến câu hỏi và đáp án (Questions & Answers)
 */

const QuestionService = require('../services/question.service');
const { successResponse } = require('../utils/response');

class QuestionController {
  /**
   * Lấy danh sách câu hỏi theo bài tập
   * GET /api/questions/exercise/:exerciseId
   */
  static async getQuestionsByExercise(req, res, next) {
    try {
      const questions = await QuestionService.getQuestionsByExercise(req.params.exerciseId, req.user);
      return successResponse(res, questions, 'Lấy danh sách câu hỏi thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy danh sách câu hỏi theo bài thi
   * GET /api/questions/exam/:examId
   */
  static async getQuestionsByExam(req, res, next) {
    try {
      const questions = await QuestionService.getQuestionsByExam(req.params.examId, req.user);
      return successResponse(res, questions, 'Lấy danh sách câu hỏi theo bài thi thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy chi tiết câu hỏi theo ID
   * GET /api/questions/:id
   */
  static async getQuestionById(req, res, next) {
    try {
      const question = await QuestionService.getQuestionById(req.params.id, req.user);
      return successResponse(res, question, 'Lấy chi tiết câu hỏi thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tạo câu hỏi kèm danh sách đáp án (Teacher/Admin)
   * POST /api/questions
   */
  static async createQuestion(req, res, next) {
    try {
      const { answers, ...questionData } = req.body;
      const newQuestion = await QuestionService.createQuestion(questionData, answers);
      return successResponse(res, newQuestion, 'Tạo câu hỏi thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cập nhật thông tin câu hỏi và đáp án (Teacher/Admin)
   * PUT /api/questions/:id
   */
  static async updateQuestion(req, res, next) {
    try {
      const { answers, ...questionData } = req.body;
      const updatedQuestion = await QuestionService.updateQuestion(req.params.id, questionData, answers);
      return successResponse(res, updatedQuestion, 'Cập nhật câu hỏi thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Xóa câu hỏi (Teacher/Admin)
   * DELETE /api/questions/:id
   */
  static async deleteQuestion(req, res, next) {
    try {
      const result = await QuestionService.deleteQuestion(req.params.id);
      return successResponse(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = QuestionController;
