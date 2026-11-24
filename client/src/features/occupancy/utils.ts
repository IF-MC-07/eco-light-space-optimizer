import type { OccupancyStatus } from './types';

export interface StatusMetaItem {
  label: string;
  badgeClass: string;
  dotClass: string;
  barClass: string;
  textClass: string;
}

export const statusMeta: Record<OccupancyStatus, StatusMetaItem> = {
  Padat: {
    label: 'Crowded',
    badgeClass: 'bg-tertiary/10 text-tertiary border-tertiary/30',
    dotClass: 'bg-tertiary',
    barClass: 'bg-tertiary',
    textClass: 'text-tertiary',
  },
  Sedang: {
    label: 'Moderate',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    dotClass: 'bg-amber-500',
    barClass: 'bg-amber-500',
    textClass: 'text-amber-700',
  },
  Rendah: {
    label: 'Low',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotClass: 'bg-emerald-500',
    barClass: 'bg-emerald-500',
    textClass: 'text-emerald-700',
  },
  Kosong: {
    label: 'Empty',
    badgeClass: 'bg-[#bbf7d0] text-primary border-primary/20',
    dotClass: 'bg-primary',
    barClass: 'bg-primary',
    textClass: 'text-primary',
  },
  'Tidak tersedia': {
    label: 'Unavailable',
    badgeClass: 'bg-neutral-muted/20 text-secondary border-neutral-border',
    dotClass: 'bg-secondary-light',
    barClass: 'bg-secondary-light',
    textClass: 'text-secondary',
  },
  'Kapasitas belum dikonfigurasi': {
    label: 'Capacity not configured',
    badgeClass: 'bg-secondary/10 text-secondary-dark border-secondary/20',
    dotClass: 'bg-secondary',
    barClass: 'bg-secondary',
    textClass: 'text-secondary-dark',
  },
};

export const isAvailableStatus = (status: string): boolean => {
  return status === 'Kosong' || status === 'Rendah' || status === 'Sedang';
};

export const isNeedsCheckStatus = (status: string): boolean => {
  return status === 'Tidak tersedia' || status === 'Kapasitas belum dikonfigurasi';
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
  return `${availableSeats} ${availableSeats === 1 ? 'seat' : 'seats'}`;
};

export const formatAge = (ageSeconds: number | null): string => {
  if (ageSeconds === null || ageSeconds === undefined) {
    return 'unknown';
  }
  if (ageSeconds < 15) {
    return 'just now';
  }
  if (ageSeconds < 60) {
    return `${Math.floor(ageSeconds)}s ago`;
  }
  return `${Math.floor(ageSeconds / 60)}m ago`;
};

