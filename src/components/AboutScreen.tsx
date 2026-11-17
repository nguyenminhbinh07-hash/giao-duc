import { BookOpen, Info, ShieldAlert, UserCheck } from 'lucide-react';

export function AboutScreen() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-2">
        <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-stone-900">
          Giới thiệu dự án (Mã đề tài: I03)
        </h1>
        <p className="text-base text-stone-600">
          Thông tin tác giả, phạm vi ứng dụng và những hạn chế hiện tại của sản phẩm.
        </p>
      </div>

      {/* Mandatory Author Attribution */}
      <section className="rounded-2xl border border-[#0F4C5C]/30 bg-white p-6 sm:p-8 space-y-4">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F4C5C]">
          <UserCheck className="w-4 h-4" />
          <span>Thông tin dự án</span>
        </div>
        <p className="text-base sm:text-lg font-medium text-stone-900 leading-relaxed">
          Sản phẩm thực tập của Nguyễn Minh Bình, mã sinh viên TH04121, Nhóm 2, Chương trình Thực
          tập sinh Đợt 15 FPT Polytechnic và IMTA TECH. Đây là dự án giáo dục cộng đồng hoàn toàn
          phi lợi nhuận, không kinh doanh, không quảng cáo.
        </p>
      </section>

      {/* Project Scope */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 space-y-4">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F4C5C]">
          <BookOpen className="w-4 h-4" />
          <span>Phạm vi dự án</span>
        </div>
        <ul className="space-y-2.5 text-sm sm:text-base text-stone-700 list-disc pl-5 leading-relaxed">
          <li>
            Phục vụ giảng dạy và học tập nội dung lịch sử địa phương cho giáo viên và học sinh cấp
            Tiểu học (lớp 3, lớp 4, lớp 5), cũng như phụ huynh quan tâm.
          </li>
          <li>
            Chuẩn hóa hồ sơ hiện vật số trong tệp <code className="font-mono text-xs">tulieu.json</code>{' '}
            tách biệt với giao diện theo đủ 15 trường lõi của chuẩn Dublin Core (ISO 15836) cùng các
            trường đơn vị hành chính hai cấp, tình trạng bảo quản, kiểm chứng văn tự và phạm vi
            quyền công bố.
          </li>
          <li>
            Bảo vệ nguyên vẹn bản gốc: học sinh quan sát ảnh toàn cảnh và ảnh cận cảnh với công cụ
            phóng to/thu nhỏ thay vì tiếp xúc trực tiếp với hiện vật thật.
          </li>
          <li>
            Tuyệt đối không dùng AI sinh ảnh minh họa hiện vật; tự động ẩn ảnh và hiển thị thông báo{' '}
            <em>"Chờ xác nhận quyền / Chưa có ảnh"</em> khi thiếu ảnh hoặc thiếu xác nhận đồng ý
            công bố.
          </li>
        </ul>
      </section>

      {/* Limitations / Unfinished Areas */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 space-y-4">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#B45309]">
          <ShieldAlert className="w-4 h-4" />
          <span>Các phần chưa làm được & Hướng hoàn thiện</span>
        </div>
        <ul className="space-y-2.5 text-sm sm:text-base text-stone-700 list-disc pl-5 leading-relaxed">
          <li>
            <strong>Mở rộng số hóa thực địa tại di tích cơ sở:</strong> Hệ thống hiện sử dụng bộ tư
            liệu hiện vật đã được công bố chính thức từ nguồn bảo tàng/cơ quan văn hóa; giai đoạn
            tiếp theo sẽ phối hợp trực tiếp với các đình, chùa và nhà lưu niệm tại địa phương để
            chụp ảnh thực tế và bổ sung các tư liệu chưa công bố.
          </li>
          <li>
            <strong>Trải nghiệm 3D đa chiều:</strong> Hiện vật số đang hỗ trợ ảnh 2D toàn cảnh và cận
            cảnh có phóng to/thu nhỏ; chưa có mô hình 3D xoay 360 độ do đòi hỏi thiết bị quét chuyên
            dụng tại di tích.
          </li>
        </ul>
      </section>

      {/* Technical Architecture Note */}
      <section className="rounded-xl border border-stone-200 bg-[#FAF8F5] p-5 flex items-start gap-3 text-sm text-stone-700">
        <Info className="w-5 h-5 text-[#0F4C5C] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Ứng dụng đọc dữ liệu động từ tệp <code className="font-mono text-xs">/tulieu.json</code>{' '}
          qua máy chủ nội bộ. Khi giáo viên hoặc nhóm biên tập cập nhật 15 bản ghi thật và đặt ảnh
          đã nén vào <code className="font-mono text-xs">/public/images/artifacts/</code>, toàn bộ
          giao diện thư viện, giáo án và trợ lý hỏi đáp sẽ tự động cập nhật theo dữ liệu mới.
        </p>
      </section>
    </div>
  );
}
