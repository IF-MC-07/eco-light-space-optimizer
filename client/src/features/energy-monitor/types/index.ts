export interface RealtimeSeriesPoint {
  time: string;
  date: string;
  actual: number;
  baseline: number;
}

export interface ChartSeriesPoint {
  label: string;
  usage: number;
  savings: number;
  efficiency: number;
}

export interface EnergySummary {
  current_consumption: number;
  today_usage: number;
  today_saved: number;
  monthly_usage: number;
  monthly_saved: number;
  chart_series?: ChartSeriesPoint[];
  realtime_series?: RealtimeSeriesPoint[];
}

export interface EnergyLogData {
  log_id: string;
  room_id: string;
  date: string;
  total_watts: number;
  saved_watts: number;
  Room?: {
    room_name: string;
  };
}

export interface EnergyBreakdown {
  room_id: string;
  room_name: string;
  total_watts: number;
  saved_watts: number;
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
