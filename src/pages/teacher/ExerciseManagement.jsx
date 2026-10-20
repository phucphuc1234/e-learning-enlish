import React, { useState, useEffect } from 'react';
import courseApi from '../../api/courseApi';
import useAuth from '../../hooks/useAuth';
import { useSearchParams, Link } from 'react-router-dom';
import {
  HiPlus,
  HiPencilSquare,
  HiTrash,
  HiChevronDown,
  HiChevronUp,
  HiArrowLeft,
  HiCheckCircle,
  HiXCircle,
  HiOutlineQuestionMarkCircle,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import exerciseApi from '../../api/exerciseApi';
import questionApi from '../../api/questionApi';
import lessonApi from '../../api/lessonApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import {
  EXERCISE_TYPES,
  EXERCISE_TYPE_LABELS,
  DIFFICULTY_LABELS,
  QUESTION_TYPES,
} from '../../utils/constants';

const ExerciseManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const lessonId = searchParams.get('lesson_id') || '';

  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [courseLessons, setCourseLessons] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(
    searchParams.get('course_id') || ''
  );

  const [lesson, setLesson] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);

  // Exercise modal
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [exFormLoading, setExFormLoading] = useState(false);
  const [exFormData, setExFormData] = useState({
    title: '',
    description: '',
    type: EXERCISE_TYPES.MULTIPLE_CHOICE,
    difficulty: 'medium',
    time_limit: 15,
    is_published: 1,
  });

  // Question modal
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [targetExerciseId, setTargetExerciseId] = useState(null);
  const [qFormLoading, setQFormLoading] = useState(false);
  const [qFormData, setQFormData] = useState({
    content: '',
    type: QUESTION_TYPES.MULTIPLE_CHOICE,
    points: 1,
    explanation: '',
    answers: [
      { content: '', is_correct: true },
      { content: '', is_correct: false },
      { content: '', is_correct: false },
      { content: '', is_correct: false },
    ],
  });

  // Delete dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState('exercise'); // 'exercise' | 'question'
  const [deleteLoading, setDeleteLoading] = useState(false);


  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await courseApi.getCourses({
          page: 1,
          limit: 100,
          teacher_id:
            user?.role === 'teacher' ? user.id : undefined,
        });

        if (!response?.success || !Array.isArray(response.data)) {
          throw new Error('Không tải được danh sách khóa học');
        }

        setCourses(response.data);
      } catch (error) {
        setCourses([]);
        toast.error(error.message);
      }
    };

    if (user?.id) {
      loadCourses();
    }
  }, [user?.id, user?.role]);

  // Trường hợp mở trực tiếp từ nút "Bài tập" của một bài học
  useEffect(() => {
    if (!lessonId) return;

    const loadSelectedLesson = async () => {
      try {
        const response = await lessonApi.getLessonById(lessonId);

        if (response?.success && response.data?.course_id) {
          setSelectedCourseId(String(response.data.course_id));
        }
      } catch (error) {
        console.error('Không tải được bài học:', error);
      }
    };

    loadSelectedLesson();
  }, [lessonId]);

  // Lấy các bài học thuộc khóa học đang chọn
  useEffect(() => {
    if (!selectedCourseId) {
      setCourseLessons([]);
      return;
    }

    const loadLessons = async () => {
      try {
        const response = await lessonApi.getLessons({
          course_id: selectedCourseId,
        });

        if (!response?.success || !Array.isArray(response.data)) {
          throw new Error('Không tải được bài học');
        }

        setCourseLessons(response.data);
      } catch (error) {
        setCourseLessons([]);
        toast.error(error.message);
      }
    };

    loadLessons();
  }, [selectedCourseId]);


  const fetchData = async () => {
    if (!lessonId) {
      setLesson(null);
      setExercises([]);
      setExpandedExerciseId(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [lessonRes, exerciseRes] = await Promise.all([
        lessonApi.getLessonById(lessonId),
        exerciseApi.getExercises({
          lesson_id: Number(lessonId),
          page: 1,
          limit: 100,
        }),
      ]);

      if (
        !lessonRes?.success ||
        !exerciseRes?.success ||
        !Array.isArray(exerciseRes.data)
      ) {
        throw new Error('Không tải được dữ liệu bài tập');
      }

      const exercisesWithQuestions = await Promise.all(
        exerciseRes.data.map(async (exercise) => {
          const questionRes =
            await questionApi.getQuestionsByExercise(exercise.id);

          if (
            !questionRes?.success ||
            !Array.isArray(questionRes.data)
          ) {
            throw new Error(
              `Không tải được câu hỏi của bài tập ${exercise.id}`
            );
          }

          return {
            ...exercise,
            questions: questionRes.data,
          };
        })
      );

      setLesson(lessonRes.data);
      setExercises(exercisesWithQuestions);

      setExpandedExerciseId((previous) =>
        exercisesWithQuestions.some((e) => e.id === previous)
          ? previous
          : exercisesWithQuestions[0]?.id ?? null
      );

    } catch (err) {
      console.error('Lỗi tải câu hỏi:', err);
      setLesson(null);
      setExercises([]);
      toast.error(err.message || 'Không thể tải bài tập');
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchData();
  }, [lessonId]);

  // Exercise CRUD Handlers
  const handleOpenAddExercise = () => {
    if (
      !lessonId ||
      !Number.isInteger(Number(lessonId)) ||
      Number(lessonId) <= 0
    ) {
      toast.error('Vui lòng chọn bài học trước khi tạo bài tập!');
      return;
    }

    setEditingExercise(null);
    setExFormData({
      title: '',
      description: '',
      type: EXERCISE_TYPES.MULTIPLE_CHOICE,
      difficulty: 'medium',
      time_limit: 15,
      is_published: 0,
    });
    setExerciseModalOpen(true);
  };

  const handleOpenEditExercise = (ex) => {
    setEditingExercise(ex);
    setExFormData({
      title: ex.title || '',
      description: ex.description || '',
      type: ex.type || EXERCISE_TYPES.MULTIPLE_CHOICE,
      difficulty: ex.difficulty || 'medium',
      time_limit: ex.time_limit || 15,
      is_published: ex.is_published ? 1 : 0,
    });
    setExerciseModalOpen(true);
  };

  const handleSaveExercise = async (e) => {
    e.preventDefault();
    if (!exFormData.title.trim()) {
      toast.error('Vui lòng nhập tên bài tập!');
      return;
    }

    setExFormLoading(true);
    try {
      if (editingExercise) {
        await exerciseApi.updateExercise(editingExercise.id, {
          ...exFormData,
          lesson_id: lessonId,
        });
        toast.success('Cập nhật bài tập thành công!');
      } else {
        await exerciseApi.createExercise({
          ...exFormData,
          lesson_id: lessonId,
          is_published: 0,
        });
        toast.success('Thêm bài tập mới thành công!');
      }
      setExerciseModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu bài tập');
    } finally {
      setExFormLoading(false);
    }
  };

  // Question CRUD Handlers
  const handleOpenAddQuestion = (exerciseId) => {
    setTargetExerciseId(exerciseId);
    setEditingQuestion(null);
    setQFormData({
      content: '',
      type: QUESTION_TYPES.MULTIPLE_CHOICE,
      points: 1,
      explanation: '',
      answers: [
        { content: '', is_correct: true },
        { content: '', is_correct: false },
        { content: '', is_correct: false },
        { content: '', is_correct: false },
      ],
    });
    setQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (exerciseId, q) => {
    setTargetExerciseId(exerciseId);
    setEditingQuestion(q);
    setQFormData({
      content: q.content || '',
      type: q.type || QUESTION_TYPES.MULTIPLE_CHOICE,
      points: q.points || 1,
      explanation: q.explanation || '',
      answers: q.answers && q.answers.length > 0 ? q.answers : [
        { content: '', is_correct: true },
        { content: '', is_correct: false },
      ],
    });
    setQuestionModalOpen(true);
  };

  const handleAnswerChange = (index, field, value) => {
    const updated = [...qFormData.answers];
    if (field === 'is_correct') {
      // Single choice mode: uncheck others
      updated.forEach((a, i) => {
        a.is_correct = i === index;
      });
    } else {
      updated[index][field] = value;
    }
    setQFormData({ ...qFormData, answers: updated });
  };

  const handleAddAnswerRow = () => {
    setQFormData({
      ...qFormData,
      answers: [...qFormData.answers, { content: '', is_correct: false }],
    });
  };

  const handleRemoveAnswerRow = (index) => {
    if (qFormData.answers.length <= 2) {
      toast.error('Bài tập cần tối thiểu 2 phương án lựa chọn!');
      return;
    }
    const updated = qFormData.answers.filter((_, i) => i !== index);
    setQFormData({ ...qFormData, answers: updated });
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!qFormData.content.trim()) {
      toast.error('Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    if (qFormData.type === 'multiple_choice') {
      const answers = qFormData.answers || [];

      if (
        answers.length < 2 ||
        answers.some((a) => !a.content?.trim())
      ) {
        toast.error('Cần ít nhất 2 đáp án và không được để trống!');
        return;
      }

      const correctCount = answers.filter(
        (a) => a.is_correct
      ).length;

      if (correctCount !== 1) {
        toast.error('Phải chọn đúng 1 đáp án!');
        return;
      }
    }

    if (
      !Number.isFinite(Number(qFormData.points)) ||
      Number(qFormData.points) <= 0
    ) {
      toast.error('Điểm phải lớn hơn 0!');
      return;
    }

    setQFormLoading(true);
    try {
      if (editingQuestion) {
        await questionApi.updateQuestion(editingQuestion.id, {
          exercise_id: targetExerciseId,
          ...qFormData,
        });
        toast.success('Cập nhật câu hỏi thành công!');
      } else {
        await questionApi.createQuestion({
          exercise_id: targetExerciseId,
          ...qFormData,
        });
        toast.success('Thêm câu hỏi mới thành công!');
      }
      setQuestionModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu câu hỏi');
    } finally {
      setQFormLoading(false);
    }
  };

  // Delete Action
  const handleDeleteExercise = (ex) => {
    setItemToDelete(ex);
    setDeleteType('exercise');
    setDeleteConfirmOpen(true);
  };

  const handleDeleteQuestion = (q) => {
    setItemToDelete(q);
    setDeleteType('question');
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    try {
      if (deleteType === 'exercise') {
        await exerciseApi.deleteExercise(itemToDelete.id);
        toast.success('Xóa bài tập thành công!');
      } else {
        await questionApi.deleteQuestion(itemToDelete.id);
        toast.success('Xóa câu hỏi thành công!');
      }
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi xóa');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold text-gray-800 mb-4">
          Chọn khóa học và bài học
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className="block text-sm font-medium mb-2">
              Khóa học
            </label>

            <select
              value={selectedCourseId}
              onChange={(e) => {
                const id = e.target.value;

                setSelectedCourseId(id);
                setCourseLessons([]);
                setLesson(null);
                setExercises([]);

                setSearchParams(id ? { course_id: id } : {});
              }}
              className="w-full border rounded-lg p-3"
            >
              <option value="">-- Chọn khóa học --</option>

              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Bài học
            </label>

            <select
              value={lessonId}
              disabled={!selectedCourseId}
              onChange={(e) => {
                const id = e.target.value;

                setSearchParams(
                  id
                    ? {
                      course_id: selectedCourseId,
                      lesson_id: id,
                    }
                    : { course_id: selectedCourseId }
                );
              }}
              className="w-full border rounded-lg p-3 disabled:bg-gray-100"
            >
              <option value="">-- Chọn bài học --</option>

              {courseLessons.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/teacher/lessons"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              <HiArrowLeft className="w-3.5 h-3.5" /> Danh sách bài học
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-xs text-gray-500 truncate max-w-sm">
              {lesson?.title || 'Bài tập thực hành'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Quản Lý Bài Tập & Ngân Hàng Câu Hỏi
          </h1>
        </div>

        <Button
          variant="primary"
          icon={HiPlus}
          size="sm"
          onClick={handleOpenAddExercise}
        >
          Thêm bộ bài tập mới
        </Button>
      </div>

      {loading ? (
        <Loading text="Đang tải danh sách bài tập và câu hỏi..." />
      ) : exercises.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <EmptyState
            title="Bài học này chưa có bài tập nào"
            message="Hãy tạo bài tập trắc nghiệm, điền từ để học viên củng cố kiến thức vừa học."
            action={
              <Button
                variant="primary"
                size="sm"
                icon={HiPlus}
                onClick={handleOpenAddExercise}
              >
                Tạo bài tập đầu tiên
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {exercises.map((exercise) => {
            const isExpanded = expandedExerciseId === exercise.id;
            const qList = exercise.questions || [];

            return (
              <div
                key={exercise.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all"
              >
                {/* Exercise Title Row */}
                <div
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/60"
                  onClick={() =>
                    setExpandedExerciseId(isExpanded ? null : exercise.id)
                  }
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <button
                      type="button"
                      className="p-1 rounded text-gray-400 hover:text-gray-600 mt-0.5 sm:mt-0"
                    >
                      {isExpanded ? (
                        <HiChevronUp className="w-5 h-5 text-blue-600" />
                      ) : (
                        <HiChevronDown className="w-5 h-5" />
                      )}
                    </button>

                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {exercise.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="primary" size="sm">
                          {EXERCISE_TYPE_LABELS[exercise.type] || exercise.type}
                        </Badge>
                        <Badge
                          variant={
                            exercise.difficulty === 'easy'
                              ? 'success'
                              : exercise.difficulty === 'hard'
                                ? 'danger'
                                : 'warning'
                          }
                          size="sm"
                        >
                          {DIFFICULTY_LABELS[exercise.difficulty] || exercise.difficulty}
                        </Badge>
                        <span className="text-[11px] text-gray-400">•</span>
                        <span className="text-[11px] text-gray-500">
                          {exercise.time_limit ? `${exercise.time_limit} phút` : 'Không giới hạn'}
                        </span>
                        <span className="text-[11px] text-gray-400">•</span>
                        <span className="text-[11px] font-medium text-blue-600">
                          {qList.length} câu hỏi
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 self-end sm:self-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      icon={HiPlus}
                      onClick={() => handleOpenAddQuestion(exercise.id)}
                    >
                      Thêm câu hỏi
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditExercise(exercise)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Sửa bài tập"
                    >
                      <HiPencilSquare className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteExercise(exercise)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa bài tập"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Questions List (Collapsible) */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/40 p-5 space-y-3">
                    {qList.length === 0 ? (
                      <div className="text-center py-6 text-xs text-gray-400">
                        Chưa có câu hỏi nào trong bài tập này.{' '}
                        <button
                          type="button"
                          onClick={() => handleOpenAddQuestion(exercise.id)}
                          className="text-blue-600 font-semibold hover:underline"
                        >
                          Thêm câu hỏi ngay
                        </button>
                      </div>
                    ) : (
                      qList.map((q, qIndex) => (
                        <div
                          key={q.id || qIndex}
                          className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                {qIndex + 1}
                              </span>
                              <div>
                                <p className="text-xs sm:text-sm font-semibold text-gray-800">
                                  {q.content}
                                </p>
                                <span className="text-[11px] text-gray-400">
                                  Điểm số: {q.points || 1} đ
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditQuestion(exercise.id, q)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                                title="Sửa câu hỏi"
                              >
                                <HiPencilSquare className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(q)}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                                title="Xóa câu hỏi"
                              >
                                <HiTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Answers preview */}
                          {q.answers && q.answers.length > 0 && (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {q.answers.map((ans, aIdx) => (
                                <div
                                  key={ans.id || aIdx}
                                  className={`p-2 rounded-lg border flex items-center gap-2 ${ans.is_correct
                                    ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800 font-medium'
                                    : 'border-gray-200 bg-white text-gray-600'
                                    }`}
                                >
                                  {ans.is_correct ? (
                                    <HiCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                  ) : (
                                    <HiXCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                  )}
                                  <span>{ans.content}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {q.explanation && (
                            <div className="mt-2.5 p-2 rounded-lg bg-blue-50/60 text-[11px] text-blue-800 border border-blue-100 flex items-start gap-1.5">
                              <HiOutlineQuestionMarkCircle className="w-4 h-4 flex-shrink-0 text-blue-600" />
                              <span>
                                <strong>Giải thích:</strong> {q.explanation}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Exercise Modal */}
      <Modal
        isOpen={exerciseModalOpen}
        onClose={() => setExerciseModalOpen(false)}
        title={editingExercise ? 'Chỉnh Sửa Bộ Bài Tập' : 'Tạo Bộ Bài Tập Mới'}
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExerciseModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={exFormLoading}
              onClick={handleSaveExercise}
            >
              {editingExercise ? 'Lưu thay đổi' : 'Tạo bài tập'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveExercise} className="space-y-4">
          <Input
            label="Tiêu đề bài tập"
            value={exFormData.title}
            onChange={(e) => setExFormData({ ...exFormData, title: e.target.value })}
            placeholder="Ví dụ: Luyện tập Nghe & Điền từ Section 1"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Loại bài tập
              </label>
              <select
                value={exFormData.type}
                onChange={(e) => setExFormData({ ...exFormData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-700"
              >
                <option value={EXERCISE_TYPES.MULTIPLE_CHOICE}>Trắc nghiệm</option>
                <option value={EXERCISE_TYPES.FILL_BLANK}>Điền từ</option>
                <option value={EXERCISE_TYPES.LISTENING}>Nghe hiểu</option>
                <option value={EXERCISE_TYPES.READING}>Đọc hiểu</option>
                <option value={EXERCISE_TYPES.MATCHING}>Nối câu</option>
                <option value={EXERCISE_TYPES.ESSAY}>Tự luận</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Độ khó
              </label>
              <select
                value={exFormData.difficulty}
                onChange={(e) => setExFormData({ ...exFormData, difficulty: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-700"
              >
                <option value="easy">Dễ (Easy)</option>
                <option value="medium">Trung bình (Medium)</option>
                <option value="hard">Khó (Hard)</option>
              </select>
            </div>
          </div>

          <Input
            label="Thời gian làm bài (phút, 0 = không giới hạn)"
            type="number"
            value={exFormData.time_limit}
            onChange={(e) => setExFormData({ ...exFormData, time_limit: Number(e.target.value) })}
          />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Hướng dẫn / Yêu cầu làm bài
            </label>
            <textarea
              rows={3}
              value={exFormData.description}
              onChange={(e) => setExFormData({ ...exFormData, description: e.target.value })}
              placeholder="Nhập hướng dẫn làm bài cho học viên..."
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-700"
            />
          </div>
        </form>
      </Modal>

      {/* Add / Edit Question Modal */}
      <Modal
        isOpen={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
        title={editingQuestion ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới'}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuestionModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={qFormLoading}
              onClick={handleSaveQuestion}
            >
              {editingQuestion ? 'Lưu thay đổi' : 'Thêm câu hỏi'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4">
          <Input
            label="Nội dung câu hỏi"
            value={qFormData.content}
            onChange={(e) => setQFormData({ ...qFormData, content: e.target.value })}
            placeholder="Nhập câu hỏi hoặc câu văn có chỗ trống..."
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Điểm số cho câu này"
              type="number"
              value={qFormData.points}
              onChange={(e) => setQFormData({ ...qFormData, points: Number(e.target.value) })}
              required
            />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Dạng câu hỏi
              </label>
              <select
                value={qFormData.type}
                onChange={(e) => setQFormData({ ...qFormData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-700"
              >
                <option value="multiple_choice">Trắc nghiệm chọn đáp án</option>
                <option value="fill_blank">Điền từ chính xác</option>
                <option value="true_false">Đúng / Sai</option>
              </select>
            </div>
          </div>

          {/* Answers list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-800">
                Các phương án lựa chọn & đáp án đúng:
              </label>
              <button
                type="button"
                onClick={handleAddAnswerRow}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                + Thêm phương án
              </button>
            </div>

            <div className="space-y-2">
              {qFormData.answers.map((ans, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct_answer"
                    checked={ans.is_correct}
                    onChange={() => handleAnswerChange(idx, 'is_correct', true)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    title="Chọn làm đáp án đúng"
                  />
                  <input
                    type="text"
                    value={ans.content}
                    onChange={(e) => handleAnswerChange(idx, 'content', e.target.value)}
                    placeholder={`Phương án ${String.fromCharCode(65 + idx)}`}
                    className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAnswerRow(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                    title="Xóa phương án"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Lời giải thích / Dẫn chứng
            </label>
            <textarea
              rows={2}
              value={qFormData.explanation}
              onChange={(e) => setQFormData({ ...qFormData, explanation: e.target.value })}
              placeholder="Giải thích vì sao đáp án này đúng để học viên tự học..."
              className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg text-gray-700"
            />
          </div>
        </form>
      </Modal>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        title={deleteType === 'exercise' ? 'Xóa bài tập' : 'Xóa câu hỏi'}
        message={`Bạn có chắc chắn muốn xóa ${deleteType === 'exercise' ? `bài tập "${itemToDelete?.title}"` : 'câu hỏi này'
          }?`}
        confirmText="Xóa vĩnh viễn"
      />
    </div>
  );
};

export default ExerciseManagement;
