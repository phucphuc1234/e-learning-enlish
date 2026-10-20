import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

async function login(page, role) {
  await page.goto("/login");
  await page
    .getByLabel("Email", { exact: false })
    .fill(`${role}@elearning.com`);
  await page.getByLabel(/^Mật khẩu/).fill("EnglishDemo!2026");
  await page.getByRole("button", { name: "Đăng nhập", exact: false }).click();
  await expect(page).toHaveURL(new RegExp(`/${role}/dashboard`));
}
test("public catalog, registration, real enrollment, lesson, exercise and exam", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Tiếng Anh mở lối/ }),
  ).toBeVisible();
  mkdirSync(".runtime/screenshots", { recursive: true });
  await page.screenshot({
    path: `.runtime/screenshots/landing-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel("Tìm khóa học").fill("Foundations");
  await expect(
    page.getByRole("heading", { name: "English Foundations", exact: true }),
  ).toBeVisible();
  await page.goto("/register");
  await page
    .getByLabel("Họ và tên", { exact: false })
    .fill(`Learner ${info.project.name}`);
  await page
    .getByLabel("Email", { exact: false })
    .fill(`${info.project.name}-${Date.now()}@example.com`);
  await page
    .getByLabel("Mật khẩu", { exact: false })
    .first()
    .fill("BrowserTest!2026");
  await page.getByLabel("Xác nhận", { exact: false }).fill("BrowserTest!2026");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /Đăng ký|Tạo tài khoản/i }).click();
  await expect(page).toHaveURL(/student\/dashboard/);
  await page.goto("/student/course/1");
  await page.getByRole("button", { name: /Đăng ký|Tham gia/i }).click();
  await expect(page).toHaveURL(/student\/lesson\/1/);
  await expect(
    page.getByRole("heading", {
      name: "Hello, nice to meet you!",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Đánh dấu đã học" }).click();
  await expect(
    page.getByRole("button", { name: "Đã hoàn thành" }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Đã hoàn thành" }),
  ).toBeDisabled();
  await page.goto("/student/exercise/1");
  await page.getByRole("radio", { name: "Nice to meet you too!" }).check();
  await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Kết quả bài làm" }),
  ).toContainText("100%");
  await page.goto("/student/exam/1");
  await page.getByRole("radio", { name: "Nice to meet you too!" }).check();
  await page.getByRole("radio", { name: "studies", exact: true }).check();
  await page
    .getByRole("radio", { name: "Could I have a tea, please?" })
    .check();
  await expect(
    page.getByText("Đã lưu câu trả lời", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("radio", { name: "studies", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Kết quả bài làm" }),
  ).toContainText("100%");
  await page.goto("/student/progress");
  await expect(
    page.getByRole("heading", { name: "Tiến độ & kết quả", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toContainText(
    "English Foundations — Progress check",
  );
  await page.goto("/profile");
  await page.getByLabel("Họ và tên").fill(`Updated ${info.project.name}`);
  await page.getByRole("button", { name: "Lưu hồ sơ" }).click();
  await page.reload();
  await expect(page.getByLabel("Họ và tên")).toHaveValue(
    `Updated ${info.project.name}`,
  );
  const oldToken = await page.evaluate(() => localStorage.getItem("token"));
  await page.getByRole("button", { name: "Mở menu tài khoản" }).first().click();
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/login/);
  await expect
    .poll(async () =>
      (
        await page.request.get("/api/auth/profile", {
          headers: { Authorization: `Bearer ${oldToken}` },
        })
      ).status(),
    )
    .toBe(401);
  expect(errors).toEqual([]);
});

test("teacher authors a course, lesson and fill-in exercise entirely through the UI", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page, "teacher");
  await page.goto("/teacher/courses");
  await page
    .getByRole("button", { name: "Tạo khóa học mới", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const title = `Writing workshop ${info.project.name} ${Date.now()}`;
  await dialog.getByLabel("Tiêu đề khóa học").fill(title);
  const courseResponse = page.waitForResponse(
    (r) => r.url().endsWith("/api/courses") && r.request().method() === "POST",
  );
  await dialog
    .getByRole("button", { name: "Tạo khóa học", exact: true })
    .click();
  const course = (await (await courseResponse).json()).data;
  await expect(dialog).not.toBeVisible();
  await page.goto(`/teacher/lessons?course_id=${course.id}`);
  await page
    .getByRole("button", { name: "Thêm bài học mới", exact: true })
    .click();
  await dialog
    .getByLabel("Tiêu đề bài học")
    .fill("A lesson created in the browser");
  await dialog
    .getByPlaceholder("Nhập nội dung lý thuyết", { exact: false })
    .fill("# Hello\n\nLearn to introduce yourself.");
  const lessonResponse = page.waitForResponse(
    (r) => r.url().endsWith("/api/lessons") && r.request().method() === "POST",
  );
  await dialog
    .getByRole("button", { name: "Thêm bài học", exact: true })
    .click();
  const lesson = (await (await lessonResponse).json()).data;
  await expect(dialog).not.toBeVisible();
  await page.goto(`/teacher/exercises?lesson_id=${lesson.id}`);
  await page
    .getByRole("button", { name: "Thêm bộ bài tập mới", exact: true })
    .click();
  await dialog.getByLabel("Tiêu đề bài tập").fill("Greetings practice");
  await dialog.getByLabel("Xuất bản bài tập").check();
  const exerciseResponse = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/exercises") && r.request().method() === "POST",
  );
  await dialog
    .getByRole("button", { name: "Tạo bài tập", exact: true })
    .click();
  const exercise = (await (await exerciseResponse).json()).data;
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Thêm câu hỏi", exact: true }).click();
  await dialog.getByLabel("Nội dung câu hỏi").fill("A common greeting is ___.");
  await dialog.getByRole("combobox").selectOption("fill_blank");
  await dialog.getByLabel("Đáp án mẫu", { exact: false }).fill("hello|hi");
  await dialog
    .getByRole("button", { name: "Thêm câu hỏi", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByText("A common greeting is ___.", { exact: true }),
  ).toBeVisible();
  // Check that UI-created records are usable by an enrolled learner, rather than only rendered locally.
  const student = (
    await (
      await page.request.post("/api/auth/login", {
        data: { email: "student@elearning.com", password: "EnglishDemo!2026" },
      })
    ).json()
  ).data;
  const headers = { Authorization: `Bearer ${student.token}` };
  expect(
    (
      await page.request.post("/api/enrollments", {
        headers,
        data: { course_id: course.id },
      })
    ).status(),
  ).toBe(201);
  const questions = (
    await (
      await page.request.get(`/api/questions/exercise/${exercise.id}`, {
        headers,
      })
    ).json()
  ).data;
  const result = await page.request.post(
    `/api/exercises/${exercise.id}/submit`,
    { headers, data: { answers: { [questions[0].id]: "HELLO" } } },
  );
  expect((await result.json()).data.scorePercentage).toBe(100);
  expect(errors).toEqual([]);
});

test("teacher and admin screens render with real API data and correct roles", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page, "teacher");
  for (const path of [
    "courses",
    "lessons?course_id=1",
    "exercises?lesson_id=1",
    "exams",
    "progress",
    "learning-paths",
    "submissions",
  ]) {
    await page.goto(`/teacher/${path}`);
    await expect(page.locator("main h1").first()).toBeVisible();
    await expect(page.getByText("Đang tải", { exact: true })).toHaveCount(0);
  }
  await page.goto("/teacher/exams");
  await page
    .getByRole("button", { name: /Tạo bài kiểm tra|Tạo đề thi/i })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByLabel("Tiêu đề bài kiểm tra")
    .fill(`Browser exam ${Date.now()}`);
  const questions = page
    .getByRole("group", { name: /Câu hỏi trong đề/ })
    .getByRole("checkbox");
  await questions.first().check();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Tạo bài kiểm tra", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/teacher\/dashboard/);
  await page.evaluate(() => {
    localStorage.clear();
  });
  await login(page, "admin");
  for (const path of ["dashboard", "users", "programs"]) {
    await page.goto(`/admin/${path}`);
    await expect(page.locator("main h1").first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});
