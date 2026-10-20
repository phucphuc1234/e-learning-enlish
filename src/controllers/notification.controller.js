/**
 * Controller xử lý các yêu cầu liên quan đến thông báo (Notifications)
 */

const NotificationService = require('../services/notification.service');
const { successResponse, paginatedResponse } = require('../utils/response');

class NotificationController {
  /**
   * Lấy danh sách thông báo của người dùng
   * GET /api/notifications
   */
  static async getMyNotifications(req, res, next) {
    try {
      const { notifications, unread_count, pagination } = await NotificationService.getUserNotifications(req.user.id, req.query);
      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách thông báo thành công',
        data: notifications,
        unread_count,
        pagination
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Đánh dấu một thông báo là đã đọc
   * PATCH /api/notifications/:id/read
   */
  static async markAsRead(req, res, next) {
    try {
      const notification = await NotificationService.markAsRead(req.params.id, req.user.id);
      return successResponse(res, notification, 'Đã đánh dấu thông báo là đã đọc');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Đánh dấu toàn bộ thông báo là đã đọc
   * PATCH /api/notifications/read-all
   */
  static async markAllAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAllAsRead(req.user.id);
      return successResponse(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Xóa thông báo
   * DELETE /api/notifications/:id
   */
  static async deleteNotification(req, res, next) {
    try {
      const result = await NotificationService.deleteNotification(req.params.id, req.user.id);
      return successResponse(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = NotificationController;
