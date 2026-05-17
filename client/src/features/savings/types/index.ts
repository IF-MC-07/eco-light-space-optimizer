export interface SavingsSummary {
  total_saved_watts: number;
  today_saved_watts: number;
  co2_saved_kg: number;
  cost_saved_idr: number;
}

export interface SavingsBreakdown {
  room_id: string;
  room_name: string;
  saved_watts: number;
  total_watts: number;
  percentage: number;
}

export interface SavingsTrend {
  date: string;
  saved_watts: number;
}

export interface YoYComparisonData {
  last_year_watts: number;
  this_year_watts: number;
  reduction_percentage: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
