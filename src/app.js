/**
 * Điểm khởi chạy chính của ứng dụng backend E-Learning English
 * Express Server Setup, Middleware, Route Mounting, Error Handling
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { getPool, closeDB } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Đảm bảo thư mục uploads tồn tại để lưu trữ file
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// =============================================
// GLOBAL MIDDLEWARES
// =============================================
app.use(cors({
  origin: '*', // Trong môi trường production có thể thay thế bằng domain cụ thể
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static files (Uploads)
app.use('/uploads', express.static(uploadsDir));

// =============================================
// HEALTH CHECK ROUTE
// =============================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Chào mừng bạn đến với E-Learning English REST API Server',
    version: '1.0.0',
    documentation: '/api',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT 1 as isAlive');
    if (result.recordset.length > 0) {
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  res.json({
    status: 'OK',
    uptime: process.uptime(),
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// =============================================
// API ROUTES MOUNTING
// =============================================
// Route tổng sẽ được mount từ src/routes/index.js
const routes = require('./routes');
app.use('/api', routes);

// =============================================
// ERROR HANDLING MIDDLEWARES
// =============================================
app.use(notFoundHandler);
app.use(errorHandler);

// =============================================
// SERVER INITIALIZATION
// =============================================
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, async () => {
    console.log(`🚀 Server đang chạy trên cổng ${PORT} trong môi trường ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    
    // Tự động kiểm tra kết nối CSDL khi khởi động
    try {
      await getPool();
    } catch (err) {
      console.warn('⚠️ Cảnh báo: Chưa thể kết nối tới SQL Server ngay bây giờ. Hệ thống sẽ thử kết nối lại khi có request.');
    }
  });

  // Graceful Shutdown
  const gracefulShutdown = async () => {
    console.log('\n🛑 Đang nhận tín hiệu dừng server...');
    server.close(async () => {
      console.log('🛑 HTTP Server đã đóng.');
      await closeDB();
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

module.exports = app;
