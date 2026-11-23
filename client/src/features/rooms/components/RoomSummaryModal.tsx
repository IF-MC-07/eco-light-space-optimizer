"use client";
import React, { useEffect, useRef, useCallback } from "react";
import { X, Users, Armchair, Clock, AlertTriangle, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { useRouter } from "next/navigation";
import { useMe } from "../../auth/hooks";
import type { RoomOccupancy, RoomRecommendation } from "../../occupancy/types";
import { statusMeta, formatAge, formatPercent, formatSeats } from "../../occupancy/utils";

import type { Room } from "../types";

interface RoomSummaryModalProps {
  roomId?: string | null;
  occupancyList?: RoomOccupancy[];
  onClose: () => void;
  onNavigateRoom?: (roomId: string) => void;
  onDeleteRoom?: (room: { room_id: string; room_name: string }) => void;
  isOpen?: boolean;
  room?: Room | null;
}

export function RoomSummaryModal({
  roomId,
  occupancyList = [],
  onClose,
  onNavigateRoom,
  onDeleteRoom,
  isOpen = true,
  room: legacyRoom,
}: RoomSummaryModalProps) {
  const router = useRouter();
  const { data: userData } = useMe();
  const isAdmin = userData?.user?.role === "admin";

  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = `room-modal-title-${roomId ?? legacyRoom?.room_id ?? "none"}`;

  // Adaptasi jika dipanggil via props legacy (RoomGrid)
  const legacyOccupancy: RoomOccupancy | null = React.useMemo(() => {
    if (!legacyRoom) return null;
    return {
      room_id: legacyRoom.room_id,
      room_name: legacyRoom.room_name,
      location: legacyRoom.location || null,
      building: legacyRoom.building || null,
      floor: legacyRoom.floor ?? null,
      is_simulated: legacyRoom.is_simulated ?? false,
      capacity: legacyRoom.capacity ?? null,
      status: (legacyRoom.availability === "occupied" ? "Padat" : "Kosong") as any,
      person_count: null,
      available_seats: legacyRoom.capacity ?? null,
      occupancy_pct_raw: null,
      occupancy_pct_display: null,
      recommendations: [],
      is_stale: false,
      age_seconds: null,
      updated_at: null,
    };
  }, [legacyRoom]);

  // Cari ruangan dari data live occupancy atau fallback ke legacy
  const room = roomId
    ? occupancyList.find((r) => r.room_id === roomId) ?? null
    : legacyOccupancy;

  // Tutup modal bila ruangan hilang dari data (mis. saklar simulasi dimatikan)
  useEffect(() => {
    if (roomId && !room) {
      onClose();
    }
  }, [roomId, room, onClose]);

  // Tangani fokus, scroll lock, dan tombol Escape
  useEffect(() => {
    if (!room) return;

    if (!triggerRef.current && typeof document !== "undefined") {
      triggerRef.current = document.activeElement as HTMLElement;
    }

    dialogRef.current?.focus();

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", handleGlobalKeyDown);
      triggerRef.current?.focus();
      triggerRef.current = null;
    };
  }, [room, onClose]);

  if (!room) return null;

  const meta = statusMeta[room.status] || statusMeta["Tidak tersedia"];
  const locationText = room.building
    ? `${room.building} · Lantai ${room.floor ?? "-"}`
    : "Gedung belum diatur";

  const isSpecialStatus =
    room.status === "Tidak tersedia" ||
    room.status === "Kapasitas belum dikonfigurasi";

  const progressPct =
    room.occupancy_pct_display !== null && room.occupancy_pct_display !== undefined
      ? Math.min(100, Math.max(0, room.occupancy_pct_display))
      : 0;

  const recommendations = room.recommendations?.slice(0, 3) ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-[520px] flex flex-col relative animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[92vh] sm:max-h-[85vh] outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id={titleId}
                  className="font-heading text-xl font-bold text-secondary-dark truncate"
                >
                  {room.room_name}
                </h2>
                {room.is_simulated && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold px-2 py-0.5 border-amber-400 text-amber-700 bg-amber-50 shrink-0"
                  >
                    Simulasi
                  </Badge>
                )}
              </div>
              <p className="text-xs text-secondary mt-1 truncate">{locationText}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-secondary-dark hover:bg-[#E2E8F0] transition-all shrink-0"
              aria-label="Tutup"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 pb-2">
          {/* Dua tile */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Tile Okupansi */}
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-neutral-border">
              <div className="flex items-center gap-1.5 mb-2">
                <Users size={14} className="text-secondary-light" />
                <span className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider">
                  Okupansi
                </span>
              </div>
              {isSpecialStatus ? (
                <p className="text-xs text-secondary font-medium">
                  {room.status === "Tidak tersedia"
                    ? "Data tidak tersedia"
                    : "Kapasitas belum diatur"}
                </p>
              ) : (
                <>
                  <p className="font-heading text-lg font-bold text-secondary-dark leading-tight">
                    {room.person_count !== null ? room.person_count : "-"} /{" "}
                    {room.capacity !== null ? room.capacity : "-"}{" "}
                    <span className="text-xs font-medium text-secondary">kursi</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-sm font-bold text-secondary-dark">{progressPct}%</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta.badgeClass}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Tile Sisa kursi */}
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-neutral-border">
              <div className="flex items-center gap-1.5 mb-2">
                <Armchair size={14} className="text-secondary-light" />
                <span className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider">
                  Sisa kursi
                </span>
              </div>
              {isSpecialStatus ? (
                <p className="text-xs text-secondary font-medium">
                  {room.status === "Tidak tersedia"
                    ? "Data tidak tersedia"
                    : "Kapasitas belum diatur"}
                </p>
              ) : (
                <p className="font-heading text-2xl font-bold text-secondary-dark leading-tight">
                  {room.available_seats !== null ? room.available_seats : "-"}
                </p>
              )}
            </div>
          </div>

          {/* Baris status data */}
          <div className="flex items-center justify-between text-[11px] text-secondary mb-5">
            <div className="flex items-center gap-1">
              <Clock size={12} className="text-secondary-light" />
              <span>Diperbarui {formatAge(room.age_seconds)}</span>
            </div>
            {room.is_stale && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                <AlertTriangle size={10} />
                Data basi
              </span>
            )}
          </div>

          {/* Rekomendasi (hanya Padat) */}
          {room.status === "Padat" && (
            <div className="mb-4">
              <h3 className="text-[11px] font-bold text-secondary-dark uppercase tracking-wider mb-2">
                Rekomendasi ruangan lain
              </h3>
              {recommendations.length === 0 ? (
                <p className="text-xs text-secondary py-3 text-center bg-[#F8FAFC] rounded-lg border border-neutral-border">
                  Tidak ada ruangan alternatif yang tersedia saat ini.
                </p>
              ) : (
                <div className="space-y-2">
                  {recommendations.map((rec) => (
                    <RecommendationItem
                      key={rec.room_id}
                      rec={rec}
                      onView={() => onNavigateRoom?.(rec.room_id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: aksi admin (hanya dirender bila ada aksi yang tampil) */}
        {isAdmin && !room.is_simulated && (
          <div className="px-6 pb-5 pt-3 shrink-0 border-t border-neutral-border/50 space-y-2">
            <Button
              onClick={() => {
                onClose();
                router.push(`/rooms/${room.room_id}`);
              }}
              className="w-full bg-primary-dark hover:bg-primary text-white py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-colors shadow-sm"
            >
              <span>Go to Room Management</span>
              <ArrowRight size={16} />
            </Button>
            {onDeleteRoom && (
              <button
                type="button"
                onClick={() => {
                  onDeleteRoom({ room_id: room.room_id, room_name: room.room_name });
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-tertiary hover:bg-tertiary/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 size={13} />
                Hapus ruangan
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-komponen item rekomendasi
function RecommendationItem({
  rec,
  onView,
}: {
  rec: RoomRecommendation;
  onView: () => void;
}) {
  const meta = statusMeta[rec.status as keyof typeof statusMeta];
  const locText = rec.building
    ? `${rec.building} · Lantai ${rec.floor ?? "-"}`
    : "Gedung belum diatur";

  return (
    <div className="p-3 bg-white rounded-lg border border-neutral-border shadow-xs flex flex-col gap-1.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-secondary-dark truncate">
            {rec.room_name || rec.room_id}
          </span>
          {rec.is_simulated && (
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 border-amber-400 text-amber-700 bg-amber-50 shrink-0"
            >
              Simulasi
            </Badge>
          )}
        </div>
        {meta && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${meta.badgeClass}`}>
            {rec.status}
          </span>
        )}
      </div>

      <div className="text-[11px] text-secondary">{locText}</div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-secondary">
          {formatPercent(rec.occupancy_pct)} · {formatSeats(rec.available_seats)}
        </span>
        {rec.reason && (
          <span className="text-[10px] text-secondary-light italic truncate ml-2">
            {rec.reason}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onView}
        className="mt-0.5 self-end text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
      >
        Lihat
        <ArrowRight size={11} />
      </button>
    </div>
  );
}
