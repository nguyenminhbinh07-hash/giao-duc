import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TULIEU_PATH = path.resolve(__dirname, 'tulieu.json');

interface ArtifactRaw {
  identifier: string;
  title: string;
  creator: string;
  subject: string;
  description: string;
  publisher: string;
  contributor: string;
  date: string;
  type: string;
  format: string;
  source: string;
  language: string;
  relation: string;
  coverage: string;
  rights: string;
  noiLuuGiuHienNay: {
    tenNoiLuuGiu: string;
    xaPhuong: string;
    tinhThanhPho: string;
  };
  noiLuuGiuTaiThoiDiemTuLieu: string;
  loaiBanHienThi: string;
  tinhTrangBanGoc: {
    mucDo: string;
    moTaNgan: string;
  };
  soDangKyHoacThamKhao: string;
  nguoiChoPhepCongBo: {
    hoTen: string;
    vaiTro: string;
    ngayDongY: string;
  };
  phamViDuocPhep: string;
  phanKhongCongBo: string;
  mucKiemChung: string;
  phienAmDichNghia: string;
  cauHoiGoiMo?: Array<{
    cauHoi: string;
    goiYTraLoi: string;
  }>;
}

interface DatasetRaw {
  khoiTuLieu: Record<string, unknown>;
  hienVat: ArtifactRaw[];
  giaoAn: Array<Record<string, any>>;
  nguonThamKhao: Array<Record<string, unknown>>;
}

async function loadDataset(): Promise<DatasetRaw> {
  const raw = await fs.readFile(TULIEU_PATH, 'utf-8');
  return JSON.parse(raw) as DatasetRaw;
}

function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

function formatArtifactGrounded(item: ArtifactRaw): string {
  const noiLuuGiu = item.noiLuuGiuHienNay
    ? `${item.noiLuuGiuHienNay.tenNoiLuuGiu} (${item.noiLuuGiuHienNay.xaPhuong}, ${item.noiLuuGiuHienNay.tinhThanhPho})`
    : 'Đang cập nhật';

  const lines = [
    `• Tên hiện vật: ${item.title}`,
    `• Mã định danh: ${item.identifier} (Mức kiểm chứng: ${item.mucKiemChung || 'Đã kiểm'})`,
    `• Nơi lưu giữ hiện nay: ${noiLuuGiu}`,
    `• Loại bản đang hiển thị: ${item.loaiBanHienThi || 'Bản số của gốc'}`,
    `• Loại hình & Niên đại: ${item.type} — ${item.date}`,
    `• Chất liệu / Quy cách: ${item.format}`,
    `• Mô tả tư liệu: ${item.description}`,
  ];

  if (item.phienAmDichNghia && item.phienAmDichNghia.trim()) {
    lines.push(`• Phiên âm / Dịch nghĩa: ${item.phienAmDichNghia}`);
  }

  lines.push(`• Nguồn tư liệu: ${item.source}`);
  return lines.join('\n');
}

