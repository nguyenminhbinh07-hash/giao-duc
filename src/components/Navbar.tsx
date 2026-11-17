import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, Menu, X } from 'lucide-react';
import { HeritageDataset, ScreenId } from '../types/heritage';
import { exportAllAsCsv, exportAllAsJson } from '../utils/exportData';

interface NavbarProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  dataset: HeritageDataset | null;
}

const NAV_ITEMS: Array<{ id: ScreenId; label: string }> = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'library', label: 'Thư viện' },
  { id: 'lessons', label: 'Giáo án' },
  { id: 'assistant', label: 'Hỏi đáp' },
  { id: 'sources', label: 'Nguồn tư liệu' },
  { id: 'about', label: 'Giới thiệu' },
];

export function Navbar({ activeScreen, onNavigate, dataset }: NavbarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const effectiveActive = activeScreen === 'detail' ? 'library' : activeScreen;

  const handleNavClick = (id: ScreenId) => {
    onNavigate(id);
    setMobileMenuOpen(false);
    setExportOpen(false);
  };

  return (
    <header className="no-print sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="text-left font-editorial text-lg sm:text-xl font-bold tracking-tight text-[#0F4C5C] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F4C5C]"
        >
          Hiện vật số I03
        </button>

        {/* Zone 2: Clean Single-Line Text Navigation Links */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-stone-600"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = effectiveActive === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F4C5C] ${
                  isActive
                    ? 'text-[#0F4C5C] border-[#0F4C5C] font-semibold'
                    : 'border-transparent hover:text-stone-900 hover:border-stone-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action (Export Data) + Mobile Toggle */}
        <div className="flex items-center gap-2 shrink-0 relative">
          <button
            type="button"
            disabled={!dataset}
            onClick={() => setExportOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0F4C5C] rounded-lg hover:bg-[#0B3B48] transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F4C5C]"
          >
            <Download className="w-4 h-4" />
            <span>Xuất dữ liệu</span>
          </button>

          {exportOpen && dataset && (
            <div className="absolute right-0 top-12 w-64 rounded-xl border border-stone-200 bg-white shadow-lg p-2 z-50">
              <p className="px-3 py-1.5 text-xs font-medium text-stone-500">
                Xuất toàn bộ hiện vật & giáo án (kèm ngày)
              </p>
              <button
                type="button"
                onClick={() => {
                  exportAllAsJson(dataset);
                  setExportOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer text-left"
              >
                <FileJson className="w-4 h-4 text-[#0F4C5C] shrink-0" />
                <span>Tải tệp JSON (.json)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  exportAllAsCsv(dataset);
                  setExportOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#B45309] shrink-0" />
                <span>Tải bảng tính CSV (.csv)</span>
              </button>
            </div>
          )}

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Menu di động"
          className="lg:hidden border-t border-stone-200 bg-white px-4 py-3 space-y-1"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = effectiveActive === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#0F4C5C]/10 text-[#0F4C5C] font-semibold'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
