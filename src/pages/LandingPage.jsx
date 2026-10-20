import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiAcademicCap,
  HiArrowUpRight,
  HiBookOpen,
  HiCheck,
  HiArrowRight,
  HiSparkles,
  HiChartBar,
  HiPencilSquare,
} from "react-icons/hi2";
import axios from "../api/axiosClient";
import { LEVEL_LABELS } from "../utils/constants";
import { formatCurrency } from "../utils/helpers";

export default function LandingPage() {
  const [courses, setCourses] = useState([]),
    [search, setSearch] = useState(""),
    [level, setLevel] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    axios
      .get("/catalog")
      .then((res) => setCourses(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const visible = courses.filter(
    (c) =>
      (!level || c.level === level) &&
      `${c.title} ${c.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="bg-[#f8faf7] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#f8faf7]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight"
          >
            <span className="rounded-xl bg-slate-900 p-2 text-white">
              <HiAcademicCap className="h-6 w-6" />
            </span>
            English<span className="font-normal text-slate-500">studio.</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#courses" className="hover:text-blue-600">
              Khóa học
            </a>
            <a href="#approach" className="hover:text-blue-600">
              Cách học
            </a>
            <Link to="/help">Hỗ trợ</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link className="hidden text-sm font-semibold sm:block" to="/login">
              Đăng nhập
            </Link>
            <Link
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              to="/register"
            >
              Bắt đầu học <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </nav>
      </header>
      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> MỘT CHÚT
              MỖI NGÀY. TIẾN BỘ DÀI LÂU.
            </p>
            <h1 className="text-5xl font-bold leading-[1.15] tracking-tight sm:text-6xl lg:text-7xl">
              Tiếng Anh mở lối.
              <br />
              <span className="text-blue-700">Bạn bước tới.</span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-8 text-slate-500">
              Từ những câu chào đầu tiên đến tự tin diễn đạt ý tưởng. Học theo
              lộ trình, thực hành cùng bài tập và nhìn thấy sự tiến bộ của chính
              mình.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-5 rounded-full bg-blue-700 px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-700/15 hover:bg-blue-800"
              >
                Bắt đầu hành trình <HiArrowUpRight className="h-5 w-5" />
              </Link>
              <a
                href="#courses"
                className="rounded-full border border-slate-300 bg-white px-7 py-4 text-sm font-semibold hover:border-blue-700"
              >
                Khám phá khóa học
              </a>
            </div>
            <div className="mt-9 flex flex-wrap gap-5 text-xs text-slate-500">
              {[
                "Học theo nhịp của bạn",
                "Lưu tiến độ tự động",
                "Có giáo viên đồng hành",
              ].map((t) => (
                <span className="flex items-center gap-1.5" key={t}>
                  <HiCheck className="h-4 w-4 text-emerald-600" />
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div
            className="relative mx-auto w-full max-w-lg pb-6 pt-4"
            aria-label="Minh họa phương pháp học"
          >
            <div className="absolute inset-5 rounded-[3rem] bg-[#e3ebde] rotate-3" />
            <div className="relative rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
              <div className="flex items-center justify-between border-b pb-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <HiBookOpen className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs text-slate-400">
                      BÀI HỌC NHỎ, BƯỚC TIẾN LỚN
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      Everyday English
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Let's go!
                </span>
              </div>
              <div className="py-9">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-600">
                  A little practice, every day.
                </p>
                <p className="text-4xl font-semibold leading-tight tracking-tight">
                  “Nice to
                  <br />
                  meet you.”
                </p>
                <p className="mt-4 text-sm text-slate-400">
                  /naɪs tə miːt juː/
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Rất vui được gặp bạn.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t pt-5">
                {[
                  ["01", "Khám phá"],
                  ["02", "Thực hành"],
                  ["03", "Tiến bộ"],
                ].map(([n, t]) => (
                  <div key={n} className="rounded-xl bg-slate-50 p-3">
                    <span className="text-xs text-slate-400">{n}</span>
                    <p className="mt-2 text-sm font-semibold">{t}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-1 right-0 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-lg">
              <span className="rounded-full bg-emerald-100 p-2">
                <HiSparkles className="h-5 w-5 text-emerald-700" />
              </span>
              <span className="text-sm font-semibold">
                Tự tin hơn, từng ngày.
              </span>
            </div>
          </div>
        </section>
        <section
          id="courses"
          className="scroll-mt-24 border-y border-slate-200 bg-white py-20"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="eyebrow">CHỌN ĐIỂM KHỞI ĐẦU CỦA BẠN</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Một khóa học. Một bước tiến.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-slate-500">
                Bài học có cấu trúc, bài tập thực hành và kiểm tra kiến thức sau
                mỗi chặng.
              </p>
            </div>
            <div className="my-8 flex flex-col gap-3 sm:flex-row">
              <input
                className="field sm:max-w-md"
                aria-label="Tìm khóa học"
                placeholder="Bạn muốn học gì hôm nay?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="field sm:max-w-xs"
                aria-label="Trình độ"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="">Tất cả trình độ</option>
                {Object.entries(LEVEL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            {error && (
              <p role="alert" className="text-red-700">
                {error}
              </p>
            )}
            {loading ? (
              <p className="py-8 text-slate-500">Đang tải khóa học…</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {visible.map((c, i) => (
                  <article
                    key={c.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50"
                  >
                    <div
                      className={`relative flex h-44 items-center justify-between overflow-hidden p-7 ${["bg-[#e9eefb]", "bg-[#e9f1e3]", "bg-[#fff0dc]"][i % 3]}`}
                    >
                      {c.thumbnail ? (
                        <img
                          src={c.thumbnail}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <>
                          <span className="relative z-10 text-4xl font-bold tracking-tight text-slate-800/80">
                            {c.level === "beginner"
                              ? "Aa."
                              : c.level === "intermediate"
                                ? "Think."
                                : "Beyond."}
                          </span>
                          <HiBookOpen className="h-24 w-24 -rotate-12 text-slate-900/10" />
                        </>
                      )}
                    </div>
                    <div className="p-6">
                      <p className="text-xs font-semibold text-blue-700">
                        {LEVEL_LABELS[c.level]} · {c.total_lessons} bài học
                      </p>
                      <h3 className="mt-3 text-xl font-bold">{c.title}</h3>
                      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-6 text-slate-500">
                        {c.description}
                      </p>
                      <p className="mt-4 text-xs text-slate-400">
                        Giáo viên: {c.teacher_name}
                      </p>
                      <div className="mt-5 flex items-center justify-between border-t pt-4">
                        <span className="text-sm font-bold">
                          {c.is_free ? "Miễn phí" : formatCurrency(c.price)}
                        </span>
                        <Link
                          to={`/student/course/${c.id}`}
                          aria-label={`Xem khóa học ${c.title}`}
                          className="rounded-full bg-slate-100 p-2.5 text-slate-700 transition group-hover:bg-blue-700 group-hover:text-white"
                        >
                          <HiArrowUpRight className="h-5 w-5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {!loading && !visible.length && !error && (
              <p className="rounded-xl bg-slate-50 p-8 text-slate-500">
                Chưa có khóa học phù hợp.
              </p>
            )}
          </div>
        </section>
        <section id="approach" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <p className="eyebrow">HỌC CÓ ĐỊNH HƯỚNG</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Không chỉ học. Hiểu và sử dụng.
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              [
                HiBookOpen,
                "Lộ trình rõ ràng",
                "Bắt đầu ở trình độ phù hợp, đi từng bước từ kiến thức nền tảng đến thực hành.",
              ],
              [
                HiPencilSquare,
                "Thực hành để ghi nhớ",
                "Làm bài tập, xem lời giải và nhận góp ý của giáo viên cho phần tự luận.",
              ],
              [
                HiChartBar,
                "Nhìn thấy sự tiến bộ",
                "Theo dõi bài học đã hoàn thành, kết quả kiểm tra và lịch sử học tập.",
              ],
            ].map(([Icon, title, description], i) => (
              <div key={title} className="border-t border-slate-300 pt-6">
                <div className="flex items-center justify-between">
                  <Icon className="h-7 w-7 text-blue-700" />
                  <span className="text-sm text-slate-400">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-slate-900 p-8 text-white sm:p-12">
            <div>
              <p className="text-sm text-emerald-300">
                Your next chapter starts here.
              </p>
              <h2 className="mt-3 text-3xl font-bold">
                Sẵn sàng cho bước đầu tiên?
              </h2>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-5 rounded-full bg-[#d6f2a5] px-7 py-4 text-sm font-bold text-slate-900 hover:bg-white"
            >
              Tạo tài khoản học viên <HiArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-5 py-8 text-xs text-slate-500 sm:px-8">
        <span>
          © {new Date().getFullYear()} English studio. Học tập, mỗi ngày.
        </span>
        <div className="flex gap-5">
          <Link to="/help">Hỗ trợ & thông tin sử dụng</Link>
          <Link to="/login">Dành cho giáo viên</Link>
        </div>
      </footer>
    </div>
  );
}
