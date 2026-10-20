/**
 * Controller quản lý người dùng (Dành cho Quản trị viên)
 */

const UserService = require('../services/user.service');
const { successResponse, paginatedResponse } = require('../utils/response');

class UserController {
  /**
   * Lấy danh sách người dùng có phân trang
   * GET /api/users
   */
  static async getAllUsers(req, res, next) {
    try {
      const { users, pagination } = await UserService.getAllUsers(req.query);
      return paginatedResponse(res, users, pagination, 'Lấy danh sách người dùng thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Lấy chi tiết một người dùng
   * GET /api/users/:id
   */
  static async getUserById(req, res, next) {
    try {
      const user = await UserService.getUserById(req.params.id);
      return successResponse(res, user, 'Lấy thông tin người dùng thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tạo tài khoản người dùng mới
   * POST /api/users
   */
  static async createUser(req, res, next) {
    try {
      const newUser = await UserService.createUser(req.body);
      return successResponse(res, newUser, 'Tạo tài khoản người dùng thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cập nhật thông tin người dùng
   * PUT /api/users/:id
   */
  static async updateUser(req, res, next) {
    try {
      const updatedUser = await UserService.updateUser(req.params.id, req.body);
      return successResponse(res, updatedUser, 'Cập nhật thông tin người dùng thành công');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Xóa người dùng
   * DELETE /api/users/:id
   */
  static async deleteUser(req, res, next) {
    try {
      const result = await UserService.deleteUser(req.params.id);
      return successResponse(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;
