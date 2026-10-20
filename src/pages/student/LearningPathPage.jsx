import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiMap,
  HiClock,
  HiBookOpen,
  HiCheckCircle,
  HiArrowRight,
  HiAcademicCap,
  HiFlag,
} from 'react-icons/hi2';
import learningPathApi from '../../api/learningPathApi';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import { LEVEL_LABELS, LEVEL_COLORS } from '../../utils/constants';

const LearningPathPage = () => {
  const [paths, setPaths] = useState([]);
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaths = async () => {
      setLoading(true);
      try {
        const res = await learningPathApi.getLearningPaths();
        const list = res?.data || res || [];
        const pList = Array.isArray(list) ? list : list.learning_paths || [];
        if (pList.length > 0) {
          setPaths(pList);
          setSelectedPathId(pList[0].id);
        } else {
          // Fallback rich roadmap data
          const defaultRoadmaps = [
            {
              id: 1,
              title: 'Lộ Trình Chinh Phục IELTS 6.5 Từ Con Số 0',
              level: 'beginner',
              estimated_duration: 180,
              description: 'Lộ trình toàn diện gồm 3 giai đoạn giúp học viên từ mất gốc tiếng Anh đạt band điểm 6.5 chuẩn quốc tế.',
              stages: [
                {
                  stage_number: 1,
                  title: 'Giai đoạn 1: Nền Tảng Ngữ Âm & Từ Vựng Cốt Lõi (Mục tiêu 4.0 - 4.5)',
                  duration: '60 ngày',
                  courses: [
                    { id: 4, title: 'Tiếng Anh Giao Tiếp Thực Chiến Cho Người Mất Gốc', lessons: 20, status: 'completed' },
                    { id: 10, title: 'Chuẩn Hóa Ngữ Âm IPA Quốc Tế & Phản Xạ Nghe', lessons: 15, status: 'completed' },
                  ],
                },
                {
                  stage_number: 2,
                  title: 'Giai đoạn 2: Phát Triển Kỹ Năng Nghe - Đọc & Ngữ Pháp B2 (Mục tiêu 5.0 - 5.5)',
                  duration: '60 ngày',
                  courses: [
                    { id: 2, title: 'Ngữ pháp & Từ vựng CEFR B2 Trọng tâm Toàn diện', lessons: 18, status: 'in_progress' },
                    { id: 12, title: 'Phương Pháp Đọc Hiểu Skimming & Scanning Chuyên Sâu', lessons: 16, status: 'upcoming' },
                  ],
                },
                {
                  stage_number: 3,
                  title: 'Giai đoạn 3: Chiến Thuật Luyện Đề & Bứt Phá IELTS 6.5 (Mục tiêu 6.5+)',
                  duration: '60 ngày',
                  courses: [
                    { id: 1, title: 'Luyện thi IELTS 6.5 - Listening & Speaking Bứt Phá', lessons: 24, status: 'upcoming' },
                    { id: 14, title: 'Tổng Hợp Đề Thi Thử Mock Test Chuẩn IDP', lessons: 10, status: 'upcoming' },
                  ],
                },
              ],
            },
            {
              id: 2,
              title: 'Lộ Trình Đạt Chuẩn Châu Âu CEFR B2 Nhanh Nhất',
              level: 'intermediate',
              estimated_duration: 120,
              description: 'Được thiết kế cho sinh viên xét tốt nghiệp đại học và người đi làm cần chứng chỉ B2.',
              stages: [
                {
                  stage_number: 1,
                  title: 'Giai đoạn 1: Củng Cố Ngữ Pháp B1 Lên B2',
                  duration: '45 ngày',
                  courses: [
                    { id: 2, title: 'Ngữ pháp & Từ vựng CEFR B2 Trọng tâm Toàn diện', lessons: 18, status: 'in_progress' },
                  ],
                },
                {
                  stage_number: 2,
                  title: 'Giai đoạn 2: Luyện Đề Thi B2 VSTEP & Cambridge',
                  duration: '75 ngày',
                  courses: [
                    { id: 15, title: 'Bộ Đề Luyện Thi Chuẩn Khung 6 Bậc VSTEP', lessons: 20, status: 'upcoming' },
                  ],
                },
              ],
            },
          ];
          setPaths(defaultRoadmaps);
          setSelectedPathId(defaultRoadmaps[0].id);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPaths();
  }, []);

  if (loading) {
    return <Loading text="Đang tải lộ trình học tập..." />;
  }

  const selectedPath = paths.find((p) => p.id === selectedPathId) || paths[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Lộ Trình Học Tập Có Định Hướng
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Học theo lộ trình từng bước được thiết kế bởi chuyên gia để đạt mục tiêu chứng chỉ nhanh nhất
        </p>
      </div>

      {/* Path selector tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {paths.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedPathId(p.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all ${
              selectedPath?.id === p.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <HiMap className="w-4 h-4" />
            <span>{p.title}</span>
          </button>
        ))}
      </div>

      {/* Selected Roadmap Details */}
      {selectedPath && (
        <div className="space-y-6">
          {/* Path Overview Card */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  LEVEL_COLORS[selectedPath.level] || 'bg-blue-50 text-blue-700'
                }`}
              >
                {LEVEL_LABELS[selectedPath.level] || selectedPath.level}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <HiClock className="w-4 h-4 text-blue-500" />
                Thời gian dự kiến: <strong>{selectedPath.estimated_duration} ngày</strong>
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mt-2">
              {selectedPath.title}
            </h2>
            <p className="mt-1.5 text-xs text-gray-600 leading-relaxed max-w-3xl">
              {selectedPath.description}
            </p>
          </div>

          {/* Visual Roadmap Milestones */}
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-blue-200 before:z-0">
            {(selectedPath.stages || [
              {
                stage_number: 1,
                title: 'Giai đoạn khởi động',
                duration: '30 ngày',
                courses: [{ id: 1, title: 'Khóa học nền tảng', lessons: 12, status: 'completed' }],
              },
            ]).map((stage, sIdx) => (
              <div key={sIdx} className="relative z-10 pl-12">
                {/* Milestone Node Pin */}
                <div className="absolute left-2.5 -translate-x-1/2 top-4 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-4 ring-white shadow">
                  {stage.stage_number || sIdx + 1}
                </div>

                {/* Stage Box */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <HiFlag className="w-4 h-4 text-blue-600" />
                      {stage.title}
                    </h3>
                    <Badge variant="purple" size="sm">
                      {stage.duration}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {stage.courses?.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between gap-3 hover:bg-blue-50/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                              c.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : c.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            <HiBookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-xs line-clamp-1">
                              {c.title}
                            </p>
                            <span className="text-[11px] text-gray-400">
                              {c.lessons} bài học
                            </span>
                          </div>
                        </div>

                        <div>
                          {c.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                              <HiCheckCircle className="w-3.5 h-3.5" /> Xong
                            </span>
                          ) : (
                            <Link to={`/student/course/${c.id || 1}`}>
                              <Button variant="primary" size="sm">
                                Vào học
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPathPage;
