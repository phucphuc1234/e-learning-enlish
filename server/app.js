import { gradeQuestions as grade } from "./grading.js";
import {
  filterAsync,
  flatMapAsync,
  forEachAsync,
  mapAsync,
} from "./async-utils.js";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  openDatabase,
  hashPassword,
  verifyPassword,
  publicUser,
  now,
} from "./database.js";
const fail = (status, message) => {
  throw Object.assign(new Error(message), {
    status,
  });
};
const positive = (value, name = "ID") => {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) fail(400, `${name} không hợp lệ`);
  return n;
};
const text = (v, name, max = 20000) => {
  if (typeof v !== "string" || !v.trim() || v.length > max)
    fail(400, `${name} không hợp lệ`);
  return v.trim();
};
const optionalText = (v) => (typeof v === "string" ? v.trim() : "");
const flag = (v) =>
  v === true || v === 1 || v === "1" || v === "true" ? 1 : 0;
const digest = (value) => createHash("sha256").update(value).digest("hex");
const choose = (value, allowed, name) =>
  allowed.includes(value) ? value : fail(400, `${name} không hợp lệ`);
const numeric = (value, min, max, name) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max
    ? n
    : fail(400, `${name} phải từ ${min} đến ${max}`);
};
const safeUrl = (v) => {
  if (!v) return "";
  try {
    const u = new URL(v);
    if (u.protocol === "https:" || u.protocol === "http:") return u.href;
  } catch {}
  fail(400, "Đường dẫn phải là URL http hoặc https hợp lệ");
};
const slugify = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || randomBytes(6).toString("hex");
const cleanQuestion = (q) => {
  const { correct_text, explanation, ...safe } = q;
  return {
    ...safe,
    answers: q.answers.map(({ is_correct, ...answer }) => answer),
  };
};
export async function createApp({
  filename,
  database,
  store: providedStore,
  disableRateLimit = false,
} = {}) {
  const store =
    providedStore ||
    (await openDatabase({
      database,
      filename,
    }));
  const { db, all, get, run, insert, update, transaction, remove } = store;
  const app = express();
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "img-src": ["'self'", "data:", "https:"],
          "media-src": ["'self'", "https:"],
          "frame-src": [
            "'self'",
            "https://www.youtube.com",
            "https://www.youtube-nocookie.com",
          ],
          "upgrade-insecure-requests":
            process.env.NODE_ENV === "production" ? [] : null,
        },
      },
    }),
  );
  app.use(
    express.json({
      limit: "1mb",
    }),
  );
  app.get("/api/health", async (req, res) =>
    res.json({
      success: true,
      database:
        (await get("SELECT 1 AS ready")).ready === 1 ? "connected" : "error",
      database_driver: store.driver,
      ...(store.driver === "mssql" ? { database_name: store.database } : {}),
    }),
  );
  const ok = (res, data = null, status = 200, extra = {}) =>
    res.status(status).json({
      success: true,
      data,
      ...extra,
    });
  function list(res, rows, query = {}) {
    const page = Math.max(1, Math.floor(Number(query.page) || 1));
    const limit = Math.min(
      200,
      Math.max(1, Math.floor(Number(query.limit) || 100)),
    );
    return ok(res, rows.slice((page - 1) * limit, page * limit), 200, {
      pagination: {
        page,
        limit,
        total: rows.length,
        totalPages: Math.max(1, Math.ceil(rows.length / limit)),
      },
    });
  }
  app.get("/api/catalog", async (req, res) =>
    ok(
      res,
      await mapAsync(
        await all("SELECT * FROM courses WHERE is_published=1"),
        courseInfo,
      ),
    ),
  );
  const required = async (table, id) =>
    (await get(`SELECT * FROM ${table} WHERE id=?`, positive(id))) ||
    fail(404, "Không tìm thấy dữ liệu");
  const staff = (user) => {
    if (!["teacher", "admin"].includes(user.role))
      fail(403, "Chỉ giáo viên và quản trị viên được thực hiện thao tác này");
  };
  const admin = (user) => {
    if (user.role !== "admin") fail(403, "Cần quyền quản trị viên");
  };
  const ownedCourse = async (user, id) => {
    staff(user);
    const c = await required("courses", id);
    if (user.role !== "admin" && c.teacher_id !== user.id)
      fail(403, "Bạn chỉ được quản lý khóa học của mình");
    return c;
  };
  const enrollment = async (user, courseId) =>
    await get(
      "SELECT * FROM enrollments WHERE student_id=? AND course_id=? AND status IN ('active','completed')",
      user.id,
      courseId,
    );
  const canManage = (user, c) =>
    user.role === "admin" ||
    (user.role === "teacher" && c.teacher_id === user.id);
  const accessCourse = async (user, id, content = false) => {
    const c = await required("courses", id);
    if (canManage(user, c)) return c;
    if (!c.is_published) fail(404, "Khóa học chưa được xuất bản");
    if (content && !(await enrollment(user, c.id)))
      fail(403, "Bạn cần đăng ký và được duyệt vào khóa học");
    return c;
  };
  const lessonAccess = async (user, id) => {
    const l = await required("lessons", id);
    const c = await accessCourse(user, l.course_id, true);
    if (!canManage(user, c) && !l.is_published)
      fail(404, "Bài học chưa được xuất bản");
    return l;
  };
  const exerciseAccess = async (user, id, manage = false) => {
    const e = await required("exercises", id);
    const l = await required("lessons", e.lesson_id);
    if (manage) await ownedCourse(user, l.course_id);
    else {
      await lessonAccess(user, l.id);
      if (
        !e.is_published &&
        !canManage(user, await required("courses", l.course_id))
      )
        fail(404, "Bài tập chưa được xuất bản");
    }
    return {
      ...e,
      course_id: l.course_id,
    };
  };
  const examAccess = async (user, id, manage = false) => {
    const e = await required("exams", id);
    if (manage) await ownedCourse(user, e.course_id);
    else {
      const c = await accessCourse(user, e.course_id, true);
      if (!e.is_published && !canManage(user, c))
        fail(404, "Bài thi chưa được xuất bản");
    }
    return e;
  };
  const questions = async (exerciseId) =>
    await mapAsync(
      await all(
        "SELECT * FROM questions WHERE exercise_id=? ORDER BY order_index,id",
        exerciseId,
      ),
      async (q) => ({
        ...q,
        answers: await all(
          "SELECT * FROM answers WHERE question_id=? ORDER BY id",
          q.id,
        ),
      }),
    );
  const examQuestions = async (examId) =>
    await mapAsync(
      await all(
        "SELECT q.* FROM questions q JOIN exam_questions eq ON q.id=eq.question_id WHERE eq.exam_id=? ORDER BY eq.order_index,q.id",
        examId,
      ),
      async (q) => ({
        ...q,
        answers: await all(
          "SELECT * FROM answers WHERE question_id=? ORDER BY id",
          q.id,
        ),
      }),
    );
  const notify = async (userId, title, message, type = "info") =>
    await insert("notifications", {
      user_id: userId,
      title,
      message,
      type,
      created_at: now(),
    });
  const visibleCourses = async (user) =>
    (await all("SELECT * FROM courses")).filter(
      (c) =>
        user.role === "admin" ||
        (user.role === "teacher" ? c.teacher_id === user.id : c.is_published),
    );
  const courseInfo = async (c) => ({
    ...c,
    teacher_name: (await required("users", c.teacher_id)).full_name,
    program_name: c.program_id
      ? (await required("programs", c.program_id)).name
      : "",
    total_lessons: (
      await get(
        "SELECT COUNT(*) AS n FROM lessons WHERE course_id=? AND is_published=1",
        c.id,
      )
    ).n,
    total_duration: (
      await get(
        "SELECT COALESCE(SUM(duration),0) AS n FROM lessons WHERE course_id=? AND is_published=1",
        c.id,
      )
    ).n,
    student_count: (
      await get(
        "SELECT COUNT(*) AS n FROM enrollments WHERE course_id=? AND status IN ('active','completed')",
        c.id,
      )
    ).n,
  });
  async function enrollmentInfo(e) {
    const c = await required("courses", e.course_id);
    const u = await required("users", e.student_id);
    const lessons = await all(
      "SELECT * FROM lessons WHERE course_id=? AND is_published=1 ORDER BY order_index,id",
      c.id,
    );
    const completed = await all(
      "SELECT p.* FROM progress p JOIN lessons l ON l.id=p.lesson_id WHERE p.student_id=? AND l.course_id=? AND l.is_published=1 AND p.is_completed=1",
      e.student_id,
      c.id,
    );
    const next =
      lessons.find((l) => !completed.some((p) => p.lesson_id === l.id)) ||
      lessons[0];
    const average = (
      await get(
        "SELECT AVG(score) AS n FROM attempts WHERE student_id=? AND course_id=? AND status='graded'",
        u.id,
        c.id,
      )
    ).n;
    return {
      ...e,
      student_name: u.full_name,
      student_email: u.email,
      course_title: c.title,
      thumbnail: c.thumbnail,
      level: c.level,
      total_lessons: lessons.length,
      lessons_completed: completed.length,
      progress_percent: lessons.length
        ? Math.round((completed.length / lessons.length) * 100)
        : 0,
      last_lesson_id: next?.id,
      last_lesson_title: next?.title,
      average_score: average === null ? null : +(average / 10).toFixed(1),
    };
  }
  if (!disableRateLimit)
    app.use(
      "/api/auth",
      rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 50,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: {
          success: false,
          message: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
        },
      }),
    );
  function userInput(body, old = {}) {
    const merged = {
      ...old,
      ...body,
    };
    const email = text(merged.email, "Email", 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      fail(400, "Email không hợp lệ");
    const data = {
      full_name: text(merged.full_name, "Họ tên", 120),
      email,
      phone: optionalText(merged.phone).slice(0, 30),
    };
    if (body.password || !old.id) {
      const password = text(body.password, "Mật khẩu", 200);
      if (password.length < 8) fail(400, "Mật khẩu cần ít nhất 8 ký tự");
      data.password_hash = hashPassword(password);
    }
    return data;
  }
  async function newSession(user) {
    const token = randomBytes(32).toString("base64url");
    await insertSession(token, user.id);
    return {
      token,
      user: publicUser(user),
    };
  }
  async function insertSession(token, userId) {
    await run("DELETE FROM sessions WHERE expires_at < ?", now());
    await run(
      "INSERT INTO sessions VALUES (?,?,?)",
      digest(token),
      userId,
      new Date(Date.now() + 7 * 86400000).toISOString(),
    );
  }
  app.post("/api/auth/register", async (req, res) => {
    if (req.body.role && req.body.role !== "student")
      fail(403, "Tài khoản giáo viên được quản trị viên cấp");
    const data = userInput(req.body);
    const u = await insert("users", {
      ...data,
      role: "student",
      created_at: now(),
    });
    await notify(
      u.id,
      "Chào mừng bạn!",
      "Khám phá khóa học và bắt đầu hành trình tiếng Anh của bạn.",
    );
    ok(res, await newSession(u), 201);
  });
  const dummyHash = hashPassword(randomBytes(32).toString("hex"));
  app.post("/api/auth/login", async (req, res) => {
    const u = await get(
      "SELECT * FROM users WHERE email=?",
      optionalText(req.body.email).toLowerCase(),
    );
    const valid = verifyPassword(
      String(req.body.password || ""),
      u?.password_hash || dummyHash,
    );
    if (!u || !valid) fail(401, "Email hoặc mật khẩu không đúng");
    if (!u.is_active) fail(403, "Tài khoản đã bị khóa");
    ok(res, await newSession(u));
  });
  app.use("/api", async (req, res, next) => {
    const token = req.headers.authorization?.match(
      /^Bearer ([A-Za-z0-9_-]{43})$/,
    )?.[1];
    const session =
      token &&
      (await get(
        "SELECT * FROM sessions WHERE token_hash=? AND expires_at>?",
        digest(token),
        now(),
      ));
    const u =
      session && (await get("SELECT * FROM users WHERE id=?", session.user_id));
    if (!u)
      return next(
        Object.assign(new Error("Vui lòng đăng nhập"), {
          status: 401,
        }),
      );
    if (!u.is_active)
      return next(
        Object.assign(new Error("Tài khoản đã bị khóa"), {
          status: 403,
        }),
      );
    req.user = publicUser(u);
    req.tokenHash = digest(token);
    // Finalize sessions that expired while the learner's browser was closed.
    for (const a of await all(
      "SELECT * FROM attempts WHERE student_id=? AND kind='exam' AND status='in_progress' AND deadline<?",
      u.id,
      now(),
    )) {
      const exam = a.exam_id
        ? await get("SELECT * FROM exams WHERE id=?", a.exam_id)
        : null;
      await transaction(
        async () =>
          await finishAttempt(
            a,
            JSON.parse(a.answers_json),
            exam?.pass_score ?? 60,
          ),
      );
    }
    next();
  });
  app.get("/api/auth/profile", (req, res) => ok(res, req.user));
  app.post("/api/auth/logout", async (req, res) => {
    await run("DELETE FROM sessions WHERE token_hash=?", req.tokenHash);
    ok(res);
  });
  app.put("/api/auth/profile", async (req, res) =>
    ok(
      res,
      publicUser(
        await update("users", req.user.id, {
          full_name: text(
            req.body.full_name ?? req.user.full_name,
            "Họ tên",
            120,
          ),
          phone: optionalText(req.body.phone ?? req.user.phone).slice(0, 30),
          avatar: safeUrl(req.body.avatar ?? req.user.avatar),
        }),
      ),
    ),
  );
  app.put("/api/auth/change-password", async (req, res) => {
    const u = await required("users", req.user.id);
    if (
      !verifyPassword(String(req.body.currentPassword || ""), u.password_hash)
    )
      fail(400, "Mật khẩu hiện tại không đúng");
    const password = text(req.body.newPassword, "Mật khẩu mới", 200);
    if (password.length < 8) fail(400, "Mật khẩu cần ít nhất 8 ký tự");
    await transaction(async () => {
      await update("users", u.id, {
        password_hash: hashPassword(password),
      });
      await run(
        "DELETE FROM sessions WHERE user_id=? AND token_hash<>?",
        u.id,
        req.tokenHash,
      );
    });
    ok(res);
  });
  app.get("/api/users", async (req, res) => {
    admin(req.user);
    let rows = (await all("SELECT * FROM users ORDER BY id DESC")).map(
      publicUser,
    );
    if (req.query.role) rows = rows.filter((u) => u.role === req.query.role);
    if (req.query.search)
      rows = rows.filter((u) =>
        `${u.full_name} ${u.email}`
          .toLowerCase()
          .includes(String(req.query.search).toLowerCase()),
      );
    list(res, rows, req.query);
  });
  app.get("/api/users/:id", async (req, res) => {
    admin(req.user);
    ok(res, publicUser(await required("users", req.params.id)));
  });
  app.post("/api/users", async (req, res) => {
    admin(req.user);
    const data = userInput(req.body);
    ok(
      res,
      publicUser(
        await insert("users", {
          ...data,
          role: choose(
            req.body.role || "student",
            ["admin", "teacher", "student"],
            "Vai trò",
          ),
          is_active:
            req.body.is_active === undefined ? 1 : flag(req.body.is_active),
          created_at: now(),
        }),
      ),
      201,
    );
  });
  app.put("/api/users/:id", async (req, res) => {
    admin(req.user);
    const old = await required("users", req.params.id);
    const role = choose(
      req.body.role ?? old.role,
      ["admin", "teacher", "student"],
      "Vai trò",
    );
    const is_active =
      req.body.is_active === undefined
        ? old.is_active
        : flag(req.body.is_active);
    if (old.id === req.user.id && (role !== "admin" || !is_active))
      fail(400, "Bạn không thể tự khóa hoặc hạ quyền chính mình");
    if (
      old.role === "teacher" &&
      role !== "teacher" &&
      (await get("SELECT id FROM courses WHERE teacher_id=?", old.id))
    )
      fail(409, "Cần chuyển các khóa học trước khi đổi vai trò giáo viên");
    const u = await transaction(async () => {
      const updated = await update("users", old.id, {
        ...userInput(req.body, old),
        role,
        is_active,
      });
      if (req.body.password || !is_active || role !== old.role)
        await run("DELETE FROM sessions WHERE user_id=?", old.id);
      return updated;
    });
    ok(res, publicUser(u));
  });
  app.delete("/api/users/:id", async (req, res) => {
    admin(req.user);
    const u = await required("users", req.params.id);
    if (u.id === req.user.id) fail(400, "Bạn không thể xóa chính mình");
    await remove("users", u.id);
    ok(res);
  });
  app.get("/api/programs", async (req, res) =>
    list(
      res,
      (
        await all(
          "SELECT p.*, (SELECT COUNT(*) FROM courses c WHERE c.program_id=p.id) AS course_count FROM programs p",
        )
      ).filter((p) => req.user.role === "admin" || p.is_active),
      req.query,
    ),
  );
  app.get("/api/programs/:id", async (req, res) =>
    ok(res, await required("programs", req.params.id)),
  );
  function programInput(b, old = {}) {
    const m = {
      ...old,
      ...b,
    };
    const name = text(m.name, "Tên chương trình", 200);
    return {
      name,
      slug: slugify(m.slug || name),
      description: optionalText(m.description),
      is_active: m.is_active === undefined ? 1 : flag(m.is_active),
    };
  }
  app.post("/api/programs", async (req, res) => {
    admin(req.user);
    ok(
      res,
      await insert("programs", {
        ...programInput(req.body),
        created_at: now(),
      }),
      201,
    );
  });
  app.put("/api/programs/:id", async (req, res) => {
    admin(req.user);
    ok(
      res,
      await update(
        "programs",
        positive(req.params.id),
        programInput(req.body, await required("programs", req.params.id)),
      ),
    );
  });
  app.delete("/api/programs/:id", async (req, res) => {
    admin(req.user);
    await required("programs", req.params.id);
    await remove("programs", positive(req.params.id));
    ok(res);
  });
  app.get("/api/courses", async (req, res) => {
    let rows = await visibleCourses(req.user);
    for (const key of ["program_id", "teacher_id", "level", "is_published"])
      if (req.query[key] !== undefined && req.query[key] !== "")
        rows = rows.filter((c) => String(c[key]) === String(req.query[key]));
    if (req.query.search)
      rows = rows.filter((c) =>
        `${c.title} ${c.description}`
          .toLowerCase()
          .includes(String(req.query.search).toLowerCase()),
      );
    list(res, await mapAsync(rows.reverse(), courseInfo), req.query);
  });
  app.get("/api/courses/slug/:slug", async (req, res) => {
    const c =
      (await get("SELECT id FROM courses WHERE slug=?", req.params.slug)) ||
      fail(404, "Không tìm thấy khóa học");
    ok(res, await courseInfo(await accessCourse(req.user, c.id)));
  });
  app.get("/api/courses/:id", async (req, res) =>
    ok(res, await courseInfo(await accessCourse(req.user, req.params.id))),
  );
  async function courseInput(b, old = {}) {
    const m = {
      ...old,
      ...b,
    };
    const title = text(m.title, "Tên khóa học", 300);
    const program_id = m.program_id
      ? (await required("programs", m.program_id)).id
      : null;
    const is_free = m.is_free === undefined ? 1 : flag(m.is_free);
    return {
      title,
      program_id,
      slug: slugify(m.slug || title),
      description: optionalText(m.description),
      thumbnail: safeUrl(m.thumbnail),
      level: choose(
        m.level || "beginner",
        ["beginner", "intermediate", "advanced"],
        "Trình độ",
      ),
      is_free,
      price: is_free ? 0 : numeric(m.price, 1, 1000000000, "Học phí"),
      is_published: flag(m.is_published),
    };
  }
  app.post("/api/courses", async (req, res) => {
    staff(req.user);
    let teacher = req.user.id;
    if (req.user.role === "admin" && req.body.teacher_id)
      teacher = (await required("users", req.body.teacher_id)).id;
    if (!["teacher", "admin"].includes((await required("users", teacher)).role))
      fail(400, "Người phụ trách phải là giáo viên");
    ok(
      res,
      await insert("courses", {
        ...(await courseInput(req.body)),
        teacher_id: teacher,
        created_at: now(),
      }),
      201,
    );
  });
  app.put("/api/courses/:id", async (req, res) => {
    const c = await ownedCourse(req.user, req.params.id);
    ok(res, await update("courses", c.id, await courseInput(req.body, c)));
  });
  app.delete("/api/courses/:id", async (req, res) => {
    const c = await ownedCourse(req.user, req.params.id);
    await remove("courses", c.id);
    ok(res);
  });
  app.get("/api/lessons/course/:courseId", async (req, res) => {
    const c = await accessCourse(req.user, req.params.courseId);
    const manage = canManage(req.user, c);
    const enrolled = await enrollment(req.user, c.id);
    let rows = await all(
      "SELECT l.*, (SELECT COUNT(*) FROM exercises e WHERE e.lesson_id=l.id AND e.is_published=1) AS exercise_count FROM lessons l WHERE course_id=? ORDER BY order_index,id",
      c.id,
    );
    if (!manage) rows = rows.filter((l) => l.is_published);
    if (req.query.is_published !== undefined)
      rows = rows.filter(
        (l) => l.is_published === flag(req.query.is_published),
      );
    if (!manage && !enrolled)
      rows = rows.map(
        ({ content, video_url, audio_url, document_url, ...l }) => l,
      );
    ok(res, rows);
  });
  app.get("/api/lessons/:id", async (req, res) => {
    const l = await lessonAccess(req.user, req.params.id);
    const c = await required("courses", l.course_id);
    const rows = (
      await all(
        "SELECT id,is_published FROM lessons WHERE course_id=? ORDER BY order_index,id",
        c.id,
      )
    ).filter((row) => canManage(req.user, c) || row.is_published);
    const index = rows.findIndex((row) => row.id === l.id);
    ok(res, {
      ...l,
      previous_lesson_id: rows[index - 1]?.id || null,
      next_lesson_id: rows[index + 1]?.id || null,
    });
  });
  function lessonInput(b, old = {}) {
    const m = {
      ...old,
      ...b,
    };
    return {
      title: text(m.title, "Tên bài học", 300),
      content: optionalText(m.content),
      video_url: safeUrl(m.video_url),
      audio_url: safeUrl(m.audio_url),
      document_url: safeUrl(m.document_url),
      duration: numeric(m.duration ?? 15, 0, 1440, "Thời lượng"),
      order_index: positive(m.order_index || 1, "Thứ tự"),
      is_published: flag(m.is_published),
    };
  }
  app.post("/api/lessons", async (req, res) => {
    const c = await ownedCourse(req.user, req.body.course_id);
    ok(
      res,
      await insert("lessons", {
        ...lessonInput(req.body),
        course_id: c.id,
        created_at: now(),
      }),
      201,
    );
  });
  app.put("/api/lessons/:id", async (req, res) => {
    const l = await required("lessons", req.params.id);
    await ownedCourse(req.user, l.course_id);
    ok(res, await update("lessons", l.id, lessonInput(req.body, l)));
  });
  app.delete("/api/lessons/:id", async (req, res) => {
    const l = await required("lessons", req.params.id);
    await ownedCourse(req.user, l.course_id);
    await remove("lessons", l.id);
    ok(res);
  });
  app.get("/api/enrollments/check/:courseId", async (req, res) => {
    await accessCourse(req.user, req.params.courseId);
    const e = await get(
      "SELECT * FROM enrollments WHERE student_id=? AND course_id=?",
      req.user.id,
      positive(req.params.courseId),
    );
    ok(res, {
      is_enrolled: !!e && ["active", "completed"].includes(e.status),
      status: e?.status || null,
    });
  });
  app.get("/api/enrollments", async (req, res) => {
    let rows = await all("SELECT * FROM enrollments ORDER BY id DESC");
    if (req.user.role === "student")
      rows = rows.filter((e) => e.student_id === req.user.id);
    else if (req.user.role === "teacher") {
      const ids = (await visibleCourses(req.user)).map((c) => c.id);
      rows = rows.filter((e) => ids.includes(e.course_id));
    }
    if (req.query.course_id)
      rows = rows.filter((e) => e.course_id === positive(req.query.course_id));
    list(res, await mapAsync(rows, enrollmentInfo), req.query);
  });
  app.post("/api/enrollments", async (req, res) => {
    const c = await accessCourse(req.user, req.body.course_id);
    const old = await get(
      "SELECT * FROM enrollments WHERE student_id=? AND course_id=?",
      req.user.id,
      c.id,
    );
    if (old && old.status !== "dropped")
      fail(409, "Bạn đã đăng ký khóa học này");
    const status = c.is_free ? "active" : "pending";
    const e = old
      ? await update("enrollments", old.id, {
          status,
        })
      : await insert("enrollments", {
          course_id: c.id,
          student_id: req.user.id,
          status,
          enrolled_at: now(),
        });
    await notify(
      req.user.id,
      status === "active" ? "Đăng ký thành công" : "Đang chờ duyệt đăng ký",
      c.title,
      "success",
    );
    if (status === "pending")
      await notify(
        c.teacher_id,
        "Đăng ký cần duyệt",
        `${req.user.full_name} đăng ký ${c.title}. Vui lòng kiểm tra học phí và duyệt trong mục Tiến độ học viên.`,
      );
    ok(res, e, 201);
  });
  app.put("/api/enrollments/:id", async (req, res) => {
    const e = await required("enrollments", req.params.id);
    await ownedCourse(req.user, e.course_id);
    const status = choose(req.body.status, ["active", "dropped"], "Trạng thái");
    await update("enrollments", e.id, {
      status,
    });
    await notify(
      e.student_id,
      "Cập nhật đăng ký khóa học",
      status === "active"
        ? "Đăng ký của bạn đã được duyệt."
        : "Đăng ký của bạn đã bị hủy.",
    );
    ok(res, await enrollmentInfo(await required("enrollments", e.id)));
  });
  app.get("/api/progress", async (req, res) => {
    if (req.query.lesson_id) {
      const l = await lessonAccess(req.user, req.query.lesson_id);
      ok(
        res,
        (await get(
          "SELECT * FROM progress WHERE student_id=? AND lesson_id=?",
          req.user.id,
          l.id,
        )) || {
          is_completed: 0,
        },
      );
    } else
      list(
        res,
        await all("SELECT * FROM progress WHERE student_id=?", req.user.id),
        req.query,
      );
  });
  app.get("/api/progress/course/:id", async (req, res) => {
    await accessCourse(req.user, req.params.id, true);
    const e = await enrollment(req.user, positive(req.params.id));
    ok(res, e ? await enrollmentInfo(e) : null);
  });
  app.post("/api/progress", async (req, res) => {
    const l = await lessonAccess(req.user, req.body.lesson_id);
    if (!(await enrollment(req.user, l.course_id)))
      fail(403, "Bạn cần đăng ký khóa học trước khi lưu tiến độ");
    const completed = flag(req.body.is_completed);
    const seconds = Math.floor(
      numeric(req.body.time_spent ?? 0, 0, 21600, "Thời gian học"),
    );
    if (store.recordProgress) {
      // Older clients use one stable session per login/lesson; the current UI sends a fresh UUID per visit.
      const hex = digest(`${req.tokenHash}:${l.id}`).slice(0, 32);
      const fallback = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      const sessionId = req.body.session_id ?? fallback;
      if (
        typeof sessionId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          sessionId,
        )
      )
        fail(400, "Mã phiên học không hợp lệ");
      return ok(
        res,
        await store.recordProgress({
          studentId: req.user.id,
          lessonId: l.id,
          sessionId,
          seconds,
          complete: completed,
        }),
      );
    }
    await transaction(async () => {
      const old = await get(
        "SELECT * FROM progress WHERE student_id=? AND lesson_id=?",
        req.user.id,
        l.id,
      );
      if (old)
        await run(
          "UPDATE progress SET is_completed=?,time_spent=?,updated_at=? WHERE student_id=? AND lesson_id=?",
          Math.max(old.is_completed, completed),
          Math.max(old.time_spent, seconds),
          now(),
          req.user.id,
          l.id,
        );
      else
        await run(
          "INSERT INTO progress(student_id,lesson_id,is_completed,time_spent,updated_at) VALUES(?,?,?,?,?)",
          req.user.id,
          l.id,
          completed,
          seconds,
          now(),
        );
      const e = await enrollmentInfo(await enrollment(req.user, l.course_id));
      await update("enrollments", e.id, {
        status: e.progress_percent === 100 ? "completed" : "active",
      });
    });
    ok(
      res,
      await get(
        "SELECT * FROM progress WHERE student_id=? AND lesson_id=?",
        req.user.id,
        l.id,
      ),
    );
  });
  const exerciseRows = async (user) =>
    await filterAsync(
      await all(
        "SELECT e.*, l.course_id FROM exercises e JOIN lessons l ON l.id=e.lesson_id",
      ),
      async (e) => {
        const c = await required("courses", e.course_id);
        const l = await required("lessons", e.lesson_id);
        return (
          canManage(user, c) ||
          (c.is_published &&
            l.is_published &&
            e.is_published &&
            (await enrollment(user, c.id)))
        );
      },
    );
  app.get("/api/exercises", async (req, res) => {
    let rows = await exerciseRows(req.user);
    if (req.query.lesson_id)
      rows = rows.filter((e) => e.lesson_id === positive(req.query.lesson_id));
    if (req.query.is_published !== undefined)
      rows = rows.filter(
        (e) => e.is_published === flag(req.query.is_published),
      );
    list(res, rows, req.query);
  });
  app.get("/api/exercises/lesson/:id", async (req, res) => {
    await lessonAccess(req.user, req.params.id);
    ok(
      res,
      (await exerciseRows(req.user)).filter(
        (e) => e.lesson_id === positive(req.params.id),
      ),
    );
  });
  app.get("/api/exercises/my-attempts", async (req, res) =>
    list(
      res,
      await mapAsync(
        await all(
          "SELECT * FROM attempts WHERE student_id=? AND kind='exercise' AND status<>'in_progress' ORDER BY id DESC",
          req.user.id,
        ),
        attemptInfo,
      ),
      req.query,
    ),
  );
  app.get("/api/exercises/my-attempts/:id", async (req, res) => {
    const a = await ownAttempt(req.user, req.params.id);
    if (a.kind !== "exercise") fail(404, "Không tìm thấy lượt làm bài tập");
    ok(res, {
      ...(await attemptInfo(a)),
      ...JSON.parse(a.result_json || "{}"),
    });
  });
  app.get("/api/exercises/:id", async (req, res) =>
    ok(res, await exerciseAccess(req.user, req.params.id)),
  );
  function exerciseInput(b, old = {}) {
    const m = {
      ...old,
      ...b,
    };
    return {
      title: text(m.title, "Tên bài tập", 300),
      description: optionalText(m.description),
      type: choose(
        m.type || "multiple_choice",
        [
          "multiple_choice",
          "fill_blank",
          "essay",
          "listening",
          "reading",
          "speaking",
          "matching",
          "ordering",
          "mixed",
        ],
        "Loại bài tập",
      ),
      difficulty: choose(
        m.difficulty || "medium",
        ["easy", "medium", "hard"],
        "Độ khó",
      ),
      time_limit: numeric(m.time_limit ?? 15, 0, 1440, "Thời gian"),
      is_published: flag(m.is_published),
    };
  }
  app.post("/api/exercises", async (req, res) => {
    const l = await required("lessons", req.body.lesson_id);
    await ownedCourse(req.user, l.course_id);
    ok(
      res,
      await insert("exercises", {
        ...exerciseInput(req.body),
        lesson_id: l.id,
        created_at: now(),
      }),
      201,
    );
  });
  app.put("/api/exercises/:id", async (req, res) => {
    const e = await exerciseAccess(req.user, req.params.id, true);
    ok(res, await update("exercises", e.id, exerciseInput(req.body, e)));
  });
  app.delete("/api/exercises/:id", async (req, res) => {
    const e = await exerciseAccess(req.user, req.params.id, true);
    await remove("exercises", e.id);
    ok(res);
  });
  function questionInput(b, old = {}) {
    const m = {
      ...old,
      ...b,
    };
    const type = choose(
      m.type || "multiple_choice",
      [
        "multiple_choice",
        "true_false",
        "fill_blank",
        "essay",
        "matching",
        "ordering",
        "speaking",
      ],
      "Loại câu hỏi",
    );
    let answers =
      ["multiple_choice", "true_false"].includes(type) &&
      Array.isArray(m.answers)
        ? m.answers.map((a) => ({
            content: text(a.content, "Đáp án", 3000),
            is_correct: flag(a.is_correct),
          }))
        : [];
    if (
      ["multiple_choice", "true_false"].includes(type) &&
      (answers.length < 2 ||
        answers.length > 10 ||
        answers.filter((a) => a.is_correct).length !== 1)
    )
      fail(400, "Cần 2–10 đáp án và đúng một đáp án đúng");
    const correct_text =
      optionalText(m.correct_text) ||
      answers.find((a) => a.is_correct)?.content ||
      "";
    if (["fill_blank", "matching", "ordering"].includes(type) && !correct_text)
      fail(400, "Cần nhập đáp án mẫu");
    if (!["multiple_choice", "true_false"].includes(type)) answers = [];
    return {
      fields: {
        content: text(m.content, "Nội dung câu hỏi"),
        type,
        points: numeric(m.points ?? 1, 0.1, 100, "Điểm"),
        explanation: optionalText(m.explanation),
        correct_text,
        order_index: positive(m.order_index || 1, "Thứ tự"),
      },
      answers,
    };
  }
  async function saveQuestion(b, old) {
    const input = questionInput(
      b,
      old && {
        ...old,
        answers: await all("SELECT * FROM answers WHERE question_id=?", old.id),
      },
    );
    return await transaction(async () => {
      const q = old
        ? await update("questions", old.id, input.fields)
        : await insert("questions", {
            ...input.fields,
            exercise_id: positive(b.exercise_id),
            created_at: now(),
          });
      await run("DELETE FROM answers WHERE question_id=?", q.id);
      for (const a of input.answers)
        await insert("answers", {
          ...a,
          question_id: q.id,
        });
      return {
        ...q,
        answers: await all("SELECT * FROM answers WHERE question_id=?", q.id),
      };
    });
  }
  app.get("/api/questions", async (req, res) => {
    if (req.query.exam_id) {
      await examAccess(req.user, req.query.exam_id, true);
      return ok(res, await examQuestions(positive(req.query.exam_id)));
    }
    if (req.query.exercise_id)
      return await sendExerciseQuestions(req, res, req.query.exercise_id);
    staff(req.user);
    const rows = await flatMapAsync(await exerciseRows(req.user), async (e) =>
      (await questions(e.id)).map((q) => ({
        ...q,
        course_id: e.course_id,
      })),
    );
    list(res, rows, req.query);
  });
  async function sendExerciseQuestions(req, res, id) {
    const e = await exerciseAccess(req.user, id);
    const manage = canManage(req.user, await required("courses", e.course_id));
    ok(
      res,
      (await questions(e.id)).map((q) => (manage ? q : cleanQuestion(q))),
    );
  }
  app.get(
    "/api/questions/exercise/:id",
    async (req, res) => await sendExerciseQuestions(req, res, req.params.id),
  );
  app.get("/api/questions/:id", async (req, res) => {
    const q = await required("questions", req.params.id);
    const e = await exerciseAccess(req.user, q.exercise_id);
    const full = {
      ...q,
      answers: await all("SELECT * FROM answers WHERE question_id=?", q.id),
    };
    ok(
      res,
      canManage(req.user, await required("courses", e.course_id))
        ? full
        : cleanQuestion(full),
    );
  });
  app.post("/api/questions", async (req, res) => {
    await exerciseAccess(req.user, req.body.exercise_id, true);
    ok(res, await saveQuestion(req.body), 201);
  });
  app.put("/api/questions/:id", async (req, res) => {
    const q = await required("questions", req.params.id);
    await exerciseAccess(req.user, q.exercise_id, true);
    ok(res, await saveQuestion(req.body, q));
  });
  app.delete("/api/questions/:id", async (req, res) => {
    const q = await required("questions", req.params.id);
    await exerciseAccess(req.user, q.exercise_id, true);
    await remove("questions", q.id);
    ok(res);
  });
  app.get("/api/exams", async (req, res) => {
    let rows = await filterAsync(
      await all("SELECT * FROM exams"),
      async (e) => {
        const c = await required("courses", e.course_id);
        return (
          canManage(req.user, c) ||
          (e.is_published &&
            c.is_published &&
            (await enrollment(req.user, c.id)))
        );
      },
    );
    if (req.query.course_id)
      rows = rows.filter((e) => e.course_id === positive(req.query.course_id));
    list(
      res,
      await mapAsync(rows, async (e) => ({
        ...e,
        total_questions: (
          await get(
            "SELECT COUNT(*) AS n FROM exam_questions WHERE exam_id=?",
            e.id,
          )
        ).n,
        course_title: (await required("courses", e.course_id)).title,
      })),
      req.query,
    );
  });
  app.get("/api/exams/results", async (req, res) =>
    list(
      res,
      await mapAsync(
        await all(
          "SELECT * FROM attempts WHERE student_id=? AND kind='exam' AND status<>'in_progress' ORDER BY id DESC",
          req.user.id,
        ),
        attemptInfo,
      ),
      req.query,
    ),
  );
  app.get("/api/exams/results/:id", async (req, res) => {
    const a = await ownAttempt(req.user, req.params.id);
    if (a.kind !== "exam") fail(404, "Không tìm thấy lượt thi");
    ok(res, {
      ...(await attemptInfo(a)),
      ...(await studentResult(a)),
    });
  });
  app.get("/api/exams/:id", async (req, res) =>
    ok(res, await examAccess(req.user, req.params.id)),
  );
  function examInput(b, old = {}) {
    const m = {
      ...old,
      ...b,
    };
    return {
      title: text(m.title, "Tên bài thi", 300),
      description: optionalText(m.description),
      type: choose(
        m.type || "quiz",
        ["quiz", "midterm", "final", "mock_test"],
        "Loại bài thi",
      ),
      time_limit: numeric(m.time_limit ?? 30, 1, 1440, "Thời lượng"),
      pass_score: numeric(m.pass_score ?? 60, 0, 100, "Điểm đạt"),
      max_attempts: positive(m.max_attempts || 3, "Số lượt thi"),
      shuffle_questions: flag(m.shuffle_questions),
      show_answer_after: flag(m.show_answer_after ?? 1),
      is_published: flag(m.is_published),
    };
  }
  async function setExamQuestions(user, exam, ids) {
    if (
      !Array.isArray(ids) ||
      ids.length > 200 ||
      new Set(ids.map(Number)).size !== ids.length
    )
      fail(400, "Danh sách câu hỏi không hợp lệ");
    for (const id of ids) {
      const q = await required("questions", id);
      const e = await exerciseAccess(user, q.exercise_id, true);
      if (e.course_id !== exam.course_id)
        fail(400, "Câu hỏi phải thuộc khóa học của bài thi");
    }
    await run("DELETE FROM exam_questions WHERE exam_id=?", exam.id);
    await forEachAsync(
      ids,
      async (id, i) =>
        await run(
          "INSERT INTO exam_questions VALUES(?,?,?)",
          exam.id,
          positive(id),
          i + 1,
        ),
    );
  }
  app.post("/api/exams", async (req, res) => {
    const c = await ownedCourse(req.user, req.body.course_id);
    const e = await transaction(async () => {
      const exam = await insert("exams", {
        ...examInput(req.body),
        course_id: c.id,
        created_at: now(),
      });
      if (req.body.question_ids)
        await setExamQuestions(req.user, exam, req.body.question_ids);
      return exam;
    });
    ok(res, e, 201);
  });
  app.put("/api/exams/:id", async (req, res) => {
    const e = await examAccess(req.user, req.params.id, true);
    const updated = await transaction(async () => {
      const result = await update("exams", e.id, examInput(req.body, e));
      if (req.body.question_ids)
        await setExamQuestions(req.user, e, req.body.question_ids);
      return result;
    });
    ok(res, updated);
  });
  app.delete("/api/exams/:id", async (req, res) => {
    const e = await examAccess(req.user, req.params.id, true);
    await remove("exams", e.id);
    ok(res);
  });
  async function ownAttempt(user, id, teacher = false) {
    const a = await required("attempts", id);
    if (a.student_id !== user.id) {
      if (teacher && a.course_id) await ownedCourse(user, a.course_id);
      else fail(403, "Bạn không được xem kết quả của người khác");
    }
    return a;
  }
  async function studentResult(a) {
    const result = JSON.parse(a.result_json || "{}");
    if (
      a.kind === "exam" &&
      (!a.exam_id ||
        !(
          await get("SELECT show_answer_after FROM exams WHERE id=?", a.exam_id)
        )?.show_answer_after)
    ) {
      delete result.details;
      delete result.questions;
    }
    return result;
  }
  async function attemptInfo(a) {
    const result = a.result_json ? JSON.parse(a.result_json) : {};
    return {
      id: a.id,
      attempt_id: a.id,
      exam_result_id: a.id,
      student_id: a.student_id,
      student_name: (await required("users", a.student_id)).full_name,
      exercise_title: a.title,
      exam_title: a.title,
      kind: a.kind,
      status: a.status,
      score: a.score,
      submitted_at: a.submitted_at,
      started_at: a.started_at,
      total_questions: result.totalQuestions,
      total_correct: result.correctCount,
      feedback: a.feedback,
      deadline: a.deadline,
    };
  }
  function validateAnswers(answers, qs) {
    if (!answers || Array.isArray(answers) || typeof answers !== "object")
      fail(400, "Đáp án phải là đối tượng theo ID câu hỏi");
    for (const [id, value] of Object.entries(answers)) {
      const q = qs.find((q) => String(q.id) === id);
      if (
        !q ||
        !["string", "number"].includes(typeof value) ||
        String(value).length > 20000
      )
        fail(400, "Đáp án không thuộc bài làm hoặc không hợp lệ");
      if (
        ["multiple_choice", "true_false"].includes(q.type) &&
        !q.answers.some((a) => a.id === Number(value))
      )
        fail(400, "Phương án trả lời không hợp lệ");
    }
    return answers;
  }
  async function finishAttempt(a, answers, passScore = 60) {
    return transaction(async () => {
      a = await required("attempts", a.id);
      if (a.status !== "in_progress") return JSON.parse(a.result_json || "{}");
      const qs = JSON.parse(a.questions_json);
      validateAnswers(answers, qs);
      const result = grade(qs, answers);
      result.isPassed =
        !result.pending_grading && result.scorePercentage >= passScore;
      result.attempt_id = a.id;
      result.exam_result_id = a.id;
      await update("attempts", a.id, {
        answers_json: JSON.stringify(answers),
        result_json: JSON.stringify(result),
        score: result.scorePercentage,
        status: result.pending_grading ? "pending_grading" : "graded",
        submitted_at: now(),
      });
      await notify(
        a.student_id,
        result.pending_grading
          ? "Bài làm đang chờ chấm"
          : "Đã có kết quả bài làm",
        `${a.title}: ${result.pending_grading ? "Giáo viên sẽ chấm phần tự luận." : result.scorePercentage + "%"}`,
        "result",
      );
      return result;
    });
  }
  app.post("/api/exercises/:id/submit", async (req, res) => {
    const e = await exerciseAccess(req.user, req.params.id);
    const qs = await questions(e.id);
    if (!qs.length) fail(400, "Bài tập chưa có câu hỏi");
    validateAnswers(req.body.answers, qs);
    const result = await transaction(async () => {
      const a = await insert("attempts", {
        student_id: req.user.id,
        course_id: e.course_id,
        exercise_id: e.id,
        kind: "exercise",
        title: e.title,
        questions_json: JSON.stringify(qs),
        started_at: now(),
      });
      return await finishAttempt(a, req.body.answers);
    });
    ok(res, result, 201);
  });
  app.post("/api/exams/:id/start", async (req, res) => {
    const e = await examAccess(req.user, req.params.id);
    if (req.user.role !== "student")
      fail(403, "Chỉ học viên được bắt đầu lượt thi");
    const a = await transaction(async () => {
      let a = await get(
        "SELECT * FROM attempts WHERE student_id=? AND exam_id=? AND status='in_progress'",
        req.user.id,
        e.id,
      );
      if (a && Date.now() > Date.parse(a.deadline)) {
        await finishAttempt(a, JSON.parse(a.answers_json), e.pass_score);
        a = null;
      }
      if (!a) {
        const count = (
          await get(
            "SELECT COUNT(*) AS n FROM attempts WHERE student_id=? AND exam_id=?",
            req.user.id,
            e.id,
          )
        ).n;
        if (count >= e.max_attempts) fail(409, "Bạn đã hết số lượt thi");
        const qs = await examQuestions(e.id);
        if (!qs.length) fail(400, "Bài thi chưa có câu hỏi");
        if (e.shuffle_questions)
          for (let i = qs.length - 1; i > 0; i--) {
            const j = randomInt(i + 1);
            [qs[i], qs[j]] = [qs[j], qs[i]];
          }
        a = await insert("attempts", {
          student_id: req.user.id,
          course_id: e.course_id,
          exam_id: e.id,
          kind: "exam",
          title: e.title,
          started_at: now(),
          deadline: new Date(Date.now() + e.time_limit * 60000).toISOString(),
          questions_json: JSON.stringify(qs),
        });
      }
      return a;
    });
    ok(res, {
      ...(await attemptInfo(a)),
      questions: JSON.parse(a.questions_json).map(cleanQuestion),
      answers: JSON.parse(a.answers_json),
      server_now: now(),
    });
  });
  app.put("/api/exams/:id/draft", async (req, res) => {
    const a = await ownAttempt(req.user, req.body.exam_result_id);
    if (a.exam_id !== positive(req.params.id) || a.status !== "in_progress")
      fail(409, "Lượt thi không còn hiệu lực");
    if (Date.now() > Date.parse(a.deadline)) fail(409, "Đã hết thời gian thi");
    validateAnswers(req.body.answers, JSON.parse(a.questions_json));
    await update("attempts", a.id, {
      answers_json: JSON.stringify(req.body.answers),
    });
    ok(res);
  });
  app.post("/api/exams/:id/submit", async (req, res) => {
    const a = await ownAttempt(req.user, req.body.exam_result_id);
    if (a.exam_id !== positive(req.params.id))
      fail(400, "Lượt thi không thuộc bài thi này");
    if (a.status !== "in_progress") return ok(res, await studentResult(a));
    const e = await required("exams", a.exam_id);
    const answers =
      Date.now() > Date.parse(a.deadline) + 5000
        ? JSON.parse(a.answers_json)
        : req.body.answers;
    const result = await transaction(
      async () => await finishAttempt(a, answers, e.pass_score),
    );
    // Hide solution details for exams whose teacher disabled answer review.
    if (!e.show_answer_after) {
      delete result.details;
      delete result.questions;
    }
    ok(res, result);
  });
  app.get("/api/submissions", async (req, res) => {
    staff(req.user);
    const courseIds = (await visibleCourses(req.user)).map((c) => c.id);
    list(
      res,
      await mapAsync(
        (
          await all(
            "SELECT * FROM attempts WHERE status<>'in_progress' ORDER BY id DESC",
          )
        ).filter((a) => courseIds.includes(a.course_id)),
        attemptInfo,
      ),
      req.query,
    );
  });
  app.get("/api/submissions/:id", async (req, res) => {
    staff(req.user);
    const a = await ownAttempt(req.user, req.params.id, true);
    ok(res, {
      ...(await attemptInfo(a)),
      ...JSON.parse(a.result_json || "{}"),
    });
  });
  app.put("/api/submissions/:id/grade", async (req, res) => {
    const a = await required("attempts", req.params.id);
    await ownedCourse(req.user, a.course_id);
    if (a.status === "in_progress") fail(409, "Bài làm chưa được nộp");
    const score = numeric(req.body.score, 0, 100, "Điểm");
    const result = JSON.parse(a.result_json);
    result.scorePercentage = score;
    result.pending_grading = false;
    result.isPassed =
      score >=
      (a.exam_id ? (await required("exams", a.exam_id)).pass_score : 60);
    await update("attempts", a.id, {
      score,
      status: "graded",
      feedback: optionalText(req.body.feedback),
      graded_by: req.user.id,
      result_json: JSON.stringify(result),
    });
    await notify(
      a.student_id,
      "Giáo viên đã chấm bài",
      `${a.title}: ${score}%. ${optionalText(req.body.feedback)}`,
      "result",
    );
    ok(res, result);
  });
  async function pathInfo(p, user) {
    const courses = await mapAsync(
      (
        await all(
          "SELECT c.*, pc.order_index FROM courses c JOIN path_courses pc ON c.id=pc.course_id WHERE pc.path_id=? ORDER BY pc.order_index",
          p.id,
        )
      ).filter((c) => c.is_published || canManage(user, c)),
      courseInfo,
    );
    return {
      ...p,
      courses,
      course_ids: courses.map((c) => c.id),
      course_count: courses.length,
      total_courses: courses.length,
      program_name: p.program_id
        ? (await required("programs", p.program_id)).name
        : "",
    };
  }
  async function ownPath(user, id) {
    staff(user);
    const p = await required("learning_paths", id);
    if (user.role !== "admin" && p.teacher_id !== user.id)
      fail(403, "Bạn chỉ được sửa lộ trình của mình");
    return p;
  }
  async function pathInput(b, old = {}) {
    const m = {
      ...old,
      ...b,
    };
    return {
      title: text(m.title, "Tên lộ trình", 300),
      description: optionalText(m.description),
      program_id: m.program_id
        ? (await required("programs", m.program_id)).id
        : null,
      level: choose(
        m.level || "beginner",
        ["beginner", "intermediate", "advanced"],
        "Trình độ",
      ),
      estimated_duration: numeric(
        m.estimated_duration ?? 30,
        1,
        3650,
        "Số ngày",
      ),
      is_published: flag(m.is_published),
    };
  }
  async function setPathCourses(user, p, ids) {
    if (!Array.isArray(ids) || new Set(ids.map(Number)).size !== ids.length)
      fail(400, "Danh sách khóa học không hợp lệ");
    await forEachAsync(ids, async (id) => await ownedCourse(user, id));
    await run("DELETE FROM path_courses WHERE path_id=?", p.id);
    await forEachAsync(
      ids,
      async (id, i) =>
        await run(
          "INSERT INTO path_courses VALUES(?,?,?)",
          p.id,
          positive(id),
          i + 1,
        ),
    );
  }
  app.get("/api/learning-paths", async (req, res) =>
    list(
      res,
      await mapAsync(
        (await all("SELECT * FROM learning_paths"))
          .filter(
            (p) =>
              req.user.role === "admin" ||
              (req.user.role === "teacher"
                ? p.teacher_id === req.user.id
                : p.is_published),
          )
          .filter(
            (p) =>
              !req.query.program_id ||
              p.program_id === Number(req.query.program_id),
          ),
        async (p) => await pathInfo(p, req.user),
      ),
      req.query,
    ),
  );
  app.get("/api/learning-paths/:id", async (req, res) => {
    const p = await required("learning_paths", req.params.id);
    if (!p.is_published) await ownPath(req.user, p.id);
    ok(res, await pathInfo(p, req.user));
  });
  app.post("/api/learning-paths", async (req, res) => {
    staff(req.user);
    const p = await transaction(async () => {
      const p = await insert("learning_paths", {
        ...(await pathInput(req.body)),
        teacher_id: req.user.id,
        created_at: now(),
      });
      if (req.body.course_ids)
        await setPathCourses(req.user, p, req.body.course_ids);
      return p;
    });
    ok(res, await pathInfo(p, req.user), 201);
  });
  app.put("/api/learning-paths/:id", async (req, res) => {
    const p = await ownPath(req.user, req.params.id);
    const result = await transaction(async () => {
      const result = await update(
        "learning_paths",
        p.id,
        await pathInput(req.body, p),
      );
      if (req.body.course_ids)
        await setPathCourses(req.user, p, req.body.course_ids);
      return result;
    });
    ok(res, await pathInfo(result, req.user));
  });
  app.delete("/api/learning-paths/:id", async (req, res) => {
    const p = await ownPath(req.user, req.params.id);
    await remove("learning_paths", p.id);
    ok(res);
  });
  app.get("/api/notifications", async (req, res) =>
    list(
      res,
      (
        await all(
          "SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC",
          req.user.id,
        )
      ).filter(
        (n) =>
          req.query.is_read === undefined ||
          n.is_read === flag(req.query.is_read),
      ),
      req.query,
    ),
  );
  app.put("/api/notifications/read-all", async (req, res) => {
    await run(
      "UPDATE notifications SET is_read=1 WHERE user_id=?",
      req.user.id,
    );
    ok(res);
  });
  app.put("/api/notifications/:id/read", async (req, res) => {
    const n = await required("notifications", req.params.id);
    if (n.user_id !== req.user.id)
      fail(403, "Thông báo không thuộc tài khoản của bạn");
    await update("notifications", n.id, {
      is_read: 1,
    });
    ok(res);
  });
  async function studentStats(user) {
    const enrollments = await mapAsync(
      await all("SELECT * FROM enrollments WHERE student_id=?", user.id),
      enrollmentInfo,
    );
    const attempts = await mapAsync(
      await all(
        "SELECT * FROM attempts WHERE student_id=? AND status<>'in_progress' ORDER BY id",
        user.id,
      ),
      attemptInfo,
    );
    const completed = (
      await get(
        "SELECT COUNT(*) AS n FROM progress WHERE student_id=? AND is_completed=1",
        user.id,
      )
    ).n;
    const weeklyStudy = await mapAsync(
      Array.from({
        length: 7,
      }),
      async (_, i) => {
        const date = new Date(Date.now() - (6 - i) * 86400000)
          .toISOString()
          .slice(0, 10);
        const from = `${date}T00:00:00.000Z`,
          to = new Date(Date.parse(from) + 86400000).toISOString();
        const seconds = (
          await get(
            store.driver === "mssql"
              ? "SELECT COALESCE(SUM(seconds),0) AS n FROM study_sessions WHERE student_id=? AND created_at>=? AND created_at<?"
              : "SELECT COALESCE(SUM(time_spent),0) AS n FROM progress WHERE student_id=? AND updated_at>=? AND updated_at<?",
            user.id,
            from,
            to,
          )
        ).n;
        return {
          day: date.slice(5),
          minutes: Math.round(seconds / 60),
        };
      },
    );
    return {
      totalCourses: enrollments.length,
      totalLessonsCompleted: completed,
      enrollments,
      attempts,
      weeklyStudy,
    };
  }
  app.get("/api/dashboard/student", async (req, res) =>
    ok(res, await studentStats(req.user)),
  );
  app.get("/api/dashboard/admin", async (req, res) => {
    admin(req.user);
    const count = async (table, condition = "") =>
      (await get(`SELECT COUNT(*) AS n FROM ${table} ${condition}`)).n;
    ok(res, {
      overview: {
        total_users: await count("users"),
        total_students: await count("users", "WHERE role='student'"),
        total_teachers: await count("users", "WHERE role='teacher'"),
        total_courses: await count("courses"),
        published_courses: await count("courses", "WHERE is_published=1"),
        total_programs: await count("programs"),
        total_enrollments: await count("enrollments"),
        total_exam_attempts: await count("attempts", "WHERE kind='exam'"),
      },
      recentUsers: (await all("SELECT * FROM users ORDER BY id DESC"))
        .slice(0, 5)
        .map(publicUser),
      topCourses: (
        await mapAsync(await all("SELECT * FROM courses"), courseInfo)
      )
        .sort((a, b) => b.student_count - a.student_count)
        .slice(0, 5),
    });
  });
  app.get("/api/dashboard/teacher", async (req, res) => {
    staff(req.user);
    const ids = (await visibleCourses(req.user)).map((c) => c.id);
    const es = (await all("SELECT * FROM enrollments")).filter((e) =>
      ids.includes(e.course_id),
    );
    const attempts = (
      await all("SELECT * FROM attempts WHERE status='graded'")
    ).filter((a) => ids.includes(a.course_id));
    const distribution = {
      excellent: 0,
      good: 0,
      average: 0,
      below: 0,
    };
    attempts.forEach(
      (a) =>
        distribution[
          a.score >= 80
            ? "excellent"
            : a.score >= 65
              ? "good"
              : a.score >= 50
                ? "average"
                : "below"
        ]++,
    );
    ok(res, {
      totalCourses: ids.length,
      totalStudents: new Set(es.map((e) => e.student_id)).size,
      totalExams: (await all("SELECT * FROM exams")).filter((e) =>
        ids.includes(e.course_id),
      ).length,
      averagePassRate: `${attempts.length ? Math.round((attempts.filter((a) => a.score >= 60).length / attempts.length) * 100) : 0}%`,
      scoreDistribution: distribution,
      weeklySubmissions: Array.from(
        {
          length: 7,
        },
        (_, i) => {
          const date = new Date(Date.now() - (6 - i) * 86400000)
            .toISOString()
            .slice(0, 10);
          return {
            day: date.slice(5),
            count: attempts.filter((a) => a.submitted_at?.startsWith(date))
              .length,
          };
        },
      ),
    });
  });
  app.get("/api/reports", async (req, res) => {
    const s = await studentStats(req.user);
    const scores = s.attempts.filter((a) => a.status === "graded");
    const periodic =
      store.driver === "mssql"
        ? await all(
            "SELECT * FROM learning_reports WHERE student_id=? ORDER BY period_start DESC",
            req.user.id,
          )
        : [];
    ok(res, [
      {
        id: req.user.id,
        report_type: "overall",
        period_start: req.user.created_at,
        period_end: now(),
        total_lessons_completed: s.totalLessonsCompleted,
        total_exercises_done: s.attempts.filter((a) => a.kind === "exercise")
          .length,
        average_score: scores.length
          ? +(
              scores.reduce((n, a) => n + a.score, 0) /
              scores.length /
              10
            ).toFixed(1)
          : 0,
        time_spent: s.weeklyStudy.reduce((n, d) => n + d.minutes, 0),
        recommendations: scores.length
          ? "Xem lại lời giải và luyện tập các câu trả lời chưa chính xác."
          : "Bắt đầu một khóa học và hoàn thành bài tập để có thống kê.",
        weeklyStudy: s.weeklyStudy,
        attempts: s.attempts,
      },
      ...periodic.map((row) => {
        const data = JSON.parse(row.data_json);
        return {
          ...row,
          total_lessons_completed: data.completed_lessons ?? 0,
          total_exercises_done: (data.attempts || []).filter(
            (a) => a.kind === "exercise",
          ).length,
          average_score:
            data.average_score == null
              ? 0
              : +(data.average_score / 10).toFixed(1),
          time_spent: Math.round((data.study_seconds ?? 0) / 60),
          recommendations: data.recommendation || "",
          attempts: data.attempts || [],
          weeklyStudy: [],
        };
      }),
    ]);
  });
  app.use("/api", (req, res) => fail(404, "API không tồn tại"));
  if (existsSync(resolve("dist/index.html"))) {
    app.use(express.static(resolve("dist")));
    app.get("/{*path}", (req, res) => res.sendFile(resolve("dist/index.html")));
  }
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    let status = error.status || 500;
    let message = error.message;
    if (
      [2601, 2627].includes(error.number) ||
      (error.code?.startsWith("ERR_SQLITE") && error.message.includes("UNIQUE"))
    ) {
      status = 409;
      message = "Email, đường dẫn hoặc dữ liệu này đã tồn tại";
    } else if (error.number >= 51001 && error.number <= 51029) {
      status = [51003, 51005, 51013, 51015, 51024].includes(error.number)
        ? 403
        : 400;
    } else if (
      error.number === 547 ||
      (error.code?.startsWith("ERR_SQLITE") &&
        error.message.includes("FOREIGN KEY"))
    ) {
      status = 409;
      message = "Dữ liệu đang được sử dụng hoặc liên kết không hợp lệ";
    } else if ([245, 2628, 8152].includes(error.number)) {
      status = 400;
      message = "Dữ liệu không đúng định dạng hoặc vượt quá độ dài cho phép";
    } else if (error.number === 1205) {
      status = 503;
      message = "Dữ liệu đang được cập nhật. Vui lòng thử lại.";
    } else if (status === 500) {
      console.error("API error:", error.code || error.name, error.number || "");
      message = "Có lỗi hệ thống. Vui lòng thử lại.";
    }
    res.status(status).json({
      success: false,
      message,
    });
  });
  app.locals.store = store;
  return app;
}
