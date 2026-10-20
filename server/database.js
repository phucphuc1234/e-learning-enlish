import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const now = () => new Date().toISOString();
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password, encoded) {
  const [salt, hash] = encoded.split(":");
  const actual = scryptSync(String(password), salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export const publicUser = (user) => {
  const { password_hash, ...safe } = user;
  return safe;
};

export function openDatabase(
  filename = process.env.DATABASE_PATH || ".data/english.sqlite",
) {
  if (filename !== ":memory:")
    mkdirSync(dirname(resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, full_name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','teacher','student')),
      phone TEXT DEFAULT '', avatar TEXT DEFAULT '', is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY, teacher_id INTEGER NOT NULL REFERENCES users(id),
      program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL, title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE, description TEXT DEFAULT '', thumbnail TEXT DEFAULT '',
      level TEXT NOT NULL DEFAULT 'beginner', price REAL NOT NULL DEFAULT 0 CHECK(price >= 0),
      is_free INTEGER NOT NULL DEFAULT 1, is_published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL, content TEXT DEFAULT '', video_url TEXT DEFAULT '', audio_url TEXT DEFAULT '',
      document_url TEXT DEFAULT '', duration INTEGER NOT NULL DEFAULT 15 CHECK(duration >= 0),
      order_index INTEGER NOT NULL DEFAULT 1, is_published INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY, lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      title TEXT NOT NULL, description TEXT DEFAULT '', type TEXT NOT NULL DEFAULT 'multiple_choice',
      difficulty TEXT DEFAULT 'medium', time_limit INTEGER DEFAULT 15,
      is_published INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY, exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      content TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'multiple_choice', points REAL NOT NULL DEFAULT 1 CHECK(points > 0),
      explanation TEXT DEFAULT '', correct_text TEXT DEFAULT '', order_index INTEGER DEFAULT 1, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY, question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      content TEXT NOT NULL, is_correct INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL, description TEXT DEFAULT '', type TEXT DEFAULT 'quiz',
      time_limit INTEGER NOT NULL DEFAULT 30 CHECK(time_limit > 0), pass_score REAL NOT NULL DEFAULT 60,
      max_attempts INTEGER NOT NULL DEFAULT 3 CHECK(max_attempts > 0), shuffle_questions INTEGER DEFAULT 0,
      show_answer_after INTEGER DEFAULT 1, is_published INTEGER DEFAULT 0, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS exam_questions (
      exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      order_index INTEGER DEFAULT 1, PRIMARY KEY(exam_id, question_id)
    );
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('pending','active','completed','dropped')),
      enrolled_at TEXT NOT NULL, UNIQUE(student_id, course_id)
    );
    CREATE TABLE IF NOT EXISTS progress (
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      is_completed INTEGER NOT NULL DEFAULT 0, time_spent INTEGER DEFAULT 0, updated_at TEXT NOT NULL,
      PRIMARY KEY(student_id,lesson_id)
    );
    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
      exercise_id INTEGER REFERENCES exercises(id) ON DELETE SET NULL,
      exam_id INTEGER REFERENCES exams(id) ON DELETE SET NULL,
      kind TEXT NOT NULL CHECK(kind IN ('exercise','exam')), title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_progress', started_at TEXT NOT NULL, deadline TEXT,
      submitted_at TEXT, questions_json TEXT NOT NULL, answers_json TEXT NOT NULL DEFAULT '{}',
      result_json TEXT, score REAL, feedback TEXT DEFAULT '', graded_by INTEGER REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL, message TEXT NOT NULL, type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS learning_paths (
      id INTEGER PRIMARY KEY, teacher_id INTEGER NOT NULL REFERENCES users(id),
      program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
      title TEXT NOT NULL, description TEXT DEFAULT '', level TEXT DEFAULT 'beginner',
      estimated_duration INTEGER DEFAULT 30, is_published INTEGER DEFAULT 0, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS path_courses (
      path_id INTEGER NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      order_index INTEGER DEFAULT 1, PRIMARY KEY(path_id,course_id)
    );
    CREATE INDEX IF NOT EXISTS courses_teacher ON courses(teacher_id);
    CREATE INDEX IF NOT EXISTS lessons_course ON lessons(course_id);
    CREATE INDEX IF NOT EXISTS attempts_student ON attempts(student_id,submitted_at);
    CREATE INDEX IF NOT EXISTS notifications_user ON notifications(user_id,is_read);
  `);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const get = (sql, ...args) => db.prepare(sql).get(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const insert = (table, data) => {
    const keys = Object.keys(data);
    const result = run(
      `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`,
      ...Object.values(data),
    );
    return get(
      `SELECT * FROM ${table} WHERE id=?`,
      Number(result.lastInsertRowid),
    );
  };
  const update = (table, id, data) => {
    const keys = Object.keys(data);
    if (keys.length)
      run(
        `UPDATE ${table} SET ${keys.map((k) => `${k}=?`).join(",")} WHERE id=?`,
        ...Object.values(data),
        id,
      );
    return get(`SELECT * FROM ${table} WHERE id=?`, id);
  };
  const transaction = (fn) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  };
  return { db, all, get, run, insert, update, transaction };
}
