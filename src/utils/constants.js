export const USER_ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
};

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: "Quản trị viên",
  [USER_ROLES.TEACHER]: "Giáo viên",
  [USER_ROLES.STUDENT]: "Học viên",
};

export const COURSE_LEVELS = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
};

export const LEVEL_LABELS = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

export const LEVEL_COLORS = {
  beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  advanced: "bg-rose-50 text-rose-700 border-rose-200",
};

export const EXAM_TYPES = {
  QUIZ: "quiz",
  MIDTERM: "midterm",
  FINAL: "final",
  MOCK_TEST: "mock_test",
};

export const EXAM_TYPE_LABELS = {
  quiz: "Kiểm tra nhanh",
  midterm: "Kiểm tra giữa kỳ",
  final: "Kiểm tra cuối kỳ",
  mock_test: "Thi thử",
};

export const EXERCISE_TYPES = {
  MULTIPLE_CHOICE: "multiple_choice",
  FILL_BLANK: "fill_blank",
  MATCHING: "matching",
  ORDERING: "ordering",
  ESSAY: "essay",
  LISTENING: "listening",
  READING: "reading",
  SPEAKING: "speaking",
};

export const EXERCISE_TYPE_LABELS = {
  multiple_choice: "Trắc nghiệm",
  fill_blank: "Điền từ",
  matching: "Nối câu",
  ordering: "Sắp xếp câu",
  essay: "Tự luận",
  listening: "Nghe hiểu",
  reading: "Đọc hiểu",
  speaking: "Luyện nói",
};

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: "multiple_choice",
  FILL_BLANK: "fill_blank",
  TRUE_FALSE: "true_false",
  MATCHING: "matching",
  ORDERING: "ordering",
  ESSAY: "essay",
};

export const QUESTION_TYPE_LABELS = {
  multiple_choice: "Trắc nghiệm 4 đáp án",
  fill_blank: "Điền vào chỗ trống",
  true_false: "Đúng / Sai",
  matching: "Nối đáp án",
  ordering: "Sắp xếp trật tự",
  essay: "Tự luận / Viết",
};

export const DIFFICULTY_LABELS = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Khó",
};

export const NOTIFICATION_TYPES = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
  ASSIGNMENT: "assignment",
  EXAM: "exam",
  RESULT: "result",
};

export const NOTIFICATION_TYPE_LABELS = {
  info: "Thông tin",
  success: "Thành công",
  warning: "Cảnh báo",
  error: "Lỗi",
  assignment: "Bài tập mới",
  exam: "Kỳ thi mới",
  result: "Kết quả bài thi",
};

export const DEFAULT_PROGRAMS = [
  {
    id: 1,
    name: "CEFR B1",
    slug: "cefr-b1",
    description: "Chương trình tiếng Anh theo chuẩn CEFR trình độ B1",
  },
  {
    id: 2,
    name: "CEFR B2",
    slug: "cefr-b2",
    description: "Chương trình tiếng Anh theo chuẩn CEFR trình độ B2",
  },
  {
    id: 3,
    name: "IELTS 6.0",
    slug: "ielts-6-0",
    description: "Luyện thi IELTS mục tiêu 6.0",
  },
  {
    id: 4,
    name: "IELTS 6.5",
    slug: "ielts-6-5",
    description: "Luyện thi IELTS mục tiêu 6.5",
  },
  {
    id: 5,
    name: "IELTS 7.0",
    slug: "ielts-7-0",
    description: "Luyện thi IELTS mục tiêu 7.0",
  },
  {
    id: 6,
    name: "IELTS 7.5+",
    slug: "ielts-7-5-plus",
    description: "Luyện thi IELTS mục tiêu 7.5 trở lên",
  },
  {
    id: 7,
    name: "Luyện thi chuyên Anh",
    slug: "luyen-thi-chuyen-anh",
    description: "Luyện thi vào lớp chuyên Anh",
  },
  {
    id: 8,
    name: "Tiếng Anh THCS",
    slug: "tieng-anh-thcs",
    description: "Tiếng Anh trung học cơ sở",
  },
  {
    id: 9,
    name: "Tiếng Anh THPT",
    slug: "tieng-anh-thpt",
    description: "Tiếng Anh trung học phổ thông",
  },
  {
    id: 10,
    name: "Tiếng Anh học thuật",
    slug: "tieng-anh-hoc-thuat",
    description: "Tiếng Anh học thuật (Academic English)",
  },
  {
    id: 11,
    name: "Tiếng Anh giao tiếp",
    slug: "tieng-anh-giao-tiep",
    description: "Tiếng Anh giao tiếp (Communicative English)",
  },
];

export const ENROLLMENT_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  DROPPED: "dropped",
};

export const ENROLLMENT_STATUS_LABELS = {
  pending: "Chờ duyệt học phí",
  active: "Đang học",
  completed: "Hoàn thành",
  dropped: "Đã hủy",
};
