import sql from "mssql";
import { AsyncLocalStorage } from "node:async_hooks";

const tables = new Set([
  "users",
  "sessions",
  "programs",
  "courses",
  "lessons",
  "exercises",
  "questions",
  "answers",
  "exams",
  "exam_questions",
  "enrollments",
  "progress",
  "attempts",
  "notifications",
  "learning_paths",
  "path_courses",
  "study_sessions",
  "learning_reports",
  "app_settings",
]);
const identifier = (name) => {
  if (!/^[A-Za-z][A-Za-z0-9_]{0,127}$/.test(name))
    throw new Error("Invalid SQL identifier");
  return `[${name}]`;
};
const tableId = (name) => {
  if (!tables.has(name)) throw new Error("Unknown application table");
  return `dbo.${identifier(name)}`;
};
const boolean = (name, fallback) => {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  if (!["true", "false"].includes(value))
    throw new Error(`${name} phải là true hoặc false.`);
  return value === "true";
};
export function connectionConfig(
  database = process.env.DB_DATABASE || "ELearningEnglish_Demo",
) {
  if (!process.env.DB_PASSWORD)
    throw new Error(
      "Chưa có DB_PASSWORD. Điền mật khẩu SQL Server trong file .env trên máy bạn.",
    );
  const parts = (process.env.DB_SERVER || "localhost").split("\\");
  const server = parts[0],
    instanceName = process.env.DB_INSTANCE || parts[1];
  if (!server || parts.length > 2)
    throw new Error(
      "DB_SERVER không hợp lệ. Dùng tên máy hoặc địa chỉ IP, không thêm http://.",
    );
  const port = Number(process.env.DB_PORT || 1433);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("DB_PORT phải từ 1 đến 65535.");
  return {
    server,
    database,
    user: process.env.DB_USER || "sa",
    password: process.env.DB_PASSWORD,
    ...(instanceName ? {} : { port }),
    options: {
      encrypt: boolean("DB_ENCRYPT", true),
      trustServerCertificate: boolean("DB_TRUST_SERVER_CERTIFICATE", false),
      ...(instanceName ? { instanceName } : {}),
      useUTC: true,
      abortTransactionOnError: true,
    },
    pool: { min: 0, max: 10, idleTimeoutMillis: 30000 },
    connectionTimeout: 15000,
    requestTimeout: 60000,
  };
}

// Replace only real placeholders. Quoted strings, identifiers and comments are preserved.
export function parameterize(statement, args) {
  let output = "",
    index = 0,
    mode = "code";
  for (let i = 0; i < statement.length; i++) {
    const c = statement[i],
      next = statement[i + 1];
    if (mode === "line") {
      output += c;
      if (c === "\n") mode = "code";
      continue;
    }
    if (mode === "block") {
      output += c;
      if (c === "*" && next === "/") {
        output += next;
        i++;
        mode = "code";
      }
      continue;
    }
    if (mode !== "code") {
      output += c;
      const end = mode === "string" ? "'" : mode === "bracket" ? "]" : '"';
      if (c === end) {
        if (next === end) {
          output += next;
          i++;
        } else mode = "code";
      }
      continue;
    }
    if (c === "'") mode = "string";
    else if (c === "[") mode = "bracket";
    else if (c === '"') mode = "identifier";
    else if (c === "-" && next === "-") mode = "line";
    else if (c === "/" && next === "*") mode = "block";
    if (c === "?") output += `@p${index++}`;
    else output += c;
  }
  if (index !== args.length) throw new Error("SQL parameter count mismatch");
  return output;
}
const normalize = (row) =>
  row &&
  Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      value instanceof Date
        ? value.toISOString()
        : typeof value === "boolean"
          ? Number(value)
          : value,
    ]),
  );
const used = () =>
  Object.assign(
    new Error(
      "Nội dung đã có bài làm. Hãy ẩn nội dung để giữ lịch sử học tập, hoặc xử lý bài làm liên quan trước.",
    ),
    { status: 409 },
  );

