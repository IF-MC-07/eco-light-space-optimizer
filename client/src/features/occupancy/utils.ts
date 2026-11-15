import type { OccupancyStatus } from './types';

export interface StatusMetaItem {
  label: OccupancyStatus;
  badgeClass: string;
  dotClass: string;
  barClass: string;
  textClass: string;
}

export const statusMeta: Record<OccupancyStatus, StatusMetaItem> = {
  Padat: {
    label: 'Padat',
    badgeClass: 'bg-tertiary/10 text-tertiary border-tertiary/30',
    dotClass: 'bg-tertiary',
    barClass: 'bg-tertiary',
    textClass: 'text-tertiary',
  },
  Sedang: {
    label: 'Sedang',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    dotClass: 'bg-amber-500',
    barClass: 'bg-amber-500',
    textClass: 'text-amber-700',
  },
  Rendah: {
    label: 'Rendah',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotClass: 'bg-emerald-500',
    barClass: 'bg-emerald-500',
    textClass: 'text-emerald-700',
  },
  Kosong: {
    label: 'Kosong',
    badgeClass: 'bg-[#bbf7d0] text-primary border-primary/20',
    dotClass: 'bg-primary',
    barClass: 'bg-primary',
    textClass: 'text-primary',
  },
  'Tidak tersedia': {
    label: 'Tidak tersedia',
    badgeClass: 'bg-neutral-muted/20 text-secondary border-neutral-border',
    dotClass: 'bg-secondary-light',
    barClass: 'bg-secondary-light',
    textClass: 'text-secondary',
  },
  'Kapasitas belum dikonfigurasi': {
    label: 'Kapasitas belum dikonfigurasi',
    badgeClass: 'bg-secondary/10 text-secondary-dark border-secondary/20',
    dotClass: 'bg-secondary',
    barClass: 'bg-secondary',
    textClass: 'text-secondary-dark',
  },
};

export const STATUS_FILTER_ORDER: readonly OccupancyStatus[] = [
  'Padat',
  'Sedang',
  'Rendah',
  'Kosong',
  'Tidak tersedia',
  'Kapasitas belum dikonfigurasi',
];

export const formatPercent = (v: number | null): string => {
  if (v === null || v === undefined) {
    return '-';
  }
  return `${v}%`;
};

export const formatSeats = (availableSeats: number | null): string => {
  if (availableSeats === null || availableSeats === undefined) {
    return '-';
  }
  return `${availableSeats} kursi`;
};

export const formatAge = (ageSeconds: number | null): string => {
  if (ageSeconds === null || ageSeconds === undefined) {
    return 'tidak diketahui';
  }
  if (ageSeconds < 15) {
    return 'baru saja';
  }
  if (ageSeconds < 60) {
    return `${Math.floor(ageSeconds)} dtk lalu`;
  }
  return `${Math.floor(ageSeconds / 60)} mnt lalu`;
};

