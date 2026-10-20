-- =============================================
-- HỆ THỐNG E-LEARNING DẠY VÀ LUYỆN THI TIẾNG ANH
-- Database: ELearningEnglish
-- SQL Server
-- =============================================

-- Tạo Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ELearningEnglish')
BEGIN
    CREATE DATABASE ELearningEnglish;
END
GO

USE ELearningEnglish;
GO

-- =============================================
-- 1. BẢNG USERS - Người dùng
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        full_name NVARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        avatar VARCHAR(500),
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- =============================================
-- 2. BẢNG PROGRAMS - Chương trình đào tạo
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Programs')
BEGIN
    CREATE TABLE Programs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description NVARCHAR(500),
        icon VARCHAR(500),
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- =============================================
-- 3. BẢNG COURSES - Khóa học
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Courses')
BEGIN
    CREATE TABLE Courses (
        id INT IDENTITY(1,1) PRIMARY KEY,
        program_id INT NOT NULL,
        teacher_id INT NOT NULL,
        title NVARCHAR(200) NOT NULL,
        slug VARCHAR(200) NOT NULL UNIQUE,
        description NVARCHAR(MAX),
        thumbnail VARCHAR(500),
        level VARCHAR(20) CHECK (level IN ('beginner', 'intermediate', 'advanced')),
        price DECIMAL(10,2) DEFAULT 0,
        is_free BIT DEFAULT 0,
        is_published BIT DEFAULT 0,
        total_lessons INT DEFAULT 0,
        total_duration INT DEFAULT 0, -- phút
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (program_id) REFERENCES Programs(id),
        FOREIGN KEY (teacher_id) REFERENCES Users(id)
    );
END
GO

-- =============================================
-- 4. BẢNG LESSONS - Bài học
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Lessons')
BEGIN
    CREATE TABLE Lessons (
        id INT IDENTITY(1,1) PRIMARY KEY,
        course_id INT NOT NULL,
        title NVARCHAR(200) NOT NULL,
        content NVARCHAR(MAX),
        video_url VARCHAR(500),
        audio_url VARCHAR(500),
        document_url VARCHAR(500),
        order_index INT DEFAULT 0,
        duration INT DEFAULT 0, -- phút
        is_published BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
    );
END
GO

-- =============================================
-- 5. BẢNG EXERCISES - Bài tập
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Exercises')
BEGIN
    CREATE TABLE Exercises (
        id INT IDENTITY(1,1) PRIMARY KEY,
        lesson_id INT NOT NULL,
        title NVARCHAR(200) NOT NULL,
        description NVARCHAR(MAX),
        type VARCHAR(30) NOT NULL CHECK (type IN ('multiple_choice', 'fill_blank', 'matching', 'ordering', 'essay', 'listening', 'reading', 'speaking')),
        difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
        time_limit INT DEFAULT 0, -- phút, 0 = không giới hạn
        order_index INT DEFAULT 0,
        is_published BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (lesson_id) REFERENCES Lessons(id) ON DELETE CASCADE
    );
END
GO

-- =============================================
-- 6. BẢNG QUESTIONS - Câu hỏi
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Questions')
BEGIN
    CREATE TABLE Questions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        exercise_id INT,
        exam_id INT,
        content NVARCHAR(MAX) NOT NULL,
        image_url VARCHAR(500),
        audio_url VARCHAR(500),
        type VARCHAR(30) NOT NULL CHECK (type IN ('multiple_choice', 'fill_blank', 'true_false', 'matching', 'ordering', 'essay')),
        points DECIMAL(5,2) DEFAULT 1,
        explanation NVARCHAR(MAX), -- Lời giải
        order_index INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (exercise_id) REFERENCES Exercises(id) ON DELETE CASCADE
    );
END
GO

-- =============================================
-- 7. BẢNG ANSWERS - Đáp án
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Answers')
BEGIN
    CREATE TABLE Answers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        question_id INT NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        is_correct BIT DEFAULT 0,
        order_index INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (question_id) REFERENCES Questions(id) ON DELETE CASCADE
    );
END
GO

