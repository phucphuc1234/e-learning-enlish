/**
 * Model quản lý dữ liệu bảng Courses (Khóa học)
 * Bao gồm các truy vấn JOIN với bảng Programs và Users (Teacher)
 */

const { sql, getPool } = require('../config/database');

class CourseModel {
  /**
   * Lấy danh sách khóa học với bộ lọc, tìm kiếm và phân trang
   */
  static async findAll({
    offset = 0,
    limit = 10,
    program_id = null,
    teacher_id = null,
    level = null,
    is_published = null,
    is_free = null,
    search = null
  }) {
    const pool = await getPool();
    const request = pool.request();

    let whereClause = 'WHERE 1=1';

    if (program_id) {
      whereClause += ' AND c.program_id = @program_id';
      request.input('program_id', sql.Int, program_id);
    }

    if (teacher_id) {
      whereClause += ' AND c.teacher_id = @teacher_id';
      request.input('teacher_id', sql.Int, teacher_id);
    }

    if (level) {
      whereClause += ' AND c.level = @level';
      request.input('level', sql.VarChar(20), level);
    }

    if (is_published !== null && is_published !== undefined) {
      whereClause += ' AND c.is_published = @is_published';
      request.input('is_published', sql.Bit, is_published ? 1 : 0);
    }

    if (is_free !== null && is_free !== undefined) {
      whereClause += ' AND c.is_free = @is_free';
      request.input('is_free', sql.Bit, is_free ? 1 : 0);
    }

    if (search) {
      whereClause += ' AND (c.title LIKE @search OR c.description LIKE @search)';
      request.input('search', sql.NVarChar(200), `%${search}%`);
    }

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const query = `
      SELECT 
        c.*,
        p.name AS program_name,
        p.slug AS program_slug,
        u.full_name AS teacher_name,
        u.email AS teacher_email,
        u.avatar AS teacher_avatar,
        (SELECT COUNT(*) FROM StudentEnrollments se WHERE se.course_id = c.id) AS total_enrolled
      FROM Courses c
      INNER JOIN Programs p ON c.program_id = p.id
      INNER JOIN Users u ON c.teacher_id = u.id
      ${whereClause}
      ORDER BY c.id DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const result = await request.query(query);
    return result.recordset;
  }

  /**
   * Đếm tổng số khóa học theo bộ lọc
   */
  static async count({
    program_id = null,
    teacher_id = null,
    level = null,
    is_published = null,
    is_free = null,
    search = null
  }) {
    const pool = await getPool();
    const request = pool.request();

    let whereClause = 'WHERE 1=1';

    if (program_id) {
      whereClause += ' AND c.program_id = @program_id';
      request.input('program_id', sql.Int, program_id);
    }

    if (teacher_id) {
      whereClause += ' AND c.teacher_id = @teacher_id';
      request.input('teacher_id', sql.Int, teacher_id);
    }

    if (level) {
      whereClause += ' AND c.level = @level';
      request.input('level', sql.VarChar(20), level);
    }

    if (is_published !== null && is_published !== undefined) {
      whereClause += ' AND c.is_published = @is_published';
      request.input('is_published', sql.Bit, is_published ? 1 : 0);
    }

    if (is_free !== null && is_free !== undefined) {
      whereClause += ' AND c.is_free = @is_free';
      request.input('is_free', sql.Bit, is_free ? 1 : 0);
    }

    if (search) {
      whereClause += ' AND (c.title LIKE @search OR c.description LIKE @search)';
      request.input('search', sql.NVarChar(200), `%${search}%`);
    }

    const query = `
      SELECT COUNT(*) as total 
      FROM Courses c
      ${whereClause}
    `;

    const result = await request.query(query);
    return result.recordset[0].total;
  }

  /**
   * Tìm khóa học theo ID (kèm thông tin chương trình và giảng viên)
   */
  static async findById(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          c.*,
          p.name AS program_name,
          p.slug AS program_slug,
          u.full_name AS teacher_name,
          u.email AS teacher_email,
          u.avatar AS teacher_avatar,
          (SELECT COUNT(*) FROM StudentEnrollments se WHERE se.course_id = c.id) AS total_enrolled
        FROM Courses c
        INNER JOIN Programs p ON c.program_id = p.id
        INNER JOIN Users u ON c.teacher_id = u.id
        WHERE c.id = @id
      `);