function fallbackSearchAnswer(dataset: DatasetRaw, question: string): string {
  const hienVatList = Array.isArray(dataset.hienVat) ? dataset.hienVat : [];
  const giaoAnList = Array.isArray(dataset.giaoAn) ? dataset.giaoAn : [];
  const qRaw = question.toLowerCase().trim();
  const qNorm = normalizeText(question);

  // 1. Tra cứu theo mã định danh (I03-00001 .. I03-00015 hoặc I03-01)
  const codeMatches = qRaw.match(/i03-\d{1,5}/g);
  if (codeMatches && codeMatches.length > 0) {
    const normalizedCodes = codeMatches.map((code) => {
      const numPart = code.replace('i03-', '');
      return `I03-${numPart.padStart(5, '0')}`;
    });
    const matched = hienVatList.filter((item) =>
      normalizedCodes.includes(item.identifier.toUpperCase())
    );
    if (matched.length > 0) {
      return matched.map(formatArtifactGrounded).join('\n\n────────────────────\n\n');
    }
  }

  // 2. Tra cứu theo giáo án / tiết dạy
  if (
    qNorm.includes('giao an') ||
    qNorm.includes('tiet 1') ||
    qNorm.includes('tiet 2') ||
    qNorm.includes('tiet 3') ||
    qNorm.includes('ga-0')
  ) {
    let targetLessons = giaoAnList;
    if (qNorm.includes('tiet 1') || qNorm.includes('ga-01')) {
      targetLessons = giaoAnList.filter((g) => g.id === 'GA-01');
    } else if (qNorm.includes('tiet 2') || qNorm.includes('ga-02')) {
      targetLessons = giaoAnList.filter((g) => g.id === 'GA-02');
    } else if (qNorm.includes('tiet 3') || qNorm.includes('ga-03')) {
      targetLessons = giaoAnList.filter((g) => g.id === 'GA-03');
    }

    if (targetLessons.length > 0) {
      return targetLessons
        .map((ga) => {
          const codes: string[] = Array.isArray(ga.hienVatTichHop) ? ga.hienVatTichHop : [];
          const artifactDetails = codes
            .map((code) => {
              const found = hienVatList.find((h) => h.identifier === code);
              return found
                ? `${code} (${found.title} — Nơi lưu giữ: ${found.noiLuuGiuHienNay.tenNoiLuuGiu}, Loại bản: ${found.loaiBanHienThi})`
                : code;
            })
            .join('\n  + ');

          const kienThuc = Array.isArray(ga.mucTieu?.kienThuc)
            ? ga.mucTieu.kienThuc.join(' ')
            : '';

          return [
            `📘 ${ga.tiet} (${ga.id}): ${ga.tenBaiHoc}`,
            `• Khối lớp & Thời lượng: ${ga.khoiLop} (${ga.thoiLuong})`,
            `• Mục tiêu kiến thức: ${kienThuc}`,
            `• Các hiện vật tích hợp:\n  + ${artifactDetails}`,
          ].join('\n');
        })
        .join('\n\n────────────────────\n\n');
    }
  }

  // 3. Tìm theo từ khóa trong tên, mô tả, địa danh
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
        const titleNorm = normalizeText(item.title);
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
      return scored
        .slice(0, 4)
        .map((s) => formatArtifactGrounded(s.item))
        .join('\n\n────────────────────\n\n');
    }
  }

  return 'Chưa có tư liệu về nội dung này trong tệp tulieu.json. Vui lòng nhập mã hiện vật (từ I03-00001 đến I03-00015), tên hiện vật hoặc tên tiết học để tra cứu.';
}

