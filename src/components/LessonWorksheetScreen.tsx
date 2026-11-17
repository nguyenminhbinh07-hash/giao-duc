import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Download,
  ExternalLink,
  History,
  Loader2,
  Plus,
  Printer,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ArtifactRecord, LessonPlan, WorksheetQuestion } from '../types/heritage';
import { exportWorksheetAsTxt } from '../utils/exportData';
import { SpeechReaderControls } from './SpeechReaderControls';

interface SavedAnswerItem {
  id: string;
  loai: 'trac-nghiem' | 'tu-luan';
  cauHoi: string;
  maHienVatLienQuan: string;
  userAnswer: string;
  dapAnGoiY: string;
  isCorrect?: boolean;
}

interface WorksheetSubmission {
  id: string;
  lessonId: string;
  tiet: string;
  tenBaiHoc: string;
  studentName: string;
  studentClass: string;
  submittedAt: string;
  mcCorrect: number;
  mcTotal: number;
  items: SavedAnswerItem[];
}

const SUBMISSIONS_STORAGE_KEY = 'i03_phieu_hoc_tap_submissions_v1';
const DRAFT_STORAGE_KEY = 'i03_phieu_hoc_tap_draft_v1';

interface LessonWorksheetScreenProps {
  lessons: LessonPlan[];
  artifacts: ArtifactRecord[];
  onOpenArtifact: (identifier: string) => void;
}

