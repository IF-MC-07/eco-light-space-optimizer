import React, { useState, useMemo, useEffect } from 'react';
import type { RoomOccupancy, OccupancyStatus } from '../types';
import { isAvailableStatus, isNeedsCheckStatus } from '../utils';
import { OccupancyCard } from './OccupancyCard';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useMe } from '@/features/auth/hooks';

type FilterCategory = 'all' | 'padat' | 'tersedia' | 'perlu_dicek';
type SortOption = 'lowest_occupancy' | 'busy_first' | 'name_asc';

interface OccupancyGridProps {
  occupancyList: RoomOccupancy[];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  showSimulated: boolean;
  onToggleSimulated: (checked: boolean) => void;
  onSelectRoom?: (roomId: string) => void;
  isAdmin?: boolean;
}

function getStatusRank(status: OccupancyStatus): number {
  switch (status) {
    case 'Padat':
      return 1;
    case 'Sedang':
      return 2;
    case 'Rendah':
      return 3;
    case 'Kosong':
      return 4;
    case 'Tidak tersedia':
    case 'Kapasitas belum dikonfigurasi':
    default:
      return 5;
  }
}

function compareLowestOccupancy(a: RoomOccupancy, b: RoomOccupancy): number {
  const aSpecial = isNeedsCheckStatus(a.status);
  const bSpecial = isNeedsCheckStatus(b.status);

  if (aSpecial && !bSpecial) return 1;
  if (!aSpecial && bSpecial) return -1;
  if (aSpecial && bSpecial) {
    const nameCmp = a.room_name.localeCompare(b.room_name, 'id', { numeric: true });
    if (nameCmp !== 0) return nameCmp;
    return a.room_id.localeCompare(b.room_id);
  }

  const pctA = a.occupancy_pct_raw ?? a.occupancy_pct_display ?? 0;
  const pctB = b.occupancy_pct_raw ?? b.occupancy_pct_display ?? 0;
  if (pctA !== pctB) {
    return pctA - pctB;
  }

  const nameCmp = a.room_name.localeCompare(b.room_name, 'id', { numeric: true });
  if (nameCmp !== 0) return nameCmp;
  return a.room_id.localeCompare(b.room_id);
}

function compareBusyFirst(a: RoomOccupancy, b: RoomOccupancy): number {
  const rankA = getStatusRank(a.status);
  const rankB = getStatusRank(b.status);

  if (rankA !== rankB) {
    return rankA - rankB;
  }

  const pctA = a.occupancy_pct_raw ?? a.occupancy_pct_display ?? -1;
  const pctB = b.occupancy_pct_raw ?? b.occupancy_pct_display ?? -1;
  if (pctA !== pctB) {
    return pctB - pctA;
  }

  const nameCmp = a.room_name.localeCompare(b.room_name, 'id', { numeric: true });
  if (nameCmp !== 0) return nameCmp;
  return a.room_id.localeCompare(b.room_id);
}

function compareNameAsc(a: RoomOccupancy, b: RoomOccupancy): number {
  const nameCmp = a.room_name.localeCompare(b.room_name, 'id', { numeric: true });
  if (nameCmp !== 0) return nameCmp;
  return a.room_id.localeCompare(b.room_id);
}