function fallbackGenerateQuestions(
  artifact: ArtifactRaw,
  questionType: string | undefined,
  count: number
) {
  const results: Array<{
    id: string;
    loai: 'trac-nghiem' | 'tu-luan';
    cauHoi: string;
    luaChon?: string[];
    dapAnGoiY: string;
    maHienVatLienQuan: string;
    isAiGenerated: boolean;
  }> = [];

  if (questionType !== 'tu-luan') {
    results.push({
      id: `LOCAL-${artifact.identifier}-${Date.now()}-0`,
      loai: 'trac-nghiem',
      cauHoi: `Hiện vật "${artifact.title}" (mã ${artifact.identifier}) hiện nay đang được lưu giữ tại đâu?`,
      luaChon: [
        `${artifact.noiLuuGiuHienNay.tenNoiLuuGiu} (${artifact.noiLuuGiuHienNay.tinhThanhPho})`,
        'Bảo tàng Chăm (Thành phố Đà Nẵng)',
        'Khu di tích Địa đạo Củ Chi (Thành phố Hồ Chí Minh)',
      ],
      dapAnGoiY: `${artifact.noiLuuGiuHienNay.tenNoiLuuGiu} (${artifact.noiLuuGiuHienNay.tinhThanhPho})`,
      maHienVatLienQuan: artifact.identifier,
      isAiGenerated: true,
    });
  }

  if (Array.isArray(artifact.cauHoiGoiMo)) {
    for (const q of artifact.cauHoiGoiMo) {
      if (results.length >= count) break;
      results.push({
        id: `LOCAL-${artifact.identifier}-${Date.now()}-${results.length}`,
        loai: 'tu-luan',
        cauHoi: q.cauHoi,
        dapAnGoiY: q.goiYTraLoi,
        maHienVatLienQuan: artifact.identifier,
        isAiGenerated: true,
      });
    }
  }

  while (results.length < count) {
    results.push({
      id: `LOCAL-${artifact.identifier}-${Date.now()}-${results.length}`,
      loai: 'tu-luan',
      cauHoi: `Dựa vào hồ sơ hiện vật ${artifact.title} (${artifact.identifier}), em hãy nêu niên đại và chất liệu của hiện vật này.`,
      dapAnGoiY: `Niên đại: ${artifact.date}; Quy cách/Chất liệu: ${artifact.format}.`,
      maHienVatLienQuan: artifact.identifier,
      isAiGenerated: true,
    });
  }

  return results.slice(0, count);
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/tulieu', async (_req, res) => {
    try {
      const dataset = await loadDataset();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json(dataset);
    } catch (err) {
      console.error('Error loading tulieu.json:', err);
      res.status(500).json({ error: 'Không thể đọc tệp dữ liệu tulieu.json trên máy chủ.' });
    }
  });

  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { question, history } = req.body as {
        question?: string;
        history?: Array<{ role: 'user' | 'model'; text: string }>;
      };

      if (!question || !question.trim()) {
        return res.status(400).json({ error: 'Vui lòng nhập câu hỏi.' });
      }

      const dataset = await loadDataset();
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({ answer: fallbackSearchAnswer(dataset, question.trim()) });
      }

      const groundingData = JSON.stringify(
        {
          khoiTuLieu: dataset.khoiTuLieu,
          hienVat: dataset.hienVat,
          giaoAn: dataset.giaoAn,
        },
        null,
        2
      );

      const systemInstruction = `Bạn là Trợ lý hỏi đáp di sản của ứng dụng "Giáo án dùng hiện vật số cho tiểu học" (Mã đề tài: I03).
NGUYÊN TẮC BẮT BUỘC (TUYỆT ĐỐI TUÂN THỦ):
1. CHỈ trả lời các câu hỏi dựa HOÀN TOÀN trên dữ liệu JSON trong tệp tulieu.json và nội dung giáo án được cung cấp dưới đây.
2. KHÔNG BAO GIỜ tự suy đoán, bịa đặt, bổ sung kiến thức lịch sử từ bên ngoài hoặc điền thay thông tin còn trống/chờ cập nhật.
3. Nếu thông tin người dùng hỏi KHÔNG có trong dữ liệu cung cấp bên dưới (hoặc nằm ở phần chưa nạp dữ liệu thật), BẮT BUỘC trả lời bắt đầu bằng đúng cụm từ: "Chưa có tư liệu về nội dung này".
4. MỌI câu trả lời có đề cập đến hiện vật hoặc thông tin tư liệu BẮT BUỘC phải trích dẫn rõ 3 yếu tố:
   - Mã định danh bản ghi (identifier)
   - Nơi lưu giữ hiện nay (tenNoiLuuGiu, xaPhuong, tinhThanhPho)
   - Loại bản đang hiển thị (loaiBanHienThi: Bản gốc / Bản sao / Bản số của gốc / Bản số của sao)
5. Nếu bản ghi có mức kiểm chứng là "Chưa kiểm" hoặc "Chưa đọc được", phải nhắc rõ tình trạng kiểm chứng đó cho người hỏi.
6. Trình bày bằng tiếng Việt có dấu chuẩn xác, ngắn gọn, thân thiện, dễ hiểu với giáo viên và học sinh tiểu học.

DỮ LIỆU NGUỒN DUY NHẤT (tulieu.json & giáo án):
${groundingData}`;

      const chatHistory = Array.isArray(history)
        ? history.slice(-6).map((item) => ({
            role: item.role,
            parts: [{ text: item.text }],
          }))
        : [];

      const contents = [
        ...chatHistory,
        {
          role: 'user',
          parts: [{ text: question.trim() }],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
        },
      });

      const answer = response.text?.trim() || fallbackSearchAnswer(dataset, question.trim());
      return res.json({ answer });
    } catch (err) {
      console.error('Gemini chat error, using local fallback:', err);
      try {
        const dataset = await loadDataset();
        const q = (req.body?.question as string) || '';
        return res.json({ answer: fallbackSearchAnswer(dataset, q) });
      } catch {
        return res.status(500).json({
          error: 'Không thể kết nối tới dịch vụ hỏi đáp ngay lúc này. Vui lòng thử lại sau.',
        });
      }
    }
  });

  app.post('/api/gemini/generate-questions', async (req, res) => {
    try {
      const { identifier, questionType, gradeLevel, count } = req.body as {
        identifier?: string;
        questionType?: 'trac-nghiem' | 'tu-luan' | 'ca-hai';
        gradeLevel?: string;
        count?: number;
      };

      if (!identifier) {
        return res.status(400).json({ error: 'Vui lòng chọn mã hiện vật.' });
      }

      const dataset = await loadDataset();
      const artifact = dataset.hienVat.find((item) => item.identifier === identifier);
      if (!artifact) {
        return res.status(404).json({ error: 'Không tìm thấy mã hiện vật trong tulieu.json.' });
      }

      const safeCount = Math.min(Math.max(Number(count) || 2, 1), 4);
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          questions: fallbackGenerateQuestions(artifact, questionType, safeCount),
        });
      }

      const prompt = `Hãy tạo ${safeCount} câu hỏi học tập dành cho học sinh tiểu học (${gradeLevel || 'Lớp 4'}) hoàn toàn dựa trên dữ liệu hiện vật sau đây trong tulieu.json.
Loại câu hỏi yêu cầu: ${
        questionType === 'trac-nghiem'
          ? 'Chỉ câu hỏi trắc nghiệm (có 3 lựa chọn A, B, C)'
          : questionType === 'tu-luan'
            ? 'Chỉ câu hỏi tự luận gợi mở'
            : 'Kết hợp trắc nghiệm và tự luận gợi mở'
      }.

QUY TẮC BẮT BUỘC:
- Chỉ sử dụng thông tin có mặt trong hồ sơ hiện vật JSON dưới đây.
- Tuyệt đối không bịa thêm chi tiết lịch sử, kích thước, hoa văn hay năm tháng không có trong dữ liệu.
- Nếu hiện vật là bản ghi mẫu hoặc có phần "Chưa kiểm" / "Chưa đọc được", có thể đặt câu hỏi giúp học sinh rèn kỹ năng đọc hồ sơ, nhận biết chất liệu, tình trạng bảo quản, hoặc ý thức giữ gìn di sản dựa đúng trên dữ liệu hiện có.
- Ngôn ngữ: Tiếng Việt chuẩn xác, gần gũi với học sinh tiểu học.

HỒ SƠ HIỆN VẬT:
${JSON.stringify(artifact, null, 2)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                loai: {
                  type: Type.STRING,
                  description: "Giá trị bắt buộc là 'trac-nghiem' hoặc 'tu-luan'.",
                },
                cauHoi: {
                  type: Type.STRING,
                  description: 'Nội dung câu hỏi tiếng Việt cho học sinh tiểu học.',
                },
                luaChon: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description:
                    'Danh sách 3 phương án lựa chọn nếu là trac-nghiem; mảng rỗng nếu là tu-luan.',
                },
                dapAnGoiY: {
                  type: Type.STRING,
                  description: 'Đáp án đúng hoặc gợi ý trả lời ngắn gọn cho giáo viên.',
                },
              },
              required: ['loai', 'cauHoi', 'luaChon', 'dapAnGoiY'],
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '[]').trim()) as Array<{
        loai: string;
        cauHoi: string;
        luaChon: string[];
        dapAnGoiY: string;
      }>;

      const normalized = parsed.map((q, idx) => ({
        id: `AI-${artifact.identifier}-${Date.now()}-${idx}`,
        loai: q.loai === 'trac-nghiem' ? ('trac-nghiem' as const) : ('tu-luan' as const),
        cauHoi: q.cauHoi,
        luaChon: q.loai === 'trac-nghiem' ? q.luaChon : undefined,
        dapAnGoiY: q.dapAnGoiY,
        maHienVatLienQuan: artifact.identifier,
        isAiGenerated: true,
      }));

      return res.json({ questions: normalized });
    } catch (err) {
      console.error('Gemini generate-questions error, using fallback:', err);
      try {
        const dataset = await loadDataset();
        const artifact = dataset.hienVat.find(
          (item) => item.identifier === req.body?.identifier
        );
        if (artifact) {
          const safeCount = Math.min(Math.max(Number(req.body?.count) || 2, 1), 4);
          return res.json({
            questions: fallbackGenerateQuestions(artifact, req.body?.questionType, safeCount),
          });
        }
      } catch {
        // ignore
      }
      return res.status(500).json({
        error: 'Không thể tạo câu hỏi tự động lúc này. Vui lòng thử lại sau.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();