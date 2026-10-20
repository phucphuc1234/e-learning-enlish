/**
 * Model quản lý dữ liệu bảng StudentExamResults và StudentAnswers
 * Lưu trữ kết quả thi và câu trả lời chi tiết của học viên
 */

const { sql, getPool } = require('../config/database');

class ExamResultModel {
  /**
   * Tạo bản ghi lượt thi mới khi học viên bắt đầu làm bài
   */
  static async createResult({ student_id, exam_id, total_questions, attempt_number = 1 }) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('student_id', sql.Int, student_id)
      .input('exam_id', sql.Int, exam_id)
      .input('total_questions', sql.Int, total_questions)
      .input('attempt_number', sql.Int, attempt_number)
      .query(`
        INSERT INTO StudentExamResults (
          student_id, exam_id, score, total_correct, total_questions,
          time_taken, is_passed, attempt_number, started_at
        )
        OUTPUT INSERTED.*
        VALUES (
          @student_id, @exam_id, 0, 0, @total_questions,
          0, 0, @attempt_number, GETDATE()
        )
      `);

    return result.recordset[0];
  }

  /**
   * Cập nhật kết quả bài thi sau khi học viên nộp bài
   */
  static async updateResult(id, { score, total_correct, time_taken, is_passed }) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .input('score', sql.Decimal(5, 2), score)
      .input('total_correct', sql.Int, total_correct)
      .input('time_taken', sql.Int, time_taken)
      .input('is_passed', sql.Bit, is_passed ? 1 : 0)
      .query(`
        UPDATE StudentExamResults
        SET 
          score = @score,
          total_correct = @total_correct,
          time_taken = @time_taken,
          is_passed = @is_passed,
          completed_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Lấy chi tiết kết quả một lần thi theo ID
   */
  static async findById(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          ser.*,
          e.title AS exam_title,
          e.type AS exam_type,
          e.time_limit,
          e.pass_score,
          e.show_answer_after,
          c.id AS course_id,
          c.title AS course_title,
          u.full_name AS student_name,
          u.email AS student_email
        FROM StudentExamResults ser
        INNER JOIN Exams e ON ser.exam_id = e.id
        INNER JOIN Courses c ON e.course_id = c.id
        INNER JOIN Users u ON ser.student_id = u.id
        WHERE ser.id = @id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Đếm số lần học viên đã thi một bài thi cụ thể
   */
  static async countAttempts(student_id, exam_id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('student_id', sql.Int, student_id)
      .input('exam_id', sql.Int, exam_id)
      .query(`
        SELECT COUNT(*) AS total_attempts
        FROM StudentExamResults
        WHERE student_id = @student_id AND exam_id = @exam_id
      `);

    return result.recordset[0].total_attempts;
  }

  /**
   * Lấy lịch sử làm bài kiểm tra của một học viên
   */
  static async getByStudent(student_id, { exam_id = null, offset = 0, limit = 10 } = {}) {
    const pool = await getPool();
    const request = pool.request();
    request.input('student_id', sql.Int, student_id);
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    let whereClause = 'WHERE ser.student_id = @student_id';
    if (exam_id) {
      whereClause += ' AND ser.exam_id = @exam_id';
      request.input('exam_id', sql.Int, exam_id);
    }

    const query = `
      SELECT 
        ser.*,
        e.title AS exam_title,
        e.type AS exam_type,
        e.pass_score,
        c.title AS course_title
      FROM StudentExamResults ser
      INNER JOIN Exams e ON ser.exam_id = e.id
      INNER JOIN Courses c ON e.course_id = c.id
      ${whereClause}
      ORDER BY ser.started_at DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Lấy danh sách kết quả làm bài của học viên theo bài thi (dành cho giáo viên)
   */
  static async getByExam(exam_id, { offset = 0, limit = 10 } = {}) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('exam_id', sql.Int, exam_id)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT 
          ser.*,
          u.full_name AS student_name,
          u.email AS student_email,
          u.avatar AS student_avatar
        FROM StudentExamResults ser
        INNER JOIN Users u ON ser.student_id = u.id
        WHERE ser.exam_id = @exam_id
        ORDER BY ser.score DESC, ser.time_taken ASC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

    return result.recordset;
  }

  /**
   * Lưu các câu trả lời của học viên trong một transaction
   */
  static async saveStudentAnswers(student_id, exam_result_id, answers = []) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      for (const ans of answers) {
        const req = new sql.Request(transaction);
        req.input('student_id', sql.Int, student_id);
        req.input('question_id', sql.Int, ans.question_id);
        req.input('exam_result_id', sql.Int, exam_result_id || null);
        req.input('selected_answer_id', sql.Int, ans.selected_answer_id || null);
        req.input('text_answer', sql.NVarChar(sql.MAX), ans.text_answer || null);
        req.input('is_correct', sql.Bit, ans.is_correct ? 1 : 0);
        req.input('points_earned', sql.Decimal(5, 2), ans.points_earned || 0);

        await req.query(`
          INSERT INTO StudentAnswers (
            student_id, question_id, exam_result_id, selected_answer_id,
            text_answer, is_correct, points_earned, answered_at
          )
          VALUES (
            @student_id, @question_id, @exam_result_id, @selected_answer_id,
            @text_answer, @is_correct, @points_earned, GETDATE()
          )
        `);
      }

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Lấy chi tiết các câu trả lời của học viên theo lượt thi
   */
  static async getStudentAnswersByResult(exam_result_id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('exam_result_id', sql.Int, exam_result_id)
      .query(`
        SELECT 
          sa.*,
          q.content AS question_content,
          q.type AS question_type,
          q.points AS question_points,
          q.explanation AS question_explanation,
          a.content AS selected_answer_content
        FROM StudentAnswers sa
        INNER JOIN Questions q ON sa.question_id = q.id
        LEFT JOIN Answers a ON sa.selected_answer_id = a.id
        WHERE sa.exam_result_id = @exam_result_id
        ORDER BY sa.id ASC
      `);

    return result.recordset;
  }
}

module.exports = ExamResultModel;