-- =============================================
-- 8. BẢNG EXAMS - Bài kiểm tra / Thi thử
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Exams')
BEGIN
    CREATE TABLE Exams (
        id INT IDENTITY(1,1) PRIMARY KEY,
        course_id INT NOT NULL,
        teacher_id INT NOT NULL,
        title NVARCHAR(200) NOT NULL,
        description NVARCHAR(MAX),
        type VARCHAR(20) NOT NULL CHECK (type IN ('quiz', 'midterm', 'final', 'mock_test')),
        time_limit INT NOT NULL, -- phút
        total_questions INT DEFAULT 0,
        total_points DECIMAL(5,2) DEFAULT 0,
        pass_score DECIMAL(5,2) DEFAULT 50,
        max_attempts INT DEFAULT 1,
        shuffle_questions BIT DEFAULT 0,
        show_answer_after BIT DEFAULT 1,
        is_published BIT DEFAULT 0,
        start_date DATETIME,
        end_date DATETIME,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (course_id) REFERENCES Courses(id),
        FOREIGN KEY (teacher_id) REFERENCES Users(id)
    );
END
GO

-- =============================================
-- 9. BẢNG EXAM_QUESTIONS - Câu hỏi bài thi
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ExamQuestions')
BEGIN
    CREATE TABLE ExamQuestions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        exam_id INT NOT NULL,
        question_id INT NOT NULL,
        order_index INT DEFAULT 0,
        FOREIGN KEY (exam_id) REFERENCES Exams(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES Questions(id)
    );
END
GO

-- =============================================
-- 10. BẢNG STUDENT_ENROLLMENTS - Đăng ký khóa học
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StudentEnrollments')
BEGIN
    CREATE TABLE StudentEnrollments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        student_id INT NOT NULL,
        course_id INT NOT NULL,
        enrolled_at DATETIME DEFAULT GETDATE(),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
        progress_percent DECIMAL(5,2) DEFAULT 0,
        completed_at DATETIME,
        FOREIGN KEY (student_id) REFERENCES Users(id),
        FOREIGN KEY (course_id) REFERENCES Courses(id),
        UNIQUE(student_id, course_id)
    );
END
GO

-- =============================================
-- 11. BẢNG STUDENT_PROGRESS - Tiến độ học
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StudentProgress')
BEGIN
    CREATE TABLE StudentProgress (
        id INT IDENTITY(1,1) PRIMARY KEY,
        student_id INT NOT NULL,
        lesson_id INT NOT NULL,
        is_completed BIT DEFAULT 0,
        completed_at DATETIME,
        time_spent INT DEFAULT 0, -- phút
        last_accessed DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (student_id) REFERENCES Users(id),
        FOREIGN KEY (lesson_id) REFERENCES Lessons(id),
        UNIQUE(student_id, lesson_id)
    );
END
GO

-- =============================================
-- 12. BẢNG STUDENT_ANSWERS - Câu trả lời học viên
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StudentAnswers')
BEGIN
    CREATE TABLE StudentAnswers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        student_id INT NOT NULL,
        question_id INT NOT NULL,
        exam_result_id INT,
        selected_answer_id INT,
        text_answer NVARCHAR(MAX),
        is_correct BIT DEFAULT 0,
        points_earned DECIMAL(5,2) DEFAULT 0,
        answered_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (student_id) REFERENCES Users(id),
        FOREIGN KEY (question_id) REFERENCES Questions(id),
        FOREIGN KEY (selected_answer_id) REFERENCES Answers(id)
    );
END
GO

-- =============================================
-- 13. BẢNG STUDENT_EXAM_RESULTS - Kết quả thi
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StudentExamResults')
BEGIN
    CREATE TABLE StudentExamResults (
        id INT IDENTITY(1,1) PRIMARY KEY,
        student_id INT NOT NULL,
        exam_id INT NOT NULL,
        score DECIMAL(5,2) DEFAULT 0,
        total_correct INT DEFAULT 0,
        total_questions INT DEFAULT 0,
        time_taken INT DEFAULT 0, -- phút
        is_passed BIT DEFAULT 0,
        attempt_number INT DEFAULT 1,
        started_at DATETIME DEFAULT GETDATE(),
        completed_at DATETIME,
        FOREIGN KEY (student_id) REFERENCES Users(id),
        FOREIGN KEY (exam_id) REFERENCES Exams(id)
    );
END
GO

