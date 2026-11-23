export interface Holiday {
  holiday_id?: string;
  holiday_date: string;
  name: string;
  holiday_name?: string; // compat
  type: 'nasional' | 'cuti_bersama' | 'kampus';
  is_national_holiday?: boolean; // compat
  suspend_rules?: boolean;
  source_ref?: string;
}

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
