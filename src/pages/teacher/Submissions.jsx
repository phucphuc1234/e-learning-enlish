import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "../../api/axiosClient";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import Loading from "../../components/common/Loading";
import { formatDate } from "../../utils/helpers";
export default function Submissions() {
  const [rows, setRows] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [selected, setSelected] = useState(null),
    [form, setForm] = useState({ score: 0, feedback: "" }),
    [saving, setSaving] = useState(false),
    [filter, setFilter] = useState("");
  async function load() {
    setLoading(true);
    try {
      setRows(
        (await axios.get("/submissions", { params: { limit: 200 } })).data,
      );
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
  async function view(a) {
    try {
      const res = await axios.get(`/submissions/${a.id}`);
      setSelected(res.data);
      setForm({ score: a.score || 0, feedback: a.feedback || "" });
    } catch (e) {
      toast.error(e.message);
    }
  }
  async function grade(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`/submissions/${selected.id}/grade`, form);
      setSelected(null);
      await load();
      toast.success("Đã chấm điểm và gửi thông báo tới học viên");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">GIẢNG DẠY</p>
        <h1 className="text-3xl font-bold">Bài nộp & chấm điểm</h1>
        <p className="mt-2 text-sm text-slate-500">
          Xem bài làm, chấm tự luận và gửi nhận xét cho học viên.
        </p>
      </div>
      <label className="flex items-center gap-3 text-sm">
        Hiển thị
        <select
          aria-label="Lọc bài nộp"
          className="field max-w-xs"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Tất cả bài nộp</option>
          <option value="pending_grading">Chờ chấm</option>
          <option value="graded">Đã chấm</option>
        </select>
      </label>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <Loading />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                {[
                  "Học viên",
                  "Bài làm",
                  "Ngày nộp",
                  "Điểm",
                  "Trạng thái",
                  "",
                ].map((t, i) => (
                  <th className="p-3" key={i}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((a) => !filter || a.status === filter)
                .map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="p-3 font-semibold">{a.student_name}</td>
                    <td className="p-3">{a.exercise_title}</td>
                    <td className="p-3">{formatDate(a.submitted_at)}</td>
                    <td className="p-3">{a.score}%</td>
                    <td className="p-3">
                      {a.status === "pending_grading" ? "Chờ chấm" : "Đã chấm"}
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => view(a)}
                      >
                        Xem & chấm
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!rows.length && (
            <p className="py-10 text-center text-slate-500">Chưa có bài nộp.</p>
          )}
        </div>
      )}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Chi tiết bài làm"
        size="lg"
      >
        {selected && (
          <form className="space-y-5" onSubmit={grade}>
            <p className="font-semibold">
              {selected.student_name} · {selected.exercise_title}
            </p>
            {(selected.questions || []).map((q, i) => (
              <div
                key={q.questionId}
                className="rounded-xl bg-slate-50 p-4 text-sm"
              >
                <p className="font-semibold">
                  {i + 1}. {q.question_content}
                </p>
                <p className="mt-2 whitespace-pre-wrap">
                  Trả lời: {q.selected_answer || "(Chưa trả lời)"}
                </p>
                {q.correct_answer && (
                  <p className="mt-1 text-emerald-700">
                    Đáp án: {q.correct_answer}
                  </p>
                )}
              </div>
            ))}
            <Input
              label="Điểm cuối cùng (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              required
              value={form.score}
              onChange={(e) =>
                setForm({ ...form, score: Number(e.target.value) })
              }
            />
            <label className="block text-sm">
              Nhận xét
              <textarea
                className="field mt-2"
                rows={4}
                value={form.feedback}
                onChange={(e) => setForm({ ...form, feedback: e.target.value })}
              />
            </label>
            <Button type="submit" loading={saving}>
              Lưu điểm và nhận xét
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
