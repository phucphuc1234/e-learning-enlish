import { createApp } from "./app.js";
import { verifyPassword } from "./database.js";

const app = createApp();
if (process.env.NODE_ENV === "production") {
  const demo = app.locals.store.all(
    "SELECT password_hash FROM users WHERE email IN ('admin@elearning.com','teacher@elearning.com','student@elearning.com')",
  );
  if (demo.some((u) => verifyPassword("EnglishDemo!2026", u.password_hash))) {
    throw new Error(
      "Refusing production startup with local demo passwords. Use a separate production database and create an administrator securely.",
    );
  }
}
const port = Number(process.env.PORT) || 5000;
const server = app.listen(port, process.env.HOST || "127.0.0.1", () => {
  console.log(`English API listening on port ${port}; SQLite connected`);
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    server.close(() => {
      app.locals.store.db.close();
      process.exit(0);
    });
  });
