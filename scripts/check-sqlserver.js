import { openDatabase, verifyPassword } from "../server/database.js";
import { connectionHint } from "../server/sqlserver-store.js";

let store;
try {
  store = await openDatabase({ driver: "mssql" });
  const info = await store.get(
    "SELECT DB_NAME() AS database_name,(SELECT COUNT(*) FROM dbo.users) AS users,(SELECT COUNT(*) FROM dbo.courses) AS courses,(SELECT COUNT(*) FROM dbo.lessons) AS lessons",
  );
  const proc = await store.get(
    "SELECT OBJECT_ID(N'dbo.usp_RecordLessonProgress',N'P') AS id",
  );
  if (!proc.id)
    throw Object.assign(new Error("Missing progress procedure"), {
      code: "ESCHEMA",
    });
  console.log("SQL Server connected.");
  console.log(
    `Database: ${info.database_name} | users: ${info.users} | courses: ${info.courses} | lessons: ${info.lessons}`,
  );
  const demo = await store.get(
    "SELECT password_hash FROM dbo.users WHERE email='student@elearning.com'",
  );
  if (demo && verifyPassword("EnglishDemo!2026", demo.password_hash))
    console.log("Demo student password hash: OK.");
} catch (error) {
  console.error(connectionHint(error));
  process.exitCode = 1;
} finally {
  await store?.db.close();
}
