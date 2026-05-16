export interface AutomationSchedule {
  schedule_id: string;
  room_id: string;
  user_id: string;
  schedule_name: string;
  start_time: string;
  end_time: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
