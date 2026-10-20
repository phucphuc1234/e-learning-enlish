import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import AuthLayout from "../components/layout/AuthLayout";
import MainLayout from "../components/layout/MainLayout";
import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute";
import Loading from "../components/common/Loading";
const LandingPage = lazy(() => import("../pages/LandingPage"));
const HelpPage = lazy(() => import("../pages/HelpPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const UserManagement = lazy(() => import("../pages/admin/UserManagement"));
const ProgramManagement = lazy(
  () => import("../pages/admin/ProgramManagement"),
);
const TeacherDashboard = lazy(
  () => import("../pages/teacher/TeacherDashboard"),
);
const CourseManagement = lazy(
  () => import("../pages/teacher/CourseManagement"),
);
const LessonManagement = lazy(
  () => import("../pages/teacher/LessonManagement"),
);
const ExerciseManagement = lazy(
  () => import("../pages/teacher/ExerciseManagement"),
);
const ExamManagement = lazy(() => import("../pages/teacher/ExamManagement"));
const StudentProgress = lazy(() => import("../pages/teacher/StudentProgress"));
const LearningPathManagement = lazy(
  () => import("../pages/teacher/LearningPathManagement"),
);
const Submissions = lazy(() => import("../pages/teacher/Submissions"));
const StudentDashboard = lazy(
  () => import("../pages/student/StudentDashboard"),
);
const CourseList = lazy(() => import("../pages/student/CourseList"));
const CourseDetail = lazy(() => import("../pages/student/CourseDetail"));
const LessonView = lazy(() => import("../pages/student/LessonView"));
const ExercisePage = lazy(() => import("../pages/student/ExercisePage"));
const ExamPage = lazy(() => import("../pages/student/ExamPage"));
const MyProgress = lazy(() => import("../pages/student/MyProgress"));
const LearningPathPage = lazy(
  () => import("../pages/student/LearningPathPage"),
);
const NotificationPage = lazy(
  () => import("../pages/student/NotificationPage"),
);
const ExerciseHistory = lazy(() => import("../pages/student/ExerciseHistory"));
function Home() {
  const { loading, isAuthenticated, user } = useAuth();
  if (loading) return <Loading fullScreen />;
  return isAuthenticated ? (
    <Navigate replace to={`/${user.role}/dashboard`} />
  ) : (
    <LandingPage />
  );
}
function AuthPage({ children }) {
  const { isAuthenticated, loading } = useAuth();
  return loading ? (
    <Loading />
  ) : isAuthenticated ? (
    <Navigate replace to="/" />
  ) : (
    children
  );
}
export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading text="Đang tải trang…" />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/help" element={<HelpPage />} />
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <AuthPage>
                <LoginPage />
              </AuthPage>
            }
          />
          <Route
            path="/register"
            element={
              <AuthPage>
                <RegisterPage />
              </AuthPage>
            }
          />
        </Route>
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationPage />} />
            <Route element={<RoleRoute allowedRoles={["admin"]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/programs" element={<ProgramManagement />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={["teacher", "admin"]} />}>
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/courses" element={<CourseManagement />} />
              <Route path="/teacher/lessons" element={<LessonManagement />} />
              <Route
                path="/teacher/exercises"
                element={<ExerciseManagement />}
              />
              <Route path="/teacher/exams" element={<ExamManagement />} />
              <Route path="/teacher/progress" element={<StudentProgress />} />
              <Route
                path="/teacher/learning-paths"
                element={<LearningPathManagement />}
              />
              <Route path="/teacher/submissions" element={<Submissions />} />
            </Route>
            <Route
              element={
                <RoleRoute allowedRoles={["student", "teacher", "admin"]} />
              }
            >
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/courses" element={<CourseList />} />
              <Route path="/student/course/:id" element={<CourseDetail />} />
              <Route path="/student/lesson/:id" element={<LessonView />} />
              <Route path="/student/exercise/:id" element={<ExercisePage />} />
              <Route path="/student/exam/:id" element={<ExamPage />} />
              <Route path="/student/progress" element={<MyProgress />} />
              <Route
                path="/student/learning-paths"
                element={<LearningPathPage />}
              />
              <Route
                path="/student/notifications"
                element={<NotificationPage />}
              />
              <Route
                path="/student/exercise-history"
                element={<ExerciseHistory />}
              />
            </Route>
            <Route
              path="*"
              element={
                <div className="surface text-center">
                  <h1 className="text-2xl font-bold">
                    404 · Không tìm thấy trang
                  </h1>
                  <a className="mt-4 inline-block text-blue-700" href="/">
                    Về trang chủ
                  </a>
                </div>
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </Suspense>
  );
}
