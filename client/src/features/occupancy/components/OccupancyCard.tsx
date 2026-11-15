import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Trash2, MapPin, Users, Clock, AlertTriangle } from 'lucide-react';
import type { RoomOccupancy } from '../types';
import { statusMeta, formatAge } from '../utils';
import { RecommendationList } from './RecommendationList';

interface OccupancyCardProps {
  room: RoomOccupancy;
  onClick?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export function OccupancyCard({ room, onClick, onDelete }: OccupancyCardProps) {
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

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer relative group flex flex-col justify-between"
      onClick={onClick}
    >
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-tertiary hover:text-white z-10"
          title="Hapus Ruangan"
        >
          <Trash2 size={14} />
        </button>
      )}

      <CardContent className="p-5 flex flex-col h-full">
        {/* Header Kartu: Nama Ruangan & Badges */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap pr-6">
            <h3 className="text-xl font-heading font-bold text-black">{room.room_name}</h3>
            {room.is_simulated && (
              <Badge
                variant="outline"
                className="text-[10px] font-semibold px-2 py-0.5 border-amber-400 text-amber-700 bg-amber-50"
              >
                Simulasi
              </Badge>
            )}
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide shrink-0 ${meta.badgeClass}`}
          >
            {meta.label}
          </span>
        </div>

        {/* Lokasi Gedung & Lantai */}
        <div className="flex items-center text-xs text-secondary mb-3">
          <MapPin size={13} className="mr-1 shrink-0 text-secondary-light" />
          <span className="truncate">{locationText}</span>
        </div>

        {/* Badan Kartu Berdasarkan Status */}
        <div className="space-y-3 mb-3">
          {room.status === 'Tidak tersedia' ? (
            <div className="py-2 px-3 bg-neutral rounded-lg border border-neutral-border text-xs text-secondary font-medium">
              Data tidak tersedia
            </div>
          ) : room.status === 'Kapasitas belum dikonfigurasi' ? (
            <div className="py-2 px-3 bg-secondary/5 rounded-lg border border-secondary/20 text-xs text-secondary-dark font-medium">
              Kapasitas belum diatur
            </div>
          ) : (
            <>
              {/* Jumlah Orang / Kapasitas */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary flex items-center gap-1 font-medium">
                  <Users size={13} className="text-secondary-light" />
                  {room.person_count !== null ? room.person_count : '-'} /{' '}
                  {room.capacity !== null ? room.capacity : '-'} orang
                </span>
                <span className="font-bold text-secondary-dark">{progressPct}%</span>
              </div>

              {/* Bilah Progres */}
              <div className="w-full bg-neutral-muted/30 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${meta.barClass}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Sisa Kursi */}
              <div className="text-xs text-secondary font-medium">
                Sisa kursi:{' '}
                <span className="font-semibold text-secondary-dark">
                  {room.available_seats !== null ? room.available_seats : '-'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Rekomendasi Ruangan jika Padat */}
        {room.status === 'Padat' && room.recommendations && (
          <RecommendationList recommendations={room.recommendations} />
        )}

        {/* Baris Bawah: Waktu Diperbarui & Penanda Data Basi */}
        <div className="mt-auto pt-3 border-t border-neutral-border flex items-center justify-between text-[11px] text-secondary">
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-secondary-light" />
            <span>Diperbarui {formatAge(room.age_seconds)}</span>
          </div>

          {room.is_stale && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
              <AlertTriangle size={11} />
              Data basi
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

