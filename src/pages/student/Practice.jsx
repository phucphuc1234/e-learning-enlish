import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../../api/axiosClient";
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import { formatSeconds } from "../../utils/helpers";

export default function Practice({ kind = "exercise" }) {
  const { id } = useParams();
  const isExam = kind === "exam";
  const [data, setData] = useState(null),
    [questions, setQuestions] = useState([]),
    [answers, setAnswers] = useState({});
  const [session, setSession] = useState(null),
    [result, setResult] = useState(null),
    [error, setError] = useState("");
  const [loading, setLoading] = useState(true),
    [submitting, setSubmitting] = useState(false),
    [remaining, setRemaining] = useState(null),
    [saved, setSaved] = useState("");
  const answersRef = useRef({}),
    locked = useRef(false),
    autoSubmitted = useRef(false),
    endRef = useRef(null);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    setResult(null);
    setSession(null);
    setAnswers({});
    locked.current = false;
    autoSubmitted.current = false;
    async function load() {
      try {
        const response = await axios.get(
          `/${isExam ? "exams" : "exercises"}/${id}`,
        );
        const payload = isExam
          ? (await axios.post(`/exams/${id}/start`)).data
          : {
              questions: (await axios.get(`/questions/exercise/${id}`)).data,
              answers: {},
            };
        if (!alive) return;
        setData(response.data);
        setQuestions(payload.questions);
        setAnswers(payload.answers || {});
        answersRef.current = payload.answers || {};
        if (isExam) {
          endRef.current =
            performance.now() +
            Math.max(
              0,
              Date.parse(payload.deadline) - Date.parse(payload.server_now),
            );
          setSession(payload);
        }
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [id, isExam]);
  const submit = useCallback(
    async (automatic = false) => {
      if (locked.current || result || !questions.length) return;
      if (
        !automatic &&
        Object.keys(answersRef.current).length < questions.length &&
        !window.confirm("Bạn chưa trả lời hết. Vẫn nộp bài?")
      )
        return;
      locked.current = true;
      setSubmitting(true);
      setError("");
      try {
        const response = await axios.post(
          `/${isExam ? "exams" : "exercises"}/${id}/submit`,
          {
            answers: answersRef.current,
            exam_result_id: session?.exam_result_id,
          },
        );
        setResult(response.data);
        toast.success(
          response.data.pending_grading
            ? "Đã nộp bài. Chờ giáo viên chấm phần tự luận."
            : "Đã lưu kết quả bài làm.",
        );
      } catch (e) {
        setError(e.message);
      } finally {
        locked.current = false;
        setSubmitting(false);
      }
    },
    [id, isExam, session, result, questions.length],
  );
  useEffect(() => {
    if (!session || result) return;
    const tick = () => {
      const seconds = Math.max(
        0,
        Math.ceil((endRef.current - performance.now()) / 1000),
      );
      setRemaining(seconds);
      if (!seconds && !autoSubmitted.current) {
        autoSubmitted.current = true;
        submit(true);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session, result, submit]);
  useEffect(() => {
    if (!session || result) return;
    const timer = setTimeout(async () => {
      try {
        await axios.put(`/exams/${id}/draft`, {
          exam_result_id: session.exam_result_id,
          answers,
        });
        setSaved("Đã lưu câu trả lời");
      } catch (e) {
        setSaved(`Chưa lưu được: ${e.message}`);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [answers, session, result, id]);
  function answer(q, value) {
    if (result || submitting || remaining === 0) return;
    const next = { ...answersRef.current, [q.id]: value };
    answersRef.current = next;
    setAnswers(next);
    setSaved("Đang lưu…");
  }
  if (loading) return <Loading text="Đang tải bài làm…" />;
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <Link
        className="text-sm text-blue-600"
        to={
          data?.lesson_id
            ? `/student/lesson/${data.lesson_id}`
            : "/student/dashboard"
        }
      >
        ← Quay lại
      </Link>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
        >
          {error}
        </div>
      )}
      {data && (
        <>
          <div className="sticky top-16 z-20 rounded-2xl border bg-white/95 p-5 shadow-sm backdrop-blur flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">
                {isExam ? "KIỂM TRA KIẾN THỨC" : "LUYỆN TẬP"}
              </p>
              <h1 className="text-xl font-bold">{data.title}</h1>
              <p className="mt-1 text-xs text-slate-500">
                {questions.length} câu hỏi · {Object.keys(answers).length} đã
                trả lời
              </p>
            </div>
            {isExam && !result && (
              <div
                role="timer"
                className={`font-mono text-2xl font-bold ${remaining < 60 ? "text-red-600" : "text-blue-700"}`}
              >
                {formatSeconds(remaining)}
              </div>
            )}
          </div>
          {data.description && (
            <p className="whitespace-pre-wrap rounded-xl bg-blue-50 p-5 text-sm text-blue-900">
              {data.description}
            </p>
          )}
          {result && (
            <section
              aria-label="Kết quả bài làm"
              className="rounded-2xl bg-slate-900 text-white p-7"
            >
              <p className="text-sm text-slate-300">
                {result.pending_grading
                  ? "Điểm tạm tính · Chờ giáo viên chấm"
                  : "Kết quả đã lưu"}
              </p>
              <p className="my-2 text-5xl font-bold">
                {result.scorePercentage}%
              </p>
              <p className="text-sm">
                Đúng {result.correctCount}/{result.totalQuestions} câu ·{" "}
                {result.earnedPoints}/{result.totalPoints} điểm tự động
              </p>
              {isExam && (
                <p className="mt-2 text-sm">
                  {result.pending_grading
                    ? "Kết quả cuối cùng sẽ có sau khi chấm."
                    : result.isPassed
                      ? "Bạn đã đạt yêu cầu."
                      : "Chưa đạt yêu cầu. Hãy ôn lại bài học."}
                </p>
              )}
              <Link
                to={isExam ? "/student/progress" : "/student/exercise-history"}
                className="mt-4 inline-block text-sm text-emerald-300 underline"
              >
                Xem lịch sử và kết quả →
              </Link>
            </section>
          )}
          {!questions.length && (
            <p className="surface">
              Bài này chưa có câu hỏi. Vui lòng liên hệ giáo viên.
            </p>
          )}
          {questions.map((q, i) => {
            const detail = result?.details?.find((d) => d.questionId === q.id);
            return (
              <section key={q.id} className="surface space-y-4">
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
                    {i + 1}
                  </span>
                  <div>
                    <h2 className="font-semibold whitespace-pre-wrap">
                      {q.content}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {q.points} điểm
                      {["essay", "speaking"].includes(q.type)
                        ? " · Giáo viên chấm"
                        : ""}
                    </p>
                  </div>
                </div>
                {q.answers?.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {q.answers.map((a) => (
                      <label
                        key={a.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition ${Number(answers[q.id]) === a.id ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200 hover:bg-slate-50"}`}
                      >
                        <input
                          aria-label={a.content}
                          type="radio"
                          name={`question-${q.id}`}
                          value={a.id}
                          checked={Number(answers[q.id]) === a.id}
                          disabled={!!result || submitting || remaining === 0}
                          onChange={() => answer(q, a.id)}
                        />
                        {a.content}
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    aria-label={`Trả lời câu ${i + 1}`}
                    rows={["essay", "speaking"].includes(q.type) ? 6 : 2}
                    className="field"
                    disabled={!!result || submitting || remaining === 0}
                    value={answers[q.id] || ""}
                    placeholder={
                      q.type === "speaking"
                        ? "Nhập đường dẫn bản ghi âm HTTPS hoặc bản chép lời để giáo viên nhận xét."
                        : "Nhập câu trả lời của bạn…"
                    }
                    onChange={(e) => answer(q, e.target.value)}
                  />
                )}
                {detail && (
                  <div
                    className={`rounded-xl p-4 text-sm ${detail.needs_grading ? "bg-amber-50 text-amber-900" : detail.isCorrect ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}
                  >
                    <p className="font-semibold">
                      {detail.needs_grading
                        ? "Chờ giáo viên chấm"
                        : detail.isCorrect
                          ? "Chính xác"
                          : "Chưa chính xác"}
                    </p>
                    {!detail.needs_grading && (
                      <p className="mt-1">Đáp án: {detail.correct_answer}</p>
                    )}
                    {detail.explanation && (
                      <p className="mt-1">{detail.explanation}</p>
                    )}
                  </div>
                )}
              </section>
            );
          })}
          {!result && questions.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p aria-live="polite" className="text-xs text-slate-500">
                {isExam ? saved : "Kết quả được chấm và lưu trên máy chủ."}
              </p>
              <Button
                loading={submitting}
                onClick={() => submit(remaining === 0)}
              >
                Nộp bài
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
