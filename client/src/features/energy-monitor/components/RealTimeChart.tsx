"use client";
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { AreaChart, Area, Line, XAxis, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { useEnergySummary } from '../hooks';
import { ChartSkeleton, ErrorState, EmptyState } from '../../../components/ui/StateFeedback';

export function RealTimeChart() {
  const { data: response, isLoading, isError, refetch } = useEnergySummary();
  const rawSeries = response?.realtime_series || [];

  const { series, hasBaseline } = useMemo(() => {
    let baselineFound = false;
    const formatted = rawSeries.map((item: any) => {
      const actual = item.actual_kwh ?? item.actual ?? 0;
      const baseline =
        item.baseline_kwh !== null && item.baseline_kwh !== undefined
          ? Number(Number(item.baseline_kwh).toFixed(3))
          : item.baseline !== null && item.baseline !== undefined
          ? Number(Number(item.baseline).toFixed(3))
          : null;

      if (baseline !== null) {
        baselineFound = true;
      }

      return {
        time: item.time || '00:00',
        actual_kwh: Number(Number(actual).toFixed(3)),
        baseline_kwh: baseline,
      };
    });

    return { series: formatted, hasBaseline: baselineFound };
  }, [rawSeries]);

  return (
    <Card className="min-h-[300px] flex flex-col border-transparent bg-[#F5F7F5] shadow-sm mb-6">
      <CardHeader className="pb-2 flex flex-row items-start justify-between px-6 pt-6">
        <div>
          <CardTitle className="text-lg text-black font-heading font-bold mb-1">
            Konsumsi Energi Real-Time (kWh)
          </CardTitle>
          <p className="text-xs text-secondary-light font-medium">
            Hourly energy readings today vs historical baseline
          </p>
        </div>
        {series.length > 0 && !isLoading && !isError && (
          <div className="flex items-center gap-4 text-[10px] font-bold text-secondary uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-dark"></div>
              Aktual
            </div>
            {hasBaseline && (
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 border-t-2 border-dashed border-slate-500"></span>
                Baseline
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-4 pt-4 px-0 flex flex-col justify-center">
        {isLoading ? (
          <div className="px-6">
            <ChartSkeleton height={200} />
          </div>
        ) : isError ? (
          <ErrorState
            message="Failed to load real-time consumption chart"
            onRetry={() => refetch()}
          />
        ) : series.length === 0 ? (
          <EmptyState
            message="No real-time energy consumption data"
            description="No energy sensor readings recorded for today."
          />
        ) : (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4D1E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1B4D1E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }}
                  width={35}
                />
                <Tooltip
                  cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(val: any, name: string) => {
                    if (val === null || val === undefined) return ['—', name];
                    const label = name === 'actual_kwh' ? 'Aktual' : 'Baseline';
                    return [`${Number(val).toFixed(3)} kWh`, label];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="actual_kwh"
                  name="actual_kwh"
                  stroke="#1B4D1E"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorActual)"
                  activeDot={{ r: 6, fill: '#1B4D1E', stroke: '#fff', strokeWidth: 2 }}
                />
                {hasBaseline && (
                  <Line
                    type="monotone"
                    dataKey="baseline_kwh"
                    name="baseline_kwh"
                    stroke="#64748b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
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
