import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app.js";
import { seedDemo } from "../server/seed.js";

async function fixture(t, filename = ":memory:") {
  const app = createApp({ filename, disableRateLimit: true });
  seedDemo(app.locals.store);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}/api`;
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    app.locals.store.db.close();
  });
  const request = async (
    path,
    { token, method = "GET", body, status = 200 } = {},
  ) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const json = await res.json();
    assert.equal(
      res.status,
      status,
      `${method} ${path}: ${JSON.stringify(json)}`,
    );
    return json;
  };
  const login = async (role) =>
    (
      await request("/auth/login", {
        method: "POST",
        body: { email: `${role}@elearning.com`, password: "EnglishDemo!2026" },
      })
    ).data;
  const student = await login("student"),
    teacher = await login("teacher"),
    admin = await login("admin");
  const enroll = async (course = 1) =>
    request("/enrollments", {
      method: "POST",
      token: student.token,
      body: { course_id: course },
      status: 201,
    });
  return {
    app,
    request,
    login,
    student,
    teacher,
    admin,
    enroll,
    store: app.locals.store,
  };
}

test("health and public catalog work; protected endpoints require authentication", async (t) => {
  const { request } = await fixture(t);
  assert.equal((await request("/health")).database, "connected");
  assert.equal((await request("/catalog")).data.length, 3);
  await request("/courses", { status: 401 });
});
test("registration cannot grant elevated roles; validation and duplicate emails", async (t) => {
  const { request } = await fixture(t);
  const body = {
    full_name: "New Learner",
    email: "new@example.com",
    password: "Password123!",
  };
  await request("/auth/register", {
    method: "POST",
    body: { ...body, role: "admin" },
    status: 403,
  });
  await request("/auth/register", {
    method: "POST",
    body: { ...body, password: "short" },
    status: 400,
  });
  const user = (
    await request("/auth/register", { method: "POST", body, status: 201 })
  ).data;
  assert.equal(user.user.role, "student");
  assert.ok(!("password_hash" in user.user));
  await request("/auth/register", {
    method: "POST",
    body: { ...body, email: "NEW@example.com" },
    status: 409,
  });
});
test("logout revokes sessions and blocked users lose access immediately", async (t) => {
  const { request, student, admin } = await fixture(t);
  await request("/auth/logout", { method: "POST", token: student.token });
  await request("/auth/profile", { token: student.token, status: 401 });
  const token = (
    await request("/auth/login", {
      method: "POST",
      body: { email: "teacher@elearning.com", password: "EnglishDemo!2026" },
    })
  ).data.token;
  await request("/users/2", {
    token: admin.token,
    method: "PUT",
    body: { is_active: 0 },
  });
  await request("/courses", { token, status: 401 });
  await request("/auth/login", {
    method: "POST",
    body: { email: "teacher@elearning.com", password: "EnglishDemo!2026" },
    status: 403,
  });
});
test("lesson content and progress require enrollment, and completion persists", async (t) => {
  const { request, student, enroll } = await fixture(t);
  const token = student.token;
  await request("/lessons/1", { token, status: 403 });
  const publicLessons = (await request("/lessons/course/1", { token })).data;
  assert.ok(!("content" in publicLessons[0]));
  await enroll();
  assert.match(
    (await request("/lessons/1", { token })).data.content,
    /Introducing/,
  );
  await request("/progress", {
    token,
    method: "POST",
    body: { lesson_id: 1, is_completed: true, time_spent: 60 },
  });
  await request("/progress", {
    token,
    method: "POST",
    body: { lesson_id: 1, is_completed: true, time_spent: 30 },
  });
  const progress = (await request("/progress/course/1", { token })).data;
  assert.equal(progress.lessons_completed, 1);
  assert.equal(progress.progress_percent, 33);
  assert.equal(
    (await request("/progress?lesson_id=1", { token })).data.time_spent,
    60,
  );
  await request("/enrollments", {
    token,
    method: "POST",
    body: { course_id: 1 },
    status: 409,
  });
});
test("teachers cannot mutate other teachers courses; students cannot manage users", async (t) => {
  const { request, student, teacher, admin } = await fixture(t);
  const other = (
    await request("/users", {
      token: admin.token,
      method: "POST",
      status: 201,
      body: {
        full_name: "Other",
        email: "other@example.com",
        password: "Password123!",
        role: "teacher",
      },
    })
  ).data;
  const c = (
    await request("/courses", {
      token: admin.token,
      method: "POST",
      status: 201,
      body: { title: "Other course", teacher_id: other.id },
    })
  ).data;
  await request(`/courses/${c.id}`, {
    token: teacher.token,
    method: "PUT",
    body: { title: "stolen" },
    status: 403,
  });
  await request("/users", { token: student.token, status: 403 });
  await request("/courses", {
    token: student.token,
    method: "POST",
    body: { title: "test" },
    status: 403,
  });
  const visible = (await request("/courses", { token: teacher.token })).data;
  assert.ok(visible.every((c) => c.teacher_id === teacher.user.id));
  await request(`/users/${admin.user.id}`, {
    token: admin.token,
    method: "PUT",
    body: { role: "student" },
    status: 400,
  });
});
test("server grades exercises and never exposes solutions before submission", async (t) => {
  const { request, student, teacher, enroll } = await fixture(t);
  await enroll();
  const qs = (await request("/questions/exercise/1", { token: student.token }))
    .data;
  assert.ok(!("explanation" in qs[0]));
  assert.ok(qs[0].answers.every((a) => !("is_correct" in a)));
  const key = (
    await request("/questions/exercise/1", { token: teacher.token })
  ).data[0].answers.find((a) => a.is_correct);
  const result = (
    await request("/exercises/1/submit", {
      token: student.token,
      method: "POST",
      status: 201,
      body: { answers: { [qs[0].id]: key.id }, score: 0 },
    })
  ).data;
  assert.equal(result.scorePercentage, 100);
  assert.equal(result.details[0].correctAnswerId, key.id);
  assert.equal(
    (await request("/exercises/my-attempts", { token: student.token })).data
      .length,
    1,
  );
  await request("/exercises/1/submit", {
    token: student.token,
    method: "POST",
    status: 400,
    body: { answers: { [qs[0].id]: 999999 }, score: 100 },
  });
});
test("paid enrollment stays pending until teacher approval", async (t) => {
  const { request, student, teacher } = await fixture(t);
  await request("/courses/1", {
    token: teacher.token,
    method: "PUT",
    body: { is_free: 0, price: 500000 },
  });
  const e = (
    await request("/enrollments", {
      token: student.token,
      method: "POST",
      body: { course_id: 1 },
      status: 201,
    })
  ).data;
  assert.equal(e.status, "pending");
  await request("/lessons/1", { token: student.token, status: 403 });
  await request(`/enrollments/${e.id}`, {
    token: student.token,
    method: "PUT",
    body: { status: "active" },
    status: 403,
  });
  await request(`/enrollments/${e.id}`, {
    token: teacher.token,
    method: "PUT",
    body: { status: "active" },
  });
  await request("/lessons/1", { token: student.token });
});
test("exam resumes, saves drafts, grades on server, enforces attempts and idempotent submission", async (t) => {
  const { request, student, teacher, enroll } = await fixture(t);
  await enroll();
  const token = student.token;
  await request("/exams/1", {
    token: teacher.token,
    method: "PUT",
    body: { max_attempts: 1 },
  });
  const a = (await request("/exams/1/start", { token, method: "POST" })).data;
  const b = (await request("/exams/1/start", { token, method: "POST" })).data;
  assert.equal(a.exam_result_id, b.exam_result_id);
  assert.ok(
    a.questions.every((q) => q.answers.every((v) => !("is_correct" in v))),
  );
  const keys = (await request("/questions?exam_id=1", { token: teacher.token }))
    .data;
  const answers = Object.fromEntries(
    keys.map((q) => [q.id, q.answers.find((a) => a.is_correct).id]),
  );
  await request("/exams/1/draft", {
    token,
    method: "PUT",
    body: { exam_result_id: a.id, answers },
  });
  assert.deepEqual(
    (await request("/exams/1/start", { token, method: "POST" })).data.answers,
    answers,
  );
  const result = (
    await request("/exams/1/submit", {
      token,
      method: "POST",
      body: { exam_result_id: a.id, answers, score: 0 },
    })
  ).data;
  assert.equal(result.scorePercentage, 100);
  assert.equal(result.isPassed, true);
  assert.equal(
    (
      await request("/exams/1/submit", {
        token,
        method: "POST",
        body: { exam_result_id: a.id, answers: {} },
      })
    ).data.scorePercentage,
    100,
  );
  await request("/exams/1/start", { token, method: "POST", status: 409 });
});
test("expired exams cannot use late answers, and cross-exam submission is rejected", async (t) => {
  const { request, student, store, enroll } = await fixture(t);
  await enroll();
  const token = student.token;
  const a = (await request("/exams/1/start", { token, method: "POST" })).data;
  const answers = Object.fromEntries(
    a.questions.map((q) => [q.id, q.answers[0].id]),
  );
  await request("/exams/2/submit", {
    token,
    method: "POST",
    body: { exam_result_id: a.id, answers },
    status: 400,
  });
  store.update("attempts", a.id, {
    deadline: new Date(Date.now() - 10000).toISOString(),
  });
  await request("/exams/1/draft", {
    token,
    method: "PUT",
    body: { exam_result_id: a.id, answers },
    status: 409,
  });
  assert.equal(
    (
      await request("/exams/1/submit", {
        token,
        method: "POST",
        body: { exam_result_id: a.id, answers },
      })
    ).data.scorePercentage,
    0,
  );
});
test("essay submissions wait for grading and generate notifications and feedback", async (t) => {
  const { request, student, teacher, enroll } = await fixture(t);
  await enroll();
  const e = (
    await request("/exercises", {
      token: teacher.token,
      method: "POST",
      status: 201,
      body: { lesson_id: 1, title: "Writing", type: "essay", is_published: 1 },
    })
  ).data;
  const q = (
    await request("/questions", {
      token: teacher.token,
      method: "POST",
      status: 201,
      body: {
        exercise_id: e.id,
        content: "Introduce yourself",
        type: "essay",
        points: 5,
      },
    })
  ).data;
  const result = (
    await request(`/exercises/${e.id}/submit`, {
      token: student.token,
      method: "POST",
      status: 201,
      body: { answers: { [q.id]: "My name is An." } },
    })
  ).data;
  assert.equal(result.pending_grading, true);
  await request(`/submissions/${result.attempt_id}/grade`, {
    token: student.token,
    method: "PUT",
    body: { score: 90 },
    status: 403,
  });
  await request(`/submissions/${result.attempt_id}/grade`, {
    token: teacher.token,
    method: "PUT",
    body: { score: 90, feedback: "Well done!" },
  });
  const history = (
    await request(`/exercises/my-attempts/${result.attempt_id}`, {
      token: student.token,
    })
  ).data;
  assert.equal(history.score, 90);
  assert.equal(history.feedback, "Well done!");
  assert.equal(history.status, "graded");
  assert.ok(
    (await request("/notifications", { token: student.token })).data.some((n) =>
      n.message.includes("Well done!"),
    ),
  );
});
test("fill-in answers normalize case and whitespace, and malformed questions are rejected", async (t) => {
  const { request, student, teacher, enroll } = await fixture(t);
  await enroll();
  const e = (
    await request("/exercises", {
      token: teacher.token,
      method: "POST",
      status: 201,
      body: { lesson_id: 1, title: "Vocabulary", is_published: 1 },
    })
  ).data;
  const q = (
    await request("/questions", {
      token: teacher.token,
      method: "POST",
      status: 201,
      body: {
        exercise_id: e.id,
        content: "A greeting?",
        type: "fill_blank",
        correct_text: "hello|hi",
      },
    })
  ).data;
  assert.equal(
    (
      await request(`/exercises/${e.id}/submit`, {
        token: student.token,
        method: "POST",
        status: 201,
        body: { answers: { [q.id]: "  HELLO " } },
      })
    ).data.scorePercentage,
    100,
  );
  await request("/questions", {
    token: teacher.token,
    method: "POST",
    status: 400,
    body: {
      exercise_id: e.id,
      content: "Bad MC",
      answers: [
        { content: "A", is_correct: 1 },
        { content: "B", is_correct: 1 },
      ],
    },
  });
});
test("learning-path order is persisted; transaction rolls back invalid course assignments", async (t) => {
  const { request, teacher } = await fixture(t);
  const token = teacher.token;
  await request("/learning-paths/1", {
    token,
    method: "PUT",
    body: { course_ids: [3, 1] },
  });
  assert.deepEqual(
    (await request("/learning-paths/1", { token })).data.course_ids,
    [3, 1],
  );
  await request("/learning-paths/1", {
    token,
    method: "PUT",
    body: { title: "Changed", course_ids: [9999] },
    status: 404,
  });
  assert.notEqual(
    (await request("/learning-paths/1", { token })).data.title,
    "Changed",
  );
});
test("SQLite data survives closing and reopening the application; seed is repeatable", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "english-test-"));
  const filename = join(dir, "test.sqlite");
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const app = createApp({ filename, disableRateLimit: true });
  seedDemo(app.locals.store);
  seedDemo(app.locals.store);
  assert.equal(app.locals.store.get("SELECT COUNT(*) AS n FROM courses").n, 3);
  app.locals.store.db.close();
  const second = createApp({ filename, disableRateLimit: true });
  assert.equal(
    second.locals.store.get("SELECT COUNT(*) AS n FROM lessons").n,
    6,
  );
  second.locals.store.db.close();
});

test("answer-review policy cannot be bypassed through history, repeat submit or teacher-only endpoints", async (t) => {
  const { request, student, teacher, enroll } = await fixture(t);
  await enroll();
  const token = student.token;
  await request("/exams/1", {
    token: teacher.token,
    method: "PUT",
    body: { show_answer_after: 0 },
  });
  const a = (await request("/exams/1/start", { token, method: "POST" })).data;
  const result = (
    await request("/exams/1/submit", {
      token,
      method: "POST",
      body: { exam_result_id: a.id, answers: {} },
    })
  ).data;
  assert.ok(!result.details && !result.questions);
  const repeated = (
    await request("/exams/1/submit", {
      token,
      method: "POST",
      body: { exam_result_id: a.id, answers: {} },
    })
  ).data;
  assert.ok(!repeated.details && !repeated.questions);
  const history = (await request(`/exams/results/${a.id}`, { token })).data;
  assert.ok(!history.details && !history.questions);
  await request(`/exercises/my-attempts/${a.id}`, { token, status: 404 });
  await request(`/submissions/${a.id}`, { token, status: 403 });
});
test("malicious URLs, invalid IDs, empty published questions and cross-course exam questions are rejected", async (t) => {
  const { request, teacher } = await fixture(t);
  const token = teacher.token;
  await request("/courses/not-an-id", { token, status: 400 });
  await request("/lessons/1", {
    token,
    method: "PUT",
    body: { video_url: "javascript:alert(1)" },
    status: 400,
  });
  await request("/exams/1", {
    token,
    method: "PUT",
    body: { question_ids: [4] },
    status: 400,
  });
  assert.equal(
    (await request("/questions?exam_id=1", { token })).data.length,
    3,
  );
  // A fill-in question from the UI may still include empty multiple-choice fields; they are irrelevant.
  await request("/questions", {
    token,
    method: "POST",
    status: 201,
    body: {
      exercise_id: 1,
      content: "Say hello",
      type: "fill_blank",
      correct_text: "hello",
      answers: [{ content: "", is_correct: true }],
    },
  });
});
test("users can update their profile without escalating privileges; password changes revoke other sessions", async (t) => {
  const { request, student, login } = await fixture(t);
  const second = await login("student");
  const res = await request("/auth/profile", {
    token: student.token,
    method: "PUT",
    body: { full_name: "Changed", role: "admin", email: "stolen@example.com" },
  });
  assert.equal(res.data.role, "student");
  assert.equal(res.data.email, "student@elearning.com");
  await request("/auth/change-password", {
    token: student.token,
    method: "PUT",
    body: {
      currentPassword: "EnglishDemo!2026",
      newPassword: "ChangedPass!2026",
    },
  });
  await request("/auth/profile", { token: second.token, status: 401 });
  await request("/auth/profile", { token: student.token });
});
test("lesson navigation follows published order and never crosses into another course", async (t) => {
  const { request, student, teacher, enroll } = await fixture(t);
  await enroll();
  await request("/lessons/2", {
    token: teacher.token,
    method: "PUT",
    body: { is_published: 0 },
  });
  const first = (await request("/lessons/1", { token: student.token })).data;
  assert.equal(first.previous_lesson_id, null);
  assert.equal(first.next_lesson_id, 3);
  const last = (await request("/lessons/3", { token: student.token })).data;
  assert.equal(last.next_lesson_id, null);
});
