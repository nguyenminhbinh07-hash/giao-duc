import { ExternalLink, ShieldCheck } from 'lucide-react';
import { HeritageDataset } from '../types/heritage';

interface SourcesCreditsScreenProps {
  dataset: HeritageDataset;
}

export function SourcesCreditsScreen({ dataset }: SourcesCreditsScreenProps) {
  const officialSources = dataset.nguonThamKhao.filter(
    (s) => s.loaiNguon === 'Nguồn chính thống'
  );
  const specialistSources = dataset.nguonThamKhao.filter(
    (s) => s.loaiNguon !== 'Nguồn chính thống'
  );

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-stone-900">
          Nguồn tư liệu & Ghi nhận
        </h1>
        <p className="text-base text-stone-600">
          Tổng hợp {dataset.nguonThamKhao.length} nguồn tài liệu tham khảo (trong đó có{' '}
          {officialSources.length} nguồn chính thống) và danh mục ghi nhận quyền công bố từ các đơn
          vị/cá nhân lưu giữ tư liệu.
        </p>
      </div>

      {/* Section 1: Official Sources */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-2 border-b border-stone-200 pb-2">
          <h2 className="font-editorial text-xl font-semibold text-stone-900">
            01. Nguồn chính thống ({officialSources.length})
          </h2>
          <span className="text-xs text-stone-500">Văn bản pháp quy & Chuẩn quốc tế</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {officialSources.map((src) => (
            <article
              key={src.id}
              className="rounded-xl border border-stone-200 bg-white p-5 space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                  <span className="font-mono font-semibold text-[#0F4C5C]">{src.id}</span>
                  <span>Năm: {src.namXuatBan}</span>
                </div>
                <h3 className="text-base font-semibold text-stone-900 leading-snug">
                  {src.tenTaiLieu}
                </h3>
                <p className="text-xs font-medium text-stone-700">
                  Cơ quan ban hành: {src.tacGiaHoacCoQuan}
                </p>
                <p className="text-sm text-stone-600 leading-relaxed">{src.moTaNgan}</p>
              </div>
              <a
                href={src.lienKet}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F4C5C] hover:underline pt-1"
              >
                <span>{src.lienKet}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* Section 2: Specialist / Pedagogical References */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-2 border-b border-stone-200 pb-2">
          <h2 className="font-editorial text-xl font-semibold text-stone-900">
            02. Tài liệu tham khảo chuyên môn ({specialistSources.length})
          </h2>
          <span className="text-xs text-stone-500">Phương pháp sư phạm & Số hóa di sản</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {specialistSources.map((src) => (
            <article
              key={src.id}
              className="rounded-xl border border-stone-200 bg-white p-5 space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                  <span className="font-mono font-semibold text-[#B45309]">{src.id}</span>
                  <span>Năm: {src.namXuatBan}</span>
                </div>
                <h3 className="text-base font-semibold text-stone-900 leading-snug">
                  {src.tenTaiLieu}
                </h3>
                <p className="text-xs font-medium text-stone-700">{src.tacGiaHoacCoQuan}</p>
                <p className="text-sm text-stone-600 leading-relaxed">{src.moTaNgan}</p>
              </div>
              <a
                href={src.lienKet}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F4C5C] hover:underline pt-1"
              >
                <span>{src.lienKet}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* Section 3: Acknowledgments & Scope of Permission */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2 text-[#0F4C5C]">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="font-editorial text-xl font-semibold text-stone-900">
            03. Ghi nhận đơn vị lưu giữ & Người cho phép công bố
          </h2>
        </div>

        <div className="rounded-xl bg-[#FAF8F5] border border-stone-200 p-4 sm:p-5 text-sm space-y-2">
          <p className="font-semibold text-stone-900">
            Đơn vị lưu giữ chính khối tư liệu:{' '}
            {dataset.khoiTuLieu.noiLuuGiuChinh.tenNoiLuuGiu} (
            {dataset.khoiTuLieu.noiLuuGiuChinh.xaPhuong},{' '}
            {dataset.khoiTuLieu.noiLuuGiuChinh.tinhThanhPho})
          </p>
          <p className="text-stone-700">
            <span className="font-medium">Đại diện cho phép công bố:</span>{' '}
            {dataset.khoiTuLieu.nguoiChoPhepCongBoChinh.hoTen} — Vai trò:{' '}
            {dataset.khoiTuLieu.nguoiChoPhepCongBoChinh.vaiTro} — Ngày đồng ý:{' '}
            {dataset.khoiTuLieu.nguoiChoPhepCongBoChinh.ngayDongY}
          </p>
          <p className="text-stone-700">
            <span className="font-medium">Phạm vi cho phép chung:</span>{' '}
            {dataset.khoiTuLieu.nguoiChoPhepCongBoChinh.phamVi}
          </p>
        </div>

        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-stone-100 text-stone-700">
              <tr>
                <th className="p-3 font-semibold border-b border-stone-200">Mã bản ghi</th>
                <th className="p-3 font-semibold border-b border-stone-200">
                  Đơn vị / Nơi lưu giữ hiện nay
                </th>
                <th className="p-3 font-semibold border-b border-stone-200">
                  Họ tên & Vai trò người cho phép
                </th>
                <th className="p-3 font-semibold border-b border-stone-200">
                  Phạm vi được phép công bố
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {dataset.hienVat.map((item) => (
                <tr key={item.identifier} className="align-top bg-white">
                  <td className="p-3 font-mono text-xs font-semibold text-[#0F4C5C] whitespace-nowrap">
                    {item.identifier}
                  </td>
                  <td className="p-3 text-stone-800">
                    {item.noiLuuGiuHienNay.tenNoiLuuGiu} ({item.noiLuuGiuHienNay.xaPhuong},{' '}
                    {item.noiLuuGiuHienNay.tinhThanhPho})
                  </td>
                  <td className="p-3 text-stone-700">
                    {item.nguoiChoPhepCongBo.hoTen
                      ? `${item.nguoiChoPhepCongBo.hoTen} (${item.nguoiChoPhepCongBo.vaiTro}, ${item.nguoiChoPhepCongBo.ngayDongY})`
                      : 'Chờ xác nhận thông tin người cho phép công bố'}
                  </td>
                  <td className="p-3 text-stone-600">{item.phamViDuocPhep}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
