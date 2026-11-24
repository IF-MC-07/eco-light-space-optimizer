"use client";
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useSavingsTrend } from '../hooks';
import { ChartSkeleton, ErrorState, EmptyState } from '../../../components/ui/StateFeedback';

interface SavingsTrendChartProps {
  filters: {
    range_type: string;
    start_date: string;
    end_date: string;
  };
}

export function SavingsTrendChart({ filters }: SavingsTrendChartProps) {
  const { data: response, isLoading, isError, refetch } = useSavingsTrend(filters);
  const trendData = response || [];

  const { formattedData, hasBaseline } = useMemo(() => {
    let baselineFound = false;

    const data = trendData.map((item: any) => {
      const actual = item.actual_kwh ?? item.total_kwh ?? item.value ?? 0;
      const baseline =
        item.baseline_kwh !== null && item.baseline_kwh !== undefined
          ? Number(Number(item.baseline_kwh).toFixed(3))
          : null;

      if (baseline !== null) {
        baselineFound = true;
      }

      return {
        dateLabel: item.label || 'N/A',
        actual_kwh: Number(Number(actual).toFixed(3)),
        baseline_kwh: baseline,
      };
    });

    return { formattedData: data, hasBaseline: baselineFound };
  }, [trendData]);

  return (
    <Card className="min-h-[400px] flex flex-col border-transparent bg-[#F5F7F5] shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between px-6 pt-6">
        <div>
          <CardTitle className="text-lg text-black font-heading font-bold">
            Energy Consumption Trend & Baseline
          </CardTitle>
          <p className="text-xs text-secondary-light font-semibold mt-1">
            Comparison of actual energy vs historical baseline over the selected time range
          </p>
        </div>
        {trendData.length > 0 && !isLoading && !isError && (
          <div className="flex items-center space-x-4 text-[10px] font-bold text-secondary uppercase tracking-widest">
            <div className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-dark mr-1.5"></span>
              Actual Consumption
            </div>
            {hasBaseline && (
              <div className="flex items-center">
                <span className="w-3.5 h-0.5 border-t-2 border-dashed border-slate-500 mr-1.5"></span>
                Baseline
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-6 pt-6 px-0 min-h-0 flex flex-col justify-center">
        {isLoading ? (
          <div className="px-6">
            <ChartSkeleton height={260} />
          </div>
        ) : isError ? (
          <ErrorState
            message="Failed to load energy consumption chart"
            onRetry={() => refetch()}
          />
        ) : trendData.length === 0 ? (
          <EmptyState
            message="No energy consumption data for this period"
            description="No energy readings recorded for the selected date range."
          />
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedData} margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActualKwh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4D1E" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1B4D1E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="dateLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }}
                  width={40}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip
                  cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any, name: string) => {
                    if (value === null || value === undefined) return ['—', name];
                    const label = name === 'actual_kwh' ? 'Actual Consumption' : 'Baseline';
                    return [`${Number(value).toFixed(3)} kWh`, label];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="actual_kwh"
                  name="actual_kwh"
                  stroke="#1B4D1E"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorActualKwh)"
                  activeDot={{ r: 6, fill: '#1B4D1E', stroke: '#fff', strokeWidth: 2 }}
                />
                {hasBaseline && (
                  <Line
                    type="monotone"
                    dataKey="baseline_kwh"
                    name="baseline_kwh"
                    stroke="#64748b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 5, fill: '#64748b' }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