export function LessonWorksheetScreen({
  lessons,
  artifacts,
  onOpenArtifact,
}: LessonWorksheetScreenProps) {
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0]?.id ?? '');
  const [studentName, setStudentName] = useState(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { studentName?: string };
        return parsed.studentName ?? '';
      }
    } catch {
      // ignore localStorage read errors
    }
    return '';
  });
  const [studentClass, setStudentClass] = useState(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { studentClass?: string };
        return parsed.studentClass ?? '';
      }
    } catch {
      // ignore localStorage read errors
    }
    return '';
  });
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { answers?: Record<string, string> };
        return parsed.answers ?? {};
      }
    } catch {
      // ignore localStorage read errors
    }
    return {};
  });
  const [showAnswerKeys, setShowAnswerKeys] = useState(false);

  // Worksheet submissions history in localStorage
  const [worksheetTab, setWorksheetTab] = useState<'form' | 'history'>('form');
  const [submissions, setSubmissions] = useState<WorksheetSubmission[]>(() => {
    try {
      const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as WorksheetSubmission[];
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore localStorage read errors
    }
    return [];
  });
  const [submitNotice, setSubmitNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  // AI Question Generator state
  const [aiArtifactId, setAiArtifactId] = useState(artifacts[0]?.identifier ?? '');
  const [aiQuestionType, setAiQuestionType] = useState<'trac-nghiem' | 'tu-luan' | 'ca-hai'>(
    'ca-hai'
  );
  const [aiGradeLevel, setAiGradeLevel] = useState('Lớp 4');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiGeneratedList, setAiGeneratedList] = useState<WorksheetQuestion[]>([]);
  const [addedToWorksheetByLesson, setAddedToWorksheetByLesson] = useState<
    Record<string, WorksheetQuestion[]>
  >({});

  // Sync draft state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ studentName, studentClass, answers })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [studentName, studentClass, answers]);

  // Sync submissions history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
    } catch {
      // ignore storage quota errors
    }
  }, [submissions]);

  const activeLesson = lessons.find((l) => l.id === selectedLessonId) ?? lessons[0];

  const lessonSpeechSegments = useMemo(() => {
    if (!activeLesson) return [];
    const linkedArtifacts = activeLesson.hienVatTichHop
      .map((code) => artifacts.find((a) => a.identifier === code))
      .filter((a): a is ArtifactRecord => Boolean(a));

    return [
      `${activeLesson.tiet}, ${activeLesson.khoiLop}. Bài học: ${activeLesson.tenBaiHoc}.`,
      ...activeLesson.mucTieu.kienThuc.map((k) => `Mục tiêu kiến thức: ${k}`),
      ...linkedArtifacts.map(
        (art) => `Hiện vật ${art.identifier}: ${art.title}. Mô tả: ${art.description}`
      ),
    ];
  }, [activeLesson, artifacts]);

  if (!activeLesson) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-600">
        Chưa có giáo án nào được nạp trong tulieu.json.
      </div>
    );
  }

  const extraQuestions = addedToWorksheetByLesson[activeLesson.id] ?? [];
  const allWorksheetQuestions = [...activeLesson.phieuHocTap.cauHoi, ...extraQuestions];

  const worksheetSpeechSegments = [
    `${activeLesson.phieuHocTap.tieuDe}.`,
    activeLesson.phieuHocTap.huongDan,
    ...allWorksheetQuestions.map((q, idx) => `Câu ${idx + 1}: ${q.cauHoi}`),
  ];

  const handleSubmitWorksheet = () => {
    const cleanName = studentName.trim();
    const cleanClass = studentClass.trim();

    if (!cleanName || !cleanClass) {
      setSubmitNotice({
        type: 'error',
        message: 'Em hãy nhập đầy đủ "Họ và tên học sinh" và "Lớp" trước khi nộp bài nhé.',
      });
      return;
    }

    let mcTotal = 0;
    let mcCorrect = 0;

    const items: SavedAnswerItem[] = allWorksheetQuestions.map((q) => {
      const userAnswer = (answers[q.id] ?? '').trim();
      if (q.loai === 'trac-nghiem') {
        mcTotal += 1;
        const isCorrect = userAnswer !== '' && userAnswer === q.dapAnGoiY;
        if (isCorrect) mcCorrect += 1;
        return {
          id: q.id,
          loai: q.loai,
          cauHoi: q.cauHoi,
          maHienVatLienQuan: q.maHienVatLienQuan,
          userAnswer,
          dapAnGoiY: q.dapAnGoiY,
          isCorrect,
        };
      }
      return {
        id: q.id,
        loai: q.loai,
        cauHoi: q.cauHoi,
        maHienVatLienQuan: q.maHienVatLienQuan,
        userAnswer,
        dapAnGoiY: q.dapAnGoiY,
      };
    });

    const submission: WorksheetSubmission = {
      id: `SUB-${Date.now()}`,
      lessonId: activeLesson.id,
      tiet: activeLesson.tiet,
      tenBaiHoc: activeLesson.tenBaiHoc,
      studentName: cleanName,
      studentClass: cleanClass,
      submittedAt: new Date().toLocaleString('vi-VN', {
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      mcCorrect,
      mcTotal,
      items,
    };

    setSubmissions((prev) => [submission, ...prev]);
    setShowAnswerKeys(true);
    setSubmitNotice({
      type: 'success',
      message: `Đã lưu bài làm của ${cleanName} (${cleanClass}) vào máy này! Trắc nghiệm đúng ${mcCorrect}/${mcTotal} câu.`,
    });
  };

  const handleDeleteSubmission = (id: string) => {
    setSubmissions((prev) => prev.filter((item) => item.id !== id));
    if (expandedSubmissionId === id) {
      setExpandedSubmissionId(null);
    }
  };

  const handleClearAllSubmissions = () => {
    setSubmissions([]);
    setConfirmClearAll(false);
    setExpandedSubmissionId(null);
  };

  const handleGenerateAiQuestions = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: aiArtifactId,
          questionType: aiQuestionType,
          gradeLevel: aiGradeLevel,
          count: 2,
        }),
      });
      const data = (await response.json()) as {
        questions?: WorksheetQuestion[];
        error?: string;
      };
      if (!response.ok || data.error) {
        setAiError(data.error ?? 'Không thể tạo câu hỏi gợi ý lúc này.');
      } else {
        setAiGeneratedList(data.questions ?? []);
      }
    } catch {
      setAiError('Lỗi kết nối tới máy chủ khi gọi Gemini tạo câu hỏi.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddQuestionToWorksheet = (question: WorksheetQuestion) => {
    setAddedToWorksheetByLesson((prev) => {
      const current = prev[activeLesson.id] ?? [];
      if (current.some((q) => q.id === question.id)) return prev;
      return {
        ...prev,
        [activeLesson.id]: [...current, question],
      };
    });
  };

  return (
    <div className="space-y-8">
      <div className="no-print space-y-2">
        <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-stone-900">
          Giáo án & Phiếu học tập tương tác
        </h1>
        <p className="text-base text-stone-600">
          Giáo án Lịch sử địa phương tích hợp hiện vật số, kèm phiếu học tập trực tuyến cho học
          sinh và công cụ AI hỗ trợ giáo viên soạn thêm câu hỏi.
        </p>
      </div>

      {/* Lesson Tabs */}
      <div
        role="tablist"
        aria-label="Chọn tiết học"
        className="no-print flex flex-wrap gap-2 p-1.5 bg-stone-200/70 rounded-xl w-fit"
      >
        {lessons.map((lesson) => {
          const isSelected = lesson.id === activeLesson.id;
          return (
            <button
              key={lesson.id}
              role="tab"
              aria-selected={isSelected}
              type="button"
              onClick={() => {
                setSelectedLessonId(lesson.id);
                setShowAnswerKeys(false);
                setSubmitNotice(null);
              }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-white text-[#0F4C5C] shadow-sm'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              {lesson.tiet}: {lesson.khoiLop}
            </button>
          );
        })}
      </div>

      {/* Detailed Lesson Plan */}
      <section className="no-print rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-[#0F4C5C]">
              <span>{activeLesson.tiet}</span>
              <span aria-hidden="true">·</span>
              <span>{activeLesson.khoiLop}</span>
              <span aria-hidden="true">·</span>
              <span>Thời lượng: {activeLesson.thoiLuong}</span>
            </div>
            <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-stone-900">
              {activeLesson.tenBaiHoc}
            </h2>
          </div>
          <SpeechReaderControls
            sourceKey={`lesson-${activeLesson.id}`}
            idleLabel="Nghe mô tả"
            segments={lessonSpeechSegments}
          />
        </div>

        {/* Objectives */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl bg-[#FAF8F5] border border-stone-200 p-4 space-y-2">
            <h3 className="text-sm font-bold text-stone-900">1. Kiến thức</h3>
            <ul className="space-y-1.5 text-sm text-stone-700 list-disc pl-4 leading-relaxed">
              {activeLesson.mucTieu.kienThuc.map((k, idx) => (
                <li key={idx}>{k}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-[#FAF8F5] border border-stone-200 p-4 space-y-2">
            <h3 className="text-sm font-bold text-stone-900">2. Năng lực</h3>
            <ul className="space-y-1.5 text-sm text-stone-700 list-disc pl-4 leading-relaxed">
              {activeLesson.mucTieu.nangLuc.map((n, idx) => (
                <li key={idx}>{n}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-[#FAF8F5] border border-stone-200 p-4 space-y-2">
            <h3 className="text-sm font-bold text-stone-900">3. Phẩm chất</h3>
            <ul className="space-y-1.5 text-sm text-stone-700 list-disc pl-4 leading-relaxed">
              {activeLesson.mucTieu.phamChat.map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Linked Artifacts */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-stone-900">Hiện vật số tích hợp trong tiết học</h3>
          <div className="flex flex-wrap gap-2">
            {activeLesson.hienVatTichHop.map((id) => {
              const found = artifacts.find((a) => a.identifier === id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onOpenArtifact(id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium bg-[#0F4C5C]/8 text-[#0F4C5C] border border-[#0F4C5C]/25 rounded-lg hover:bg-[#0F4C5C]/15 transition-colors cursor-pointer"
                >
                  <span className="font-mono font-semibold">{id}</span>
                  {found && <span className="max-w-[200px] truncate">— {found.title}</span>}
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Teaching Progression */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-stone-900">Tiến trình tổ chức dạy học</h3>
          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-stone-100 text-stone-700">
                <tr>
                  <th className="p-3 font-semibold border-b border-stone-200 w-40">
                    Hoạt động / Thời lượng
                  </th>
                  <th className="p-3 font-semibold border-b border-stone-200">
                    Hoạt động của Giáo viên
                  </th>
                  <th className="p-3 font-semibold border-b border-stone-200">
                    Hoạt động của Học sinh
                  </th>
                  <th className="p-3 font-semibold border-b border-stone-200 w-36">
                    Hiện vật sử dụng
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {activeLesson.tienTrinh.map((step, idx) => (
                  <tr key={idx} className="align-top bg-white">
                    <td className="p-3 font-medium text-stone-900">
                      <p>{step.buoc}</p>
                      <p className="text-xs text-stone-500 mt-0.5 tabular-nums">{step.thoiLuong}</p>
                    </td>
                    <td className="p-3 text-stone-700 leading-relaxed">{step.hoatDongGiaoVien}</td>
                    <td className="p-3 text-stone-700 leading-relaxed">{step.hoatDongHocSinh}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        {step.hienVatSuDung.map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => onOpenArtifact(code)}
                            className="font-mono text-xs px-2 py-0.5 rounded border border-stone-300 bg-stone-50 text-[#0F4C5C] hover:border-[#0F4C5C] cursor-pointer"
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* AI Teacher Question Generator */}
      <section className="no-print rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 space-y-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#B45309]">
            <Sparkles className="w-4 h-4" />
            <span>Công cụ hỗ trợ giáo viên (Gemini AI)</span>
          </div>
          <h2 className="font-editorial text-xl font-semibold text-stone-900">
            Tạo thêm câu hỏi gợi mở / trắc nghiệm từ hồ sơ hiện vật
          </h2>
          <p className="text-sm text-stone-600">
            Chọn một hiện vật trong <code className="font-mono text-xs">tulieu.json</code> để hệ
            thống gợi ý thêm câu hỏi phù hợp học sinh tiểu học, sau đó có thể đưa vào Phiếu học
            tập.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2">
            <label htmlFor="ai-artifact" className="block text-xs font-medium text-stone-600 mb-1">
              Chọn hiện vật nguồn
            </label>
            <select
              id="ai-artifact"
              value={aiArtifactId}
              onChange={(e) => setAiArtifactId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
            >
              {artifacts.map((a) => (
                <option key={a.identifier} value={a.identifier}>
                  {a.identifier} — {a.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ai-qtype" className="block text-xs font-medium text-stone-600 mb-1">
              Hình thức câu hỏi
            </label>
            <select
              id="ai-qtype"
              value={aiQuestionType}
              onChange={(e) =>
                setAiQuestionType(e.target.value as 'trac-nghiem' | 'tu-luan' | 'ca-hai')
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
            >
              <option value="ca-hai">Trắc nghiệm & Tự luận</option>
              <option value="trac-nghiem">Chỉ trắc nghiệm</option>
              <option value="tu-luan">Chỉ tự luận gợi mở</option>
            </select>
          </div>

          <div>
            <label htmlFor="ai-grade" className="block text-xs font-medium text-stone-600 mb-1">
              Khối lớp
            </label>
            <select
              id="ai-grade"
              value={aiGradeLevel}
              onChange={(e) => setAiGradeLevel(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
            >
              <option value="Lớp 3">Lớp 3</option>
              <option value="Lớp 4">Lớp 4</option>
              <option value="Lớp 5">Lớp 5</option>
            </select>
          </div>
        </div>

        <div>
          <button
            type="button"
            disabled={aiLoading}
            onClick={handleGenerateAiQuestions}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0F4C5C] rounded-xl hover:bg-[#0B3B48] disabled:opacity-60 cursor-pointer"
          >
            {aiLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{aiLoading ? 'Đang tạo câu hỏi...' : 'Tạo câu hỏi đề xuất'}</span>
          </button>
        </div>

        {aiError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-2.5 text-sm text-red-900">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-700" />
            <span>{aiError}</span>
          </div>
        )}

        {aiGeneratedList.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Nội dung đề xuất bởi AI - Giáo viên cần kiểm tra trước khi sử dụng</span>
            </div>

            <div className="space-y-3">
              {aiGeneratedList.map((q) => {
                const alreadyAdded = extraQuestions.some((item) => item.id === q.id);
                return (
                  <div
                    key={q.id}
                    className="rounded-xl border border-stone-200 bg-[#FAF8F5] p-4 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-stone-600">
                        {q.loai === 'trac-nghiem' ? 'Trắc nghiệm' : 'Tự luận gợi mở'} · Mã:{' '}
                        <span className="font-mono font-semibold text-[#0F4C5C]">
                          {q.maHienVatLienQuan}
                        </span>
                      </span>
                      <button
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => handleAddQuestionToWorksheet(q)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#0F4C5C] text-[#0F4C5C] bg-white hover:bg-[#0F4C5C]/5 disabled:opacity-50 cursor-pointer"
                      >
                        {alreadyAdded ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã thêm vào phiếu</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Thêm vào Phiếu học tập</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm sm:text-base font-medium text-stone-900">{q.cauHoi}</p>
                    {q.luaChon && q.luaChon.length > 0 && (
                      <ul className="text-sm text-stone-700 space-y-1 pl-4">
                        {q.luaChon.map((opt, idx) => (
                          <li key={idx}>
                            {String.fromCharCode(65 + idx)}. {opt}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-stone-600 pt-1">
                      <span className="font-semibold">Đáp án / Gợi ý:</span> {q.dapAnGoiY}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Interactive Student Worksheet & Saved History */}
      <section className="print-worksheet rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#0F4C5C] uppercase tracking-wider">
              {activeLesson.tiet} · {activeLesson.khoiLop}
            </p>
            <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-stone-900">
              {activeLesson.phieuHocTap.tieuDe}
            </h2>
            <p className="text-sm text-stone-600">{activeLesson.phieuHocTap.huongDan}</p>
          </div>

          <div className="no-print flex flex-wrap items-center gap-2">
            <SpeechReaderControls
              sourceKey={`worksheet-${activeLesson.id}`}
              idleLabel="Nghe mô tả"
              segments={worksheetSpeechSegments}
            />
            <button
              type="button"
              onClick={() => setShowAnswerKeys((prev) => !prev)}
              className="px-3.5 py-2 text-xs sm:text-sm font-medium border border-stone-300 bg-white text-stone-800 rounded-lg hover:bg-stone-50 cursor-pointer whitespace-nowrap"
            >
              {showAnswerKeys ? 'Ẩn gợi ý đáp án' : 'Xem gợi ý đáp án'}
            </button>
            <button
              type="button"
              onClick={() =>
                exportWorksheetAsTxt(
                  activeLesson,
                  studentName,
                  studentClass,
                  answers,
                  extraQuestions
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium border border-stone-300 bg-white text-stone-800 rounded-lg hover:bg-stone-50 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Xuất phiếu (.txt)</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0F4C5C] rounded-lg hover:bg-[#0B3B48] cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>In phiếu học tập</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs: Làm phiếu học tập vs Danh sách bài đã làm trên máy này */}
        <div className="no-print flex flex-wrap items-center gap-2 p-1 bg-stone-100 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setWorksheetTab('form')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              worksheetTab === 'form'
                ? 'bg-white text-[#0F4C5C] shadow-sm'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Làm phiếu học tập</span>
          </button>
          <button
            type="button"
            onClick={() => setWorksheetTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
              worksheetTab === 'history'
                ? 'bg-white text-[#0F4C5C] shadow-sm'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Danh sách bài đã làm trên máy này ({submissions.length})</span>
          </button>
        </div>

        {worksheetTab === 'form' ? (
          <>
            {/* Student Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ws-name" className="block text-xs font-medium text-stone-600 mb-1">
                  Họ và tên học sinh
                </label>
                <input
                  id="ws-name"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Nhập họ và tên học sinh..."
                  className="w-full px-3.5 py-2 text-sm sm:text-base rounded-lg border border-stone-300 bg-[#FAF8F5] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                />
              </div>
              <div>
                <label htmlFor="ws-class" className="block text-xs font-medium text-stone-600 mb-1">
                  Lớp
                </label>
                <input
                  id="ws-class"
                  type="text"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  placeholder="Ví dụ: Lớp 4A..."
                  className="w-full px-3.5 py-2 text-sm sm:text-base rounded-lg border border-stone-300 bg-[#FAF8F5] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                />
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-5">
              {allWorksheetQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-stone-200 bg-[#FAF8F5] p-4 sm:p-5 space-y-3"
                >
                  {q.isAiGenerated && (
                    <p className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-300 rounded-md px-2.5 py-1 inline-block">
                      Nội dung đề xuất bởi AI - Giáo viên cần kiểm tra trước khi sử dụng
                    </p>
                  )}

                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-base font-semibold text-stone-900">
                      Câu {idx + 1}: {q.cauHoi}
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenArtifact(q.maHienVatLienQuan)}
                      className="no-print text-xs font-mono font-semibold text-[#0F4C5C] hover:underline shrink-0 cursor-pointer"
                    >
                      Tra cứu {q.maHienVatLienQuan}
                    </button>
                  </div>

                  {q.loai === 'trac-nghiem' && q.luaChon ? (
                    <div className="space-y-2 pt-1">
                      {q.luaChon.map((option, oIdx) => {
                        const checked = answers[q.id] === option;
                        return (
                          <label
                            key={oIdx}
                            className={`flex items-start gap-3 p-3 rounded-lg border text-sm sm:text-base cursor-pointer transition-colors ${
                              checked
                                ? 'bg-white border-[#0F4C5C] text-stone-900 font-medium'
                                : 'bg-white/70 border-stone-200 text-stone-800 hover:bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`ws-${q.id}`}
                              value={option}
                              checked={checked}
                              onChange={() =>
                                setAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: option,
                                }))
                              }
                              className="mt-1 accent-[#0F4C5C]"
                            />
                            <span>
                              <strong className="mr-1.5">{String.fromCharCode(65 + oIdx)}.</strong>
                              {option}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <textarea
                      rows={3}
                      value={answers[q.id] ?? ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                      placeholder="Em hãy viết câu trả lời của mình vào đây..."
                      className="w-full p-3 text-sm sm:text-base rounded-lg border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                    />
                  )}

                  {showAnswerKeys && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-sm text-emerald-950">
                      <span className="font-semibold">Đáp án / Gợi ý: </span>
                      {q.dapAnGoiY}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Submit & Save to localStorage Action */}
            <div className="no-print pt-2 space-y-3 border-t border-stone-200">
              {submitNotice && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-2.5 ${
                    submitNotice.type === 'success'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                      : 'border-amber-300 bg-amber-50 text-amber-950'
                  }`}
                >
                  {submitNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-700" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" />
                  )}
                  <span>{submitNotice.message}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-stone-500">
                  Bài làm tự động lưu nháp khi nhập và lưu kết quả vào bộ nhớ trình duyệt khi bấm nộp.
                </p>
                <button
                  type="button"
                  onClick={handleSubmitWorksheet}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0F4C5C] rounded-xl hover:bg-[#0B3B48] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Send className="w-4 h-4" />
                  <span>Nộp bài & Lưu kết quả</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Saved Submissions History View */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone-600 tabular-nums">
                Tổng cộng <strong className="text-stone-900">{submissions.length}</strong> bài làm
                đã lưu trên trình duyệt máy này.
              </p>

              {submissions.length > 0 && (
                <div className="flex items-center gap-2">
                  {confirmClearAll ? (
                    <>
                      <span className="text-xs font-medium text-red-700">
                        Xác nhận xóa tất cả?
                      </span>
                      <button
                        type="button"
                        onClick={handleClearAllSubmissions}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer"
                      >
                        Đồng ý xóa
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearAll(false)}
                        className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 cursor-pointer"
                      >
                        Hủy
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa toàn bộ lịch sử</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {submissions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 bg-[#FAF8F5] p-8 text-center space-y-2">
                <p className="text-base font-medium text-stone-800">
                  Chưa có bài làm nào được lưu trên máy này.
                </p>
                <p className="text-sm text-stone-600">
                  Khi học sinh điền tên, lớp và bấm &ldquo;Nộp bài & Lưu kết quả&rdquo;, bài làm sẽ
                  hiển thị tại đây để thầy cô xem lại.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => {
                  const isExpanded = expandedSubmissionId === sub.id;
                  return (
                    <div
                      key={sub.id}
                      className="rounded-xl border border-stone-200 bg-[#FAF8F5] p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-base font-semibold text-stone-900">
                            {sub.studentName}{' '}
                            <span className="text-sm font-medium text-[#0F4C5C]">
                              ({sub.studentClass})
                            </span>
                          </p>
                          <p className="text-xs text-stone-600 flex flex-wrap items-center gap-2 tabular-nums">
                            <span>{sub.tiet}</span>
                            <span aria-hidden="true">·</span>
                            <span>Nộp lúc: {sub.submittedAt}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-emerald-800">
                              Trắc nghiệm: {sub.mcCorrect}/{sub.mcTotal} đúng
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedSubmissionId(isExpanded ? null : sub.id)
                            }
                            className="px-3 py-1.5 text-xs font-semibold text-[#0F4C5C] bg-white border border-stone-300 rounded-lg hover:bg-stone-50 cursor-pointer"
                          >
                            {isExpanded ? 'Thu gọn bài làm' : 'Xem chi tiết bài làm'}
                          </button>
                          <button
                            type="button"
                            aria-label={`Xóa bài làm của ${sub.studentName}`}
                            onClick={() => handleDeleteSubmission(sub.id)}
                            className="p-1.5 text-stone-500 hover:text-red-700 bg-white border border-stone-200 rounded-lg hover:border-red-200 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-stone-200 pt-3 space-y-2.5">
                          {sub.items.map((ans, aIdx) => (
                            <div
                              key={ans.id}
                              className="rounded-lg bg-white border border-stone-200 p-3 text-sm space-y-1"
                            >
                              <p className="font-medium text-stone-900">
                                Câu {aIdx + 1} [{ans.maHienVatLienQuan}]: {ans.cauHoi}
                              </p>
                              <p className="text-stone-700">
                                <span className="font-semibold">Câu trả lời của học sinh: </span>
                                {ans.userAnswer || (
                                  <span className="italic text-stone-400">Chưa trả lời</span>
                                )}
                              </p>
                              {ans.loai === 'trac-nghiem' && (
                                <p
                                  className={`text-xs font-semibold ${
                                    ans.isCorrect ? 'text-emerald-700' : 'text-amber-800'
                                  }`}
                                >
                                  {ans.isCorrect ? 'Đúng' : `Chưa đúng (Đáp án: ${ans.dapAnGoiY})`}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
