
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import exerciseApi from '../../api/exerciseApi';

export default function ExerciseHistory() {
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        let active = true;

        const loadHistory = async () => {
            try {
                const res = await exerciseApi.getMyAttempts();

                if (!res?.success || !Array.isArray(res.data)) {
                    throw new Error('Dữ liệu lịch sử không hợp lệ');
                }

                if (active) setAttempts(res.data);
            } catch (err) {
                if (active) {
                    toast.error(err.message || 'Không tải được lịch sử');
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadHistory();

        return () => {
            active = false;
        };
    }, []);

    const showDetail = async (attemptId) => {
        if (selected === attemptId) {
            setSelected(null);
            setDetail(null);
            return;
        }

        setSelected(attemptId);
        setDetail(null);
        setDetailLoading(true);

        try {
            const res =
                await exerciseApi.getMyAttemptDetail(attemptId);

            if (!res?.success || !res?.data) {
                throw new Error('Không tải được kết quả chi tiết');
            }

            setDetail(res.data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setDetailLoading(false);
        }
    };

    const formatDate = (value) => {
        if (!value) return 'Không xác định';

        return new Date(value).toLocaleString('vi-VN');
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-10">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Lịch sử làm bài tập
                </h1>

                <p className="text-sm text-gray-500 mt-2">
                    Xem điểm số và kết quả các lần làm bài đã lưu.
                </p>
            </div>

            {loading ? (
                <p className="text-gray-500">
                    Đang tải lịch sử làm bài...
                </p>
            ) : attempts.length === 0 ? (
                <div className="bg-white border rounded-xl p-8">
                    <p className="text-gray-600">
                        Bạn chưa có lượt nộp bài nào.
                    </p>

                    <Link
                        to="/student/courses"
                        className="text-blue-600 underline text-sm mt-3 inline-block"
                    >
                        Khám phá khóa học
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {attempts.map((item) => (
                        <div
                            key={item.attempt_id}
                            className="bg-white border rounded-xl p-5 shadow-sm"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-gray-900">
                                        {item.exercise_title}
                                    </h3>

                                    <p className="text-sm text-gray-500 mt-1">
                                        {item.course_title} — {item.lesson_title}
                                    </p>

                                    <p className="text-xs text-gray-400 mt-1">
                                        Nộp lúc: {formatDate(item.submitted_at)}
                                    </p>

                                    <p className="text-sm text-gray-600 mt-2">
                                        Đúng {item.total_correct}/{item.total_questions} câu
                                    </p>
                                </div>

                                <div className="flex flex-col items-start sm:items-end gap-2">
                                    <span className="text-2xl font-bold text-blue-600">
                                        {Number(item.score).toFixed(1)}%
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => showDetail(item.attempt_id)}
                                        className="text-sm font-semibold text-blue-700 hover:underline"
                                    >
                                        {selected === item.attempt_id
                                            ? 'Ẩn chi tiết'
                                            : 'Xem chi tiết'}
                                    </button>
                                </div>
                            </div>

                            {selected === item.attempt_id && (
                                <div className="border-t mt-5 pt-4 space-y-4">
                                    {detailLoading ? (
                                        <p className="text-sm text-gray-500">
                                            Đang tải chi tiết...
                                        </p>
                                    ) : detail ? (
                                        (detail.questions || []).map((q, index) => (
                                            <div
                                                key={q.question_id}
                                                className="bg-gray-50 rounded-xl p-4 space-y-2"
                                            >
                                                <p className="font-semibold text-sm">
                                                    Câu {index + 1}: {q.question_content}
                                                </p>

                                                <p className="text-sm text-gray-600">
                                                    Bạn chọn:{' '}
                                                    {q.selected_answer || 'Chưa trả lời'}
                                                </p>

                                                <p className="text-sm text-emerald-700">
                                                    Đáp án đúng:{' '}
                                                    {q.correct_answer || 'Không có dữ liệu'}
                                                </p>

                                                <p
                                                    className={`text-sm font-semibold ${q.is_correct
                                                            ? 'text-green-700'
                                                            : 'text-red-600'
                                                        }`}
                                                >
                                                    {q.is_correct ? 'Đúng' : 'Sai hoặc bỏ trống'}
                                                </p>

                                                {q.explanation && (
                                                    <p className="text-sm text-blue-900 bg-blue-50 rounded-lg p-3">
                                                        Lời giải: {q.explanation}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">
                                            Chưa tải được chi tiết kết quả.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
