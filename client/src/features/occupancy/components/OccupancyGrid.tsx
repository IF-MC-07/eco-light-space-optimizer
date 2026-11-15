import React, { useState, useMemo } from 'react';
import type { RoomOccupancy, OccupancyStatus } from '../types';
import { STATUS_FILTER_ORDER, statusMeta } from '../utils';
import { OccupancyCard } from './OccupancyCard';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface OccupancyGridProps {
  occupancyList: RoomOccupancy[];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  showSimulated: boolean;
  onToggleSimulated: (checked: boolean) => void;
  onSelectRoom?: (room: RoomOccupancy) => void;
  onDeleteRoom?: (room: RoomOccupancy) => void;
}

export function OccupancyGrid({
  occupancyList,
  isLoading,
  isError,
  onRetry,
  showSimulated,
  onToggleSimulated,
  onSelectRoom,
  onDeleteRoom,
}: OccupancyGridProps) {
  const [selectedStatus, setSelectedStatus] = useState<OccupancyStatus | null>(null);

  // Hitung jumlah ruangan per status
  const statusCounts = useMemo(() => {
    const counts: Record<OccupancyStatus, number> = {
      Padat: 0,
      Sedang: 0,
      Rendah: 0,
      Kosong: 0,
      'Tidak tersedia': 0,
      'Kapasitas belum dikonfigurasi': 0,
    };
    for (const item of occupancyList) {
      if (item.status in counts) {
        counts[item.status]++;
      }
    }
    return counts;
  }, [occupancyList]);

  // Filter ruangan berdasarkan status terpilih
  const filteredList = useMemo(() => {
    if (!selectedStatus) return occupancyList;
    return occupancyList.filter((item) => item.status === selectedStatus);
  }, [occupancyList, selectedStatus]);

  // State loading skeleton
  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        {/* Skeleton Toolbar */}
        <div className="h-10 bg-neutral-muted/20 rounded-xl animate-pulse" />
        {/* Skeleton 6 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-64 rounded-xl border border-neutral-border bg-white p-5 space-y-4 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="h-5 bg-neutral-muted/40 rounded w-1/2" />
                <div className="h-5 bg-neutral-muted/40 rounded w-16" />
              </div>
              <div className="h-4 bg-neutral-muted/30 rounded w-1/3" />
              <div className="h-12 bg-neutral-muted/20 rounded-lg" />
              <div className="h-2 bg-neutral-muted/40 rounded-full" />
              <div className="h-4 bg-neutral-muted/30 rounded w-1/4 mt-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // State error
  if (isError) {
    return (
      <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-neutral-border">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3">
          <AlertCircle size={24} />
        </div>
        <h3 className="font-heading font-bold text-lg text-secondary-dark mb-1">
          Gagal Memuat Ketersediaan Ruangan
        </h3>
        <p className="text-sm text-secondary mb-5 max-w-md">
          Terjadi kendala saat menyinkronkan data ketersediaan dengan sistem. Silakan coba beberapa saat lagi.
        </p>
        {onRetry && (
          <Button
            onClick={onRetry}
            className="bg-primary-dark hover:bg-primary text-white flex items-center gap-2"
          >
            <RefreshCw size={14} />
            <span>Coba Lagi</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Toolbar Atas: Filter Status & Toggle Simulasi */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-neutral-border shadow-xs">
        {/* Filter per status */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedStatus(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              selectedStatus === null
                ? 'bg-secondary-dark text-white border-secondary-dark shadow-xs'
                : 'bg-neutral text-secondary border-neutral-border hover:bg-neutral-border/50'
            }`}
          >
            Semua ({occupancyList.length})
          </button>

          {STATUS_FILTER_ORDER.map((status) => {
            const count = statusCounts[status];
            const meta = statusMeta[status];
            const isSelected = selectedStatus === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(isSelected ? null : status)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isSelected
                    ? `${meta.badgeClass} ring-2 ring-primary/40 font-bold`
                    : 'bg-neutral text-secondary border-neutral-border hover:bg-neutral-border/50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                <span>{meta.label}</span>
                <span className="text-[11px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Toggle Tampilkan Ruangan Simulasi */}
        <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
          <label
            htmlFor="toggle-simulated"
            className="text-xs font-semibold text-secondary-dark cursor-pointer select-none"
          >
            Tampilkan ruangan simulasi
          </label>
          <Switch
            id="toggle-simulated"
            checked={showSimulated}
            onCheckedChange={onToggleSimulated}
          />
        </div>
      </div>

      {/* Grid Kartu Ruangan */}
      {filteredList.length === 0 ? (
        <div className="w-full py-16 text-center bg-white rounded-xl border border-neutral-border text-secondary">
          <p className="text-sm font-medium">Tidak ada ruangan yang sesuai dengan filter.</p>
          {selectedStatus && (
            <button
              type="button"
              onClick={() => setSelectedStatus(null)}
              className="mt-2 text-xs font-bold text-primary hover:underline"
            >
              Reset filter status
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((room) => (
            <OccupancyCard
              key={room.room_id}
              room={room}
              onClick={() => onSelectRoom?.(room)}
              {...(onDeleteRoom ? { onDelete: () => onDeleteRoom(room) } : {})}
            />
          ))}
        </div>
      )}
    </div>
  );
}