export function OccupancyGrid({
  occupancyList,
  isLoading,
  isError,
  onRetry,
  showSimulated,
  onToggleSimulated,
  onSelectRoom,
  isAdmin: propIsAdmin,
}: OccupancyGridProps) {
  const { data: userData } = useMe();
  const effectiveIsAdmin = propIsAdmin ?? (userData?.user?.role === 'admin');

  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [userSortOption, setUserSortOption] = useState<SortOption | null>(null);

  const effectiveSortOption: SortOption =
    userSortOption ?? (effectiveIsAdmin ? 'busy_first' : 'lowest_occupancy');

  // Hitung jumlah ruangan per kategori filter
  const counts = useMemo(() => {
    let padat = 0;
    let tersedia = 0;
    let perluDicek = 0;

    for (const item of occupancyList) {
      if (item.status === 'Padat') {
        padat++;
      } else if (isAvailableStatus(item.status)) {
        tersedia++;
      } else if (isNeedsCheckStatus(item.status)) {
        perluDicek++;
      }
    }

    return {
      all: occupancyList.length,
      padat,
      tersedia,
      perluDicek,
    };
  }, [occupancyList]);

  // Jika filter aktif menjadi 0 setelah saklar simulasi diubah, kembalikan ke "Semua"
  useEffect(() => {
    if (filterCategory === 'padat' && counts.padat === 0) {
      setFilterCategory('all');
    } else if (filterCategory === 'tersedia' && counts.tersedia === 0) {
      setFilterCategory('all');
    } else if (filterCategory === 'perlu_dicek' && counts.perluDicek === 0) {
      setFilterCategory('all');
    }
  }, [filterCategory, counts]);

  // Filter ruangan berdasarkan kategori terpilih
  const filteredList = useMemo(() => {
    switch (filterCategory) {
      case 'padat':
        return occupancyList.filter((r) => r.status === 'Padat');
      case 'tersedia':
        return occupancyList.filter((r) => isAvailableStatus(r.status));
      case 'perlu_dicek':
        return occupancyList.filter((r) => isNeedsCheckStatus(r.status));
      case 'all':
      default:
        return occupancyList;
    }
  }, [occupancyList, filterCategory]);

  // Urutkan hasil filter sesuai pilihan pengurutan
  const displayedList = useMemo(() => {
    const list = [...filteredList];
    switch (effectiveSortOption) {
      case 'lowest_occupancy':
        return list.sort(compareLowestOccupancy);
      case 'busy_first':
        return list.sort(compareBusyFirst);
      case 'name_asc':
        return list.sort(compareNameAsc);
      default:
        return list;
    }
  }, [filteredList, effectiveSortOption]);

  // State loading skeleton
  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        {/* Skeleton Toolbar */}
        <div className="h-10 bg-neutral-muted/20 rounded-xl animate-pulse" />
        {/* Skeleton 6 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-48 rounded-xl border border-neutral-border bg-white p-5 space-y-4 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="h-5 bg-neutral-muted/40 rounded w-1/2" />
                <div className="h-5 bg-neutral-muted/40 rounded w-16" />
              </div>
              <div className="h-4 bg-neutral-muted/30 rounded w-1/3" />
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
      {/* Toolbar Atas: Filter Status, Dropdown Urutkan, & Toggle Simulasi */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-neutral-border shadow-xs">
        {/* Chip status: 4 chip dalam satu baris */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Semua (n) */}
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              filterCategory === 'all'
                ? 'bg-secondary-dark text-white border-secondary-dark shadow-xs font-bold'
                : 'bg-neutral text-secondary border-neutral-border hover:bg-neutral-border/50'
            }`}
          >
            Semua ({counts.all})
          </button>

          {/* Padat (n) */}
          <button
            type="button"
            disabled={counts.padat === 0}
            onClick={() => setFilterCategory('padat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              counts.padat === 0
                ? 'opacity-40 cursor-not-allowed bg-neutral text-secondary border-neutral-border'
                : filterCategory === 'padat'
                ? 'bg-tertiary/10 text-tertiary border-tertiary ring-2 ring-tertiary/40 font-bold'
                : 'bg-neutral text-secondary border-neutral-border hover:bg-neutral-border/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-tertiary shrink-0" />
            <span>Padat</span>
            <span className="text-[11px] opacity-75">({counts.padat})</span>
          </button>

          {/* Tersedia (n) */}
          <button
            type="button"
            disabled={counts.tersedia === 0}
            onClick={() => setFilterCategory('tersedia')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              counts.tersedia === 0
                ? 'opacity-40 cursor-not-allowed bg-neutral text-secondary border-neutral-border'
                : filterCategory === 'tersedia'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/40 font-bold'
                : 'bg-neutral text-secondary border-neutral-border hover:bg-neutral-border/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Tersedia</span>
            <span className="text-[11px] opacity-75">({counts.tersedia})</span>
          </button>

          {/* Perlu dicek (n) - Hanya dirender untuk admin */}
          {effectiveIsAdmin && (
            <button
              type="button"
              disabled={counts.perluDicek === 0}
              onClick={() => setFilterCategory('perlu_dicek')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                counts.perluDicek === 0
                  ? 'opacity-40 cursor-not-allowed bg-neutral text-secondary border-neutral-border'
                  : filterCategory === 'perlu_dicek'
                  ? 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-500/40 font-bold'
                  : 'bg-neutral text-secondary border-neutral-border hover:bg-neutral-border/50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>Perlu dicek</span>
              <span className="text-[11px] opacity-75">({counts.perluDicek})</span>
            </button>
          )}
        </div>

        {/* Kontrol Kanan: Dropdown Urutkan & Toggle Simulasi */}
        <div className="flex items-center gap-4 flex-wrap shrink-0 self-end lg:self-center">
          {/* Dropdown Urutkan */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-select"
              className="text-xs font-semibold text-secondary-dark whitespace-nowrap"
            >
              Urutkan:
            </label>
            <select
              id="sort-select"
              value={effectiveSortOption}
              onChange={(e) => setUserSortOption(e.target.value as SortOption)}
              className="bg-neutral text-secondary-dark border border-neutral-border text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="lowest_occupancy">Okupansi terendah</option>
              <option value="busy_first">Padat dulu</option>
              <option value="name_asc">Nama (A-Z)</option>
            </select>
          </div>

          {/* Toggle Tampilkan Ruangan Simulasi */}
          <div className="flex items-center gap-2.5">
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
      </div>

      {/* Grid Kartu Ruangan */}
      {displayedList.length === 0 ? (
        <div className="w-full py-16 text-center bg-white rounded-xl border border-neutral-border text-secondary">
          <p className="text-sm font-medium">Tidak ada ruangan yang sesuai dengan filter.</p>
          {filterCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className="mt-2 text-xs font-bold text-primary hover:underline"
            >
              Reset filter status
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-fr">
          {displayedList.map((room) => (
            <OccupancyCard
              key={room.room_id}
              room={room}
              onClick={() => onSelectRoom?.(room.room_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
