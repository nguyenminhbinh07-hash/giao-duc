/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import tulieuStatic from '../tulieu.json';
import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { AboutScreen } from './components/AboutScreen';
import { ArtifactDetailScreen } from './components/ArtifactDetailScreen';
import { HeritageAssistantScreen } from './components/HeritageAssistantScreen';
import { HomeScreen } from './components/HomeScreen';
import { LessonWorksheetScreen } from './components/LessonWorksheetScreen';
import { LibraryScreen } from './components/LibraryScreen';
import { Navbar } from './components/Navbar';
import { SourcesCreditsScreen } from './components/SourcesCreditsScreen';
import { HeritageDataset, ScreenId } from './types/heritage';

export default function App() {
  const [dataset, setDataset] = useState<HeritageDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeScreen, setActiveScreen] = useState<ScreenId>('home');
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>('');
  const [librarySearchQuery, setLibrarySearchQuery] = useState<string>('');
  const [assistantPrefillCode, setAssistantPrefillCode] = useState<string | undefined>(undefined);

const fetchDataset = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/tulieu');
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error('Không thể tải dữ liệu từ /api/tulieu');
      }
      const data = (await response.json()) as HeritageDataset;
      setDataset(data);
    } catch {
      // Tự động nạp trực tiếp từ tulieu.json khi triển khai web tĩnh trên Vercel
      setDataset(tulieuStatic as unknown as HeritageDataset);
      setLoadError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, []);

  const navigateTo = (screen: ScreenId) => {
    setActiveScreen(screen);
    if (screen !== 'assistant') {
      setAssistantPrefillCode(undefined);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenArtifact = (identifier: string) => {
    setSelectedArtifactId(identifier);
    setActiveScreen('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchToLibrary = (query: string) => {
    setLibrarySearchQuery(query);
    setActiveScreen('library');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskAboutArtifact = (identifier: string) => {
    setAssistantPrefillCode(identifier);
    setActiveScreen('assistant');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedArtifact =
    dataset?.hienVat.find((item) => item.identifier === selectedArtifactId) ??
    dataset?.hienVat[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917]">
      <Navbar activeScreen={activeScreen} onNavigate={navigateTo} dataset={dataset} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {loading ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#0F4C5C]" />
            <p className="text-base font-medium text-stone-700">
              Đang tải dữ liệu tư liệu và giáo án từ tulieu.json...
            </p>
          </div>
        ) : loadError || !dataset ? (
          <div className="rounded-2xl border border-red-200 bg-white p-10 flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-stone-900">Không thể tải dữ liệu</p>
              <p className="text-sm text-stone-600">{loadError}</p>
            </div>
            <button
              type="button"
              onClick={fetchDataset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0F4C5C] rounded-lg hover:bg-[#0B3B48] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử tải lại</span>
            </button>
          </div>
        ) : (
          <>
            {activeScreen === 'home' && (
              <HomeScreen
                dataset={dataset}
                onNavigate={navigateTo}
                onSearchToLibrary={handleSearchToLibrary}
                onSelectArtifact={handleOpenArtifact}
              />
            )}

            {activeScreen === 'library' && (
              <LibraryScreen
                key={librarySearchQuery}
                artifacts={dataset.hienVat}
                initialSearch={librarySearchQuery}
                onSelectArtifact={handleOpenArtifact}
              />
            )}

            {activeScreen === 'detail' && selectedArtifact && (
              <ArtifactDetailScreen
                artifact={selectedArtifact}
                allArtifacts={dataset.hienVat}
                onBack={() => navigateTo('library')}
                onSelectArtifact={handleOpenArtifact}
                onAskAboutArtifact={handleAskAboutArtifact}
              />
            )}

            {activeScreen === 'lessons' && (
              <LessonWorksheetScreen
                lessons={dataset.giaoAn}
                artifacts={dataset.hienVat}
                onOpenArtifact={handleOpenArtifact}
              />
            )}

            {activeScreen === 'assistant' && (
              <HeritageAssistantScreen
                key={assistantPrefillCode ?? 'default-chat'}
                initialArtifactCode={assistantPrefillCode}
              />
            )}

            {activeScreen === 'sources' && <SourcesCreditsScreen dataset={dataset} />}

            {activeScreen === 'about' && <AboutScreen />}
          </>
        )}
      </main>

      <footer className="no-print border-t border-stone-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs sm:text-sm text-stone-600">
          <div className="space-y-1">
            <p className="font-semibold text-stone-900">
              Giáo án dùng hiện vật số cho tiểu học · Mã đề tài: I03
            </p>
            <p>Dự án giáo dục di sản địa phương phi lợi nhuận, không kinh doanh, không quảng cáo.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => navigateTo('sources')}
              className="hover:text-[#0F4C5C] hover:underline cursor-pointer"
            >
              Nguồn tư liệu & Ghi nhận
            </button>
            <button
              type="button"
              onClick={() => navigateTo('about')}
              className="hover:text-[#0F4C5C] hover:underline cursor-pointer"
            >
              Giới thiệu tác giả
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
