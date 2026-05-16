export enum RoomStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export interface Room {
  room_id: string;
  room_name: string;
  location: string;
  capacity: number;
  status: RoomStatus;
}

export interface IotDevice {
  device_id: string;
  room_id: string;
  device_name: string;
  type: string;
  status: string;
}

export interface AutomationSchedule {
  schedule_id: string;
  room_id: string;
  user_id: string;
  schedule_name: string;
  start_time: string;
  end_time: string;
}

export interface RoomStats {
  totalRooms: number;
  activeRooms: number;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
