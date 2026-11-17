import React, { useState } from 'react';
import { AlertCircle, Loader2, Send, ShieldCheck } from 'lucide-react';
import tulieuRaw from '../../tulieu.json';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface HeritageAssistantScreenProps {
  initialArtifactCode?: string;
}

const SAMPLE_PROMPTS = [
  'Trống đồng Ngọc Lũ (mã I03-00001) có chất liệu, hoa văn và nơi lưu giữ hiện nay như thế nào?',
  'Giới thiệu các hiện vật tiêu biểu tại tỉnh Bắc Ninh (I03-00005, I03-00006, I03-00010, I03-00011).',
  'Tiết 1 trong giáo án sử dụng những mã hiện vật nào và có mục tiêu gì?',
  'Tóm tắt thông tin về Xe tăng T-54B số hiệu 843 (mã I03-00015) và nơi lưu giữ.',
];

function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

function formatArtifactReply(item: any): string {
  const noiLuuGiu = item.noiLuuGiuHienNay
    ? `${item.noiLuuGiuHienNay.tenNoiLuuGiu} (${item.noiLuuGiuHienNay.xaPhuong}, ${item.noiLuuGiuHienNay.tinhThanhPho})`
    : 'Đang cập nhật';

  const lines = [
    `• Tên hiện vật: ${item.title}`,
    `• Mã định danh: ${item.identifier} | Mức kiểm chứng: ${item.mucKiemChung || 'Đã kiểm'}`,
    `• Loại bản đang hiển thị: ${item.loaiBanHienThi || 'Bản số của gốc'}`,
    `• Loại hình & Niên đại: ${item.type} — ${item.date}`,
    `• Chất liệu / Quy cách: ${item.format}`,
    `• Nơi lưu giữ hiện nay: ${noiLuuGiu}`,
    `• Mô tả tư liệu: ${item.description}`,
  ];

  if (item.phienAmDichNghia && item.phienAmDichNghia.trim()) {
    lines.push(`• Phiên âm / Dịch nghĩa: ${item.phienAmDichNghia}`);
  }

  lines.push(`• Nguồn tư liệu: ${item.source}`);
  return lines.join('\n');
}

