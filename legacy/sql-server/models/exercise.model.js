/**
 * Model quản lý dữ liệu bảng Exercises (Bài tập luyện tập theo bài học)
 */

const { sql, getPool } = require('../config/database');

class ExerciseModel {
  /**
   * Lấy danh sách bài tập theo bài học
   */
  static async findByLesson(lesson_id, is_published = null) {
    const pool = await getPool();
    const request = pool.request();
    request.input('lesson_id', sql.Int, lesson_id);

    let whereClause = 'WHERE e.lesson_id = @lesson_id';
    if (is_published !== null && is_published !== undefined) {
      whereClause += ' AND e.is_published = @is_published';
      request.input('is_published', sql.Bit, is_published ? 1 : 0);
    }

    const query = `
      SELECT 
        e.*,
        (SELECT COUNT(*) FROM Questions q WHERE q.exercise_id = e.id) AS total_questions
      FROM Exercises e
      ${whereClause}
      ORDER BY e.order_index ASC, e.id ASC
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Lấy danh sách bài tập kèm phân trang
   */
  static async findAll({ offset = 0, limit = 10, lesson_id = null, type = null, difficulty = null, is_published = null, search = null }) {
    const pool = await getPool();
    const request = pool.request();

    let whereClause = 'WHERE 1=1';

    if (lesson_id) {
      whereClause += ' AND e.lesson_id = @lesson_id';
      request.input('lesson_id', sql.Int, lesson_id);
    }

    if (type) {
      whereClause += ' AND e.type = @type';
      request.input('type', sql.VarChar(30), type);
    }

    if (difficulty) {
      whereClause += ' AND e.difficulty = @difficulty';
      request.input('difficulty', sql.VarChar(20), difficulty);
    }

    if (is_published !== null && is_published !== undefined) {
      whereClause += ' AND e.is_published = @is_published';
      request.input('is_published', sql.Bit, is_published ? 1 : 0);
    }

    if (search) {
      whereClause += ' AND e.title LIKE @search';
      request.input('search', sql.NVarChar(200), `%${search}%`);
    }

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const query = `
      SELECT 
        e.*,
        l.title AS lesson_title,
        c.id AS course_id,
        c.title AS course_title,
        (SELECT COUNT(*) FROM Questions q WHERE q.exercise_id = e.id) AS total_questions
      FROM Exercises e
      INNER JOIN Lessons l ON e.lesson_id = l.id
      INNER JOIN Courses c ON l.course_id = c.id
      ${whereClause}
      ORDER BY e.order_index ASC, e.id ASC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Đếm tổng số bài tập
   */
  static async count({ lesson_id = null, type = null, difficulty = null, is_published = null, search = null }) {
    const pool = await getPool();
    const request = pool.request();

    let whereClause = 'WHERE 1=1';

    if (lesson_id) {
      whereClause += ' AND e.lesson_id = @lesson_id';
      request.input('lesson_id', sql.Int, lesson_id);
    }

    if (type) {
      whereClause += ' AND e.type = @type';
      request.input('type', sql.VarChar(30), type);
    }

    if (difficulty) {
      whereClause += ' AND e.difficulty = @difficulty';
      request.input('difficulty', sql.VarChar(20), difficulty);
    }

    if (is_published !== null && is_published !== undefined) {
      whereClause += ' AND e.is_published = @is_published';
      request.input('is_published', sql.Bit, is_published ? 1 : 0);
    }

    if (search) {
      whereClause += ' AND e.title LIKE @search';
      request.input('search', sql.NVarChar(200), `%${search}%`);
    }

    const query = `SELECT COUNT(*) as total FROM Exercises e ${whereClause}`;
    const result = await request.query(query);
    return result.recordset[0].total;
  }

  /**
   * Tìm bài tập theo ID
   */
  static async findById(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          e.*,
          l.title AS lesson_title,
          c.id AS course_id,
          c.title AS course_title,
          c.teacher_id,
          (SELECT COUNT(*) FROM Questions q WHERE q.exercise_id = e.id) AS total_questions
        FROM Exercises e
        INNER JOIN Lessons l ON e.lesson_id = l.id
        INNER JOIN Courses c ON l.course_id = c.id
        WHERE e.id = @id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Tạo bài tập mới
   */
  static async create({
    lesson_id,
    title,
    description = null,
    type = 'multiple_choice',
    difficulty = 'medium',
    time_limit = 0,
    order_index = 0,
    is_published = 0
  }) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('lesson_id', sql.Int, lesson_id)
      .input('title', sql.NVarChar(200), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('type', sql.VarChar(30), type)
      .input('difficulty', sql.VarChar(20), difficulty)
      .input('time_limit', sql.Int, time_limit)
      .input('order_index', sql.Int, order_index)
      .input('is_published', sql.Bit, is_published ? 1 : 0)
      .query(`
        INSERT INTO Exercises (
          lesson_id, title, description, type, difficulty,
          time_limit, order_index, is_published, created_at, updated_at
        )
        OUTPUT INSERTED.*
        VALUES (
          @lesson_id, @title, @description, @type, @difficulty,
          @time_limit, @order_index, @is_published, GETDATE(), GETDATE()
        )
      `);

    return result.recordset[0];
  }

  /**
   * Cập nhật thông tin bài tập
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
      request.input('type', sql.VarChar(30), updateData.type);
      updateFields.push('type = @type');
    }
    if (updateData.difficulty !== undefined) {
      request.input('difficulty', sql.VarChar(20), updateData.difficulty);
      updateFields.push('difficulty = @difficulty');
    }
    if (updateData.time_limit !== undefined) {
      request.input('time_limit', sql.Int, updateData.time_limit);
      updateFields.push('time_limit = @time_limit');
    }
    if (updateData.order_index !== undefined) {
      request.input('order_index', sql.Int, updateData.order_index);
      updateFields.push('order_index = @order_index');
    }
    if (updateData.is_published !== undefined) {
      request.input('is_published', sql.Bit, updateData.is_published ? 1 : 0);
      updateFields.push('is_published = @is_published');
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push('updated_at = GETDATE()');

    const query = `
      UPDATE Exercises
      SET ${updateFields.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id
    `;

    const result = await request.query(query);
    return result.recordset[0] || null;
  }

  /**
   * Xóa bài tập
   */
  static async delete(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Exercises WHERE id = @id');

    return result.rowsAffected[0] > 0;
  }
}

module.exports = ExerciseModel;
