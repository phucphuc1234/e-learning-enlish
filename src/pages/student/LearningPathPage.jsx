import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../api/axiosClient";
import Loading from "../../components/common/Loading";
import RequestError from "../../components/common/RequestError";
import { LEVEL_LABELS } from "../../utils/constants";
export default function LearningPathPage() {
  const [paths, setPaths] = useState([]),
    [enrollments, setEnrollments] = useState([]),
    [selected, setSelected] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  async function load() {
    setLoading(true);
    try {
      const [p, e] = await Promise.all([
        axios.get("/learning-paths"),
        axios.get("/enrollments"),
      ]);
      setPaths(p.data);
      setEnrollments(e.data);
      setSelected(p.data[0]?.id);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  const path = paths.find((p) => p.id === selected);
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">HỌC CÓ ĐỊNH HƯỚNG</p>
        <h1 className="mt-2 text-3xl font-bold">Lộ trình học tập</h1>
        <p className="mt-2 text-sm text-slate-500">
          Theo các khóa học được giáo viên sắp xếp, từng bước đến mục tiêu của
          bạn.
        </p>
      </div>
      <RequestError message={error} onRetry={load} />
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            {paths.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`rounded-full border px-5 py-3 text-sm font-semibold ${p.id === selected ? "bg-blue-700 text-white" : "bg-white text-slate-600"}`}
              >
                {p.title}
              </button>
            ))}
          </div>
          {!paths.length && (
            <p className="surface text-slate-500">
              Chưa có lộ trình được xuất bản.
            </p>
          )}
          {path && (
            <section className="surface">
              <p className="eyebrow">
                {LEVEL_LABELS[path.level]} · {path.estimated_duration} ngày dự
                kiến
              </p>
              <h2 className="mt-3 text-2xl font-bold">{path.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                {path.description}
              </p>
              <ol className="mt-8 space-y-5">
                {path.courses.map((c, i) => {
                  const e = enrollments.find((e) => e.course_id === c.id);
                  return (
                    <li key={c.id} className="flex items-start gap-4">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${e?.progress_percent === 100 ? "bg-emerald-100 text-emerald-700" : "bg-blue-50 text-blue-700"}`}
                      >
                        {e?.progress_percent === 100 ? "✓" : i + 1}
                      </span>
                      <div className="flex flex-1 flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
                        <div>
                          <h3 className="font-bold">{c.title}</h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {c.total_lessons} bài học ·{" "}
                            {e
                              ? `${e.progress_percent}% hoàn thành`
                              : "Chưa tham gia"}
                          </p>
                        </div>
                        <Link
                          className="text-sm font-semibold text-blue-700"
                          to={`/student/course/${c.id}`}
                        >
                          Xem khóa học →
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {!path.courses.length && (
                <p className="mt-6 text-sm text-slate-500">
                  Giáo viên đang bổ sung khóa học cho lộ trình.
                </p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