function searchLocalTulieu(question: string): string {
  const data = tulieuRaw as any;
  const hienVatList: any[] = Array.isArray(data?.hienVat) ? data.hienVat : [];
  const giaoAnList: any[] = Array.isArray(data?.giaoAn) ? data.giaoAn : [];

  const qRaw = question.toLowerCase().trim();
  const qNorm = normalizeText(question);

  // 1. Kiểm tra nếu người dùng hỏi cụ thể theo mã định danh (ví dụ I03-00001 hoặc I03-01)
  const codeMatches = qRaw.match(/i03-\d{1,5}/g);
  if (codeMatches && codeMatches.length > 0) {
    const normalizedCodes = codeMatches.map((code) => {
      const numPart = code.replace('i03-', '');
      return `I03-${numPart.padStart(5, '0')}`;
    });

    const matchedByCode = hienVatList.filter((item) =>
      normalizedCodes.includes(String(item.identifier).toUpperCase())
    );

    if (matchedByCode.length > 0) {
      return matchedByCode.map(formatArtifactReply).join('\n\n────────────────────\n\n');
    }
  }

  // 2. Kiểm tra câu hỏi về Giáo án / Tiết học / Phiếu học tập
  const isLessonQuery =
    qNorm.includes('giao an') ||
    qNorm.includes('tiet 1') ||
    qNorm.includes('tiet 2') ||
    qNorm.includes('tiet 3') ||
    qNorm.includes('ga-01') ||
    qNorm.includes('ga-02') ||
    qNorm.includes('ga-03') ||
    qNorm.includes('phieu hoc tap');

  if (isLessonQuery && giaoAnList.length > 0) {
    let targetLessons = giaoAnList;
    if (qNorm.includes('tiet 1') || qNorm.includes('ga-01')) {
      targetLessons = giaoAnList.filter((g) => g.id === 'GA-01');
    } else if (qNorm.includes('tiet 2') || qNorm.includes('ga-02')) {
      targetLessons = giaoAnList.filter((g) => g.id === 'GA-02');
    } else if (qNorm.includes('tiet 3') || qNorm.includes('ga-03')) {
      targetLessons = giaoAnList.filter((g) => g.id === 'GA-03');
    }

    return targetLessons
      .map((ga) => {
        const codes = Array.isArray(ga.hienVatTichHop) ? ga.hienVatTichHop : [];
        const artifactNames = codes
          .map((code: string) => {
            const found = hienVatList.find((h) => h.identifier === code);
            return found
              ? `${code} (${found.title} — Lưu giữ: ${found.noiLuuGiuHienNay?.tenNoiLuuGiu}, Loại bản: ${found.loaiBanHienThi})`
              : code;
          })
          .join('\n  + ');

        const kienThuc = Array.isArray(ga.mucTieu?.kienThuc)
          ? ga.mucTieu.kienThuc.join(' ')
          : '';

        return [
          `📘 ${ga.tiet} (${ga.id}): ${ga.tenBaiHoc}`,
          `• Đối tượng & Thời lượng: ${ga.khoiLop} (${ga.thoiLuong})`,
          `• Mục tiêu kiến thức: ${kienThuc}`,
          `• Các mã hiện vật tích hợp trong bài:\n  + ${artifactNames}`,
        ].join('\n');
      })
      .join('\n\n────────────────────\n\n');
  }

  // 3. Kiểm tra câu hỏi tổng hợp danh sách toàn bộ hiện vật
  if (
    qNorm.includes('tat ca hien vat') ||
    qNorm.includes('danh sach hien vat') ||
    qNorm.includes('bao nhieu hien vat')
  ) {
    const summary = hienVatList
      .map(
        (item) =>
          `• ${item.identifier}: ${item.title} (${item.date}) — Lưu giữ: ${item.noiLuuGiuHienNay?.tenNoiLuuGiu} [${item.loaiBanHienThi}]`
      )
      .join('\n');
    return `Bộ tư liệu I03 hiện có ${hienVatList.length} bản ghi hiện vật đã kiểm chứng:\n\n${summary}`;
  }

  // 4. Tìm kiếm theo từ khóa trong tên, địa danh, triều đại, mô tả
  const stopWords = new Set([
    'la', 'gi', 'co', 'nhung', 'thong', 'tin', 've', 'hien', 'vat', 'cua', 'va',
    'o', 'dau', 'luu', 'giu', 'nay', 'nhu', 'the', 'nao', 'gioi', 'thieu', 'tom',
    'tat', 'cho', 'em', 'biet', 'tai', 'tinh', 'thanh', 'pho', 'ma', 'ban', 'ghi',
  ]);

  const keywords = qNorm
    .replace(/[.,?!():;"']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !stopWords.has(w));

  if (keywords.length > 0) {
    const scored = hienVatList
      .map((item) => {
        const titleNorm = normalizeText(item.title || '');
        const searchable = normalizeText(
          [
            item.identifier,
            item.title,
            item.subject,
            item.description,
            item.creator,
            item.date,
            item.type,
            item.coverage,
            item.noiLuuGiuHienNay?.tenNoiLuuGiu,
            item.noiLuuGiuHienNay?.tinhThanhPho,
            item.phienAmDichNghia,
          ].join(' ')
        );

        let score = 0;
        for (const kw of keywords) {
          if (titleNorm.includes(kw)) score += 3;
          else if (searchable.includes(kw)) score += 1;
        }
        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      const topMatches = scored.slice(0, 4).map((s) => s.item);
      return topMatches.map(formatArtifactReply).join('\n\n────────────────────\n\n');
    }
  }

  return 'Chưa có tư liệu về nội dung này trong tệp tulieu.json. Thầy cô và các em có thể nhập mã hiện vật (từ I03-00001 đến I03-00015), tên hiện vật (ví dụ: Trống đồng Ngọc Lũ, Bia Vĩnh Lăng, Xe tăng 843) hoặc tên tiết học (Tiết 1, Tiết 2, Tiết 3) để tra cứu.';
}

export function HeritageAssistantScreen({ initialArtifactCode }: HeritageAssistantScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'Xin chào thầy cô và các em học sinh! Mình là Trợ lý hỏi đáp di sản. Mọi câu trả lời đều bám sát dữ liệu trong tệp tulieu.json và giáo án đã nạp, kèm trích dẫn Mã định danh bản ghi, Nơi lưu giữ và Loại bản đang hiển thị.',
    },
  ]);
  const [input, setInput] = useState(
    initialArtifactCode
      ? `Hãy tóm tắt thông tin hiện vật mã ${initialArtifactCode}, nơi lưu giữ và loại bản đang hiển thị.`
      : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    const nextUserMessage: ChatMessage = { role: 'user', text: trimmed };
    const updatedHistory = [...messages, nextUserMessage];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 3500);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          question: trimmed,
          history: updatedHistory.slice(1, -1),
        }),
      });
      window.clearTimeout(timeoutId);

      const data = (await response.json()) as { answer?: string; error?: string };
      if (response.ok && data.answer && !data.error) {
        setMessages((prev) => [...prev, { role: 'model', text: data.answer! }]);
      } else {
        const localReply = searchLocalTulieu(trimmed);
        setMessages((prev) => [...prev, { role: 'model', text: localReply }]);
      }
    } catch {
      window.clearTimeout(timeoutId);
      const localReply = searchLocalTulieu(trimmed);
      setMessages((prev) => [...prev, { role: 'model', text: localReply }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuestion(input);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-stone-900">
          Trợ lý hỏi đáp di sản
        </h1>
        <p className="text-base text-stone-600">
          Tra cứu thông tin về hiện vật và bài học dành cho giáo viên và học sinh tiểu học.
        </p>
      </div>

      {/* Strict Grounding Contract Notice */}
      <div className="rounded-xl border border-[#0F4C5C]/25 bg-[#0F4C5C]/5 p-4 flex items-start gap-3 text-sm text-stone-800">
        <ShieldCheck className="w-5 h-5 text-[#0F4C5C] mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold text-stone-900">
            Quy tắc trung thực tư liệu (Bám sát 100% tệp tulieu.json)
          </p>
          <p className="text-stone-700 leading-relaxed">
            Trợ lý chỉ sử dụng thông tin có trong <code className="font-mono text-xs">tulieu.json</code>{' '}
            và nội dung giáo án; luôn trích dẫn <strong>Mã định danh</strong>,{' '}
            <strong>Nơi lưu giữ</strong> và <strong>Loại bản đang hiển thị</strong>. Nếu nội dung
            chưa được nạp dữ liệu, hệ thống sẽ trả lời đúng nguyên tắc:{' '}
            <em>"Chưa có tư liệu về nội dung này"</em>.
          </p>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-stone-500">Câu hỏi gợi ý nhanh:</p>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => sendQuestion(prompt)}
              className="text-left text-xs sm:text-sm px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-700 hover:border-[#0F4C5C] hover:text-[#0F4C5C] transition-colors cursor-pointer disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Thread */}
      <section
        aria-label="Khung hội thoại hỏi đáp di sản"
        className="rounded-2xl border border-stone-200 bg-white flex flex-col h-[500px]"
      >
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm sm:text-base leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#0F4C5C] text-white'
                    : 'bg-[#FAF8F5] border border-stone-200 text-stone-900'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 bg-[#FAF8F5] border border-stone-200 text-sm text-stone-600">
                <Loader2 className="w-4 h-4 animate-spin text-[#0F4C5C]" />
                <span>Đang tra cứu trong tulieu.json...</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-4 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 flex items-center gap-2 text-sm text-red-900">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="border-t border-stone-200 p-3 sm:p-4 flex items-center gap-3 bg-stone-50/70 rounded-b-2xl"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi về hiện vật hoặc bài học (ví dụ: Mã I03-00001 lưu giữ ở đâu?)..."
            aria-label="Nhập câu hỏi cho trợ lý di sản"
            className="flex-1 px-4 py-2.5 text-sm sm:text-base rounded-xl border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0F4C5C] rounded-xl hover:bg-[#0B3B48] disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Gửi</span>
          </button>
        </form>
      </section>
    </div>
  );
}