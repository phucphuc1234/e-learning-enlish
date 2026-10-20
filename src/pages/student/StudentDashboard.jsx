import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiAcademicCap,
  HiArrowUpRight,
  HiBookOpen,
  HiCheckCircle,
  HiClock,
  HiClipboardDocumentCheck,
} from "react-icons/hi2";
import useAuth from "../../hooks/useAuth";
import axios from "../../api/axiosClient";
import Loading from "../../components/common/Loading";
import RequestError from "../../components/common/RequestError";
import { LEVEL_LABELS, ENROLLMENT_STATUS_LABELS } from "../../utils/constants";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null),
    [exams, setExams] = useState([]),
    [error, setError] = useState("");
  async function load() {
    setError("");
    try {
      const [stats, exams] = await Promise.all([
        axios.get("/dashboard/student"),
        axios.get("/exams"),
      ]);
      setData(stats.data);
      setExams(exams.data);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  if (!data && !error) return <Loading />;
  const active = data?.enrollments.find((e) =>
    ["active", "completed"].includes(e.status),
  );
  const graded = data?.attempts.filter((a) => a.status === "graded") || [];
  const stats = [
    [HiBookOpen, "Khóa học đã đăng ký", data?.totalCourses || 0],
    [HiCheckCircle, "Bài học hoàn thành", data?.totalLessonsCompleted || 0],
    [HiClipboardDocumentCheck, "Bài làm đã nộp", data?.attempts.length || 0],
    [
      HiAcademicCap,
      "Điểm trung bình",
      graded.length
        ? `${(graded.reduce((s, a) => s + a.score, 0) / graded.length / 10).toFixed(1)}/10`
        : "Chưa có",
    ],
  ];
  return (
    <div className="space-y-7">
      <RequestError message={error} onRetry={load} />
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-7 text-white sm:p-10">
        <div className="absolute -right-12 -top-20 h-72 w-72 rounded-full border-[40px] border-white/5" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            YOUR ENGLISH JOURNEY
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Chào {user.full_name.split(" ").at(-1)},<br />
            hôm nay mình học gì?
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Mỗi bài học nhỏ là một bước tiến. Tiếp tục hành trình của bạn, theo
            nhịp của chính mình.
          </p>
          <Link
            className="mt-7 inline-flex items-center gap-5 rounded-full bg-[#d6f2a5] px-6 py-3 text-sm font-bold text-slate-900"
            to={
              active?.last_lesson_id
                ? `/student/lesson/${active.last_lesson_id}`
                : "/student/courses"
            }
          >
            {active?.last_lesson_id ? "Tiếp tục học" : "Khám phá khóa học"}
            <HiArrowUpRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map(([Icon, title, value]) => (
          <section key={title} className="surface">
            <Icon className="mb-4 h-6 w-6 text-blue-600" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{title}</p>
          </section>
        ))}
      </div>
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Khóa học của tôi</h2>
          <Link
            to="/student/courses"
            className="text-sm font-semibold text-blue-700"
          >
            Khám phá thêm ↗
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {data?.enrollments.map((e) => (
            <article key={e.id} className="surface">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {LEVEL_LABELS[e.level]}
                </span>
                <span className="text-xs text-slate-500">
                  {ENROLLMENT_STATUS_LABELS[e.status]}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{e.course_title}</h3>
              <div className="my-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${e.progress_percent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>
                  {e.lessons_completed}/{e.total_lessons} bài học
                </span>
                <span>{e.progress_percent}%</span>
              </div>
              <Link
                className="mt-5 inline-flex text-sm font-semibold text-blue-700"
                to={
                  ["active", "completed"].includes(e.status) && e.last_lesson_id
                    ? `/student/lesson/${e.last_lesson_id}`
                    : `/student/course/${e.course_id}`
                }
              >
                {e.status === "pending"
                  ? "Xem đăng ký đang chờ duyệt"
                  : "Vào học →"}
              </Link>
            </article>
          ))}
        </div>
        {!data?.enrollments.length && (
          <div className="surface py-12 text-center text-sm text-slate-500">
            Bạn chưa đăng ký khóa học nào.{" "}
            <Link to="/student/courses" className="text-blue-700 underline">
              Chọn khóa học đầu tiên
            </Link>
            .
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold">Kiểm tra kiến thức</h2>
        <div className="surface divide-y">
          {exams.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <h3 className="font-semibold">{e.title}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {e.total_questions} câu · {e.time_limit} phút · Điểm đạt{" "}
                  {e.pass_score}%
                </p>
              </div>
              <Link
                to={`/student/exam/${e.id}`}
                className="rounded-lg border px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                Làm bài →
              </Link>
            </div>
          ))}
          {!exams.length && (
            <p className="text-sm text-slate-500">
              Bài kiểm tra sẽ xuất hiện sau khi bạn tham gia khóa học.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
