import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, HelpCircle, MessageSquare } from 'lucide-react';
import { ArtifactRecord } from '../types/heritage';
import { ArtifactImageViewer } from './ArtifactImageViewer';
import { SpeechReaderControls } from './SpeechReaderControls';
import { VerificationBadge } from './VerificationBadge';

interface ArtifactDetailScreenProps {
  artifact: ArtifactRecord;
  allArtifacts: ArtifactRecord[];
  onBack: () => void;
  onSelectArtifact: (identifier: string) => void;
  onAskAboutArtifact: (identifier: string) => void;
}

export function ArtifactDetailScreen({
  artifact,
  allArtifacts,
  onBack,
  onSelectArtifact,
  onAskAboutArtifact,
}: ArtifactDetailScreenProps) {
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});

  const currentIndex = allArtifacts.findIndex((a) => a.identifier === artifact.identifier);
  const prevItem = currentIndex > 0 ? allArtifacts[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < allArtifacts.length - 1
      ? allArtifacts[currentIndex + 1]
      : null;

  const dublinCoreRows: Array<{ label: string; dcName: string; value: string }> = [
    { label: 'Tiêu đề', dcName: 'Title', value: artifact.title },
    { label: 'Tác giả / Người tạo', dcName: 'Creator', value: artifact.creator },
    { label: 'Chủ đề', dcName: 'Subject', value: artifact.subject },
    { label: 'Mô tả', dcName: 'Description', value: artifact.description },
    { label: 'Đơn vị công bố', dcName: 'Publisher', value: artifact.publisher },
    { label: 'Người đóng góp', dcName: 'Contributor', value: artifact.contributor },
    { label: 'Niên đại / Thời gian', dcName: 'Date', value: artifact.date },
    { label: 'Loại hình', dcName: 'Type', value: artifact.type },
    { label: 'Định dạng / Chất liệu & Kích thước', dcName: 'Format', value: artifact.format },
    { label: 'Mã định danh', dcName: 'Identifier', value: artifact.identifier },
    { label: 'Nguồn gốc tư liệu', dcName: 'Source', value: artifact.source },
    { label: 'Ngôn ngữ', dcName: 'Language', value: artifact.language },
    { label: 'Tài liệu / Bài học liên quan', dcName: 'Relation', value: artifact.relation },
    { label: 'Phạm vi không gian / thời gian', dcName: 'Coverage', value: artifact.coverage },
    { label: 'Quyền sử dụng', dcName: 'Rights', value: artifact.rights },
  ];

  return (
    <div className="space-y-8">
      {/* Navigation Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại thư viện</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!prevItem}
            onClick={() => {
              if (prevItem) {
                setRevealedHints({});
                onSelectArtifact(prevItem.identifier);
              }
            }}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Trước</span>
          </button>
          <button
            type="button"
            disabled={!nextItem}
            onClick={() => {
              if (nextItem) {
                setRevealedHints({});
                onSelectArtifact(nextItem.identifier);
              }
            }}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
          >
            <span>Tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title & Status Header */}
      <header className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
            <span className="font-mono font-semibold text-[#0F4C5C]">{artifact.identifier}</span>
            <span aria-hidden="true">·</span>
            <span>{artifact.type}</span>
            <span aria-hidden="true">·</span>
            <span>{artifact.loaiBanHienThi}</span>
            <span aria-hidden="true">·</span>
            <span>Số đăng ký: {artifact.soDangKyHoacThamKhao}</span>
          </div>
          <VerificationBadge status={artifact.mucKiemChung} />
        </div>

        <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-stone-900 leading-snug">
          {artifact.title}
        </h1>

        <p className="text-base text-stone-700 leading-relaxed max-w-3xl">{artifact.description}</p>

        <div className="pt-1 flex flex-wrap items-center gap-3">
          <SpeechReaderControls
            sourceKey={artifact.identifier}
            idleLabel="Nghe mô tả"
            segments={[
              `Hiện vật mã ${artifact.identifier}. ${artifact.title}.`,
              `Mô tả hiện vật: ${artifact.description}`,
              ...(artifact.cauHoiGoiMo.length > 0
                ? [
                    'Câu hỏi gợi mở cho học sinh.',
                    ...artifact.cauHoiGoiMo.map(
                      (q, idx) => `Câu ${idx + 1}: ${q.cauHoi}`
                    ),
                  ]
                : []),
            ]}
          />
          <button
            type="button"
            onClick={() => onAskAboutArtifact(artifact.identifier)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#0F4C5C] bg-[#0F4C5C]/8 border border-[#0F4C5C]/20 rounded-lg hover:bg-[#0F4C5C]/15 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Hỏi Trợ lý AI về hiện vật {artifact.identifier}</span>
          </button>
        </div>
      </header>

      {/* Panoramic & Close-up Viewer */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 space-y-4">
        <h2 className="font-editorial text-xl font-semibold text-stone-900">
          Hình ảnh toàn cảnh & cận cảnh
        </h2>
        <ArtifactImageViewer artifact={artifact} mode="full" />
      </section>

      {/* Transcription / Translation Warning Block (if present) */}
      {artifact.phienAmDichNghia && artifact.phienAmDichNghia.trim() !== '' && (
        <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-editorial text-xl font-semibold text-stone-900">
              Phần phiên âm / dịch nghĩa tư liệu
            </h2>
            <VerificationBadge status={artifact.mucKiemChung} />
          </div>
          <p className="text-base text-stone-800 leading-relaxed bg-[#FAF8F5] border border-stone-200 rounded-xl p-4">
            {artifact.phienAmDichNghia}
          </p>
          {artifact.mucKiemChung === 'Chưa kiểm' && (
            <p className="text-sm text-amber-900 font-medium">
              Lưu ý cho giáo viên: Phần phiên âm/dịch nghĩa này đang ở trạng thái "Chưa kiểm", cần
              đối chiếu chuyên môn trước khi giảng dạy chính thức.
            </p>
          )}
        </section>
      )}

      {/* Extended Conservation, Location & Rights Fields */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 space-y-5">
        <h2 className="font-editorial text-xl font-semibold text-stone-900">
          Thông tin lưu giữ, bảo quản & quyền công bố
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div className="border-b border-stone-100 pb-3">
            <dt className="text-xs font-medium text-stone-500">
              Nơi lưu giữ hiện nay (Đơn vị hành chính hai cấp)
            </dt>
            <dd className="mt-1 font-medium text-stone-900">
              {artifact.noiLuuGiuHienNay.tenNoiLuuGiu} — {artifact.noiLuuGiuHienNay.xaPhuong},{' '}
              {artifact.noiLuuGiuHienNay.tinhThanhPho}
            </dd>
          </div>
          <div className="border-b border-stone-100 pb-3">
            <dt className="text-xs font-medium text-stone-500">
              Nơi lưu giữ tại thời điểm tư liệu (Địa danh cũ)
            </dt>
            <dd className="mt-1 text-stone-800">{artifact.noiLuuGiuTaiThoiDiemTuLieu || 'Không có'}</dd>
          </div>
          <div className="border-b border-stone-100 pb-3">
            <dt className="text-xs font-medium text-stone-500">Loại bản đang hiển thị</dt>
            <dd className="mt-1 font-medium text-stone-900">{artifact.loaiBanHienThi}</dd>
          </div>
          <div className="border-b border-stone-100 pb-3">
            <dt className="text-xs font-medium text-stone-500">Tình trạng bản gốc</dt>
            <dd className="mt-1 text-stone-800">
              <span className="font-semibold text-stone-900">{artifact.tinhTrangBanGoc.mucDo}:</span>{' '}
              {artifact.tinhTrangBanGoc.moTaNgan}
            </dd>
          </div>
          <div className="border-b border-stone-100 pb-3">
            <dt className="text-xs font-medium text-stone-500">Số đăng ký hoặc số tham khảo</dt>
            <dd className="mt-1 font-mono text-stone-900">{artifact.soDangKyHoacThamKhao}</dd>
          </div>
          <div className="border-b border-stone-100 pb-3">
            <dt className="text-xs font-medium text-stone-500">Người cho phép công bố</dt>
            <dd className="mt-1 text-stone-800">
              {artifact.nguoiChoPhepCongBo.hoTen
                ? `${artifact.nguoiChoPhepCongBo.hoTen} (${artifact.nguoiChoPhepCongBo.vaiTro}) · Đồng ý ngày ${artifact.nguoiChoPhepCongBo.ngayDongY}`
                : 'Chưa có thông tin xác nhận công bố'}
            </dd>
          </div>
          <div className="border-b border-stone-100 pb-3">
            <dt className="text-xs font-medium text-stone-500">Phạm vi được phép</dt>
            <dd className="mt-1 text-stone-800">{artifact.phamViDuocPhep}</dd>
          </div>
          <div className="border-b border-stone-100 pb-3">
            <dt className="text-xs font-medium text-stone-500">Phần không công bố</dt>
            <dd className="mt-1 text-stone-800">{artifact.phanKhongCongBo}</dd>
          </div>
        </dl>
      </section>

      {/* 15 Core Dublin Core Fields */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-editorial text-xl font-semibold text-stone-900">
            Hồ sơ 15 trường lõi chuẩn Dublin Core (ISO 15836)
          </h2>
          <span className="text-xs text-stone-500">Đọc trực tiếp từ tulieu.json</span>
        </div>

        <dl className="divide-y divide-stone-100 text-sm">
          {dublinCoreRows.map((row, idx) => (
            <div
              key={row.dcName}
              className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-6 items-start"
            >
              <dt className="text-stone-600 font-medium">
                <span className="font-mono text-xs text-stone-400 mr-2 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                {row.label}{' '}
                <span className="font-mono text-xs text-stone-400">({row.dcName})</span>
              </dt>
              <dd className="sm:col-span-2 text-stone-900 leading-relaxed">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Open-ended Questions for Primary Students */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#B45309]" />
          <h2 className="font-editorial text-xl font-semibold text-stone-900">
            Câu hỏi gợi mở dành cho học sinh tiểu học
          </h2>
        </div>

        {artifact.cauHoiGoiMo.length === 0 ? (
          <p className="text-sm text-stone-600">Chưa có câu hỏi gợi mở cho bản ghi này.</p>
        ) : (
          <div className="space-y-4">
            {artifact.cauHoiGoiMo.map((q, idx) => {
              const isOpen = Boolean(revealedHints[idx]);
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-stone-200 bg-[#FAF8F5] p-4 sm:p-5 space-y-3"
                >
                  <p className="text-base font-medium text-stone-900">
                    <span className="font-semibold text-[#0F4C5C] mr-1.5">Câu {idx + 1}:</span>
                    {q.cauHoi}
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedHints((prev) => ({ ...prev, [idx]: !prev[idx] }))
                      }
                      className="text-xs sm:text-sm font-semibold text-[#0F4C5C] hover:underline cursor-pointer"
                    >
                      {isOpen ? 'Ẩn gợi ý trả lời' : 'Xem gợi ý trả lời'}
                    </button>
                    {isOpen && (
                      <p className="mt-2 text-sm text-stone-700 bg-white border border-stone-200 rounded-lg p-3 leading-relaxed">
                        {q.goiYTraLoi}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