// Pool injection is used by adapter tests; normal startup always makes a real TDS connection.
export function createSqlStore(pool, database) {
  const scope = new AsyncLocalStorage();
  async function query(statement, args = []) {
    const request = scope.getStore()?.request() || pool.request();
    const bound = parameterize(statement, args);
    args.forEach((value, index) => {
      const type =
        value instanceof Date
          ? sql.DateTime2(3)
          : typeof value === "boolean"
            ? sql.Bit
            : typeof value === "number"
              ? Number.isSafeInteger(value) && Math.abs(value) <= 2147483647
                ? sql.Int
                : sql.Float
              : sql.NVarChar(sql.MAX);
      request.input(`p${index}`, type, value ?? null);
    });
    return request.query(bound);
  }
  const all = async (statement, ...args) =>
    ((await query(statement, args)).recordset || []).map(normalize);
  const get = async (statement, ...args) => (await all(statement, ...args))[0];
  const run = async (statement, ...args) => ({
    changes: ((await query(statement, args)).rowsAffected || []).reduce(
      (n, v) => n + v,
      0,
    ),
  });
  const insert = async (table, data) => {
    const keys = Object.keys(data);
    return get(
      `INSERT INTO ${tableId(table)} (${keys.map(identifier).join(",")}) OUTPUT INSERTED.* VALUES (${keys.map(() => "?").join(",")})`,
      ...Object.values(data),
    );
  };
  const update = async (table, id, data) => {
    const keys = Object.keys(data);
    if (keys.length)
      await run(
        `UPDATE ${tableId(table)} SET ${keys.map((k) => `${identifier(k)}=?`).join(",")} WHERE id=?`,
        ...Object.values(data),
        id,
      );
    return get(`SELECT * FROM ${tableId(table)} WHERE id=?`, id);
  };
  async function transaction(fn) {
    if (scope.getStore()) return fn();
    for (let attempt = 0; ; attempt++) {
      const tx = pool.transaction();
      await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
      try {
        const result = await scope.run(tx, fn);
        await tx.commit();
        return result;
      } catch (error) {
        try {
          await tx.rollback();
        } catch {}
        if (error.number === 1205 && attempt < 2) continue;
        throw error;
      }
    }
  }
  async function remove(table, id) {
    tableId(table);
    return transaction(async () => {
      if (table === "users") {
        if (
          (await get("SELECT id FROM courses WHERE teacher_id=?", id)) ||
          (await get("SELECT id FROM learning_paths WHERE teacher_id=?", id))
        )
          throw Object.assign(
            new Error(
              "Tài khoản còn phụ trách khóa học/lộ trình. Hãy khóa tài khoản hoặc chuyển nội dung trước.",
            ),
            { status: 409 },
          );
        await run("UPDATE attempts SET graded_by=NULL WHERE graded_by=?", id);
        for (const name of ["sessions", "notifications"])
          await run(`DELETE FROM ${tableId(name)} WHERE user_id=?`, id);
        for (const name of [
          "learning_reports",
          "study_sessions",
          "progress",
          "attempts",
          "enrollments",
        ])
          await run(`DELETE FROM ${tableId(name)} WHERE student_id=?`, id);
      }
      if (table === "programs") {
        await run("UPDATE courses SET program_id=NULL WHERE program_id=?", id);
        await run(
          "UPDATE learning_paths SET program_id=NULL WHERE program_id=?",
          id,
        );
      }
      if (table === "courses") {
        if (await get("SELECT id FROM attempts WHERE course_id=?", id))
          throw used();
        for (const l of await all(
          "SELECT id FROM lessons WHERE course_id=?",
          id,
        ))
          await remove("lessons", l.id);
        for (const e of await all("SELECT id FROM exams WHERE course_id=?", id))
          await remove("exams", e.id);
        await run("DELETE FROM learning_reports WHERE course_id=?", id);
        await run("DELETE FROM enrollments WHERE course_id=?", id);
        await run("DELETE FROM path_courses WHERE course_id=?", id);
      }
      if (table === "lessons") {
        if (
          await get(
            "SELECT a.id FROM attempts a JOIN exercises e ON e.id=a.exercise_id WHERE e.lesson_id=?",
            id,
          )
        )
          throw used();
        for (const e of await all(
          "SELECT id FROM exercises WHERE lesson_id=?",
          id,
        ))
          await remove("exercises", e.id);
        await run("DELETE FROM progress WHERE lesson_id=?", id);
        await run("DELETE FROM study_sessions WHERE lesson_id=?", id);
      }
      if (table === "exercises") {
        if (await get("SELECT id FROM attempts WHERE exercise_id=?", id))
          throw used();
        for (const q of await all(
          "SELECT id FROM questions WHERE exercise_id=?",
          id,
        ))
          await remove("questions", q.id);
      }
      if (table === "questions") {
        await run("DELETE FROM answers WHERE question_id=?", id);
        await run("DELETE FROM exam_questions WHERE question_id=?", id);
      }
      if (table === "exams") {
        if (await get("SELECT id FROM attempts WHERE exam_id=?", id))
          throw used();
        await run("DELETE FROM exam_questions WHERE exam_id=?", id);
      }
      if (table === "learning_paths")
        await run("DELETE FROM path_courses WHERE path_id=?", id);
      await run(`DELETE FROM ${tableId(table)} WHERE id=?`, id);
    });
  }
  async function recordProgress({
    studentId,
    lessonId,
    sessionId,
    seconds,
    complete,
  }) {
    const request = pool.request();
    request
      .input("StudentId", sql.Int, studentId)
      .input("LessonId", sql.Int, lessonId)
      .input("SessionId", sql.UniqueIdentifier, sessionId)
      .input("Seconds", sql.Int, seconds)
      .input("Complete", sql.Bit, Boolean(complete));
    return normalize(
      (await request.execute("dbo.usp_RecordLessonProgress")).recordset[0],
    );
  }
  const close = () => pool.close();
  return {
    driver: "mssql",
    database,
    pool,
    db: { close },
    close,
    all,
    get,
    run,
    insert,
    update,
    transaction,
    remove,
    recordProgress,
  };
}

