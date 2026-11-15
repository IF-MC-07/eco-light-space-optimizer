export type OccupancyStatus =
  | 'Kosong'
  | 'Rendah'
  | 'Sedang'
  | 'Padat'
  | 'Tidak tersedia'
  | 'Kapasitas belum dikonfigurasi';

export interface RoomRecommendation {
  room_id: string;
  room_name: string | null;
  building: string | null;
  floor: string | number | null;
  occupancy_pct: number;
  available_seats: number;
  status: OccupancyStatus | string;
  is_simulated: boolean;
  reason: string;
}

export interface RoomOccupancy {
  room_id: string;
  room_name: string;
  location: string | null;
  building: string | null;
  floor: string | number | null;
  is_simulated: boolean;
  capacity: number | null;
  status: OccupancyStatus;
  confirmed_status?: OccupancyStatus;
  candidate_status?: string | null;
  candidate_count?: number;
  person_count: number | null;
  available_seats: number | null;
  occupancy_pct_raw: number | null;
  occupancy_pct_display: number | null;
  recommendations: RoomRecommendation[];
  is_stale: boolean;
  age_seconds: number | null;
  updated_at: string | null;
}

export interface OccupancyListParams {
  include_simulated?: boolean;
  only_simulated?: boolean;
}

