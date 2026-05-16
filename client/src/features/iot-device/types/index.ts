export interface IotDevice {
  device_id: number;
  room_id: number;
  device_name: string;
  device_type: string;
  status: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
