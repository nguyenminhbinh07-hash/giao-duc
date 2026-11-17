import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Building2, Layers, MessageSquareText, Search, ShieldCheck } from 'lucide-react';
import { HeritageDataset, ScreenId } from '../types/heritage';
import { VerificationBadge } from './VerificationBadge';

interface HomeScreenProps {
  dataset: HeritageDataset;
  onNavigate: (screen: ScreenId) => void;
  onSearchToLibrary: (query: string) => void;
  onSelectArtifact: (identifier: string) => void;
}

export function HomeScreen({
  dataset,
  onNavigate,
  onSearchToLibrary,
  onSelectArtifact,
}: HomeScreenProps) {
  const [quickQuery, setQuickQuery] = useState('');
  const { khoiTuLieu, hienVat, giaoAn, nguonThamKhao } = dataset;

  const quickMatches = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    if (!q) return [];
    return hienVat
      .filter(
        (item) =>
          item.identifier.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          item.subject.toLowerCase().includes(q) ||
          item.date.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [quickQuery, hienVat]);

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchToLibrary(quickQuery.trim());
  };

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* Hero Section */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-10 lg:p-12">
        <div className="max-w-3xl space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-[#0F4C5C]">
            <span>Mã đề tài: {khoiTuLieu.maDeTai}</span>
            <span aria-hidden="true">·</span>
            <span>Giáo dục Di sản Tiểu học</span>
            <span aria-hidden="true">·</span>
            <span>Chuẩn Dublin Core (15 trường lõi)</span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-semibold text-stone-900 leading-tight">
            {khoiTuLieu.tenUngDung}
          </h1>

          <p className="text-base sm:text-lg text-stone-700 leading-relaxed">
            <span className="font-semibold text-stone-900">Khối tư liệu:</span>{' '}
            {khoiTuLieu.tenKhoiTuLieu}
          </p>

          <p className="text-base text-stone-600 leading-relaxed">{khoiTuLieu.moTaTongQuan}</p>

          {/* Quick Search Bar */}
          <form onSubmit={handleSubmitSearch} className="pt-2">
            <label htmlFor="home-quick-search" className="sr-only">
              Tìm kiếm nhanh hiện vật, mã định danh hoặc chủ đề
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="home-quick-search"
                  type="search"
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  placeholder="Tìm nhanh theo mã (I03-01), tên hiện vật, loại hình, niên đại..."
                  className="w-full pl-11 pr-4 py-3 text-base rounded-xl border border-stone-300 bg-[#FAF8F5] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:border-[#0F4C5C]"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-[#0F4C5C] rounded-xl hover:bg-[#0B3B48] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Tìm trong thư viện</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Instant Search Preview */}
          {quickQuery.trim() !== '' && (
            <div className="rounded-xl border border-stone-200 bg-[#FAF8F5] p-4 space-y-2">
              <p className="text-xs font-semibold text-stone-500">
                Kết quả gợi ý nhanh ({quickMatches.length})
              </p>
              {quickMatches.length === 0 ? (
                <p className="text-sm text-stone-600">
                  Không có bản ghi nào khớp với từ khóa "{quickQuery}". Nhấn "Tìm trong thư viện" để
                  duyệt toàn bộ.
                </p>
              ) : (
                <ul className="divide-y divide-stone-200">
                  {quickMatches.map((item) => (
                    <li key={item.identifier} className="py-2 first:pt-0 last:pb-0">
                      <button
                        type="button"
                        onClick={() => onSelectArtifact(item.identifier)}
                        className="w-full flex items-center justify-between gap-3 text-left hover:text-[#0F4C5C] transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-semibold text-[#0F4C5C] mr-2">
                            {item.identifier}
                          </span>
                          <span className="text-sm font-medium text-stone-900 truncate">
                            {item.title}
                          </span>
                        </div>
                        <VerificationBadge status={item.mucKiemChung} compact />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Key Metrics Strip */}
      <section aria-label="Tổng quan số lượng tư liệu" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500">Hồ sơ hiện vật số</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums">
            {hienVat.length}
          </p>
          <p className="mt-1 text-xs text-stone-600">Đủ 15 trường Dublin Core</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500">Giáo án tích hợp</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums">
            {giaoAn.length} tiết
          </p>
          <p className="mt-1 text-xs text-stone-600">Kèm phiếu học tập tương tác</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500">Nguồn tham khảo</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums">
            {nguonThamKhao.length}
          </p>
          <p className="mt-1 text-xs text-stone-600">Đã phân loại nguồn chính thống</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500">Đối tượng sử dụng</p>
          <p className="mt-1 text-lg sm:text-xl font-bold text-[#0F4C5C]">Lớp 3 – Lớp 5</p>
          <p className="mt-1 text-xs text-stone-600">Giáo viên, học sinh & phụ huynh</p>
        </div>
      </section>

      {/* Holding Location & Publication Authorization */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F4C5C]">
              <Building2 className="w-4 h-4" />
              <span>Nơi lưu giữ hiện nay (Đơn vị hành chính hai cấp)</span>
            </div>
            <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-stone-900">
              {khoiTuLieu.noiLuuGiuChinh.tenNoiLuuGiu}
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm border-t border-stone-100">
              <div>
                <dt className="text-stone-500 text-xs">Xã / Phường hiện nay</dt>
                <dd className="font-medium text-stone-900 mt-0.5">
                  {khoiTuLieu.noiLuuGiuChinh.xaPhuong}
                </dd>
              </div>
              <div>
                <dt className="text-stone-500 text-xs">Tỉnh / Thành phố hiện nay</dt>
                <dd className="font-medium text-stone-900 mt-0.5">
                  {khoiTuLieu.noiLuuGiuChinh.tinhThanhPho}
                </dd>
              </div>
            </dl>
          </div>
          <p className="text-xs text-stone-500">
            Cập nhật cấu trúc dữ liệu mẫu: {khoiTuLieu.ngayCapNhatMau}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#B45309]">
              <ShieldCheck className="w-4 h-4" />
              <span>Thông tin người cho phép công bố</span>
            </div>
            <dl className="space-y-2.5 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-stone-100 pb-2">
                <dt className="text-stone-500">Họ tên đại diện</dt>
                <dd className="font-semibold text-stone-900 sm:text-right">
                  {khoiTuLieu.nguoiChoPhepCongBoChinh.hoTen}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-stone-100 pb-2">
                <dt className="text-stone-500">Vai trò / Chức vụ</dt>
                <dd className="font-medium text-stone-800 sm:text-right">
                  {khoiTuLieu.nguoiChoPhepCongBoChinh.vaiTro}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-stone-100 pb-2">
                <dt className="text-stone-500">Ngày đồng ý</dt>
                <dd className="font-medium text-stone-800 sm:text-right">
                  {khoiTuLieu.nguoiChoPhepCongBoChinh.ngayDongY}
                </dd>
              </div>
              <div>
                <dt className="text-stone-500">Phạm vi cho phép</dt>
                <dd className="text-stone-800 mt-1 leading-relaxed">
                  {khoiTuLieu.nguoiChoPhepCongBoChinh.phamVi}
                </dd>
              </div>
            </dl>
          </div>
          <div>
            <button
              type="button"
              onClick={() => onNavigate('sources')}
              className="text-sm font-semibold text-[#0F4C5C] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Xem mục Nguồn tư liệu & Ghi nhận chi tiết</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Primary Feature Pathways */}
      <section className="space-y-4">
        <h2 className="font-editorial text-2xl font-semibold text-stone-900">
          Khám phá không gian học tập
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            type="button"
            onClick={() => onNavigate('library')}
            className="text-left rounded-2xl border border-stone-200 bg-white p-6 hover:border-[#0F4C5C] transition-colors flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div className="space-y-2.5">
              <Layers className="w-6 h-6 text-[#0F4C5C]" />
              <h3 className="text-lg font-semibold text-stone-900">Thư viện hiện vật số</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Tra cứu {hienVat.length} hồ sơ hiện vật với bộ lọc theo loại hình, niên đại, loại
                bản hiển thị và tình trạng bản gốc.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F4C5C]">
              <span>Mở thư viện</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('lessons')}
            className="text-left rounded-2xl border border-stone-200 bg-white p-6 hover:border-[#0F4C5C] transition-colors flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div className="space-y-2.5">
              <BookOpen className="w-6 h-6 text-[#B45309]" />
              <h3 className="text-lg font-semibold text-stone-900">Giáo án & Phiếu học tập</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Giáo án chi tiết từng tiết học gắn với hiện vật số, phiếu học tập trực tuyến có thể
                in và gợi ý câu hỏi từ AI.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F4C5C]">
              <span>Xem giáo án</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('assistant')}
            className="text-left rounded-2xl border border-stone-200 bg-white p-6 hover:border-[#0F4C5C] transition-colors flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div className="space-y-2.5">
              <MessageSquareText className="w-6 h-6 text-[#0F4C5C]" />
              <h3 className="text-lg font-semibold text-stone-900">Trợ lý hỏi đáp di sản</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Hỏi đáp nhanh về tư liệu và bài học. Mọi câu trả lời đều bám sát dữ liệu trong
                tulieu.json và trích dẫn mã rõ ràng.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F4C5C]">
              <span>Đặt câu hỏi</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
