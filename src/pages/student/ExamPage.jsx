import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  HiClock,
  HiCheckCircle,
  HiExclamationTriangle,
  HiClipboardDocumentCheck,
  HiArrowPath,
  HiArrowLeft,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import examApi from '../../api/examApi';
import questionApi from '../../api/questionApi';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import { formatSeconds } from '../../utils/helpers';

const ExamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    const fetchExam = async () => {
      setLoading(true);
      try {
        const [exRes, qRes] = await Promise.allSettled([
          examApi.getExamById(id),
          questionApi.getQuestions({ exam_id: id }),
        ]);

        let examData = null;
        if (exRes.status === 'fulfilled') {
          examData = exRes.value?.data || exRes.value;
          setExam(examData);
        } else {
          examData = {
            id: Number(id),
            title: 'IELTS Mock Test Listening - Test 1',
            time_limit: 40, // 40 minutes
            pass_score: 60,
            max_attempts: 2,
          };
          setExam(examData);
        }

        if (qRes.status === 'fulfilled') {
          const list = qRes.value?.data || qRes.value || [];
          const qList = Array.isArray(list) ? list : list.questions || [];
          setQuestions(qList);
        } else {
          // Generate realistic IELTS sample questions
          const sampleQ = [
            {
              id: 1,
              content: 'The woman is calling to inquire about a reservation for which month?',
              points: 1,
              answers: [
                { id: 101, content: 'August', is_correct: true },
                { id: 102, content: 'September', is_correct: false },
                { id: 103, content: 'October', is_correct: false },
                { id: 104, content: 'November', is_correct: false },
              ],
            },
            {
              id: 2,
              content: 'What type of room does the customer finally choose?',
              points: 1,
              answers: [
                { id: 201, content: 'Standard Single Room', is_correct: false },
                { id: 202, content: 'Deluxe Double with Balcony', is_correct: true },
                { id: 203, content: 'Family Suite', is_correct: false },
                { id: 204, content: 'Twin Room on ground floor', is_correct: false },
              ],
            },
            {
              id: 3,
              content: 'What extra facility is included free of charge?',
              points: 1,
              answers: [
                { id: 301, content: 'Airport shuttle transfer', is_correct: false },
                { id: 302, content: 'Buffet breakfast & gym access', is_correct: true },
                { id: 303, content: 'Laundry service', is_correct: false },
                { id: 304, content: 'Private car parking space', is_correct: false },
              ],
            },
            {
              id: 4,
              content: 'What time is the latest checkout allowed?',
              points: 1,
              answers: [
                { id: 401, content: '11:00 AM', is_correct: false },
                { id: 402, content: '12:00 PM (Noon)', is_correct: true },
                { id: 403, content: '02:00 PM', is_correct: false },
                { id: 404, content: '04:00 PM', is_correct: false },
              ],
            },
          ];
          setQuestions(sampleQ);
        }

        // Initialize timer (in seconds)
        const durationMinutes = examData?.time_limit || 40;
        setTimeLeft(durationMinutes * 60);

        // Try calling start API
        try {
          await examApi.startExam(id);
        } catch {
          // ignore
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || submitted) return;

    if (timeLeft <= 0) {
      toast.error('Đã hết thời gian làm bài! Hệ thống tự động nộp bài.');
      handleDoSubmit();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, submitted]);

  const handleSelectOption = (questionId, optionId) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleDoSubmit = async () => {
    setSubmitting(true);
    setConfirmModalOpen(false);
    try {
      let correct = 0;
      let totalPts = 0;
      let earnedPts = 0;

      questions.forEach((q) => {
        const correctOpt = q.answers?.find((a) => a.is_correct);
        const userChoice = answers[q.id];
        totalPts += q.points || 1;
        if (correctOpt && userChoice === correctOpt.id) {
          correct++;
          earnedPts += q.points || 1;
        }
      });

      const percentage = Math.round((earnedPts / (totalPts || 1)) * 100);
      const isPass = percentage >= (exam?.pass_score || 50);

      const resData = {
        score: percentage,
        totalCorrect: correct,
        totalQuestions: questions.length,
        isPassed: isPass,
      };

      setResult(resData);
      setSubmitted(true);
      toast.success(isPass ? 'Chúc mừng! Bạn đã vượt qua bài thi.' : 'Bạn chưa đạt điểm chuẩn của bài thi.');

      try {
        await examApi.submitExam(id, { answers, score: percentage });
      } catch {
        // Fallback OK
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading text="Đang khởi tạo bài thi và bộ câu hỏi..." />;
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isTimeCritical = timeLeft !== null && timeLeft <= 300; // Under 5 mins

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Bar with Timer */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:px-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-16 z-20">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 block">
            Phòng Thi Trực Tuyến
          </span>
          <h1 className="text-base sm:text-lg font-bold text-gray-900">
            {exam?.title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {!submitted && (
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-sm font-mono font-bold shadow-sm ${
                isTimeCritical
                  ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              <HiClock className="w-5 h-5" />
              <span>{formatSeconds(timeLeft)}</span>
            </div>
          )}

          {!submitted ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setConfirmModalOpen(true)}
              loading={submitting}
            >
              Nộp bài thi
            </Button>
          ) : (
            <Link to="/student/progress">
              <Button variant="outline" size="sm">
                Xem bảng điểm
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Result Display if Submitted */}
      {submitted && result && (
        <div
          className={`rounded-2xl p-6 sm:p-8 text-white shadow-xl ${
            result.isPassed
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
              : 'bg-gradient-to-r from-rose-600 to-pink-600'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-black">
                {result.score}%
              </div>
              <div>
                <h2 className="text-2xl font-black">
                  {result.isPassed ? 'KẾT QUẢ: ĐẠT CHUẨN' : 'KẾT QUẢ: CHƯA ĐẠT'}
                </h2>
                <p className="text-xs text-white/90 mt-1">
                  Đúng {result.totalCorrect}/{result.totalQuestions} câu hỏi • Điểm sàn yêu cầu: {exam?.pass_score || 50}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                icon={HiArrowPath}
                className="bg-white text-gray-900 font-bold"
                onClick={() => window.location.reload()}
              >
                Làm lại đề này
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Examination Layout: Question Box + Question Navigator */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Area (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {currentQuestion && (
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <span className="text-xs font-bold text-blue-600">
                  Câu hỏi {currentIndex + 1} / {questions.length}
                </span>
                <span className="text-xs text-gray-400">
                  Điểm: {currentQuestion.points || 1} đ
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-relaxed mb-6">
                {currentQuestion.content}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {(currentQuestion.answers || []).map((ans, idx) => {
                  const isSelected = answers[currentQuestion.id] === ans.id;
                  const isCorrect = ans.is_correct;

                  let optClass = 'border-gray-200 hover:border-blue-300 bg-white';
                  if (submitted) {
                    if (isCorrect) optClass = 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900';
                    else if (isSelected && !isCorrect) optClass = 'border-rose-500 bg-rose-50 font-bold text-rose-900';
                    else optClass = 'border-gray-100 bg-gray-50/50 text-gray-400';
                  } else if (isSelected) {
                    optClass = 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-sm';
                  }

                  return (
                    <div
                      key={ans.id || idx}
                      onClick={() => handleSelectOption(currentQuestion.id, ans.id)}
                      className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-all ${optClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center font-bold text-xs bg-white text-gray-700">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{ans.content}</span>
                      </div>
                      {submitted && isCorrect && (
                        <HiCheckCircle className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Prev / Next question navigation */}
              <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                >
                  &larr; Câu trước
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                >
                  Câu tiếp &rarr;
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Question Palette Navigator (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-sm">
            <h4 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wider">
              Bảng Câu Hỏi ({answeredCount}/{questions.length})
            </h4>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = currentIndex === idx;

                let btnClass = 'bg-gray-50 border-gray-200 text-gray-600';
                if (isCurrent) {
                  btnClass = 'bg-blue-600 text-white font-bold ring-2 ring-blue-500/30';
                } else if (isAnswered) {
                  btnClass = 'bg-emerald-500 text-white font-semibold';
                }

                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg border text-xs flex items-center justify-center transition-all ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-5 pt-4 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300 inline-block" />
                <span>Chưa trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
                <span>Đang xem</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Xác Nhận Nộp Bài Thi"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModalOpen(false)}
            >
              Làm tiếp
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={submitting}
              onClick={handleDoSubmit}
            >
              Nộp bài ngay
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-gray-600">
          <p>
            Bạn đã hoàn thành <strong className="text-gray-900">{answeredCount}</strong> trên tổng số{' '}
            <strong className="text-gray-900">{questions.length}</strong> câu hỏi.
          </p>
          {answeredCount < questions.length && (
            <div className="p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-start gap-2">
              <HiExclamationTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                Cảnh báo: Còn {questions.length - answeredCount} câu hỏi chưa được chọn đáp án!
              </span>
            </div>
          )}
          <p>Bạn có chắc chắn muốn kết thúc bài thi không?</p>
        </div>
      </Modal>
    </div>
  );
};

export default ExamPage;