-- =============================================
-- 14. BẢNG LEARNING_PATHS - Lộ trình học
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LearningPaths')
BEGIN
    CREATE TABLE LearningPaths (
        id INT IDENTITY(1,1) PRIMARY KEY,
        program_id INT NOT NULL,
        teacher_id INT NOT NULL,
        title NVARCHAR(200) NOT NULL,
        description NVARCHAR(MAX),
        level VARCHAR(20) CHECK (level IN ('beginner', 'intermediate', 'advanced')),
        estimated_duration INT DEFAULT 0, -- ngày
        is_published BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (program_id) REFERENCES Programs(id),
        FOREIGN KEY (teacher_id) REFERENCES Users(id)
    );
END
GO

-- =============================================
-- 15. BẢNG LEARNING_PATH_COURSES - Khóa học trong lộ trình
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LearningPathCourses')
BEGIN
    CREATE TABLE LearningPathCourses (
        id INT IDENTITY(1,1) PRIMARY KEY,
        learning_path_id INT NOT NULL,
        course_id INT NOT NULL,
        order_index INT DEFAULT 0,
        FOREIGN KEY (learning_path_id) REFERENCES LearningPaths(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES Courses(id)
    );
END
GO

-- =============================================
-- 16. BẢNG NOTIFICATIONS - Thông báo
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE Notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        title NVARCHAR(200) NOT NULL,
        message NVARCHAR(MAX),
        type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'assignment', 'exam', 'result')),
        is_read BIT DEFAULT 0,
        link VARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(id)
    );
END
GO

-- =============================================
-- 17. BẢNG REPORTS - Báo cáo định kỳ
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Reports')
BEGIN
    CREATE TABLE Reports (
        id INT IDENTITY(1,1) PRIMARY KEY,
        student_id INT NOT NULL,
        course_id INT NOT NULL,
        report_type VARCHAR(20) CHECK (report_type IN ('weekly', 'monthly', 'course_completion')),
        total_lessons_completed INT DEFAULT 0,
        total_exercises_done INT DEFAULT 0,
        total_exams_taken INT DEFAULT 0,
        average_score DECIMAL(5,2) DEFAULT 0,
        time_spent INT DEFAULT 0, -- phút
        strengths NVARCHAR(MAX),
        weaknesses NVARCHAR(MAX),
        recommendations NVARCHAR(MAX),
        period_start DATETIME,
        period_end DATETIME,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (student_id) REFERENCES Users(id),
        FOREIGN KEY (course_id) REFERENCES Courses(id)
    );
END
GO

-- =============================================
-- DỮ LIỆU MẪU
-- =============================================

-- Thêm tài khoản Admin mặc định (password: admin123)
INSERT INTO Users (full_name, email, password, role)
VALUES (N'Admin Hệ Thống', 'admin@elearning.com', '$2b$10$YQ8GzKj6KxOjGjFGhKQVXeHashedPasswordPlaceholder', 'admin');

-- Thêm các chương trình đào tạo
INSERT INTO Programs (name, slug, description) VALUES
(N'CEFR B1', 'cefr-b1', N'Chương trình tiếng Anh theo chuẩn CEFR trình độ B1'),
(N'CEFR B2', 'cefr-b2', N'Chương trình tiếng Anh theo chuẩn CEFR trình độ B2'),
(N'IELTS 6.0', 'ielts-6-0', N'Luyện thi IELTS mục tiêu 6.0'),
(N'IELTS 6.5', 'ielts-6-5', N'Luyện thi IELTS mục tiêu 6.5'),
(N'IELTS 7.0', 'ielts-7-0', N'Luyện thi IELTS mục tiêu 7.0'),
(N'IELTS 7.5+', 'ielts-7-5-plus', N'Luyện thi IELTS mục tiêu 7.5 trở lên'),
(N'Luyện thi chuyên Anh', 'luyen-thi-chuyen-anh', N'Luyện thi vào lớp chuyên Anh'),
(N'Tiếng Anh THCS', 'tieng-anh-thcs', N'Tiếng Anh trung học cơ sở'),
(N'Tiếng Anh THPT', 'tieng-anh-thpt', N'Tiếng Anh trung học phổ thông'),
(N'Tiếng Anh học thuật', 'tieng-anh-hoc-thuat', N'Tiếng Anh học thuật (Academic English)'),
(N'Tiếng Anh giao tiếp', 'tieng-anh-giao-tiep', N'Tiếng Anh giao tiếp (Communicative English)');
GO

PRINT N'✅ Database ELearningEnglish đã được tạo thành công!';
GO
