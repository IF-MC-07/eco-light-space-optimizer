export interface EnergySummary {
  current_consumption: number;
  today_usage: number;
  today_saved: number;
  monthly_usage: number;
  monthly_saved: number;
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
