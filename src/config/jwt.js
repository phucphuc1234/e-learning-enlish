/**
 * Cấu hình JWT (JSON Web Token) cho xác thực người dùng
 */

require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'elearning_english_default_fallback_secret_key',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  algorithm: 'HS256'
};
