/**
 * Middleware xác thực và phân quyền (Authentication & Authorization)
 */

const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { errorResponse } = require('../utils/response');
const { sql, getPool } = require('../config/database');

/**
 * Middleware xác thực token JWT
 * Kiểm tra token từ Authorization header: "Bearer <token>"
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Vui lòng đăng nhập để tiếp tục (Thiếu token xác thực)', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, 'Token không hợp lệ', 401);
    }

    // Xác thực token
    let decoded;
    try {
      decoded = jwt.verify(token, jwtConfig.secret);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return errorResponse(res, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 401);
      }
      return errorResponse(res, 'Token xác thực không hợp lệ', 401);
    }

    // Kiểm tra xem user còn tồn tại và đang hoạt động không
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, decoded.id)
      .query('SELECT id, full_name, email, role, is_active FROM Users WHERE id = @id');

    if (result.recordset.length === 0) {
      return errorResponse(res, 'Tài khoản người dùng không còn tồn tại', 401);
    }

    const user = result.recordset[0];
    if (!user.is_active) {
      return errorResponse(res, 'Tài khoản của bạn đã bị khóa', 403);
    }

    // Gắn thông tin người dùng vào request
    req.user = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (err) {
    console.error('Lỗi middleware authenticate:', err);
    return errorResponse(res, 'Lỗi hệ thống trong quá trình xác thực', 500);
  }
};

/**
 * Middleware phân quyền theo vai trò (Role-Based Access Control)
 * @param  {...string} roles - Danh sách vai trò được phép truy cập ('admin', 'teacher', 'student')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Yêu cầu đăng nhập trước khi thực hiện thao tác này', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: [${roles.join(', ')}]`,
        403
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
