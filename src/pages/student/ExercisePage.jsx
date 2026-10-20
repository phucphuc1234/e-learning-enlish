
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  HiCheckCircle,
  HiXCircle,
  HiArrowPath,
  HiArrowLeft,
  HiQuestionMarkCircle,
  HiSparkles,
} from 'react-icons/hi2';

import toast from 'react-hot-toast';

import exerciseApi from '../../api/exerciseApi';
import questionApi from '../../api/questionApi';

import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';

const ExercisePage = () => {
  const { id } = useParams();

  // ==============================
  // STATE
  // ==============================
  const [exercise, setExercise] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [userAnswers, setUserAnswers] = useState({});

  const [submitted, setSubmitted] = useState(false);
  const [scoreData, setScoreData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ==============================
  // TẢI BÀI TẬP VÀ CÂU HỎI
  // ==============================
  useEffect(() => {
    let cancelled = false;

    const fetchExercise = async () => {
      setLoading(true);
      setExercise(null);
      setQuestions([]);
      setUserAnswers({});
      setSubmitted(false);
      setScoreData(null);

      try {
        const [exerciseRes, questionRes] = await Promise.all([
          exerciseApi.getExerciseById(id),
          questionApi.getQuestionsByExercise(id),
        ]);

        if (!exerciseRes?.success || !exerciseRes?.data) {
          throw new Error('Không tải được thông tin bài tập');
        }

        if (
          !questionRes?.success ||
          !Array.isArray(questionRes?.data)
        ) {
          throw new Error('Không tải được danh sách câu hỏi');
        }

        const questionList = questionRes.data.map((q) => ({
          ...q,
          answers: Array.isArray(q.answers) ? q.answers : [],
        }));

        if (
          questionList.some(
            (q) => q.type !== 'multiple_choice'
          )
        ) {
          throw new Error(
            'Bài tập có loại câu hỏi chưa hỗ trợ chấm tự động'
          );
        }

        if (!cancelled) {
          setExercise(exerciseRes.data);
          setQuestions(questionList);
        }
      } catch (error) {
        console.error('Lỗi tải bài tập:', error);

        if (!cancelled) {
          toast.error(
            error?.response?.data?.message ||
            error.message ||
            'Không thể tải bài tập'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchExercise();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ==============================
  // CHỌN ĐÁP ÁN
  // ==============================
  const handleSelectAnswer = (questionId, answerId) => {
    if (submitted || submitting) {
      return;
    }

    setUserAnswers((prev) => ({
      ...prev,
      [String(questionId)]: Number(answerId),
    }));
  };

  // ==============================
  // NỘP BÀI - BACKEND CHẤM ĐIỂM
  // ==============================
  const handleSubmit = async () => {
    if (submitted || submitting) {
      return;
    }

    if (questions.length === 0) {
      toast.error('Bài tập chưa có câu hỏi!');
      return;
    }

    const missingAnswers = questions.some(
      (q) => !q.answers || q.answers.length < 2
    );

    if (missingAnswers) {
      toast.error(
        'Một số câu hỏi chưa có đủ đáp án. Hãy báo giáo viên kiểm tra.'
      );
      return;
    }

    const answeredCount = questions.filter(
      (q) => userAnswers[q.id] !== undefined
    ).length;

    if (answeredCount < questions.length) {
      const confirmed = window.confirm(
        `Bạn mới trả lời ${answeredCount}/${questions.length} câu.\n` +
        'Bạn vẫn muốn nộp bài?'
      );

      if (!confirmed) {
        return;
      }
    }

    setSubmitting(true);

    try {
      const response = await exerciseApi.submitExercise(id, {
        answers: userAnswers,
      });

      if (!response?.success || !response?.data) {
        throw new Error('Không nhận được kết quả chấm điểm');
      }

      const result = response.data;

      if (
        !Number.isFinite(Number(result.scorePercentage)) ||
        !Array.isArray(result.details)
      ) {
        throw new Error(
          'Kết quả trả về từ backend không hợp lệ'
        );
      }

      // Lưu kết quả server trả về
      setScoreData(result);

      // Hiển thị đáp án đúng và lời giải
      setQuestions((previousQuestions) =>
        previousQuestions.map((question) => {
          const detail = result.details.find(
            (item) =>
              String(item.questionId) === String(question.id)
          );

          return {
            ...question,

            explanation: detail?.explanation || '',

            answers: (question.answers || []).map((answer) => ({
              ...answer,

              is_correct:
                detail != null &&
                String(answer.id) ===
                String(detail.correctAnswerId),
            })),
          };
        })
      );

      setSubmitted(true);

      toast.success(
        `Nộp bài thành công! Điểm: ${result.scorePercentage}%`
      );
    } catch (error) {
      console.error('Lỗi nộp bài:', error);

      toast.error(
        error?.response?.data?.message ||
        error.message ||
        'Không thể nộp bài. Vui lòng thử lại!'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==============================
  // LÀM LẠI BÀI
  // ==============================
  const handleRetry = () => {
    window.location.reload();
  };

  // ==============================
  // LOADING
  // ==============================
  if (loading) {
    return (
      <Loading text="Đang tải câu hỏi bài tập..." />
    );
  }

  // ==============================
  // KHÔNG TẢI ĐƯỢC BÀI TẬP
  // ==============================
  if (!exercise) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-red-600">
          Không tải được bài tập
        </h2>

        <p className="text-gray-500 mt-2">
          Vui lòng kiểm tra kết nối hoặc quyền truy cập.
        </p>

        <Link
          to="/student/courses"
          className="text-blue-600 underline mt-4 inline-block"
        >
          Quay lại danh sách khóa học
        </Link>
      </div>
    );
  }

  // ==============================
  // GIAO DIỆN
  // ==============================
  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <Link
          to={`/student/lesson/${exercise.lesson_id}`}
          className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline"
        >
          <HiArrowLeft className="w-4 h-4" />
          Quay lại bài học
        </Link>

        <Badge variant="primary" size="sm">
          {questions.length} câu hỏi trắc nghiệm
        </Badge>
      </div>

      {/* THÔNG TIN BÀI TẬP */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {exercise.title || 'Bài tập thực hành'}
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          {exercise.description ||
            'Hãy chọn đáp án đúng nhất cho từng câu hỏi.'}
        </p>
        <Link
          to="/student/exercise-history"
          className="inline-block mt-3 text-sm font-semibold text-blue-600 hover:underline"
        >
          Xem lịch sử làm bài
        </Link>
        {!submitted && (
          <div className="mt-4 text-xs text-blue-700 bg-blue-50 p-3 rounded-lg">
            Đã trả lời:{' '}
            <strong>
              {
                questions.filter(
                  (q) => userAnswers[q.id] !== undefined
                ).length
              }
              /{questions.length}
            </strong>
            {' '}câu hỏi
          </div>
        )}
      </div>

      {/* KẾT QUẢ SAU KHI NỘP BÀI */}
      {submitted && scoreData && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black">
                {scoreData.scorePercentage}%
              </div>

              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <HiSparkles className="w-5 h-5 text-amber-300" />
                  Kết quả làm bài
                </h3>

                <p className="text-sm text-blue-100 mt-1">
                  Đúng {scoreData.correctCount}/
                  {scoreData.totalQuestions} câu
                </p>

                <p className="text-sm text-blue-100 mt-1">
                  Điểm: {scoreData.earnedPoints}/
                  {scoreData.totalPoints}
                </p>

                {scoreData.attempt_id && (
                  <p className="text-xs text-blue-100 mt-1">
                    Mã lượt làm: {scoreData.attempt_id}
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={HiArrowPath}
              onClick={handleRetry}
              className="bg-white text-blue-600"
            >
              Làm lại bài tập
            </Button>
          </div>
        </div>
      )}

      {/* DANH SÁCH CÂU HỎI */}
      <div className="space-y-5">

        {questions.length === 0 && (
          <div className="bg-white border rounded-xl p-8 text-center">
            <HiQuestionMarkCircle className="w-10 h-10 mx-auto text-gray-400" />

            <p className="text-gray-600 mt-3">
              Bài tập hiện chưa có câu hỏi.
            </p>
          </div>
        )}

        {questions.map((q, qIndex) => {
          const selectedId = userAnswers[q.id];

          const correctOption = submitted
            ? q.answers.find((a) => Boolean(a.is_correct))
            : null;

          const questionCorrect =
            submitted &&
            correctOption != null &&
            String(selectedId) === String(correctOption.id);

          const questionBorder = submitted
            ? questionCorrect
              ? 'border-emerald-300'
              : 'border-rose-300'
            : 'border-gray-200';

          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl border-2 p-6 shadow-sm ${questionBorder}`}
            >

              {/* NỘI DUNG CÂU HỎI */}
              <div className="flex items-start gap-3">

                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {qIndex + 1}
                </span>

                <div className="flex-1">
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 leading-relaxed">
                    {q.content}
                  </h4>

                  {q.points != null && (
                    <p className="text-xs text-gray-400 mt-1">
                      {q.points} điểm
                    </p>
                  )}
                </div>
              </div>

              {/* DANH SÁCH ĐÁP ÁN */}
              <div className="mt-5 space-y-3 md:pl-10">

                {q.answers.length === 0 && (
                  <p className="text-red-500 text-sm">
                    Câu hỏi này chưa có đáp án.
                  </p>
                )}

                {q.answers.map((ans, aIdx) => {
                  const isSelected =
                    String(selectedId ?? '') === String(ans.id);

                  const isCorrect =
                    submitted && Boolean(ans.is_correct);

                  const isWrong =
                    submitted && isSelected && !isCorrect;

                  let optionStyle =
                    'border-gray-200 bg-white hover:border-blue-400';

                  if (submitted) {
                    if (isCorrect) {
                      optionStyle =
                        'border-emerald-500 bg-emerald-50';
                    } else if (isWrong) {
                      optionStyle =
                        'border-rose-500 bg-rose-50';
                    } else {
                      optionStyle =
                        'border-gray-200 bg-gray-50';
                    }
                  } else if (isSelected) {
                    optionStyle =
                      'border-blue-600 bg-blue-50';
                  }

                  return (
                    <label
                      key={ans.id}
                      className={`
                        flex items-center gap-3 p-4
                        border-2 rounded-xl transition-all
                        ${optionStyle}
                        ${submitted || submitting
                          ? 'cursor-not-allowed'
                          : 'cursor-pointer'
                        }
                      `}
                    >

                      {/* RADIO BUTTON */}
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={ans.id}
                        checked={isSelected}
                        disabled={submitted || submitting}
                        onChange={() =>
                          handleSelectAnswer(q.id, ans.id)
                        }
                        className="w-5 h-5 accent-blue-600 flex-shrink-0"
                      />

                      {/* CHỮ A, B, C, D */}
                      <span className="font-bold text-sm text-gray-700">
                        {String.fromCharCode(65 + aIdx)}.
                      </span>

                      {/* NỘI DUNG ĐÁP ÁN */}
                      <span className="flex-1 text-sm text-gray-800">
                        {ans.content}
                      </span>

                      {/* BIỂU TƯỢNG ĐÚNG / SAI */}
                      {submitted && isCorrect && (
                        <HiCheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                      )}

                      {submitted && isWrong && (
                        <HiXCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
                      )}
                    </label>
                  );
                })}
              </div>

              {/* KẾT QUẢ TỪNG CÂU */}
              {submitted && (
                <div className="mt-4 md:ml-10">

                  <p
                    className={`text-sm font-semibold ${questionCorrect
                      ? 'text-emerald-700'
                      : 'text-rose-600'
                      }`}
                  >
                    {questionCorrect
                      ? 'Chính xác!'
                      : selectedId == null
                        ? 'Bạn chưa trả lời câu này.'
                        : 'Đáp án chưa chính xác.'}
                  </p>

                  {/* LỜI GIẢI */}
                  {q.explanation && (
                    <div className="mt-3 p-4 rounded-xl bg-blue-50 border border-blue-100">

                      <div className="flex items-start gap-2">
                        <HiQuestionMarkCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />

                        <div className="text-sm text-blue-900">
                          <strong>Lời giải chi tiết:</strong>

                          <p className="mt-1">
                            {q.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* NÚT NỘP BÀI */}
      {!submitted && (
        <div className="flex justify-end pt-5 border-t border-gray-200">

          <Button
            variant="primary"
            size="lg"
            loading={submitting}
            disabled={
              submitting ||
              questions.length === 0 ||
              questions.some(
                (q) => !q.answers || q.answers.length < 2
              )
            }
            onClick={handleSubmit}
          >
            Nộp bài & Chấm điểm
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExercisePage;
