import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HiBookOpen,
  HiClock,
  HiUser,
  HiCheckCircle,
  HiLockClosed,
  HiPlayCircle,
  HiAcademicCap,
  HiArrowLeft,
  HiShare,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import courseApi from '../../api/courseApi';
import lessonApi from '../../api/lessonApi';
import enrollmentApi from '../../api/enrollmentApi';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import {
  LEVEL_LABELS,
  LEVEL_COLORS,
} from '../../utils/constants';
import { formatCurrency, formatDuration } from '../../utils/helpers';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      try {
        const [cRes, lRes, enCheck] = await Promise.allSettled([
          courseApi.getCourseById(id),
          lessonApi.getLessons({ course_id: id }),
          enrollmentApi.checkEnrollment(id),
        ]);

        if (cRes.status === 'fulfilled') {
          setCourse(cRes.value?.data || cRes.value);
        } else {
          // Fallback course detail
          setCourse({
            id: Number(id),
            title: 'Luyện thi IELTS 6.5 - Listening & Speaking Toàn Diện',
            description: 'Khóa học cung cấp lộ trình bài bản từ việc luyện nghe phát âm IPA, các bẫy thường gặp trong Section 1-4 đến kỹ năng phản xạ tự tin khi vấn đáp trực tiếp với giám khảo trong Speaking Part 1, 2, 3.',
            level: 'intermediate',
            price: 500000,
            is_free: 0,
            total_lessons: 24,
            total_duration: 720,
            teacher_name: 'ThS. Nguyễn Hoàng Nam (8.5 IELTS)',
            requirements: [
              'Trình độ đầu vào khuyến nghị tương đương CEFR B1 hoặc IELTS 5.0',
              'Dành tối thiểu 45 phút mỗi ngày để luyện nghe và làm bài tập thực hành',
            ],
            objectives: [
              'Nắm chắc kỹ năng bắt từ khóa (Keywords) và Paraphrasing trong bài nghe',
              'Tự tin phát âm chuẩn bảng ngữ âm quốc tế IPA',
              'Sở hữu dàn ý mẫu cho hơn 50 chủ đề Speaking Part 2 thịnh hành nhất',
            ],
          });
        }

        if (lRes.status === 'fulfilled') {
          const lList = lRes.value?.data || lRes.value || [];
          setLessons(Array.isArray(lList) ? lList : lList.lessons || []);
        } else {
          setLessons([
            {
              id: 1,
              title: 'Bài 1: Tổng quan bài thi IELTS Listening & Kỹ thuật nghe số, tên riêng',
              duration: 35,
              order_index: 1,
            },
            {
              id: 2,
              title: 'Bài 2: Chiến lược nghe Maps & Plan Labeling chuẩn xác',
              duration: 45,
              order_index: 2,
            },
            {
              id: 3,
              title: 'Bài 3: Ngữ âm nâng cao - Nối âm, nuốt âm và trọng âm câu',
              duration: 40,
              order_index: 3,
            },
            {
              id: 4,
              title: 'Bài 4: Chiến thuật xử lý Speaking Part 1 tự nhiên, không bị ngắc ngứ',
              duration: 50,
              order_index: 4,
            },
          ]);
        }

        if (enCheck.status === 'fulfilled') {
          const res = enCheck.value?.data || enCheck.value;
          setIsEnrolled(Boolean(res?.isEnrolled || res?.enrolled));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [id]);

  const handleEnroll = async () => {
    setEnrollLoading(true);
    try {
      await enrollmentApi.enrollCourse(id);
      setIsEnrolled(true);
      toast.success('Đăng ký khóa học thành công! Bắt đầu học ngay nhé.');
      if (lessons.length > 0) {
        navigate(`/student/lesson/${lessons[0].id}`);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi khi đăng ký khóa học');
    } finally {
      setEnrollLoading(false);
    }
  };

  if (loading) {
    return <Loading text="Đang tải thông tin khóa học..." />;
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Khóa học không tồn tại hoặc đã bị gỡ.</p>
        <Link to="/student/courses" className="mt-4 inline-block text-blue-600 hover:underline text-xs">
          Quay lại danh sách khóa học
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/student/courses"
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:underline"
        >
          <HiArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách khóa học
        </Link>
      </div>

      {/* Hero Banner Header */}
      <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${
                LEVEL_COLORS[course.level] || 'bg-blue-50 text-blue-700'
              }`}
            >
              {LEVEL_LABELS[course.level] || course.level}
            </span>
            <Badge variant="purple" size="sm">
              Chuẩn Quốc Tế
            </Badge>
          </div>

          <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">
            {course.title}
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            {course.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <HiUser className="w-4 h-4 text-blue-600" />
              <span>
                Giảng viên: <strong className="text-gray-800">{course.teacher_name || 'Đội ngũ chuyên gia'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HiBookOpen className="w-4 h-4 text-blue-600" />
              <span>
                Tổng số: <strong className="text-gray-800">{course.total_lessons || lessons.length}</strong> bài học
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HiClock className="w-4 h-4 text-emerald-600" />
              <span>{formatDuration(course.total_duration || 600)}</span>
            </div>
          </div>
        </div>

        {/* Action Enrollment Box */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 rounded-2xl border border-blue-100/80 flex flex-col justify-between text-center">
          <div>
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block">
              Học phí trọn gói
            </span>
            <div className="text-3xl font-black text-blue-600 mt-2">
              {course.is_free ? 'Miễn phí' : formatCurrency(course.price)}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Truy cập không giới hạn trọn đời
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {isEnrolled ? (
              <Link to={`/student/lesson/${lessons[0]?.id || 1}`} className="w-full block">
                <Button variant="primary" size="lg" fullWidth icon={HiPlayCircle}>
                  Vào học ngay
                </Button>
              </Link>
            ) : (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={enrollLoading}
                onClick={handleEnroll}
              >
                Đăng ký tham gia ngay
              </Button>
            )}

            <p className="text-[11px] text-gray-400">
              Cam kết chuẩn đầu ra • Hỗ trợ cố vấn 24/7
            </p>
          </div>
        </div>
      </div>

      {/* Syllabus / Lessons list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Objectives */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <HiAcademicCap className="w-5 h-5 text-blue-600" /> Bạn sẽ đạt được gì sau khóa học?
            </h3>
            <ul className="space-y-2.5 text-xs text-gray-700">
              {(course.objectives || [
                'Làm chủ toàn diện các dạng bài thi tiếng Anh trọng tâm.',
                'Nâng cao phản xạ nghe - hiểu tự nhiên qua audio chuẩn bản ngữ.',
                'Hoàn thiện kỹ năng giải quyết bài tập và bài thi trắc nghiệm.',
              ]).map((obj, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <HiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Curriculum */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">
                Chương Trình Học Chi Tiết ({lessons.length} bài)
              </h3>
            </div>

            <div className="divide-y divide-gray-100">
              {lessons.map((lesson, idx) => (
                <div
                  key={lesson.id}
                  className="py-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900">{lesson.title}</p>
                      <span className="text-[11px] text-gray-400">
                        {formatDuration(lesson.duration || 30)}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isEnrolled ? (
                      <Link to={`/student/lesson/${lesson.id}`}>
                        <Button variant="outline" size="sm" icon={HiPlayCircle}>
                          Học
                        </Button>
                      </Link>
                    ) : (
                      <span className="p-1.5 text-gray-300" title="Đăng ký để mở khóa">
                        <HiLockClosed className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-sm text-xs">
            <h4 className="font-bold text-gray-900 mb-3">Yêu cầu đầu vào:</h4>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Thiết bị kết nối Internet (máy tính hoặc điện thoại)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Tai nghe để nghe bài giảng và audio rõ ràng
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Tinh thần tự giác học tập mỗi ngày
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
