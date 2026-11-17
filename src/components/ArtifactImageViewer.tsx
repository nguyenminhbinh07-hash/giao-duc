import React, { useState } from 'react';
import { EyeOff, Maximize2, RotateCcw, ShieldAlert, ZoomIn, ZoomOut } from 'lucide-react';
import { ArtifactRecord } from '../types/heritage';

export function hasPublicationPermissionAndImages(artifact: ArtifactRecord): boolean {
  const hasImages = Array.isArray(artifact.danhSachAnh) && artifact.danhSachAnh.length > 0;
  const p = artifact.nguoiChoPhepCongBo;
  const isCleanValue = (val?: string) => {
    const trimmed = (val ?? '').trim();
    return trimmed.length > 0 && !trimmed.startsWith('[Chờ');
  };
  const hasPermission =
    Boolean(p) && isCleanValue(p.hoTen) && isCleanValue(p.vaiTro) && isCleanValue(p.ngayDongY);

  return hasImages && hasPermission;
}

interface ArtifactImageViewerProps {
  artifact: ArtifactRecord;
  mode?: 'compact' | 'full';
}

export function ArtifactImageViewer({ artifact, mode = 'full' }: ArtifactImageViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgErrorIds, setImgErrorIds] = useState<Record<string, boolean>>({});

  const canDisplay = hasPublicationPermissionAndImages(artifact);

  if (!canDisplay) {
    const missingImages = !artifact.danhSachAnh || artifact.danhSachAnh.length === 0;
    const missingPermission =
      !artifact.nguoiChoPhepCongBo?.hoTen?.trim() ||
      !artifact.nguoiChoPhepCongBo?.vaiTro?.trim() ||
      !artifact.nguoiChoPhepCongBo?.ngayDongY?.trim();

    if (mode === 'compact') {
      return (
        <div className="aspect-[4/3] w-full rounded-lg border border-dashed border-stone-300 bg-stone-100/80 flex flex-col items-center justify-center p-4 text-center">
          <EyeOff className="w-6 h-6 text-stone-500 mb-2" />
          <p className="text-sm font-semibold text-stone-800">Chờ xác nhận quyền / Chưa có ảnh</p>
          <p className="text-xs text-stone-500 mt-1">
            {missingImages && missingPermission
              ? 'Thiếu ảnh đính kèm và thông tin người cho phép công bố'
              : missingImages
                ? 'Chưa có tệp ảnh đính kèm'
                : 'Thiếu xác nhận người cho phép công bố'}
          </p>
        </div>
      );
    }

    return (
      <div className="w-full rounded-xl border border-dashed border-stone-300 bg-stone-100/70 p-8 sm:p-12 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-white border border-stone-200 flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6 text-amber-700" />
        </div>
        <h3 className="text-lg font-semibold text-stone-900">Chờ xác nhận quyền / Chưa có ảnh</h3>
        <p className="text-sm text-stone-600 max-w-md mt-2 leading-relaxed">
          Theo quy tắc bảo vệ bản quyền và trung thực tư liệu của dự án, hình ảnh chỉ hiển thị khi có
          đầy đủ tệp ảnh chụp thật và thông tin xác nhận của người cho phép công bố trong{' '}
          <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-stone-200">
            tulieu.json
          </code>
          .
        </p>
        <div className="mt-4 text-xs text-stone-600 space-y-1">
          {missingImages && <p>• Trạng thái tệp ảnh: Chưa có ảnh đính kèm</p>}
          {missingPermission && (
            <p>• Trạng thái quyền công bố: Thiếu họ tên, vai trò hoặc ngày đồng ý</p>
          )}
        </div>
      </div>
    );
  }

  const images = artifact.danhSachAnh;
  const activeImage = images[selectedIndex] ?? images[0];
  const activeImgUrl = activeImage.duongDan || (activeImage as any).url || '';
  const activeImgId = activeImage.id || `${artifact.identifier}-img-${selectedIndex}`;
  const activeImgType = activeImage.loaiAnh || 'Ảnh tư liệu';
  const hasLoadError = Boolean(imgErrorIds[activeImgId]);

  if (mode === 'compact') {
    return (
      <figure className="w-full">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
          {hasLoadError ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-stone-600">
              <EyeOff className="w-6 h-6 mb-1.5" />
              <span className="text-xs font-medium">Không tải được tệp ảnh ({activeImgUrl})</span>
            </div>
          ) : (
            <img
              src={activeImgUrl}
              alt={activeImage.chuThich || artifact.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgErrorIds((prev) => ({ ...prev, [activeImgId]: true }))}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <figcaption className="mt-2 text-xs text-stone-600 space-y-0.5">
          <p className="font-medium text-stone-800 line-clamp-1">
            {activeImgType}: {activeImage.chuThich}
          </p>
          <p className="text-stone-500 line-clamp-1">Nguồn: {activeImage.nguon}</p>
        </figcaption>
      </figure>
    );
  }

  const handleZoomIn = () => setZoom((z) => Math.min(3.5, Number((z + 0.4).toFixed(2))));
  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(1, Number((z - 0.4).toFixed(2)));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-100 border border-stone-200 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium text-stone-800">
          <Maximize2 className="w-4 h-4 text-[#0F4C5C]" />
          <span>{activeImgType}</span>
          <span aria-hidden="true" className="text-stone-400">·</span>
          <span className="font-mono text-xs tabular-nums text-stone-600">
            Thu phóng: {Math.round(zoom * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white border border-stone-300 rounded-lg text-stone-800 hover:bg-stone-50 disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            <ZoomOut className="w-3.5 h-3.5" />
            <span>Thu nhỏ</span>
          </button>
          <input
            type="range"
            min={1}
            max={3.5}
            step={0.1}
            value={zoom}
            aria-label="Mức độ thu phóng ảnh hiện vật"
            onChange={(e) => {
              const val = Number(e.target.value);
              setZoom(val);
              if (val === 1) setPan({ x: 0, y: 0 });
            }}
            className="w-24 accent-[#0F4C5C] hidden sm:block"
          />
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 3.5}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white border border-stone-300 rounded-lg text-stone-800 hover:bg-stone-50 disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Phóng to</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white border border-stone-300 rounded-lg text-stone-800 hover:bg-stone-50 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>
        </div>
      </div>

      <figure>
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative w-full h-[320px] sm:h-[460px] rounded-xl border border-stone-200 bg-stone-900 overflow-hidden flex items-center justify-center select-none ${
            zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
        >
          {hasLoadError ? (
            <div className="text-center p-6 text-stone-300">
              <EyeOff className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Không tìm thấy tệp ảnh tại {activeImgUrl}</p>
            </div>
          ) : (
            <img
              src={activeImgUrl}
              alt={activeImage.chuThich || artifact.title}
              referrerPolicy="no-referrer"
              draggable={false}
              onError={() => setImgErrorIds((prev) => ({ ...prev, [activeImgId]: true }))}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="max-h-full max-w-full object-contain"
            />
          )}
          {zoom > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/75 text-white text-xs px-2.5 py-1 rounded-md pointer-events-none">
              Kéo chuột để di chuyển vùng quan sát
            </div>
          )}
        </div>

        <figcaption className="mt-3 rounded-lg bg-stone-50 border border-stone-200 px-4 py-3 text-sm text-stone-700 space-y-1">
          <p className="font-medium text-stone-900">
            Chú thích ({activeImgType}): {activeImage.chuThich}
          </p>
          <p className="text-xs text-stone-600">Nguồn ảnh: {activeImage.nguon}</p>
        </figcaption>
      </figure>

      {images.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {images.map((img, idx) => {
            const thumbUrl = img.duongDan || (img as any).url || '';
            const thumbId = img.id || `${artifact.identifier}-img-${idx}`;
            const thumbType = img.loaiAnh || 'Ảnh tư liệu';
            return (
              <button
                key={thumbId}
                type="button"
                onClick={() => {
                  setSelectedIndex(idx);
                  handleReset();
                }}
                className={`text-left rounded-lg border p-2 transition-colors cursor-pointer ${
                  idx === selectedIndex
                    ? 'border-[#0F4C5C] bg-[#0F4C5C]/5'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded bg-stone-100 mb-1.5">
                  <img
                    src={thumbUrl}
                    alt={img.chuThich}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs font-semibold text-stone-900 truncate">{thumbType}</p>
                <p className="text-[11px] text-stone-500 truncate">{img.chuThich}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}