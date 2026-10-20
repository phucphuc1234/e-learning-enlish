/**
 * Model quản lý dữ liệu bảng StudentEnrollments (Đăng ký học khóa học)
 */

const { sql, getPool } = require('../config/database');

class EnrollmentModel {
  /**
   * Đăng ký khóa học mới cho học viên
   */
  static async enroll({ student_id, course_id }) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('student_id', sql.Int, student_id)
      .input('course_id', sql.Int, course_id)
      .query(`
        INSERT INTO StudentEnrollments (student_id, course_id, enrolled_at, status, progress_percent)
        OUTPUT INSERTED.*
        VALUES (@student_id, @course_id, GETDATE(), 'active', 0)
      `);

    return result.recordset[0];
  }

  /**
   * Kiểm tra xem học viên đã đăng ký khóa học hay chưa
   */
  static async findOne(student_id, course_id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('student_id', sql.Int, student_id)
      .input('course_id', sql.Int, course_id)
      .query(`
        SELECT se.*, c.title AS course_title
        FROM StudentEnrollments se
        INNER JOIN Courses c ON se.course_id = c.id
        WHERE se.student_id = @student_id AND se.course_id = @course_id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Lấy danh sách khóa học mà một học viên đã đăng ký
   */
  static async getByStudent(student_id, { offset = 0, limit = 10, status = null } = {}) {
    const pool = await getPool();
    const request = pool.request();
    request.input('student_id', sql.Int, student_id);
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    let whereClause = 'WHERE se.student_id = @student_id';
    if (status) {
      whereClause += ' AND se.status = @status';
      request.input('status', sql.VarChar(20), status);
    }

    const query = `
      SELECT 
        se.*,
        c.title AS course_title,
        c.slug AS course_slug,
        c.thumbnail AS course_thumbnail,
        c.level AS course_level,
        c.total_lessons,
        c.total_duration,
        u.full_name AS teacher_name
      FROM StudentEnrollments se
      INNER JOIN Courses c ON se.course_id = c.id
      INNER JOIN Users u ON c.teacher_id = u.id
      ${whereClause}
      ORDER BY se.enrolled_at DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Đếm tổng số khóa học mà học viên đã đăng ký
   */
  static async countByStudent(student_id, status = null) {
    const pool = await getPool();
    const request = pool.request();
    request.input('student_id', sql.Int, student_id);

    let whereClause = 'WHERE se.student_id = @student_id';
    if (status) {
      whereClause += ' AND se.status = @status';
      request.input('status', sql.VarChar(20), status);
    }

    const query = `SELECT COUNT(*) as total FROM StudentEnrollments se ${whereClause}`;
    const result = await request.query(query);
    return result.recordset[0].total;
  }

  /**
   * Lấy danh sách học viên đăng ký một khóa học cụ thể
   */
  static async getByCourse(course_id, { offset = 0, limit = 10 } = {}) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('course_id', sql.Int, course_id)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT 
          se.*,
          u.full_name AS student_name,
          u.email AS student_email,
          u.phone AS student_phone,
          u.avatar AS student_avatar
        FROM StudentEnrollments se
        INNER JOIN Users u ON se.student_id = u.id
        WHERE se.course_id = @course_id
        ORDER BY se.enrolled_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `);

    return result.recordset;
  }

  /**
   * Cập nhật tiến độ hoàn thành khóa học (%)
   */
  static async updateProgress(student_id, course_id, progress_percent) {
    const pool = await getPool();
    const isCompleted = progress_percent >= 100;

    const result = await pool
      .request()
      .input('student_id', sql.Int, student_id)
      .input('course_id', sql.Int, course_id)
      .input('progress_percent', sql.Decimal(5, 2), progress_percent)
      .input('status', sql.VarChar(20), isCompleted ? 'completed' : 'active')
      .query(`
        UPDATE StudentEnrollments
        SET 
          progress_percent = @progress_percent,
          status = @status,
          completed_at = CASE WHEN @progress_percent >= 100 AND completed_at IS NULL THEN GETDATE() ELSE completed_at END
        OUTPUT INSERTED.*
        WHERE student_id = @student_id AND course_id = @course_id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Hủy đăng ký hoặc cập nhật trạng thái đăng ký
   */
  static async updateStatus(student_id, course_id, status) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('student_id', sql.Int, student_id)
      .input('course_id', sql.Int, course_id)
      .input('status', sql.VarChar(20), status)
      .query(`
        UPDATE StudentEnrollments
        SET status = @status
        OUTPUT INSERTED.*
        WHERE student_id = @student_id AND course_id = @course_id
      `);

    return result.recordset[0] || null;
  }
}

module.exports = EnrollmentModel;
