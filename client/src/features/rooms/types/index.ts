export enum RoomStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE'
}

export enum DeviceType {
  AC = 'AC',
  LIGHTING = 'LIGHTING',
  PROJECTOR = 'PROJECTOR',
  SENSOR = 'SENSOR',
  OTHER = 'OTHER'
}

export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR'
}

export enum DayOfWeek {
  MON = 'MON',
  TUE = 'TUE',
  WED = 'WED',
  THU = 'THU',
  FRI = 'FRI',
  SAT = 'SAT',
  SUN = 'SUN'
}

export interface Schedule {
  id: string;
  deviceId: string;
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface Device {
  id: string;
  roomId: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  ipAddress: string;
  macAddress: string;
  lastSeen: string;
  schedule?: Schedule;
}

export interface Room {
  id: string;
  name: string;
  floor: string;
  building: string;
  capacity: number;
  status: RoomStatus;
  createdAt: string;
  devices: Device[];
}

export interface RoomFilters {
  status?: RoomStatus | string;
  building?: string;
  floor?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface RoomStats {
  totalRooms: number;
  activeRooms: number;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
}

export interface CreateRoomPayload {
  name: string;
  floor: string;
  building: string;
  capacity: number;
}

export interface UpdateRoomPayload extends Partial<CreateRoomPayload> {
  status?: RoomStatus | string;
}

export interface CreateDevicePayload {
  roomId: string;
  name: string;
  type: DeviceType | string;
  ipAddress: string;
  macAddress: string;
}

export interface UpdateDevicePayload extends Partial<CreateDevicePayload> {
  status?: DeviceStatus | string;
}

export interface CreateSchedulePayload {
  deviceId: string;
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface UpdateSchedulePayload extends Partial<CreateSchedulePayload> {}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
