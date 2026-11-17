import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { VerificationStatus } from '../types/heritage';

interface VerificationBadgeProps {
  status: VerificationStatus;
  compact?: boolean;
}

export function VerificationBadge({ status, compact = false }: VerificationBadgeProps) {
  if (status === 'Đã kiểm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-900 font-medium whitespace-nowrap shrink-0 ${
          compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
        }`}
        title="Nội dung đã được kiểm chứng"
      >
        <CheckCircle2 className={compact ? 'w-3.5 h-3.5 text-emerald-700' : 'w-4 h-4 text-emerald-700'} />
        <span>Đã kiểm</span>
      </span>
    );
  }

  if (status === 'Chưa kiểm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border border-amber-400 bg-amber-50 text-amber-950 font-semibold whitespace-nowrap shrink-0 ${
          compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
        }`}
        title="Cảnh báo: Phần phiên âm / dịch nghĩa hoặc thông tin chưa được kiểm chứng"
      >
        <AlertTriangle className={compact ? 'w-3.5 h-3.5 text-amber-700' : 'w-4 h-4 text-amber-700'} />
        <span>Chưa kiểm</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-stone-100 text-stone-800 font-medium whitespace-nowrap shrink-0 ${
        compact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      }`}
      title="Tư liệu bị mờ hoặc hư hại, hiện chưa đọc được"
    >
      <HelpCircle className={compact ? 'w-3.5 h-3.5 text-stone-600' : 'w-4 h-4 text-stone-600'} />
      <span>Chưa đọc được</span>
    </span>
  );
}
