/**
 * Controller xử lý các yêu cầu liên quan đến xác thực và thông tin tài khoản
 */

const AuthService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');

class AuthController {
  /**
   * Đăng ký tài khoản học viên mới
   * POST /api/auth/register
   */
  static async register(req, res, next) {
    try {
      const { full_name, email, password, phone } = req.body;
      const result = await AuthService.register({ full_name, email, password, phone });
      return successResponse(res, result, 'Đăng ký tài khoản thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Đăng nhập người dùng
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });
      return successResponse(res, result, 'Đăng nhập thành công', 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy thông tin tài khoản đang đăng nhập
   * GET /api/auth/profile
   */
  static async getProfile(req, res, next) {
    try {
      const user = await AuthService.getProfile(req.user.id);
      return successResponse(res, user, 'Lấy thông tin cá nhân thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cập nhật thông tin tài khoản
   * PUT /api/auth/profile
   */
  static async updateProfile(req, res, next) {
    try {
      const { full_name, phone, avatar } = req.body;
      const updatedUser = await AuthService.updateProfile(req.user.id, { full_name, phone, avatar });
      return successResponse(res, updatedUser, 'Cập nhật thông tin cá nhân thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Đổi mật khẩu
   * PUT /api/auth/change-password
   */
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await AuthService.changePassword(req.user.id, { currentPassword, newPassword });
      return successResponse(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
