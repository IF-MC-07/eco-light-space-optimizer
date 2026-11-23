export interface CoverageData {
  days_with_data: number;
  expected_days: number;
  ratio: number;
}

export interface SavingsSummary {
  current_kwh: number;
  baseline_kwh: number | null;
  delta_kwh: number | null;
  delta_pct: number | null;
  status: string;
  coverage: CoverageData;
  total_kwh?: number;
  total_wh?: number;
  // Compat
  total_saved_watts?: number;
  today_saved_watts?: number;
  co2_saved_kg?: number;
  cost_saved_idr?: number;
}

export interface SavingsBreakdown {
  room_id: string;
  room_name: string;
  is_simulated?: boolean;
  actual_kwh: number | null;
  baseline_kwh: number | null;
  delta_kwh: number | null;
  has_sensor: boolean;
  total_kwh?: number | null;
  total_wh?: number | null;
  percentage?: number | null;
  // Compat
  saved_watts?: number | null;
  total_watts?: number | null;
  has_savings_data?: boolean;
}

export interface SavingsTrend {
  date: string;
  label: string;
  actual_kwh: number;
  baseline_kwh: number | null;
  value?: number;
  total_kwh?: number;
  total_wh?: number;
  unit?: string;
  // Compat
  saved_watts?: number;
}

export interface PowerStatsData {
  efficiency_score?: number;
  total_kwh?: number;
  mean_watts?: number;
  max_watts?: number;
  sample_count?: number;
}

export interface PeriodStats {
  start?: string | Date;
  end?: string | Date;
  total_kwh?: number;
  total_wh?: number;
  // Compat
  total_watts?: number;
  saved_watts?: number;
}

export interface Insight {
  rule_id: 'insufficient_data' | 'saving' | 'waste' | 'neutral' | 'top_room_deviation' | 'coverage_warning' | string;
  severity: 'info' | 'success' | 'warning' | 'error' | 'neutral' | string;
  text_key: string;
  title: string;
  message: string;
  recommendation?: string | null;
  params: Record<string, any>;
  evidence: {
    rule_id: string;
    threshold?: string | number | Record<string, any>;
    [key: string]: any;
  };
}

export interface YoYComparisonData {
  status: 'insufficient_baseline' | 'saving' | 'waste' | 'neutral' | string;
  current_kwh: number;
  baseline_kwh: number | null;
  delta_kwh: number | null;
  change_percentage: number | null;
  coverage: CoverageData;
  meta?: {
    baseline_weeks: number;
    generated_at: string;
  };
  insights?: Insight[];
  current_period?: PeriodStats;
  previous_period?: PeriodStats;
  difference_wh?: number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
