import { createApp } from "./app.js";
import { verifyPassword } from "./database.js";
import { connectionHint } from "./sqlserver-store.js";

let app;
try {
  app = await createApp();
  if (process.env.NODE_ENV === "production") {
    const demo = await app.locals.store.all(
      "SELECT password_hash FROM users WHERE email IN ('admin@elearning.com','teacher@elearning.com','student@elearning.com')",
    );
    if (demo.some((u) => verifyPassword("EnglishDemo!2026", u.password_hash)))
      throw new Error(
        "Refusing production startup with local demo passwords. Use a separate production database and create an administrator securely.",
      );
  }
} catch (error) {
  await app?.locals.store.db.close();
  console.error(
    process.env.DB_DRIVER === "mssql" ? connectionHint(error) : error.message,
  );
  process.exit(1);
}
const port = Number(process.env.PORT) || 5000;
const server = app.listen(port, process.env.HOST || "127.0.0.1", () => {
  console.log(
    `English API listening on port ${port}; ${app.locals.store.driver === "mssql" ? "SQL Server" : "SQLite"} connected`,
  );
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    server.close(async () => {
      await app.locals.store.db.close();
      process.exit(0);
    });
  });
