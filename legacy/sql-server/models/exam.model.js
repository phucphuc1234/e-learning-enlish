/**
 * Model quản lý dữ liệu bảng Exams và ExamQuestions (Bài kiểm tra, bài thi, thi thử)
 */

const { sql, getPool } = require('../config/database');

class ExamModel {
  /**
   * Lấy danh sách bài thi với bộ lọc và phân trang
   */
  static async findAll({
    offset = 0,
    limit = 10,
    course_id = null,
    teacher_id = null,
    type = null,
    is_published = null,
    search = null
  }) {
    const pool = await getPool();
    const request = pool.request();

    let whereClause = 'WHERE 1=1';

    if (course_id) {
      whereClause += ' AND e.course_id = @course_id';
      request.input('course_id', sql.Int, course_id);
    }

    if (teacher_id) {
      whereClause += ' AND e.teacher_id = @teacher_id';
      request.input('teacher_id', sql.Int, teacher_id);
    }

    if (type) {
      whereClause += ' AND e.type = @type';
      request.input('type', sql.VarChar(20), type);
    }

    if (is_published !== null && is_published !== undefined) {
      whereClause += ' AND e.is_published = @is_published';
      request.input('is_published', sql.Bit, is_published ? 1 : 0);
    }

    if (search) {
      whereClause += ' AND (e.title LIKE @search OR e.description LIKE @search)';
      request.input('search', sql.NVarChar(200), `%${search}%`);
    }

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const query = `
      SELECT 
        e.*,
        c.title AS course_title,
        u.full_name AS teacher_name,
        (SELECT COUNT(*) FROM StudentExamResults ser WHERE ser.exam_id = e.id) AS total_submissions
      FROM Exams e
      INNER JOIN Courses c ON e.course_id = c.id
      INNER JOIN Users u ON e.teacher_id = u.id
      ${whereClause}
      ORDER BY e.id DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Đếm tổng số bài thi theo bộ lọc
   */
  static async count({
    course_id = null,
    teacher_id = null,
    type = null,
    is_published = null,
    search = null
  }) {
    const pool = await getPool();
    const request = pool.request();

    let whereClause = 'WHERE 1=1';

    if (course_id) {
      whereClause += ' AND e.course_id = @course_id';
      request.input('course_id', sql.Int, course_id);
    }

    if (teacher_id) {
      whereClause += ' AND e.teacher_id = @teacher_id';
      request.input('teacher_id', sql.Int, teacher_id);
    }

    if (type) {
      whereClause += ' AND e.type = @type';
      request.input('type', sql.VarChar(20), type);
    }

    if (is_published !== null && is_published !== undefined) {
      whereClause += ' AND e.is_published = @is_published';
      request.input('is_published', sql.Bit, is_published ? 1 : 0);
    }

    if (search) {
      whereClause += ' AND (e.title LIKE @search OR e.description LIKE @search)';
      request.input('search', sql.NVarChar(200), `%${search}%`);
    }

    const query = `SELECT COUNT(*) as total FROM Exams e ${whereClause}`;
    const result = await request.query(query);
    return result.recordset[0].total;
  }

  /**
   * Lấy chi tiết bài thi theo ID
   */
  static async findById(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          e.*,
          c.title AS course_title,
          u.full_name AS teacher_name,
          u.email AS teacher_email,
          (SELECT COUNT(*) FROM ExamQuestions eq WHERE eq.exam_id = e.id) AS questions_count
        FROM Exams e
        INNER JOIN Courses c ON e.course_id = c.id
        INNER JOIN Users u ON e.teacher_id = u.id
        WHERE e.id = @id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Lấy danh sách bài thi theo khóa học
   */
  static async findByCourse(course_id, is_published = null) {
    const pool = await getPool();
    const request = pool.request();
    request.input('course_id', sql.Int, course_id);

    let whereClause = 'WHERE e.course_id = @course_id';
    if (is_published !== null && is_published !== undefined) {
      whereClause += ' AND e.is_published = @is_published';
      request.input('is_published', sql.Bit, is_published ? 1 : 0);
    }

    const query = `
      SELECT e.*, c.title AS course_title
      FROM Exams e
      INNER JOIN Courses c ON e.course_id = c.id
      ${whereClause}
      ORDER BY e.id ASC
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Tạo bài thi mới
   */
  static async create({
    course_id,
    teacher_id,
    title,
    description = null,
    type = 'quiz',
    time_limit = 60,
    total_questions = 0,
    total_points = 10,
    pass_score = 5,
    max_attempts = 1,
    shuffle_questions = 0,
    show_answer_after = 1,
    is_published = 0,
    start_date = null,
    end_date = null
  }) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('course_id', sql.Int, course_id)
      .input('teacher_id', sql.Int, teacher_id)
      .input('title', sql.NVarChar(200), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('type', sql.VarChar(20), type)
      .input('time_limit', sql.Int, time_limit)
      .input('total_questions', sql.Int, total_questions)
      .input('total_points', sql.Decimal(5, 2), total_points)
      .input('pass_score', sql.Decimal(5, 2), pass_score)
      .input('max_attempts', sql.Int, max_attempts)
      .input('shuffle_questions', sql.Bit, shuffle_questions ? 1 : 0)
      .input('show_answer_after', sql.Bit, show_answer_after ? 1 : 0)
      .input('is_published', sql.Bit, is_published ? 1 : 0)
      .input('start_date', sql.DateTime, start_date ? new Date(start_date) : null)
      .input('end_date', sql.DateTime, end_date ? new Date(end_date) : null)
      .query(`
        INSERT INTO Exams (
          course_id, teacher_id, title, description, type, time_limit,
          total_questions, total_points, pass_score, max_attempts,
          shuffle_questions, show_answer_after, is_published,
          start_date, end_date, created_at, updated_at
        )
        OUTPUT INSERTED.*
        VALUES (
          @course_id, @teacher_id, @title, @description, @type, @time_limit,
          @total_questions, @total_points, @pass_score, @max_attempts,
          @shuffle_questions, @show_answer_after, @is_published,
          @start_date, @end_date, GETDATE(), GETDATE()
        )
      `);

    return result.recordset[0];
  }

  /**
   * Cập nhật thông tin bài thi
   */
  static async update(id, updateData) {
    const pool = await getPool();
    const request = pool.request();
    request.input('id', sql.Int, id);

    const updateFields = [];

    if (updateData.title !== undefined) {
      request.input('title', sql.NVarChar(200), updateData.title);
      updateFields.push('title = @title');
    }
    if (updateData.description !== undefined) {
      request.input('description', sql.NVarChar(sql.MAX), updateData.description);
      updateFields.push('description = @description');
    }
    if (updateData.type !== undefined) {
      request.input('type', sql.VarChar(20), updateData.type);
      updateFields.push('type = @type');
    }
    if (updateData.time_limit !== undefined) {
      request.input('time_limit', sql.Int, updateData.time_limit);
      updateFields.push('time_limit = @time_limit');
    }
    if (updateData.total_questions !== undefined) {
      request.input('total_questions', sql.Int, updateData.total_questions);
      updateFields.push('total_questions = @total_questions');
    }
    if (updateData.total_points !== undefined) {
      request.input('total_points', sql.Decimal(5, 2), updateData.total_points);
      updateFields.push('total_points = @total_points');
    }
    if (updateData.pass_score !== undefined) {
      request.input('pass_score', sql.Decimal(5, 2), updateData.pass_score);
      updateFields.push('pass_score = @pass_score');
    }
    if (updateData.max_attempts !== undefined) {
      request.input('max_attempts', sql.Int, updateData.max_attempts);
      updateFields.push('max_attempts = @max_attempts');
    }
    if (updateData.shuffle_questions !== undefined) {
      request.input('shuffle_questions', sql.Bit, updateData.shuffle_questions ? 1 : 0);
      updateFields.push('shuffle_questions = @shuffle_questions');
    }
    if (updateData.show_answer_after !== undefined) {
      request.input('show_answer_after', sql.Bit, updateData.show_answer_after ? 1 : 0);
      updateFields.push('show_answer_after = @show_answer_after');
    }
    if (updateData.is_published !== undefined) {
      request.input('is_published', sql.Bit, updateData.is_published ? 1 : 0);
      updateFields.push('is_published = @is_published');
    }
    if (updateData.start_date !== undefined) {
      request.input('start_date', sql.DateTime, updateData.start_date ? new Date(updateData.start_date) : null);
      updateFields.push('start_date = @start_date');
    }
    if (updateData.end_date !== undefined) {
      request.input('end_date', sql.DateTime, updateData.end_date ? new Date(updateData.end_date) : null);
      updateFields.push('end_date = @end_date');
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push('updated_at = GETDATE()');

    const query = `
      UPDATE Exams
      SET ${updateFields.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id
    `;

    const result = await request.query(query);
    return result.recordset[0] || null;
  }

  /**
   * Thêm danh sách câu hỏi vào bài thi (ExamQuestions)
   */
  static async addQuestions(exam_id, questionIds = []) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      for (let i = 0; i < questionIds.length; i++) {
        const qId = questionIds[i];
        const req = new sql.Request(transaction);
        req.input('exam_id', sql.Int, exam_id);
        req.input('question_id', sql.Int, qId);
        req.input('order_index', sql.Int, i + 1);

        // Tránh insert trùng câu hỏi vào cùng 1 exam
        await req.query(`
          IF NOT EXISTS (SELECT 1 FROM ExamQuestions WHERE exam_id = @exam_id AND question_id = @question_id)
          BEGIN
            INSERT INTO ExamQuestions (exam_id, question_id, order_index)
            VALUES (@exam_id, @question_id, @order_index)
          END
        `);
      }

      // Tự động cập nhật total_questions và total_points trong bảng Exams
      const updateReq = new sql.Request(transaction);
      updateReq.input('exam_id', sql.Int, exam_id);
      await updateReq.query(`
        UPDATE Exams
        SET 
          total_questions = (SELECT COUNT(*) FROM ExamQuestions WHERE exam_id = @exam_id),
          total_points = ISNULL((
            SELECT SUM(q.points) 
            FROM Questions q 
            INNER JOIN ExamQuestions eq ON q.id = eq.question_id 
            WHERE eq.exam_id = @exam_id
          ), 0),
          updated_at = GETDATE()
        WHERE id = @exam_id
      `);

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Xóa câu hỏi khỏi bài thi
   */
  static async removeQuestion(exam_id, question_id) {
    const pool = await getPool();
    await pool
      .request()
      .input('exam_id', sql.Int, exam_id)
      .input('question_id', sql.Int, question_id)
      .query(`
        DELETE FROM ExamQuestions 
        WHERE exam_id = @exam_id AND question_id = @question_id;

        UPDATE Exams
        SET 
          total_questions = (SELECT COUNT(*) FROM ExamQuestions WHERE exam_id = @exam_id),
          total_points = ISNULL((
            SELECT SUM(q.points) 
            FROM Questions q 
            INNER JOIN ExamQuestions eq ON q.id = eq.question_id 
            WHERE eq.exam_id = @exam_id
          ), 0),
          updated_at = GETDATE()
        WHERE id = @exam_id;
      `);

    return true;
  }

  /**
   * Xóa bài thi
   */
  static async delete(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Exams WHERE id = @id');

    return result.rowsAffected[0] > 0;
  }
}

module.exports = ExamModel;
