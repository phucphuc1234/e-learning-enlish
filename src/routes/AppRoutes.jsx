import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { USER_ROLES } from '../utils/constants';

// Layouts & Guards
import AuthLayout from '../components/layout/AuthLayout';
import MainLayout from '../components/layout/MainLayout';
import PrivateRoute from './PrivateRoute';
import RoleRoute from './RoleRoute';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import ProgramManagement from '../pages/admin/ProgramManagement';

// Teacher Pages
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import CourseManagement from '../pages/teacher/CourseManagement';
import LessonManagement from '../pages/teacher/LessonManagement';
import ExerciseManagement from '../pages/teacher/ExerciseManagement';
import ExamManagement from '../pages/teacher/ExamManagement';
import StudentProgress from '../pages/teacher/StudentProgress';
import LearningPathManagement from '../pages/teacher/LearningPathManagement';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import CourseList from '../pages/student/CourseList';
import CourseDetail from '../pages/student/CourseDetail';
import LessonView from '../pages/student/LessonView';
import ExercisePage from '../pages/student/ExercisePage';
import ExamPage from '../pages/student/ExamPage';
import MyProgress from '../pages/student/MyProgress';
import LearningPathPage from '../pages/student/LearningPathPage';
import NotificationPage from '../pages/student/NotificationPage';
import ExerciseHistory from '../pages/student/ExerciseHistory';
// Root redirect based on authenticated user's role
const RootRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role === USER_ROLES.ADMIN) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (user?.role === USER_ROLES.TEACHER) {
    return <Navigate to="/teacher/dashboard" replace />;
  }
  return <Navigate to="/student/dashboard" replace />;
};

// 404 Not Found Component
const NotFound = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
    <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-2xl mb-4">
      404
    </div>
    <h2 className="text-xl font-bold text-gray-900">Không tìm thấy trang</h2>
    <p className="mt-2 text-xs text-gray-500 max-w-sm">
      Đường dẫn bạn yêu cầu không tồn tại hoặc đã được chuyển sang địa chỉ mới.
    </p>
    <a
      href="/"
      className="mt-6 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
    >
      Về trang chủ
    </a>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public / Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          {/* Index Route */}
          <Route path="/" element={<RootRedirect />} />

          {/* Admin routes */}
          <Route element={<RoleRoute allowedRoles={[USER_ROLES.ADMIN]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/programs" element={<ProgramManagement />} />
          </Route>

          {/* Teacher routes */}
          <Route element={<RoleRoute allowedRoles={[USER_ROLES.TEACHER, USER_ROLES.ADMIN]} />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/courses" element={<CourseManagement />} />
            <Route path="/teacher/lessons" element={<LessonManagement />} />
            <Route path="/teacher/exercises" element={<ExerciseManagement />} />
            <Route path="/teacher/exams" element={<ExamManagement />} />
            <Route path="/teacher/progress" element={<StudentProgress />} />
            <Route path="/teacher/learning-paths" element={<LearningPathManagement />} />
          </Route>

          {/* Student routes */}
          <Route element={<RoleRoute allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN]} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/courses" element={<CourseList />} />
            <Route path="/student/course/:id" element={<CourseDetail />} />
            <Route path="/student/lesson/:id" element={<LessonView />} />
            <Route path="/student/exercise/:id" element={<ExercisePage />} />
            <Route path="/student/exam/:id" element={<ExamPage />} />
            <Route path="/student/progress" element={<MyProgress />} />
            <Route path="/student/learning-paths" element={<LearningPathPage />} />
            <Route path="/student/notifications" element={<NotificationPage />} />
            <Route
              path="/student/exercise-history"
              element={<ExerciseHistory />}
            />
          </Route>

          {/* Profile fallback */}
          <Route path="/profile" element={<MyProgress />} />

          {/* 404 inside layout */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      {/* Global Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
