import ReactMarkdown from "react-markdown";
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  HiCheckCircle,
  HiArrowLeft,
  HiArrowRight,
  HiBookOpen,
  HiPencilSquare,
  HiSpeakerWave,
  HiVideoCamera,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import lessonApi from "../../api/lessonApi";
import progressApi from "../../api/progressApi";
import exerciseApi from "../../api/exerciseApi";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Loading from "../../components/common/Loading";
import { formatDuration } from "../../utils/helpers";

const LessonView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const openedAt = useRef(Date.now());

  const [lesson, setLesson] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completeLoading, setCompleteLoading] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      try {
        const [lRes, exRes, progRes] = await Promise.allSettled([
          lessonApi.getLessonById(id),
          exerciseApi.getExercisesByLesson(id, {
            is_published: 1,
          }),
          progressApi.getProgress({ lesson_id: id }),
        ]);

        if (lRes.status === "fulfilled") {
          setLesson(lRes.value?.data || lRes.value);
        } else {
          setLesson(null);
        }

        if (exRes.status === "fulfilled") {
          const list = exRes.value?.data || exRes.value || [];
          setExercises(Array.isArray(list) ? list : list.exercises || []);
        } else {
          setExercises([]);
        }

        if (progRes.status === "fulfilled") {
          const res = progRes.value?.data || progRes.value;
          setIsCompleted(Boolean(res?.is_completed));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id]);

  const handleMarkCompleted = async () => {
    setCompleteLoading(true);
    try {
      await progressApi.updateProgress({
        lesson_id: id,
        is_completed: true,
        time_spent: Math.floor((Date.now() - openedAt.current) / 1000),
      });
      setIsCompleted(true);
      toast.success("Tuyệt vời! Bạn đã hoàn thành bài học này.");
    } catch (error) {
      toast.error(error.message || "Chưa lưu được tiến độ. Vui lòng thử lại.");
    } finally {
      setCompleteLoading(false);
    }
  };

  if (loading) {
    return <Loading text="Đang tải nội dung bài giảng..." />;
  }

  if (!lesson) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Bài học không tồn tại.</p>
        <Link
          to="/student/dashboard"
          className="text-blue-600 hover:underline text-xs mt-2 inline-block"
        >
          Về bàn học của tôi
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to={`/student/course/${lesson.course_id || 1}`}
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:underline"
        >
          <HiArrowLeft className="w-3.5 h-3.5" /> Xem lại giáo trình khóa học
        </Link>

        <Badge variant={isCompleted ? "success" : "primary"} dot size="sm">
          {isCompleted ? "Đã hoàn thành" : "Đang học"}
        </Badge>
      </div>

      {/* Lesson Title Header */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Bài {lesson.order_index || 1} • {formatDuration(lesson.duration)}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
            {lesson.title}
          </h1>
        </div>

        <Button
          variant={isCompleted ? "outline" : "success"}
          size="sm"
          icon={HiCheckCircle}
          loading={completeLoading}
          onClick={handleMarkCompleted}
          disabled={isCompleted}
        >
          {isCompleted ? "Đã hoàn thành" : "Đánh dấu đã học"}
        </Button>
      </div>

      {/* Video / Audio Player Section */}
      {lesson.video_url && (
        <div className="bg-black rounded-2xl overflow-hidden shadow-lg aspect-video w-full">
          {lesson.video_url.includes("youtube") ||
          lesson.video_url.includes("youtu.be") ? (
            <iframe
              src={lesson.video_url.replace("watch?v=", "embed/")}
              title={lesson.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video controls className="w-full h-full" src={lesson.video_url} />
          )}
        </div>
      )}

      {lesson.audio_url && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
            <HiSpeakerWave className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-700 mb-1">
              File Audio Luyện Nghe Kèm Theo
            </p>
            <audio controls className="w-full h-8">
              <source src={lesson.audio_url} />
              Trình duyệt của bạn không hỗ trợ phát audio.
            </audio>
          </div>
        </div>
      )}

      {/* Main Content Body (Theory & Lecture Notes) */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
          <HiBookOpen className="w-5 h-5 text-blue-600" /> Nội Dung Bài Giảng
        </h3>

        <div className="lesson-content max-w-none">
          <ReactMarkdown components={{ h1: "h2", h2: "h3" }}>
            {lesson.content || "Nội dung bài học đang được cập nhật thêm."}
          </ReactMarkdown>
        </div>
      </div>

      {/* Attached Exercises Section */}
      {exercises.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <HiPencilSquare className="w-5 h-5 text-blue-600" /> Bài Tập
                Củng Cố Kiến Thức
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Làm bài tập ngay để ghi nhớ từ vựng và cấu trúc ngữ pháp
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {exercises.map((ex) => (
              <div
                key={ex.id}
                className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-sm flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">
                    {ex.title}
                  </h4>
                  <span className="text-[11px] text-gray-400 capitalize">
                    Dạng bài: {ex.type || "Trắc nghiệm"}
                  </span>
                </div>

                <Link to={`/student/exercise/${ex.id}`}>
                  <Button variant="primary" size="sm">
                    Làm bài tập
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Navigation: Next / Prev */}
      <div className="pt-4 flex items-center justify-between border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          icon={HiArrowLeft}
          onClick={() => {
            if (lesson.previous_lesson_id)
              navigate(`/student/lesson/${lesson.previous_lesson_id}`);
          }}
          disabled={!lesson.previous_lesson_id}
        >
          Bài trước
        </Button>

        <Button
          variant="primary"
          size="sm"
          icon={HiArrowRight}
          iconPosition="right"
          onClick={() => {
            if (lesson.next_lesson_id)
              navigate(`/student/lesson/${lesson.next_lesson_id}`);
          }}
          disabled={!lesson.next_lesson_id}
        >
          Bài tiếp theo
        </Button>
      </div>
    </div>
  );
};

export default LessonView;
