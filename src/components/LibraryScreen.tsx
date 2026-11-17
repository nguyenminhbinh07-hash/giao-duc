import { useMemo, useState } from 'react';
import { ArrowRight, RotateCcw, Search } from 'lucide-react';
import { ArtifactRecord } from '../types/heritage';
import { ArtifactImageViewer } from './ArtifactImageViewer';
import { VerificationBadge } from './VerificationBadge';

interface LibraryScreenProps {
  artifacts: ArtifactRecord[];
  initialSearch?: string;
  onSelectArtifact: (identifier: string) => void;
}

export function LibraryScreen({
  artifacts,
  initialSearch = '',
  onSelectArtifact,
}: LibraryScreenProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [copyTypeFilter, setCopyTypeFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');

  const typeOptions = useMemo(
    () => Array.from(new Set(artifacts.map((a) => a.type))),
    [artifacts]
  );
  const dateOptions = useMemo(
    () => Array.from(new Set(artifacts.map((a) => a.date))),
    [artifacts]
  );
  const copyTypeOptions = ['Bản gốc', 'Bản sao', 'Bản số của gốc', 'Bản số của sao'];
  const conditionOptions = ['Tốt', 'Hư hại nhẹ', 'Hư hại nặng', 'Không rõ'];

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return artifacts.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (dateFilter !== 'all' && item.date !== dateFilter) return false;
      if (copyTypeFilter !== 'all' && item.loaiBanHienThi !== copyTypeFilter) return false;
      if (conditionFilter !== 'all' && item.tinhTrangBanGoc.mucDo !== conditionFilter)
        return false;

      if (!q) return true;
      return (
        item.identifier.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.date.toLowerCase().includes(q)
      );
    });
  }, [artifacts, searchTerm, typeFilter, dateFilter, copyTypeFilter, conditionFilter]);

  const hasActiveFilter =
    searchTerm !== '' ||
    typeFilter !== 'all' ||
    dateFilter !== 'all' ||
    copyTypeFilter !== 'all' ||
    conditionFilter !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setDateFilter('all');
    setCopyTypeFilter('all');
    setConditionFilter('all');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-stone-900">
          Thư viện hiện vật số
        </h1>
        <p className="text-base text-stone-600">
          Danh mục {artifacts.length} bản ghi chuẩn Dublin Core phục vụ trình chiếu trên lớp và tự
          học tại nhà.
        </p>
      </div>

      {/* Search & 4 Required Filters */}
      <section
        aria-label="Bộ lọc thư viện hiện vật"
        className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6 space-y-4"
      >
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã định danh, tên hiện vật, chủ đề, mô tả..."
              aria-label="Tìm kiếm hiện vật"
              className="w-full pl-10 pr-4 py-2.5 text-sm sm:text-base rounded-xl border border-stone-300 bg-[#FAF8F5] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
            />
          </div>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="filter-type" className="block text-xs font-medium text-stone-600 mb-1">
              Loại hình
            </label>
            <select
              id="filter-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
            >
              <option value="all">Tất cả loại hình ({typeOptions.length})</option>
              {typeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-date" className="block text-xs font-medium text-stone-600 mb-1">
              Niên đại
            </label>
            <select
              id="filter-date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
            >
              <option value="all">Tất cả niên đại</option>
              {dateOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-copy-type"
              className="block text-xs font-medium text-stone-600 mb-1"
            >
              Loại bản đang hiển thị
            </label>
            <select
              id="filter-copy-type"
              value={copyTypeFilter}
              onChange={(e) => setCopyTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
            >
              <option value="all">Tất cả loại bản</option>
              {copyTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-condition"
              className="block text-xs font-medium text-stone-600 mb-1"
            >
              Tình trạng bản gốc
            </label>
            <select
              id="filter-condition"
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
            >
              <option value="all">Tất cả tình trạng</option>
              {conditionOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-stone-600 tabular-nums">
          Đang hiển thị <span className="font-semibold text-stone-900">{filtered.length}</span> /{' '}
          {artifacts.length} hiện vật trong thư viện.
        </p>
      </section>

      {/* Artifact Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center space-y-3">
          <p className="text-base font-semibold text-stone-900">
            Không tìm thấy hiện vật phù hợp với bộ lọc hiện tại.
          </p>
          <p className="text-sm text-stone-600">
            Vui lòng thử từ khóa khác hoặc đặt lại bộ lọc để xem toàn bộ {artifacts.length} bản ghi.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0F4C5C] rounded-lg hover:bg-[#0B3B48] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Hiển thị tất cả</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <article
              key={item.identifier}
              className="rounded-2xl border border-stone-200 bg-white p-5 flex flex-col justify-between gap-4 hover:border-[#0F4C5C]/60 transition-colors"
            >
              <div className="space-y-3.5">
                <ArtifactImageViewer artifact={item} mode="compact" />

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="font-mono text-xs font-semibold text-[#0F4C5C] tabular-nums">
                    {item.identifier}
                  </span>
                  <VerificationBadge status={item.mucKiemChung} compact />
                </div>

                <h2 className="text-base sm:text-lg font-semibold text-stone-900 leading-snug">
                  {item.title}
                </h2>

                <div className="text-xs text-stone-600 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>{item.type}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.loaiBanHienThi}</span>
                  <span aria-hidden="true">·</span>
                  <span>Tình trạng: {item.tinhTrangBanGoc.mucDo}</span>
                </div>

                <p className="text-xs text-stone-500">Niên đại: {item.date}</p>

                <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <span className="text-xs text-stone-500 truncate">
                  {item.noiLuuGiuHienNay.tinhThanhPho}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectArtifact(item.identifier)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F4C5C] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Xem chi tiết</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
