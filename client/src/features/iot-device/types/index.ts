export interface IotDevice {
  device_id: string;
  room_id: string;
  device_name: string;
  device_type: string;
  status: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
