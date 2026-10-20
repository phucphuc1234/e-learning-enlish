/**
 * Configuration và kết nối SQL Server thông qua thư viện mssql
 * Cung cấp Connection Pool dùng chung cho toàn bộ ứng dụng
 */

const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: process.env.DB_DATABASE || 'ELearningEnglish',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    enableArithAbort: true
  },
  pool: {
    max: 15,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise = null;

/**
 * Lấy hoặc khởi tạo connection pool duy nhất cho toàn server
 * @returns {Promise<sql.ConnectionPool>}
 */
const getPool = async () => {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(dbConfig)
      .connect()
      .then(pool => {
        console.log('✅ Đã kết nối thành công tới SQL Server Database: ' + dbConfig.database);
        return pool;
      })
      .catch(err => {
        console.error('❌ Lỗi kết nối SQL Server:', err.message);
        poolPromise = null; // Reset để lần gọi sau có thể thử kết nối lại
        throw err;
      });
  }
  return poolPromise;
};

/**
 * Đóng kết nối database khi tắt server
 */
const closeDB = async () => {
  if (poolPromise) {
    try {
      const pool = await poolPromise;
      await pool.close();
      poolPromise = null;
      console.log('🔌 Đã đóng kết nối SQL Server.');
    } catch (err) {
      console.error('Lỗi khi đóng kết nối SQL Server:', err.message);
    }
  }
};

module.exports = {
  sql,
  getPool,
  closeDB,
  dbConfig
};
