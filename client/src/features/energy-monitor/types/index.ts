export interface RealtimeSeriesPoint {
  time: string;
  bucket?: string;
  actual_kwh: number;
  baseline_kwh: number | null;
  // Compat
  actual?: number;
  baseline?: number | null;
}

export interface ChartSeriesPoint {
  label: string;
  usage: number;
  savings: number;
  efficiency: number;
}

export interface RoomEnergyBreakdown {
  room_id: string;
  room_name: string;
  is_simulated?: boolean;
  actual_kwh: number | null;
  baseline_kwh: number | null;
  delta_kwh: number | null;
  has_sensor: boolean;
  // Compat
  total_watts?: number;
  saved_watts?: number;
}

export interface EnergySummary {
  today_usage_kwh?: number;
  today_baseline_kwh?: number | null;
  today_delta_kwh?: number | null;
  status?: string;
  coverage?: {
    days_with_data: number;
    expected_days: number;
    ratio: number;
  };
  compared_buckets?: number;
  total_buckets?: number;
  realtime_series?: RealtimeSeriesPoint[];
  by_room?: RoomEnergyBreakdown[];
  // Compat
  today_usage?: number;
  today_saved?: number;
  current_consumption?: number;
  monthly_usage?: number;
  monthly_saved?: number;
  chart_series?: ChartSeriesPoint[];
}

export interface EnergyLogData {
  log_id: string;
  room_id: string;
  date: string;
  actual_kwh?: number;
  baseline_kwh?: number | null;
  total_watts?: number;
  saved_watts?: number;
  Room?: {
    room_name: string;
  };
}

export interface EnergyBreakdown {
  room_id: string;
  room_name: string;
  is_simulated?: boolean;
  actual_kwh?: number | null;
  baseline_kwh?: number | null;
  delta_kwh?: number | null;
  has_sensor?: boolean;
  total_watts?: number;
  saved_watts?: number;
}

export interface PowerSensorData {
  sensor_id: string;
  room_id: string;
  sensor_name: string;
  power_watts: number;
  read_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
