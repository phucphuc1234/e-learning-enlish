import { openDatabase, hashPassword, now } from "../server/database.js";

if (
  !process.env.ADMIN_EMAIL ||
  !process.env.ADMIN_NAME ||
  !process.env.ADMIN_PASSWORD
) {
  console.error(
    "Set ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD securely in the process environment. Password: at least 12 characters.",
  );
  process.exit(1);
}
if (process.env.ADMIN_PASSWORD.length < 12)
  throw new Error("Administrator password requires at least 12 characters");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.ADMIN_EMAIL))
  throw new Error("Invalid email");
const store = openDatabase();
try {
  store.insert("users", {
    email: process.env.ADMIN_EMAIL.trim().toLowerCase(),
    full_name: process.env.ADMIN_NAME.trim(),
    password_hash: hashPassword(process.env.ADMIN_PASSWORD),
    role: "admin",
    created_at: now(),
  });
  console.log("Administrator created.");
} finally {
  store.db.close();
}
