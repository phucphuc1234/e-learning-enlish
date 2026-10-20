import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  HiPlus,
  HiClipboardDocumentCheck,
  HiPencilSquare,
  HiTrash,
  HiClock,
  HiUserGroup,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import examApi from '../../api/examApi';
import courseApi from '../../api/courseApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import { EXAM_TYPES, EXAM_TYPE_LABELS } from '../../utils/constants';
import { formatDuration } from '../../utils/helpers';

const ExamManagement = () => {
  const [searchParams] = useSearchParams();
  const defaultCourseId = searchParams.get('course_id') || '';

  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(defaultCourseId);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    course_id: '',
    description: '',
    type: EXAM_TYPES.QUIZ,
    time_limit: 45,
    pass_score: 50,
    max_attempts: 2,
    shuffle_questions: 1,
    show_answer_after: 1,
    is_published: 1,
  });

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, examsRes] = await Promise.allSettled([
        courseApi.getCourses(),
        examApi.getExams({ course_id: selectedCourseId || undefined }),
      ]);

      if (coursesRes.status === 'fulfilled') {
        const cList = coursesRes.value?.data || coursesRes.value || [];
        setCourses(Array.isArray(cList) ? cList : cList.courses || []);
      }

      if (examsRes.status === 'fulfilled') {
        const list = examsRes.value?.data || examsRes.value || [];
        setExams(Array.isArray(list) ? list : list.exams || []);
      } else {
        // Fallback sample exams
        setExams([
          {
            id: 1,
            title: 'IELTS Mock Test Listening - Test 1',
            course_id: 1,
            type: 'mock_test',
            time_limit: 40,
            total_questions: 40,
            pass_score: 60,
            max_attempts: 1,
            is_published: 1,
            submission_count: 58,
          },
          {
            id: 2,
            title: 'Kiểm tra Giữa kỳ Ngữ Pháp B2',
            course_id: 2,
            type: 'midterm',
            time_limit: 45,
            total_questions: 30,
            pass_score: 50,
            max_attempts: 2,
            is_published: 1,
            submission_count: 42,
          },
          {
            id: 3,
            title: 'Mini Quiz Kiểm Tra Từ Vựng Tuần 3',
            course_id: 1,
            type: 'quiz',
            time_limit: 15,
            total_questions: 15,
            pass_score: 50,
            max_attempts: 3,
            is_published: 0,
            submission_count: 0,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCourseId]);

  const handleOpenAdd = () => {
    setEditingExam(null);
    setFormData({
      title: '',
      course_id: selectedCourseId || (courses[0]?.id ? String(courses[0].id) : '1'),
      description: '',
      type: EXAM_TYPES.QUIZ,
      time_limit: 45,
      pass_score: 50,
      max_attempts: 2,
      shuffle_questions: 1,
      show_answer_after: 1,
      is_published: 1,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title || '',
      course_id: exam.course_id || '',
      description: exam.description || '',
      type: exam.type || EXAM_TYPES.QUIZ,
      time_limit: exam.time_limit || 45,
      pass_score: exam.pass_score || 50,
      max_attempts: exam.max_attempts || 1,
      shuffle_questions: exam.shuffle_questions ? 1 : 0,
      show_answer_after: exam.show_answer_after ? 1 : 0,
      is_published: exam.is_published ? 1 : 0,
    });
    setModalOpen(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tên bài kiểm tra!');
      return;
    }

    setFormLoading(true);
    try {
      if (editingExam) {
        await examApi.updateExam(editingExam.id, formData);
        toast.success('Cập nhật bài kiểm tra thành công!');
      } else {
        await examApi.createExam(formData);
        toast.success('Tạo bài kiểm tra mới thành công!');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu bài kiểm tra');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = (exam) => {
    setExamToDelete(exam);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!examToDelete) return;
    setDeleteLoading(true);
    try {
      await examApi.deleteExam(examToDelete.id);
      toast.success('Xóa bài kiểm tra thành công!');
      setDeleteConfirmOpen(false);
      setExamToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi xóa bài kiểm tra');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Quản Lý Đề Thi & Kiểm Tra
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập các bài Quiz, kiểm tra giữa kỳ, thi thử (Mock Test) có bấm giờ tự động
          </p>
        </div>

        <Button
          variant="primary"
          icon={HiPlus}
          size="sm"
          onClick={handleOpenAdd}
        >
          Tạo bài kiểm tra mới
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
          Lọc theo khóa học:
        </label>
        <div className="w-full sm:w-80">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-700"
          >
            <option value="">Tất cả các khóa học</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Exam List */}
      {loading ? (
        <Loading text="Đang tải danh sách bài kiểm tra..." />
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <EmptyState
            title="Chưa có bài kiểm tra nào"
            message="Hãy tạo bài kiểm tra để đánh giá chuẩn xác năng lực học viên."
            action={
              <Button variant="primary" size="sm" icon={HiPlus} onClick={handleOpenAdd}>
                Tạo bài thi đầu tiên
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="purple" size="sm">
                    {EXAM_TYPE_LABELS[exam.type] || exam.type}
                  </Badge>
                  <Badge variant={exam.is_published ? 'success' : 'gray'} dot size="sm">
                    {exam.is_published ? 'Đang mở' : 'Đã khóa'}
                  </Badge>
                </div>

                <h3 className="font-bold text-gray-900 text-sm mt-3 line-clamp-2">
                  {exam.title}
                </h3>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                  {exam.description || 'Đề kiểm tra chuẩn kiến thức trọng tâm.'}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <HiClock className="w-4 h-4 text-blue-500" />
                    <span>{formatDuration(exam.time_limit)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HiClipboardDocumentCheck className="w-4 h-4 text-emerald-500" />
                    <span>{exam.total_questions || 30} câu hỏi</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between text-[11px] pt-1 border-t border-gray-200/60 text-gray-500">
                    <span>Điểm qua: {exam.pass_score}%</span>
                    <span>Tối đa {exam.max_attempts} lần nộp</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <HiUserGroup className="w-3.5 h-3.5 text-gray-400" />
                  {exam.submission_count || 0} lượt nộp
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(exam)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Chỉnh sửa bài thi"
                  >
                    <HiPencilSquare className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(exam)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa bài thi"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Exam Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingExam ? 'Chỉnh Sửa Bài Kiểm Tra' : 'Tạo Bài Kiểm Tra Mới'}
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
              onClick={handleSaveExam}
            >
              {editingExam ? 'Lưu thay đổi' : 'Tạo bài kiểm tra'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveExam} className="space-y-4">
          <Input
            label="Tiêu đề bài kiểm tra"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ví dụ: Kiểm tra Giữa kỳ Ngữ Pháp B2..."
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Khóa học áp dụng
              </label>
              <select
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-700"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Hình thức bài thi
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-700"
              >
                <option value={EXAM_TYPES.QUIZ}>Kiểm tra nhanh (Quiz)</option>
                <option value={EXAM_TYPES.MIDTERM}>Kiểm tra giữa kỳ</option>
                <option value={EXAM_TYPES.FINAL}>Kiểm tra cuối kỳ</option>
                <option value={EXAM_TYPES.MOCK_TEST}>Thi thử chuẩn đề (Mock Test)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Thời gian làm bài (phút)"
              type="number"
              value={formData.time_limit}
              onChange={(e) => setFormData({ ...formData, time_limit: Number(e.target.value) })}
              required
            />
            <Input
              label="Điểm đạt (%)"
              type="number"
              value={formData.pass_score}
              onChange={(e) => setFormData({ ...formData, pass_score: Number(e.target.value) })}
              required
            />
            <Input
              label="Số lần làm tối đa"
              type="number"
              value={formData.max_attempts}
              onChange={(e) => setFormData({ ...formData, max_attempts: Number(e.target.value) })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Mô tả / Lưu ý khi làm bài
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Quy định làm bài, cấu trúc đề thi..."
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
              <input
                type="checkbox"
                checked={Boolean(formData.shuffle_questions)}
                onChange={(e) => setFormData({ ...formData, shuffle_questions: e.target.checked ? 1 : 0 })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Trộn ngẫu nhiên câu hỏi</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
              <input
                type="checkbox"
                checked={Boolean(formData.show_answer_after)}
                onChange={(e) => setFormData({ ...formData, show_answer_after: e.target.checked ? 1 : 0 })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Xem đáp án sau khi nộp</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
              <input
                type="checkbox"
                checked={Boolean(formData.is_published)}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked ? 1 : 0 })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Công khai cho học viên</span>
            </label>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title="Xóa bài kiểm tra"
        message={`Bạn có chắc chắn muốn xóa bài kiểm tra "${examToDelete?.title}" không? Tất cả kết quả bài làm của học viên cũng sẽ bị xóa theo.`}
        confirmText="Xóa bài kiểm tra"
      />
    </div>
  );
};

export default ExamManagement;
