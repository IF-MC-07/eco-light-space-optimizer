export interface AutomationSchedule {
  schedule_id: string;
  room_id: string;
  user_id: string;
  schedule_name: string;
  start_time: string;
  end_time: string;
  /** Comma-separated active days, e.g. 'MON,TUE,WED,THU,FRI'. Empty = every day. */
  schedule_days: string;
}


export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
