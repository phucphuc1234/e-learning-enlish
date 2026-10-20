import { forEachAsync } from "./async-utils.js";
import { openDatabase, hashPassword, now } from "./database.js";
export async function seedDemo(store) {
  if (store.driver === "mssql")
    throw new Error(
      "SQL Server đã có dữ liệu từ EnglishStudio_Full.sql; không chạy seed:demo vào database này.",
    );
  if (process.env.NODE_ENV === "production")
    throw new Error("Demo seed is disabled in production");
  const { get, insert, run, transaction } = store;
  // Public, local-only demo accounts; never created automatically by the server.
  const accounts = [
    ["admin@elearning.com", "Quản trị viên", "admin"],
    ["teacher@elearning.com", "Cô Minh Anh", "teacher"],
    ["student@elearning.com", "Nguyễn An", "student"],
  ];
  await transaction(async () => {
    for (const [email, full_name, role] of accounts)
      if (!(await get("SELECT id FROM users WHERE email=?", email))) {
        await insert("users", {
          email,
          full_name,
          role,
          password_hash: hashPassword("EnglishDemo!2026"),
          created_at: now(),
        });
      }
    if (await get("SELECT id FROM courses LIMIT 1")) return;
    const teacher = await get(
      "SELECT id FROM users WHERE email=?",
      "teacher@elearning.com",
    );
    const program = await insert("programs", {
      name: "Tiếng Anh nền tảng A1–A2",
      slug: "english-foundations",
      description: "Xây dựng ngữ pháp, từ vựng và giao tiếp căn bản.",
      created_at: now(),
    });
    const tracks = [
      [
        "English Foundations",
        "Nền tảng vững, tự tin mỗi ngày",
        "beginner",
        [
          [
            "Hello, nice to meet you!",
            "# Introducing yourself\n\n**Hello! My name is Anna. I am from Vietnam. I am a student.**\n\nKhi gặp một người lần đầu, bạn có thể nói “Nice to meet you!” — Rất vui được gặp bạn.\n\n## Hỏi và trả lời\n\n- What is your name? → My name is Anna.\n- Where are you from? → I am from Vietnam.\n- How are you? → I am fine, thank you.\n\n## Your turn\n\nViết 3 câu giới thiệu tên, quê quán và công việc của bạn.",
            "What is the best reply to “Nice to meet you”?",
            ["Nice to meet you too!", "I am twenty.", "It is Monday."],
            0,
          ],
          [
            "Everyday routines",
            "# The present simple\n\nDùng hiện tại đơn để nói về thói quen và những điều lặp lại.\n\n**I study English every day. She studies English every day.**\n\n- I / You / We / They + động từ nguyên mẫu.\n- He / She / It + động từ thêm -s hoặc -es.\n\n## Negative sentences\n\nI do not drink coffee. She does not drink coffee.\n\n## Practice\n\nViết 5 câu về một ngày bình thường của bạn.",
            "She ___ English every morning.",
            ["study", "studies", "studying"],
            1,
          ],
          [
            "At the café",
            "# Ordering politely\n\n**Could I have a cup of tea, please?** — Cho tôi một tách trà được không?\n\n“Could I have…” lịch sự hơn “I want…”.\n\n## Useful expressions\n\n- What would you like?\n- I would like a sandwich, please.\n- How much is it?\n- Can I pay by card?\n\n## A short dialogue\n\n**Barista:** What would you like?\n\n**Customer:** A cup of coffee, please.\n\n**Barista:** Anything else?\n\n**Customer:** No, thank you.",
            "Which phrase is a polite request?",
            [
              "Give me coffee.",
              "Could I have a tea, please?",
              "You must give tea.",
            ],
            1,
          ],
        ],
      ],
      [
        "Grammar in Context",
        "Hiểu ngữ pháp qua tình huống thực tế",
        "intermediate",
        [
          [
            "Past experiences",
            "# Past simple and present perfect\n\n**I visited London in 2022.** — Thời điểm đã xác định, dùng quá khứ đơn.\n\n**I have visited London.** — Nói về trải nghiệm, không nhấn mạnh thời điểm.\n\n## Compare\n\n- Have you ever tried sushi?\n- Yes, I tried it last week.\n\nKhông dùng hiện tại hoàn thành cùng “yesterday”, “last year” hoặc một năm đã qua.",
            "I ___ to London last year.",
            ["have been", "went", "go"],
            1,
          ],
          [
            "Plans and predictions",
            "# Talking about the future\n\nDùng **be going to** để nói về dự định đã có: “I am going to study tonight.”\n\nDùng **will** cho quyết định tức thời: “The phone is ringing. I will answer it.”\n\n## Practice\n\nViết 3 dự định cho tuần tới và 2 dự đoán về tương lai.",
            "The phone is ringing. I ___ answer it.",
            ["will", "am", "was"],
            0,
          ],
        ],
      ],
      [
        "Read & Discover",
        "Mở rộng vốn từ qua những câu chuyện",
        "beginner",
        [
          [
            "A greener city",
            "# A greener city\n\nEvery Saturday, Linh and her friends plant trees in their neighbourhood. They believe that small actions can make a big difference. Last month, they planted twenty trees near their school. Now more birds visit the area.\n\n## Vocabulary\n\n- neighbourhood: khu phố\n- plant: trồng cây\n- make a difference: tạo nên sự thay đổi\n\n## Reading strategy\n\nĐọc câu hỏi trước, tìm từ khóa rồi đọc kỹ đoạn có thông tin liên quan.",
            "How often do Linh and her friends plant trees?",
            ["Every day", "Every Saturday", "Once a year"],
            1,
          ],
        ],
      ],
    ];
    const courseIds = [];
    for (const [title, description, level, units] of tracks) {
      const c = await insert("courses", {
        title,
        slug: title.toLowerCase().replaceAll(" ", "-").replace("&", "and"),
        description,
        level,
        teacher_id: teacher.id,
        program_id: program.id,
        is_published: 1,
        created_at: now(),
      });
      courseIds.push(c.id);
      const questionIds = [];
      await forEachAsync(
        units,
        async ([lessonTitle, content, prompt, options, correct], index) => {
          const l = await insert("lessons", {
            course_id: c.id,
            title: lessonTitle,
            content,
            order_index: index + 1,
            is_published: 1,
            duration: 15,
            created_at: now(),
          });
          const e = await insert("exercises", {
            lesson_id: l.id,
            title: `Practice: ${lessonTitle}`,
            type: "multiple_choice",
            is_published: 1,
            created_at: now(),
          });
          const q = await insert("questions", {
            exercise_id: e.id,
            content: prompt,
            explanation: `Đáp án phù hợp là “${options[correct]}”. Xem lại phần lý thuyết trong bài học.`,
            created_at: now(),
          });
          questionIds.push(q.id);
          await forEachAsync(
            options,
            async (content, i) =>
              await insert("answers", {
                question_id: q.id,
                content,
                is_correct: i === correct ? 1 : 0,
              }),
          );
        },
      );
      const exam = await insert("exams", {
        course_id: c.id,
        title: `${title} — Progress check`,
        time_limit: 15,
        max_attempts: 3,
        is_published: 1,
        created_at: now(),
      });
      await forEachAsync(
        questionIds,
        async (q, i) =>
          await run(
            "INSERT INTO exam_questions VALUES(?,?,?)",
            exam.id,
            q,
            i + 1,
          ),
      );
    }
    const path = await insert("learning_paths", {
      teacher_id: teacher.id,
      program_id: program.id,
      title: "Từ nền tảng đến giao tiếp tự tin",
      description:
        "Bắt đầu với những câu chào hỏi, rèn ngữ pháp và luyện đọc mỗi ngày.",
      level: "beginner",
      estimated_duration: 30,
      is_published: 1,
      created_at: now(),
    });
    await forEachAsync(
      courseIds,
      async (c, i) =>
        await run("INSERT INTO path_courses VALUES(?,?,?)", path.id, c, i + 1),
    );
  });
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/seed.js")) {
  const store = await openDatabase();
  try {
    await seedDemo(store);
    console.log(
      "Demo data ready. See README for local demo access. Existing records preserved.",
    );
  } finally {
    await store.db.close();
  }
}
