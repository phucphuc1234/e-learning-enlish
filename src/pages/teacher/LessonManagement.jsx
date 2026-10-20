import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  HiPlus,
  HiDocumentText,
  HiPencilSquare,
  HiTrash,
  HiArrowUp,
  HiArrowDown,
  HiPencil,
  HiVideoCamera,
  HiSpeakerWave,
  HiArrowLeft,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import lessonApi from '../../api/lessonApi';
import courseApi from '../../api/courseApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import { formatDuration } from '../../utils/helpers';

const LessonManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCourseId = searchParams.get('course_id') || '';

  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    course_id: '',
    content: '',
    video_url: '',
    audio_url: '',
    document_url: '',
    duration: 15,
    order_index: 1,
    is_published: 1,
  });

  // Delete dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch courses
  useEffect(() => {
    const fetchCoursesList = async () => {
      try {
        const res = await courseApi.getCourses();
        const list = res?.data || res || [];
        const cList = Array.isArray(list) ? list : list.courses || [];
        setCourses(cList);
        if (!selectedCourseId && cList.length > 0) {
          setSearchParams({ course_id: String(cList[0].id) });
        }
      } catch (err) {
        setCourses([]);
        toast.error(err.message || 'Không tải được danh sách khóa học');
      }
    };
    fetchCoursesList();
  }, []);

  // Fetch lessons when selectedCourseId changes
  const fetchLessons = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      const res = await lessonApi.getLessons({ course_id: selectedCourseId });
      const list = res?.data || res || [];
      const lList = Array.isArray(list) ? list : list.lessons || [];
      setLessons(lList.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
    } catch {
      // Sample mock lessons
      setLessons([
        {
          id: 1,
          title: 'Bài 1: Giới thiệu bài thi IELTS Listening Section 1 & Kỹ năng bắt số, tên riêng',
          content: 'Nắm vững các dạng câu hỏi thường gặp trong Section 1 của bài thi IELTS...',
          video_url: 'https://www.youtube.com/watch?v=sample1',
          audio_url: 'https://example.com/audio1.mp3',
          duration: 35,
          order_index: 1,
          is_published: 0,
          exercise_count: 2,
        },
        {
          id: 2,
          title: 'Bài 2: Chiến lược nghe Maps & Plan Labeling',
          content: 'Phân tích các từ chỉ phương hướng và cách làm bài tập bản đồ hiệu quả...',
          video_url: 'https://www.youtube.com/watch?v=sample2',
          duration: 45,
          order_index: 2,
          is_published: 0,
          exercise_count: 3,
        },
        {
          id: 3,
          title: 'Bài 3: Luyện phát âm IPA - Nguyên âm đơn và đôi',
          content: 'Cách phát âm chuẩn bảng mẫu tự quốc tế IPA...',
          duration: 25,
          order_index: 3,
          is_published: 0,
          exercise_count: 1,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchLessons();
    }
  }, [selectedCourseId]);

  const handleOpenAdd = () => {
    setEditingLesson(null);
    setFormData({
      title: '',
      course_id: selectedCourseId,
      content: '',
      video_url: '',
      audio_url: '',
      document_url: '',
      duration: 30,
      order_index: lessons.length + 1,
      is_published: 1,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title || '',
      course_id: lesson.course_id || selectedCourseId,
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      audio_url: lesson.audio_url || '',
      document_url: lesson.document_url || '',
      duration: lesson.duration || 30,
      order_index: lesson.order_index || 1,
      is_published: lesson.is_published ? 1 : 0,
    });
    setModalOpen(true);
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài học!');
      return;
    }

    setFormLoading(true);
    try {
      if (editingLesson) {
        await lessonApi.updateLesson(editingLesson.id, formData);
        toast.success('Cập nhật bài học thành công!');
      } else {
        await lessonApi.createLesson(formData);
        toast.success('Thêm bài học mới thành công!');
      }
      setModalOpen(false);
      fetchLessons();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu bài học');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = (lesson) => {
    setLessonToDelete(lesson);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!lessonToDelete) return;
    setDeleteLoading(true);
    try {
      await lessonApi.deleteLesson(lessonToDelete.id);
      toast.success('Xóa bài học thành công!');
      setDeleteConfirmOpen(false);
      setLessonToDelete(null);
      fetchLessons();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi xóa bài học');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReorder = async (index, direction) => {
    const newLessons = [...lessons];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLessons.length) return;

    // Swap
    const temp = newLessons[index];
    newLessons[index] = newLessons[targetIndex];
    newLessons[targetIndex] = temp;

    // Update order_indexes
    newLessons.forEach((l, idx) => {
      l.order_index = idx + 1;
    });

    setLessons(newLessons);
    try {
      await Promise.all([
        lessonApi.updateLesson(newLessons[index].id, { order_index: index + 1 }),
        lessonApi.updateLesson(newLessons[targetIndex].id, { order_index: targetIndex + 1 }),
      ]);
      toast.success('Đã cập nhật thứ tự bài học!');
    } catch {
      // Local swap kept
    }
  };

  const activeCourse = courses.find((c) => String(c.id) === String(selectedCourseId));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/teacher/courses"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              <HiArrowLeft className="w-3.5 h-3.5" /> Khóa học
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-xs text-gray-500 truncate max-w-xs">
              {activeCourse?.title || 'Quản lý bài giảng'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Quản Lý Bài Học
          </h1>
        </div>

        <Button
          variant="primary"
          icon={HiPlus}
          size="sm"
          onClick={handleOpenAdd}
          disabled={!selectedCourseId}
        >
          Thêm bài học mới
        </Button>
      </div>

      {/* Course selector toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
          Chọn khóa học đang quản lý:
        </label>
        <div className="w-full sm:w-96">
          <select
            value={selectedCourseId}
            onChange={(e) => setSearchParams({ course_id: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 font-medium"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lesson List */}
      {loading ? (
        <Loading text="Đang tải danh sách bài học..." />
      ) : lessons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <EmptyState
            title="Khóa học chưa có bài giảng nào"
            message="Hãy bắt đầu soạn bài giảng để học viên có thể học tập và làm bài tập."
            action={
              <Button variant="primary" size="sm" icon={HiPlus} onClick={handleOpenAdd}>
                Thêm bài học đầu tiên
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, idx) => (
            <div
              key={lesson.id}
              className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-sm hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left section: Index + details */}
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {lesson.order_index || idx + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">
                    {lesson.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-gray-500">
                    <span>Thời lượng: {formatDuration(lesson.duration)}</span>
                    {lesson.video_url && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <HiVideoCamera className="w-3.5 h-3.5" /> Có Video
                      </span>
                    )}
                    {lesson.audio_url && (
                      <span className="flex items-center gap-1 text-purple-600">
                        <HiSpeakerWave className="w-3.5 h-3.5" /> Có Audio
                      </span>
                    )}
                    <Badge variant={lesson.is_published ? 'success' : 'gray'} dot size="sm">
                      {lesson.is_published ? 'Công khai' : 'Nháp'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Right section: Reorder + Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                {/* Exercise button */}
                <Link
                  to={`/teacher/exercises?lesson_id=${lesson.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <HiPencil className="w-3.5 h-3.5" />
                  Bài tập ({lesson.exercise_count || 0})
                </Link>

                {/* Move Up/Down buttons */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleReorder(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded transition-colors"
                    title="Đẩy lên"
                  >
                    <HiArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReorder(idx, 'down')}
                    disabled={idx === lessons.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded transition-colors"
                    title="Đẩy xuống"
                  >
                    <HiArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Edit & Delete */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(lesson)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Chỉnh sửa bài học"
                >
                  <HiPencilSquare className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(lesson)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa bài học"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Lesson Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingLesson ? 'Chỉnh Sửa Bài Học' : 'Tạo Bài Học Mới'}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={formLoading}
              onClick={handleSaveLesson}
            >
              {editingLesson ? 'Lưu thay đổi' : 'Thêm bài học'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveLesson} className="space-y-4">
          <Input
            label="Tiêu đề bài học"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ví dụ: Bài 1: Tổng quan kỹ năng Listening Part 1..."
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Thời lượng ước tính (phút)"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              required
            />
            <Input
              label="Thứ tự hiển thị"
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData({ ...formData, order_index: Number(e.target.value) })}
              required
            />
          </div>

          <Input
            label="Đường dẫn Video giảng dạy (YouTube / MP4 / Cloud)"
            value={formData.video_url}
            onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
            icon={HiVideoCamera}
          />

          <Input
            label="Đường dẫn file Audio (cho kỹ năng Listening)"
            value={formData.audio_url}
            onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
            placeholder="https://example.com/audio.mp3"
            icon={HiSpeakerWave}
          />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Nội dung bài giảng / Tài liệu văn bản
            </label>
            <textarea
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Nhập nội dung lý thuyết, ví dụ minh họa, từ vựng trọng tâm..."
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Trạng thái xuất bản
            </label>
            <select
              value={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
            >
              <option value={1}>Công khai cho học viên</option>
              <option value={0}>Bản nháp (ẩn)</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Xóa bài học"
        message={`Bạn có chắc chắn muốn xóa bài học "${lessonToDelete?.title}" không? Tất cả bài tập và câu hỏi bên trong sẽ bị xóa.`}
        confirmText="Xóa bài học"
      />
    </div>
  );
};

export default LessonManagement;
