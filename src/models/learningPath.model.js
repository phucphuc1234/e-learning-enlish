/**
 * Model quản lý dữ liệu bảng LearningPaths và LearningPathCourses (Lộ trình học theo khóa học)
 */

const { sql, getPool } = require('../config/database');

class LearningPathModel {
  /**
   * Lấy danh sách lộ trình học với bộ lọc và phân trang
   */
  static async findAll({ offset = 0, limit = 10, program_id = null, level = null, is_published = null, search = null }) {
    const pool = await getPool();
    const request = pool.request();

    let whereClause = 'WHERE 1=1';

    if (program_id) {
      whereClause += ' AND lp.program_id = @program_id';
      request.input('program_id', sql.Int, program_id);
    }

    if (level) {
      whereClause += ' AND lp.level = @level';
      request.input('level', sql.VarChar(20), level);
    }

    if (is_published !== null && is_published !== undefined) {
      whereClause += ' AND lp.is_published = @is_published';
      request.input('is_published', sql.Bit, is_published ? 1 : 0);
    }

    if (search) {
      whereClause += ' AND (lp.title LIKE @search OR lp.description LIKE @search)';
      request.input('search', sql.NVarChar(200), `%${search}%`);
    }

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const query = `
      SELECT 
        lp.*,
        p.name AS program_name,
        p.slug AS program_slug,
        u.full_name AS teacher_name,
        (SELECT COUNT(*) FROM LearningPathCourses lpc WHERE lpc.learning_path_id = lp.id) AS total_courses
      FROM LearningPaths lp
      INNER JOIN Programs p ON lp.program_id = p.id
      INNER JOIN Users u ON lp.teacher_id = u.id
      ${whereClause}
      ORDER BY lp.id DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Đếm tổng số lộ trình
   */
  static async count({ program_id = null, level = null, is_published = null, search = null }) {
    const pool = await getPool();
    const request = pool.request();

    let whereClause = 'WHERE 1=1';

    if (program_id) {
      whereClause += ' AND lp.program_id = @program_id';
      request.input('program_id', sql.Int, program_id);
    }

    if (level) {
      whereClause += ' AND lp.level = @level';
      request.input('level', sql.VarChar(20), level);
    }

    if (is_published !== null && is_published !== undefined) {
      whereClause += ' AND lp.is_published = @is_published';
      request.input('is_published', sql.Bit, is_published ? 1 : 0);
    }

    if (search) {
      whereClause += ' AND (lp.title LIKE @search OR lp.description LIKE @search)';
      request.input('search', sql.NVarChar(200), `%${search}%`);
    }

    const query = `SELECT COUNT(*) as total FROM LearningPaths lp ${whereClause}`;
    const result = await request.query(query);
    return result.recordset[0].total;
  }

  /**
   * Tìm lộ trình theo ID kèm danh sách các khóa học
   */
  static async findById(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          lp.*,
          p.name AS program_name,
          p.slug AS program_slug,
          u.full_name AS teacher_name,
          u.email AS teacher_email
        FROM LearningPaths lp
        INNER JOIN Programs p ON lp.program_id = p.id
        INNER JOIN Users u ON lp.teacher_id = u.id
        WHERE lp.id = @id
      `);

    if (result.recordset.length === 0) return null;