export async function openSqlServer({
  database = process.env.DB_DATABASE || "ELearningEnglish_Demo",
} = {}) {
  const pool = new sql.ConnectionPool(connectionConfig(database));
  pool.on("error", (error) =>
    console.error("SQL Server pool:", error.code || "ERROR"),
  );
  try {
    await pool.connect();
    const store = createSqlStore(pool, database);
    const version = await store.get(
      "SELECT value FROM dbo.app_settings WHERE [key]='schema_version'",
    );
    if (!version)
      throw Object.assign(
        new Error(
          "Database chưa có schema English Studio. Chạy EnglishStudio_Full.sql trước.",
        ),
        { code: "ESCHEMA" },
      );
    return store;
  } catch (error) {
    await pool.close().catch(() => {});
    throw error;
  }
}

export function connectionHint(error) {
  const code = error.code || error.originalError?.code;
  if (code === "ELOGIN" || error.number === 18456)
    return "SQL Server từ chối đăng nhập. Kiểm tra DB_USER, DB_PASSWORD và chế độ SQL Server Authentication.";
  if (error.number === 4060)
    return "Không mở được database. Kiểm tra DB_DATABASE=ELearningEnglish_Demo và quyền truy cập của tài khoản SQL.";
  if (
    [
      "ETIMEOUT",
      "ESOCKET",
      "ECONNREFUSED",
      "ENOTFOUND",
      "EINSTLOOKUP",
    ].includes(code)
  )
    return "Không kết nối được SQL Server qua TCP. Kiểm tra DB_SERVER, DB_PORT; bật TCP/IP và khởi động lại dịch vụ SQL Server. Nếu lỗi chứng chỉ trên máy local, dùng DB_TRUST_SERVER_CERTIFICATE=true.";
  if (code === "ESCHEMA" || error.number === 208)
    return "Database chưa có bảng English Studio. Chọn đúng DB_DATABASE và chạy file SQL đã gửi trước.";
  if (
    error.message?.startsWith("Chưa có DB_") ||
    error.message?.startsWith("DB_")
  )
    return error.message;
  return `Không kết nối được SQL Server (${code || error.number || "ERROR"}). Kiểm tra cấu hình .env; không gửi mật khẩu trong chat.`;
}
