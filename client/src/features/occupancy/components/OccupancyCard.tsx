import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import type { RoomOccupancy } from '../types';
import { statusMeta, formatAge } from '../utils';

interface OccupancyCardProps {
  room: RoomOccupancy;
  onClick?: () => void;
}

export function OccupancyCard({ room, onClick }: OccupancyCardProps) {
  const meta = statusMeta[room.status] || statusMeta['Tidak tersedia'];
  const locationText = room.building
    ? `${room.building} · Lantai ${room.floor ?? '-'}`
    : 'Gedung belum diatur';

  const isSpecialStatus =
    room.status === 'Tidak tersedia' || room.status === 'Kapasitas belum dikonfigurasi';

  const progressPct =
    room.occupancy_pct_display !== null && room.occupancy_pct_display !== undefined
      ? Math.min(100, Math.max(0, room.occupancy_pct_display))
      : 0;

  const recCount = room.recommendations?.length ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-neutral-border/50 hover:shadow-md transition-shadow cursor-pointer relative flex flex-col text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
    >
      <div className="p-5 flex flex-col h-full">
        {/* Baris 1: Nama ruangan, badge Simulasi, badge status */}
        <div className="flex justify-between items-start gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h3 className="text-base font-heading font-bold text-black truncate">{room.room_name}</h3>
            {room.is_simulated && (
              <Badge
                variant="outline"
                className="text-[10px] font-semibold px-2 py-0.5 border-amber-400 text-amber-700 bg-amber-50 shrink-0"
              >
                Simulasi
              </Badge>
            )}
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide shrink-0 whitespace-nowrap ${meta.badgeClass}`}
          >
            {meta.label}
          </span>
        </div>

        {/* Baris 2: Gedung · Lantai */}
        <p className="text-xs text-secondary mb-3 truncate">{locationText}</p>

        {/* Baris 3: Data okupansi atau pesan khusus */}
        {room.status === 'Tidak tersedia' ? (
          <p className="text-xs text-secondary mb-3">Data tidak tersedia</p>
        ) : room.status === 'Kapasitas belum dikonfigurasi' ? (
          <p className="text-xs text-secondary mb-3">Kapasitas belum diatur</p>
        ) : (
          <div className="mb-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-secondary font-medium">
                {room.person_count !== null ? room.person_count : '-'} /{' '}
                {room.capacity !== null ? room.capacity : '-'} orang
              </span>
              <span className="font-bold text-secondary-dark">{progressPct}%</span>
            </div>
            <div className="w-full bg-neutral-muted/30 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${meta.barClass}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Baris alternatif (hanya Padat) */}
        {room.status === 'Padat' && (
          <div className="text-xs text-secondary mb-3 flex items-center gap-1">
            {recCount > 0 ? (
              <>
                <span className="font-medium">{recCount} ruangan alternatif</span>
                <ArrowRight size={12} className="text-secondary-light" />
              </>
            ) : (
              <span>Tidak ada alternatif</span>
            )}
          </div>
        )}

        {/* Footer: Waktu diperbarui & penanda basi */}
        <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-secondary">
          <div className="flex items-center gap-1">
            <Clock size={11} className="text-secondary-light" />
            <span>Diperbarui {formatAge(room.age_seconds)}</span>
          </div>

          {room.is_stale && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
              <AlertTriangle size={10} />
              Data basi
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
