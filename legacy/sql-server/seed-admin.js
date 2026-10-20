
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { sql, getPool, closeDB } = require('../src/config/database');

async function seedAdmin() {
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || '';

    if (!email || password.length < 10) {
        throw new Error('Cần cấu hình ADMIN_EMAIL và ADMIN_PASSWORD (ít nhất 10 ký tự) trong .env');
    }

    const pool = await getPool();

    const result = await pool.request()
        .input('email', sql.VarChar(100), email)
        .query('SELECT id, role FROM Users WHERE email = @email');

    const existingUser = result.recordset[0];
    const hashedPassword = await bcrypt.hash(password, 12);

    if (existingUser) {
        if (existingUser.role !== 'admin') {
            throw new Error('Email này thuộc tài khoản không phải admin. Không tự nâng quyền.');
        }

        await pool.request()
            .input('email', sql.VarChar(100), email)
            .input('password', sql.VarChar(255), hashedPassword)
            .query(`
        UPDATE Users
        SET password = @password,
            is_active = 1,
            updated_at = GETDATE()
        WHERE email = @email AND role = 'admin'
      `);

        console.log('Đã cập nhật mật khẩu Admin thành công!');
    } else {
        await pool.request()
            .input('email', sql.VarChar(100), email)
            .input('password', sql.VarChar(255), hashedPassword)
            .input('name', sql.NVarChar(100), 'Quản trị hệ thống')
            .query(`
        INSERT INTO Users
          (full_name, email, password, role, is_active)
        VALUES
          (@name, @email, @password, 'admin', 1)
      `);

        console.log('Đã tạo tài khoản Admin thành công!');
    }
}

seedAdmin()
    .catch((error) => {
        console.error('Lỗi:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await closeDB();
    });
