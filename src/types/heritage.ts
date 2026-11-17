export type VerificationStatus = 'Đã kiểm' | 'Chưa kiểm' | 'Chưa đọc được';

export type DisplayCopyType =
  | 'Bản gốc'
  | 'Bản sao'
  | 'Bản số của gốc'
  | 'Bản số của sao';

export type ConditionLevel = 'Tốt' | 'Hư hại nhẹ' | 'Hư hại nặng' | 'Không rõ';

export interface ArtifactImage {
  id: string;
  loaiAnh: 'Toàn cảnh' | 'Cận cảnh';
  duongDan: string;
  chuThich: string;
  nguon: string;
}

export interface ArtifactQuestion {
  cauHoi: string;
  goiYTraLoi: string;
}

export interface ArtifactRecord {
  // 15 trường lõi chuẩn Dublin Core (ISO 15836)
  title: string;
  creator: string;
  subject: string;
  description: string;
  publisher: string;
  contributor: string;
  date: string;
  type: string;
  format: string;
  identifier: string;
  source: string;
  language: string;
  relation: string;
  coverage: string;
  rights: string;

  // Các trường bổ sung bắt buộc
  noiLuuGiuHienNay: {
    tenNoiLuuGiu: string;
    xaPhuong: string;
    tinhThanhPho: string;
  };
  noiLuuGiuTaiThoiDiemTuLieu: string;
  loaiBanHienThi: DisplayCopyType;
  tinhTrangBanGoc: {
    mucDo: ConditionLevel;
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
  mucKiemChung: VerificationStatus;
  phienAmDichNghia: string;
  danhSachAnh: ArtifactImage[];
  cauHoiGoiMo: ArtifactQuestion[];
}

export interface LessonActivity {
  buoc: string;
  thoiLuong: string;
  hoatDongGiaoVien: string;
  hoatDongHocSinh: string;
  hienVatSuDung: string[];
}

export interface WorksheetQuestion {
  id: string;
  loai: 'trac-nghiem' | 'tu-luan';
  cauHoi: string;
  luaChon?: string[];
  dapAnGoiY: string;
  maHienVatLienQuan: string;
  isAiGenerated?: boolean;
}

export interface LessonPlan {
  id: string;
  tiet: string;
  tenBaiHoc: string;
  khoiLop: string;
  thoiLuong: string;
  mucTieu: {
    kienThuc: string[];
    nangLuc: string[];
    phamChat: string[];
  };
  hienVatTichHop: string[];
  tienTrinh: LessonActivity[];
  phieuHocTap: {
    tieuDe: string;
    huongDan: string;
    cauHoi: WorksheetQuestion[];
  };
}

export interface ReferenceSource {
  id: string;
  loaiNguon: 'Nguồn chính thống' | 'Tài liệu tham khảo chuyên môn';
  tenTaiLieu: string;
  tacGiaHoacCoQuan: string;
  namXuatBan: string;
  moTaNgan: string;
  lienKet: string;
}

export interface CollectionOverview {
  maDeTai: string;
  tenUngDung: string;
  tenKhoiTuLieu: string;
  moTaTongQuan: string;
  doiTuongMucTieu: string;
  noiLuuGiuChinh: {
    tenNoiLuuGiu: string;
    xaPhuong: string;
    tinhThanhPho: string;
  };
  nguoiChoPhepCongBoChinh: {
    hoTen: string;
    vaiTro: string;
    ngayDongY: string;
    phamVi: string;
  };
  ngayCapNhatMau: string;
}

export interface HeritageDataset {
  khoiTuLieu: CollectionOverview;
  hienVat: ArtifactRecord[];
  giaoAn: LessonPlan[];
  nguonThamKhao: ReferenceSource[];
}

export type ScreenId =
  | 'home'
  | 'library'
  | 'detail'
  | 'lessons'
  | 'assistant'
  | 'sources'
  | 'about';
