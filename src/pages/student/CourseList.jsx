import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HiBookOpen,
  HiClock,
  HiAcademicCap,
  HiArrowRight,
  HiCheckBadge,
} from "react-icons/hi2";
import courseApi from "../../api/courseApi";
import programApi from "../../api/programApi";
import SearchBar from "../../components/common/SearchBar";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Loading from "../../components/common/Loading";
import EmptyState from "../../components/common/EmptyState";
import {
  DEFAULT_PROGRAMS,
  LEVEL_LABELS,
  LEVEL_COLORS,
} from "../../utils/constants";
import { formatCurrency, formatDuration } from "../../utils/helpers";

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [priceType, setPriceType] = useState("all"); // all, free, paid

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cRes, pRes] = await Promise.allSettled([
          courseApi.getCourses({
            search: search || undefined,
            program_id: selectedProgram || undefined,
            level: selectedLevel || undefined,
          }),
          programApi.getPrograms(),
        ]);

        if (pRes.status === "fulfilled") {
          const pList = pRes.value?.data || pRes.value || [];
          if (Array.isArray(pList) && pList.length > 0) {
            setPrograms(pList);
          }
        }

        if (cRes.status === "fulfilled") {
          const list = cRes.value?.data || cRes.value || [];
          const cList = Array.isArray(list) ? list : list.courses || [];
          setCourses(cList);
        } else {
          setCourses([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, selectedProgram, selectedLevel]);

  // Client filter for price
  const filteredCourses = courses.filter((c) => {
    if (priceType === "free") return Boolean(c.is_free);
    if (priceType === "paid") return !c.is_free;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Khám Phá Khóa Học Tiếng Anh
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Tìm khóa học phù hợp với trình độ và mục tiêu của bạn.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <SearchBar
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên khóa học, chủ đề ngữ pháp, IELTS..."
            containerClassName="flex-1 w-full"
          />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Tất cả chương trình</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Mọi trình độ</option>
              <option value="beginner">Cơ bản</option>
              <option value="intermediate">Trung cấp</option>
              <option value="advanced">Nâng cao</option>
            </select>

            <select
              value={priceType}
              onChange={(e) => setPriceType(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Học phí: Tất cả</option>
              <option value="free">Miễn phí</option>
              <option value="paid">Có phí</option>
            </select>
          </div>
        </div>

        {/* Quick Program Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-gray-100 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedProgram("")}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              !selectedProgram
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Tất cả
          </button>
          {programs.slice(0, 6).map((prog) => (
            <button
              key={prog.id}
              type="button"
              onClick={() => setSelectedProgram(String(prog.id))}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                String(selectedProgram) === String(prog.id)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {prog.name}
            </button>
          ))}
        </div>
      </div>

      {/* Course List Grid */}
      {loading ? (
        <Loading text="Đang tải danh sách khóa học..." />
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <EmptyState
            title="Không tìm thấy khóa học phù hợp"
            message="Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc chương trình."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSelectedProgram("");
                  setSelectedLevel("");
                  setPriceType("all");
                }}
              >
                Đặt lại bộ lọc
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const prog = programs.find((p) => p.id === course.program_id);
            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
              >
                {/* Banner Thumbnail */}
                <div className="relative h-44 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <HiAcademicCap className="w-12 h-12 mx-auto opacity-80 mb-1" />
                      <span className="text-xs font-bold tracking-wider uppercase opacity-90">
                        {prog?.name || "Chuẩn Quốc Tế"}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold shadow-sm ${
                        LEVEL_COLORS[course.level] || "bg-white text-gray-800"
                      }`}
                    >
                      {LEVEL_LABELS[course.level] || course.level}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/95 text-blue-700 shadow-sm backdrop-blur-sm">
                      {course.is_free
                        ? "Miễn phí"
                        : formatCurrency(course.price)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                      {course.title}
                    </h3>
                    <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {course.description ||
                        "Chương trình đào tạo toàn diện với lộ trình khoa học."}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <HiBookOpen className="w-4 h-4 text-blue-500" />
                      {course.total_lessons || 0} bài học
                    </span>
                    <span className="flex items-center gap-1">
                      <HiClock className="w-4 h-4 text-emerald-500" />
                      {formatDuration(course.total_duration || 0)}
                    </span>
                    <span className="font-medium text-amber-600 flex items-center gap-1">
                      {LEVEL_LABELS[course.level]}
                    </span>
                  </div>
                </div>

                {/* Card Action */}
                <div className="bg-gray-50/80 px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    {course.student_count || 0} học viên đã tham gia
                  </span>
                  <Link to={`/student/course/${course.id}`}>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={HiArrowRight}
                      iconPosition="right"
                    >
                      Xem chi tiết
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseList;