    const learningPath = result.recordset[0];
    learningPath.courses = await this.getCourses(id);
    return learningPath;
  }

  /**
   * Lấy danh sách khóa học thuộc lộ trình
   */
  static async getCourses(learning_path_id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('learning_path_id', sql.Int, learning_path_id)
      .query(`
        SELECT 
          c.*,
          lpc.order_index AS path_order_index,
          u.full_name AS teacher_name
        FROM LearningPathCourses lpc
        INNER JOIN Courses c ON lpc.course_id = c.id
        INNER JOIN Users u ON c.teacher_id = u.id
        WHERE lpc.learning_path_id = @learning_path_id
        ORDER BY lpc.order_index ASC, c.id ASC
      `);

    return result.recordset;
  }

  /**
   * Tạo lộ trình mới kèm danh sách khóa học
   */
  static async create({ program_id, teacher_id, title, description, level, estimated_duration, is_published }, course_ids = []) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const lpReq = new sql.Request(transaction);
      lpReq.input('program_id', sql.Int, program_id);
      lpReq.input('teacher_id', sql.Int, teacher_id);
      lpReq.input('title', sql.NVarChar(200), title);
      lpReq.input('description', sql.NVarChar(sql.MAX), description || null);
      lpReq.input('level', sql.VarChar(20), level || 'beginner');
      lpReq.input('estimated_duration', sql.Int, estimated_duration || 0);
      lpReq.input('is_published', sql.Bit, is_published ? 1 : 0);

      const lpResult = await lpReq.query(`
        INSERT INTO LearningPaths (
          program_id, teacher_id, title, description, level,
          estimated_duration, is_published, created_at, updated_at
        )
        OUTPUT INSERTED.*
        VALUES (
          @program_id, @teacher_id, @title, @description, @level,
          @estimated_duration, @is_published, GETDATE(), GETDATE()
        )
      `);

      const newLp = lpResult.recordset[0];

      if (Array.isArray(course_ids) && course_ids.length > 0) {
        for (let i = 0; i < course_ids.length; i++) {
          const cReq = new sql.Request(transaction);
          cReq.input('learning_path_id', sql.Int, newLp.id);
          cReq.input('course_id', sql.Int, course_ids[i]);
          cReq.input('order_index', sql.Int, i + 1);

          await cReq.query(`
            INSERT INTO LearningPathCourses (learning_path_id, course_id, order_index)
            VALUES (@learning_path_id, @course_id, @order_index)
          `);
        }
      }

      await transaction.commit();
      return this.findById(newLp.id);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Cập nhật lộ trình học
   */
  static async update(id, updateData, course_ids = null) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const updateFields = [];
      const req = new sql.Request(transaction);
      req.input('id', sql.Int, id);

      if (updateData.title !== undefined) {
        req.input('title', sql.NVarChar(200), updateData.title);
        updateFields.push('title = @title');
      }
      if (updateData.description !== undefined) {
        req.input('description', sql.NVarChar(sql.MAX), updateData.description);
        updateFields.push('description = @description');
      }
      if (updateData.level !== undefined) {
        req.input('level', sql.VarChar(20), updateData.level);
        updateFields.push('level = @level');
      }
      if (updateData.estimated_duration !== undefined) {
        req.input('estimated_duration', sql.Int, updateData.estimated_duration);
        updateFields.push('estimated_duration = @estimated_duration');
      }
      if (updateData.is_published !== undefined) {
        req.input('is_published', sql.Bit, updateData.is_published ? 1 : 0);
        updateFields.push('is_published = @is_published');
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = GETDATE()');
        await req.query(`
          UPDATE LearningPaths
          SET ${updateFields.join(', ')}
          WHERE id = @id
        `);
      }

      if (Array.isArray(course_ids)) {
        // Xóa các khóa học cũ
        const delReq = new sql.Request(transaction);
        delReq.input('learning_path_id', sql.Int, id);
        await delReq.query('DELETE FROM LearningPathCourses WHERE learning_path_id = @learning_path_id');

        // Thêm các khóa học mới
        for (let i = 0; i < course_ids.length; i++) {
          const insReq = new sql.Request(transaction);
          insReq.input('learning_path_id', sql.Int, id);
          insReq.input('course_id', sql.Int, course_ids[i]);
          insReq.input('order_index', sql.Int, i + 1);

          await insReq.query(`
            INSERT INTO LearningPathCourses (learning_path_id, course_id, order_index)
            VALUES (@learning_path_id, @course_id, @order_index)
          `);
        }
      }

      await transaction.commit();
      return this.findById(id);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Xóa lộ trình học
   */
  static async delete(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM LearningPaths WHERE id = @id');

    return result.rowsAffected[0] > 0;
  }
}

module.exports = LearningPathModel;
