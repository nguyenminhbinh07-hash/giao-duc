import { HeritageDataset, LessonPlan } from '../types/heritage';

function getTodayStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '').replace(/\r?\n/g, ' ');
  if (str.includes(',') || str.includes('"') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportAllAsJson(dataset: HeritageDataset) {
  const payload = {
    ngayXuatDuLieu: new Date().toISOString(),
    ...dataset,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  triggerDownload(blob, `du-lieu-hien-vat-giao-an-${getTodayStamp()}.json`);
}

export function exportAllAsCsv(dataset: HeritageDataset) {
  const stamp = getTodayStamp();

  // 1. Bảng Hiện vật (đủ 15 trường Dublin Core + các trường bổ sung)
  const artifactHeaders = [
    'Identifier (Mã định danh)',
    'Title (Tiêu đề)',
    'Creator (Tác giả)',
    'Subject (Chủ đề)',
    'Description (Mô tả)',
    'Publisher (Đơn vị công bố)',
    'Contributor (Người đóng góp)',
    'Date (Niên đại)',
    'Type (Loại hình)',
    'Format (Định dạng/Chất liệu)',
    'Source (Nguồn gốc)',
    'Language (Ngôn ngữ)',
    'Relation (Liên quan)',
    'Coverage (Phạm vi không gian/thời gian)',
    'Rights (Quyền sử dụng)',
    'Nơi lưu giữ hiện nay',
    'Xã/Phường hiện nay',
    'Tỉnh/Thành phố hiện nay',
    'Nơi lưu giữ tại thời điểm tư liệu',
    'Loại bản đang hiển thị',
    'Tình trạng bản gốc',
    'Mô tả tình trạng bản gốc',
    'Số đăng ký / tham khảo',
    'Người cho phép công bố',
    'Vai trò người cho phép',
    'Ngày đồng ý công bố',
    'Phạm vi được phép',
    'Phần không công bố',
    'Mức kiểm chứng',
    'Phiên âm / Dịch nghĩa',
    'Số lượng ảnh đính kèm',
  ];

  const artifactRows = dataset.hienVat.map((item) => [
    item.identifier,
    item.title,
    item.creator,
    item.subject,
    item.description,
    item.publisher,
    item.contributor,
    item.date,
    item.type,
    item.format,
    item.source,
    item.language,
    item.relation,
    item.coverage,
    item.rights,
    item.noiLuuGiuHienNay.tenNoiLuuGiu,
    item.noiLuuGiuHienNay.xaPhuong,
    item.noiLuuGiuHienNay.tinhThanhPho,
    item.noiLuuGiuTaiThoiDiemTuLieu,
    item.loaiBanHienThi,
    item.tinhTrangBanGoc.mucDo,
    item.tinhTrangBanGoc.moTaNgan,
    item.soDangKyHoacThamKhao,
    item.nguoiChoPhepCongBo.hoTen,
    item.nguoiChoPhepCongBo.vaiTro,
    item.nguoiChoPhepCongBo.ngayDongY,
    item.phamViDuocPhep,
    item.phanKhongCongBo,
    item.mucKiemChung,
    item.phienAmDichNghia,
    item.danhSachAnh.length,
  ]);

  const artifactCsv = [
    artifactHeaders.map(escapeCsvCell).join(','),
    ...artifactRows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n');

  // 2. Bảng Giáo án & Phiếu học tập
  const lessonHeaders = [
    'Mã giáo án',
    'Tiết',
    'Tên bài học',
    'Khối lớp',
    'Thời lượng',
    'Mục tiêu kiến thức',
    'Mục tiêu năng lực',
    'Mục tiêu phẩm chất',
    'Hiện vật tích hợp',
    'Số câu hỏi phiếu học tập',
  ];

  const lessonRows = dataset.giaoAn.map((ga) => [
    ga.id,
    ga.tiet,
    ga.tenBaiHoc,
    ga.khoiLop,
    ga.thoiLuong,
    ga.mucTieu.kienThuc.join(' | '),
    ga.mucTieu.nangLuc.join(' | '),
    ga.mucTieu.phamChat.join(' | '),
    ga.hienVatTichHop.join('; '),
    ga.phieuHocTap.cauHoi.length,
  ]);

  const lessonCsv = [
    lessonHeaders.map(escapeCsvCell).join(','),
    ...lessonRows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n');

  const combinedCsv =
    '\uFEFF' +
    '=== DANH SÁCH HIỆN VẬT SỐ (CHUẨN DUBLIN CORE) ===\n' +
    artifactCsv +
    '\n\n=== DANH SÁCH GIÁO ÁN TIỂU HỌC ===\n' +
    lessonCsv;

  const blob = new Blob([combinedCsv], { type: 'text/csv;charset=utf-8' });
  triggerDownload(blob, `du-lieu-hien-vat-giao-an-${stamp}.csv`);
}

export function exportWorksheetAsTxt(
  lesson: LessonPlan,
  studentName: string,
  studentClass: string,
  answers: Record<string, string>,
  extraQuestions: LessonPlan['phieuHocTap']['cauHoi']
) {
  const stamp = getTodayStamp();
  const allQuestions = [...lesson.phieuHocTap.cauHoi, ...extraQuestions];

  const lines: string[] = [
    `PHIẾU HỌC TẬP - ${lesson.tiet.toUpperCase()}`,
    `Bài học: ${lesson.tenBaiHoc} (${lesson.khoiLop})`,
    `Họ và tên học sinh: ${studentName || '........................'}`,
    `Lớp: ${studentClass || '............'}`,
    `Ngày thực hiện: ${stamp}`,
    '====================================================',
    '',
  ];

  allQuestions.forEach((q, idx) => {
    lines.push(`Câu ${idx + 1} [Mã hiện vật: ${q.maHienVatLienQuan}]${q.isAiGenerated ? ' (Đề xuất bởi AI - Cần kiểm tra)' : ''}:`);
    lines.push(q.cauHoi);
    if (q.luaChon && q.luaChon.length > 0) {
      q.luaChon.forEach((opt, oIdx) => {
        const prefix = String.fromCharCode(65 + oIdx);
        lines.push(`   ${prefix}. ${opt}`);
      });
    }
    lines.push(`--> Câu trả lời của em: ${answers[q.id] || '(Chưa trả lời)'}`);
    lines.push('');
  });

  const blob = new Blob(['\uFEFF' + lines.join('\n')], {
    type: 'text/plain;charset=utf-8',
  });
  triggerDownload(blob, `phieu-hoc-tap-${lesson.id.toLowerCase()}-${stamp}.txt`);
}
