/**
 * Middleware kiểm tra dữ liệu đầu vào sử dụng express-validator
 */

const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

/**
 * Middleware bọc kiểm tra kết quả validation của express-validator
 * Nếu có lỗi validate, trả về mã lỗi 422 hoặc 400 kèm danh sách lỗi
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Chạy tuần tự các validation rules
    if (Array.isArray(validations)) {
      for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
      }
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format lại mảng lỗi để client dễ hiển thị
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return errorResponse(
      res,
      'Dữ liệu yêu cầu không hợp lệ hoặc thiếu thông tin bắt buộc',
      400,
      formattedErrors
    );
  };
};

module.exports = {
  validate
};
