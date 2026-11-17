import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Square, Volume2 } from 'lucide-react';

interface SpeechReaderControlsProps {
  segments: string[];
  idleLabel?: string;
  sourceKey: string;
}

type SpeechState = 'idle' | 'playing' | 'paused';

function selectVietnameseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const exactViVn = voices.find((v) => v.lang.toLowerCase() === 'vi-vn');
  if (exactViVn) return exactViVn;
  const anyVi = voices.find((v) => v.lang.toLowerCase().startsWith('vi'));
  return anyVi ?? null;
}

export function SpeechReaderControls({
  segments,
  idleLabel = 'Nghe mô tả',
  sourceKey,
}: SpeechReaderControlsProps) {
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const activeRunIdRef = useRef(0);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!isSupported) return;
    const synth = window.speechSynthesis;

    const loadVoices = () => {
      setVoices(synth.getVoices());
    };
    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);
    return () => {
      synth.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported]);

  const stopReading = () => {
    activeRunIdRef.current += 1;
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    setSpeechState('idle');
  };

  // Stop speech when switching artifacts or lessons, or on unmount
  useEffect(() => {
    stopReading();
    setStatusMessage(null);
    return () => {
      activeRunIdRef.current += 1;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [sourceKey]);

  const speakQueue = (queue: string[], runId: number, idx: number) => {
    if (!isSupported || activeRunIdRef.current !== runId) return;
    if (idx >= queue.length) {
      setSpeechState('idle');
      return;
    }

    const text = queue[idx].trim();
    if (!text) {
      speakQueue(queue, runId, idx + 1);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.94;
    utterance.pitch = 1;

    const currentVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    const viVoice = selectVietnameseVoice(currentVoices);
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.onend = () => {
      if (activeRunIdRef.current === runId) {
        speakQueue(queue, runId, idx + 1);
      }
    };

    utterance.onerror = () => {
      if (activeRunIdRef.current === runId) {
        setSpeechState('idle');
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlayOrResume = () => {
    if (!isSupported) {
      setStatusMessage('Trình duyệt hiện tại chưa hỗ trợ đọc giọng nói (Web Speech API).');
      return;
    }

    const synth = window.speechSynthesis;
    if (speechState === 'paused') {
      synth.resume();
      setSpeechState('playing');
      return;
    }

    const cleanSegments = segments.map((s) => s.trim()).filter(Boolean);
    if (cleanSegments.length === 0) {
      setStatusMessage('Chưa có nội dung văn bản để đọc.');
      return;
    }

    setStatusMessage(null);
    synth.cancel();
    const nextRunId = activeRunIdRef.current + 1;
    activeRunIdRef.current = nextRunId;
    setSpeechState('playing');
    speakQueue(cleanSegments, nextRunId, 0);
  };

  const handlePause = () => {
    if (!isSupported) return;
    if (speechState === 'playing') {
      window.speechSynthesis.pause();
      setSpeechState('paused');
    } else if (speechState === 'paused') {
      window.speechSynthesis.resume();
      setSpeechState('playing');
    }
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      {speechState === 'idle' ? (
        <button
          type="button"
          onClick={handlePlayOrResume}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#B45309] bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100/80 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Volume2 className="w-4 h-4" />
          <span>{idleLabel}</span>
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={handlePause}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-[#B45309] bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100/80 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {speechState === 'paused' ? (
              <>
                <Play className="w-4 h-4" />
                <span>Tiếp tục đọc</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                <span>Tạm dừng</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={stopReading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-stone-800 bg-stone-100 border border-stone-300 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Dừng đọc</span>
          </button>
        </>
      )}

      {statusMessage && (
        <span className="text-xs text-amber-900 font-medium">{statusMessage}</span>
      )}
    </div>
  );
}
