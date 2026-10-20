import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../api/axiosClient";
import Loading from "../../components/common/Loading";
import Modal from "../../components/common/Modal";
import RequestError from "../../components/common/RequestError";
import { formatDate } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function MyProgress() {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [detail, setDetail] = useState(null);
  async function load() {
    try {
      setData((await axios.get("/dashboard/student")).data);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function view(a) {
    try {
      const res = await axios.get(
        a.kind === "exam"
          ? `/exams/results/${a.id}`
          : `/exercises/my-attempts/${a.id}`,
      );
      setDetail(res.data);
    } catch (e) {
      toast.error(e.message);
    }
  }
  if (!data && !error) return <Loading />;
  const attempts = data?.attempts || [],
    graded = attempts.filter((a) => a.status === "graded");
  const average = graded.length
    ? (graded.reduce((s, a) => s + a.score, 0) / graded.length).toFixed(1)
    : null;
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">TỪNG BƯỚC TIẾN BỘ</p>
        <h1 className="mt-2 text-3xl font-bold">Tiến độ & kết quả</h1>
        <p className="mt-2 text-sm text-slate-500">
          Thống kê từ các bài học và bài làm đã lưu của bạn.
        </p>
      </div>
      <RequestError message={error} onRetry={load} />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Bài học hoàn thành", data?.totalLessonsCompleted || 0],
          ["Bài làm đã nộp", attempts.length],
          ["Điểm trung bình", average === null ? "Chưa có" : `${average}%`],
        ].map(([title, value]) => (
          <div className="surface" key={title}>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-3 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="surface">
          <h2 className="text-lg font-bold">Các khóa học</h2>
          <div className="mt-5 space-y-5">
            {data?.enrollments.map((e) => (
              <div key={e.id}>
                <Link
                  className="text-sm font-semibold hover:text-blue-700"
                  to={`/student/course/${e.course_id}`}
                >
                  {e.course_title}
                </Link>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${e.progress_percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {e.lessons_completed}/{e.total_lessons} bài ·{" "}
                  {e.progress_percent}%
                </p>
              </div>
            ))}
            {!data?.enrollments.length && (
              <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
            )}
          </div>
        </section>
        <section className="surface">
          <h2 className="text-lg font-bold">
            Thời gian học ghi nhận trong tuần
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Thời gian trên trang bài học khi lưu hoàn thành, tính theo ngày UTC.
          </p>
          <div className="mt-8 flex h-40 items-end justify-around gap-3">
            {data?.weeklyStudy.map((d) => (
              <div
                key={d.day}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-xs text-slate-500">{d.minutes}′</span>
                <div
                  className="w-full max-w-9 rounded-t-md bg-blue-500"
                  style={{
                    height: `${Math.max(3, (d.minutes / Math.max(1, ...data.weeklyStudy.map((x) => x.minutes))) * 100)}px`,
                  }}
                />
                <span className="text-[10px] text-slate-400">{d.day}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="surface overflow-x-auto">
        <h2 className="mb-5 text-lg font-bold">Lịch sử bài tập & bài thi</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs text-slate-500">
              {["Bài làm", "Ngày nộp", "Điểm", "Trạng thái", "Chi tiết"].map(
                (t) => (
                  <th className="p-3" key={t}>
                    {t}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {attempts
              .slice()
              .reverse()
              .map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{a.exam_title}</td>
                  <td className="p-3 text-slate-500">
                    {formatDate(a.submitted_at)}
                  </td>
                  <td className="p-3 font-bold text-blue-700">{a.score}%</td>
                  <td className="p-3">
                    {a.status === "pending_grading"
                      ? "Chờ giáo viên chấm"
                      : "Đã chấm"}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => view(a)}
                      className="text-blue-700 underline"
                    >
                      Xem kết quả
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {!attempts.length && (
          <p className="py-8 text-center text-sm text-slate-500">
            Bạn chưa nộp bài nào.
          </p>
        )}
      </section>
      <Modal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title="Kết quả chi tiết"
        size="lg"
      >
        {detail && (
          <div className="space-y-4">
            <h3 className="font-bold">{detail.exam_title}</h3>
            <p className="text-3xl font-bold text-blue-700">{detail.score}%</p>
            {detail.status === "pending_grading" && (
              <p className="text-sm text-amber-700">
                Điểm tạm tính. Chờ giáo viên chấm phần tự luận.
              </p>
            )}
            {detail.feedback && (
              <div className="rounded-xl bg-blue-50 p-4 text-sm">
                Nhận xét: {detail.feedback}
              </div>
            )}
            {detail.questions?.map((q, i) => (
              <div
                key={q.question_id}
                className="rounded-xl bg-slate-50 p-4 text-sm"
              >
                <p className="font-bold">
                  {i + 1}. {q.question_content}
                </p>
                <p className="mt-2 whitespace-pre-wrap">
                  Bạn trả lời: {q.selected_answer || "(Chưa trả lời)"}
                </p>
                {q.correct_answer && (
                  <p className="mt-1 text-emerald-700">
                    Đáp án: {q.correct_answer}
                  </p>
                )}
                {q.explanation && (
                  <p className="mt-1 text-slate-500">{q.explanation}</p>
                )}
              </div>
            ))}
            {!detail.questions && (
              <p className="text-sm text-slate-500">
                Giáo viên đã tắt xem đáp án cho bài thi này.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
