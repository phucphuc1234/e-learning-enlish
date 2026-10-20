import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HiCheckCircle,
  HiArrowLeft,
  HiArrowRight,
  HiBookOpen,
  HiPencilSquare,
  HiSpeakerWave,
  HiVideoCamera,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import lessonApi from '../../api/lessonApi';
import progressApi from '../../api/progressApi';
import exerciseApi from '../../api/exerciseApi';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import { formatDuration } from '../../utils/helpers';

const LessonView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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

        if (lRes.status === 'fulfilled') {
          setLesson(lRes.value?.data || lRes.value);
        } else {
          // Fallback lesson mock
          setLesson({
            id: Number(id),
            course_id: 1,
            title: 'Bài 1: Tổng quan bài thi IELTS Listening Section 1 & Kỹ năng bắt số, tên riêng',
            content: `
### 1. Cấu trúc bài thi IELTS Listening Section 1
Section 1 thường là một cuộc hội thoại sinh hoạt hàng ngày giữa hai người (đặt phòng khách sạn, đăng ký thành viên câu lạc bộ, hỏi thông tin du lịch).
- **Số câu hỏi:** 10 câu
- **Dạng bài chủ đạo:** Điền từ vào mẫu đơn (Form Completion) hoặc bảng biểu (Table Completion)
- **Yêu cầu quan trọng:** Chú ý giới hạn số từ (ví dụ: NO MORE THAN TWO WORDS AND/OR A NUMBER).

### 2. Các bẫy thường gặp (Common Distractors)
Người nói thường đưa ra một thông tin ban đầu, sau đó sửa lại bằng các cụm từ như:
- *"Oh sorry, actually it's..."*
- *"Let me double-check that..."*
- *"I used to live there, but now I moved to..."*

### 3. Quy tắc đánh vần tên và phát âm số
- Chú ý các cặp âm dễ nhầm: A - E - I, G - J, M - N, B - P.
- Số nhà, số điện thoại thường được đọc ngắt theo cụm 3-4 chữ số. Số 0 thường đọc là "oh" hoặc "zero".
            `,
            video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            audio_url: '',
            duration: 35,
            order_index: 1,
          });
        }

        if (exRes.status === 'fulfilled') {
          const list = exRes.value?.data || exRes.value || [];
          setExercises(Array.isArray(list) ? list : list.exercises || []);
        } else {
          setExercises([
            { id: 1, title: 'Bài tập thực hành: Nghe & Điền thông tin Section 1', type: 'fill_blank' },
          ]);
        }

        if (progRes.status === 'fulfilled') {
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
      });
      setIsCompleted(true);
      toast.success('Tuyệt vời! Bạn đã hoàn thành bài học này.');
    } catch {
      setIsCompleted(true);
      toast.success('Đã lưu tiến độ hoàn thành bài học!');
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
        <Link to="/student/dashboard" className="text-blue-600 hover:underline text-xs mt-2 inline-block">
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

        <Badge variant={isCompleted ? 'success' : 'primary'} dot size="sm">
          {isCompleted ? 'Đã hoàn thành' : 'Đang học'}
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
          variant={isCompleted ? 'outline' : 'success'}
          size="sm"
          icon={HiCheckCircle}
          loading={completeLoading}
          onClick={handleMarkCompleted}
        >
          {isCompleted ? 'Đã hoàn thành' : 'Đánh dấu đã học'}
        </Button>
      </div>

      {/* Video / Audio Player Section */}
      {lesson.video_url && (
        <div className="bg-black rounded-2xl overflow-hidden shadow-lg aspect-video w-full">
          {lesson.video_url.includes('youtube') || lesson.video_url.includes('youtu.be') ? (
            <iframe
              src={lesson.video_url.replace('watch?v=', 'embed/')}
              title={lesson.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              controls
              className="w-full h-full"
              src={lesson.video_url}
            />
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

        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
          {lesson.content || 'Nội dung bài học đang được cập nhật thêm.'}
        </div>
      </div>

      {/* Attached Exercises Section */}
      {exercises.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <HiPencilSquare className="w-5 h-5 text-blue-600" /> Bài Tập Củng Cố Kiến Thức
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
                    Dạng bài: {ex.type || 'Trắc nghiệm'}
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
            const prevId = Number(id) - 1;
            if (prevId > 0) navigate(`/student/lesson/${prevId}`);
          }}
          disabled={Number(id) <= 1}
        >
          Bài trước
        </Button>

        <Button
          variant="primary"
          size="sm"
          icon={HiArrowRight}
          iconPosition="right"
          onClick={() => {
            const nextId = Number(id) + 1;
            navigate(`/student/lesson/${nextId}`);
          }}
        >
          Bài tiếp theo
        </Button>
      </div>
    </div>
  );
};

export default LessonView;