    return result.recordset[0] || null;
  }

  /**
   * Tìm khóa học theo slug
   */
  static async findBySlug(slug) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('slug', sql.VarChar(200), slug)
      .query(`
        SELECT 
          c.*,
          p.name AS program_name,
          p.slug AS program_slug,
          u.full_name AS teacher_name,
          u.email AS teacher_email,
          u.avatar AS teacher_avatar,
          (SELECT COUNT(*) FROM StudentEnrollments se WHERE se.course_id = c.id) AS total_enrolled
        FROM Courses c
        INNER JOIN Programs p ON c.program_id = p.id
        INNER JOIN Users u ON c.teacher_id = u.id
        WHERE c.slug = @slug
      `);

    return result.recordset[0] || null;
  }

  /**
   * Lấy danh sách khóa học theo chương trình
   */
  static async findByProgram(program_id, { offset = 0, limit = 10, is_published = 1 } = {}) {
    return this.findAll({ offset, limit, program_id, is_published });
  }

  /**
   * Lấy danh sách khóa học theo giáo viên
   */
  static async findByTeacher(teacher_id, { offset = 0, limit = 10 } = {}) {
    return this.findAll({ offset, limit, teacher_id });
  }

  /**
   * Tạo khóa học mới
   */
  static async create({
    program_id,
    teacher_id,
    title,
    slug,
    description = null,
    thumbnail = null,
    level = 'beginner',
    price = 0,
    is_free = 0,
    is_published = 0
  }) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('program_id', sql.Int, program_id)
      .input('teacher_id', sql.Int, teacher_id)
      .input('title', sql.NVarChar(200), title)
      .input('slug', sql.VarChar(200), slug)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('thumbnail', sql.VarChar(500), thumbnail)
      .input('level', sql.VarChar(20), level)
      .input('price', sql.Decimal(10, 2), price)
      .input('is_free', sql.Bit, is_free ? 1 : 0)
      .input('is_published', sql.Bit, is_published ? 1 : 0)
      .query(`
        INSERT INTO Courses (
          program_id, teacher_id, title, slug, description, thumbnail,
          level, price, is_free, is_published, total_lessons, total_duration,
          created_at, updated_at
        )
        OUTPUT INSERTED.*
        VALUES (
          @program_id, @teacher_id, @title, @slug, @description, @thumbnail,
          @level, @price, @is_free, @is_published, 0, 0,
          GETDATE(), GETDATE()
        )
      `);

    return result.recordset[0];
  }

  /**
   * Cập nhật thông tin khóa học
   */
  static async update(id, updateData) {
    const pool = await getPool();
    const request = pool.request();
    request.input('id', sql.Int, id);

    const updateFields = [];

    if (updateData.program_id !== undefined) {
      request.input('program_id', sql.Int, updateData.program_id);
      updateFields.push('program_id = @program_id');
    }
    if (updateData.teacher_id !== undefined) {
      request.input('teacher_id', sql.Int, updateData.teacher_id);
      updateFields.push('teacher_id = @teacher_id');
    }
    if (updateData.title !== undefined) {
      request.input('title', sql.NVarChar(200), updateData.title);
      updateFields.push('title = @title');
    }
    if (updateData.slug !== undefined) {
      request.input('slug', sql.VarChar(200), updateData.slug);
      updateFields.push('slug = @slug');
    }
    if (updateData.description !== undefined) {
      request.input('description', sql.NVarChar(sql.MAX), updateData.description);
      updateFields.push('description = @description');
    }
    if (updateData.thumbnail !== undefined) {
      request.input('thumbnail', sql.VarChar(500), updateData.thumbnail);
      updateFields.push('thumbnail = @thumbnail');
    }
    if (updateData.level !== undefined) {
      request.input('level', sql.VarChar(20), updateData.level);
      updateFields.push('level = @level');
    }
    if (updateData.price !== undefined) {
      request.input('price', sql.Decimal(10, 2), updateData.price);
      updateFields.push('price = @price');
    }
    if (updateData.is_free !== undefined) {
      request.input('is_free', sql.Bit, updateData.is_free ? 1 : 0);
      updateFields.push('is_free = @is_free');
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
      UPDATE Courses
      SET ${updateFields.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id
    `;

    const result = await request.query(query);
    return result.recordset[0] || null;
  }

  /**
   * Cập nhật số bài học và tổng thời lượng khóa học dựa trên bảng Lessons
   */
  static async updateCounters(course_id) {
    const pool = await getPool();
    await pool
      .request()
      .input('course_id', sql.Int, course_id)
      .query(`
        UPDATE Courses
        SET 
          total_lessons = (SELECT COUNT(*) FROM Lessons WHERE course_id = @course_id),
          total_duration = ISNULL((SELECT SUM(duration) FROM Lessons WHERE course_id = @course_id), 0),
          updated_at = GETDATE()
        WHERE id = @course_id
      `);
  }

  /**
   * Xóa khóa học
   */
  static async delete(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Courses WHERE id = @id');

    return result.rowsAffected[0] > 0;
  }
}

module.exports = CourseModel;
