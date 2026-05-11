export interface User {
  user_id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export interface Room {
  room_id: string;
  room_name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Zone {
  zone_id?: number;
  camera_id: number;
  zone_name: string;
  x1_pct: number;
  y1_pct: number;
  x2_pct: number;
  y2_pct: number;
  color: string;
  skew_x?: number;
  skew_y?: number;
  status?: 'aktif' | 'nonaktif';
  urutan?: number;
}

export interface IoTDevice {
  device_id: string;
  zone_id: string;
  device_name: string;
  device_type: string; // 'LAMPU' | 'AC'
  status: string; // 'ON' | 'OFF'
  brightness_level?: number;
  temperature?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Camera {
  camera_id: string;
  zone_id: string;
  camera_name: string;
  stream_url: string;
  status: string; // 'AKTIF' | 'NONAKTIF'
  created_at?: string;
  updated_at?: string;
}

export interface PowerSensor {
  sensor_id: string;
  zone_id: string;
  sensor_name: string;
  status: string; // 'AKTIF' | 'NONAKTIF'
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: User;
}

export interface EnergyLog {
  energy_log_id: string;
  sensor_id: string;
  consumption_wh: number;
  log_time: string;
}

export interface DetectionLog {
  detection_log_id: string;
  camera_id: string;
  person_count: number;
  detection_time: string;
  proof_image?: string;
}

export interface LightControl {
  light_control_id: string;
  device_id: string;
  status: string; // 'ON' | 'OFF'
  brightness_level?: number;
  control_time: string;
  controlled_by?: string;
}

export interface ACControl {
  ac_control_id: string;
  device_id: string;
  status: string; // 'ON' | 'OFF'
  temperature?: number;
  control_time: string;
  controlled_by?: string;
}

export interface AutomationSchedule {
  schedule_id: string;
  device_id: string;
  start_time: string;
  end_time: string;
  days: string; // e.g., '1,2,3,4,5' for weekdays
  status: string; // 'AKTIF' | 'NONAKTIF'
  created_at?: string;
  updated_at?: string;
}
