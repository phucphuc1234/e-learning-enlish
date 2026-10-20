/**
 * Middleware xử lý lỗi tập trung toàn hệ thống (Global Error Handler)
 */

const { errorResponse } = require('../utils/response');

/**
 * Xử lý các route không tồn tại (404 Not Found)
 */
const notFoundHandler = (req, res, next) => {
  return errorResponse(res, `Đường dẫn [${req.method}] ${req.originalUrl} không tồn tại trên hệ thống`, 404);
};

/**
 * Middleware bắt lỗi toàn cục (Global Exception Handler)
 */
const errorHandler = (err, req, res, next) => {
  console.error('🔥 [Unhandled Error]:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method
  });

  // Lỗi cú pháp JSON request body không hợp lệ
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 'Cú pháp JSON trong request body không hợp lệ', 400);
  }

  // Lỗi do SQL Server (mssql library)
  if (err.name === 'RequestError' || err.name === 'MSSQLError') {
    return errorResponse(
      res,
      'Lỗi truy vấn cơ sở dữ liệu: ' + (process.env.NODE_ENV === 'development' ? err.message : 'Vui lòng thử lại sau'),
      500,
      process.env.NODE_ENV === 'development' ? err : undefined
    );
  }

  // Lỗi Multer khi upload file vượt quá kích thước hoặc định dạng không cho phép
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'Dung lượng file tải lên vượt quá giới hạn cho phép (Tối đa 10MB)', 400);
    }
    return errorResponse(res, `Lỗi tải file: ${err.message}`, 400);
  }

  // Các lỗi xác thực JWT
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Token xác thực không hợp lệ', 401);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Lỗi hệ thống nội bộ (Internal Server Error)';

  return errorResponse(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  );
};

module.exports = {
  notFoundHandler,
  errorHandler
};
