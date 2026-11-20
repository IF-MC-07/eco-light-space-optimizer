"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useEnergySummary } from '../hooks';
import { ChartSkeleton, ErrorState, EmptyState } from '../../../components/ui/StateFeedback';

export function RealTimeChart() {
  const { data: response, isLoading, isError, refetch } = useEnergySummary();
  const series = response?.realtime_series || [];

  return (
    <Card className="min-h-[300px] flex flex-col border-transparent bg-[#F5F7F5] shadow-sm mb-6">
      <CardHeader className="pb-2 flex flex-row items-start justify-between px-6 pt-6">
        <div>
          <CardTitle className="text-lg text-black font-heading font-bold mb-1">Energy Consumption (kW)</CardTitle>
        </div>
        {series.length > 0 && !isLoading && !isError && (
          <div className="flex items-center gap-4 text-[10px] font-bold text-secondary uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary-dark"></div>
              Actual
            </div>
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
            message="Gagal memuat grafik konsumsi real-time"
            onRetry={() => refetch()}
          />
        ) : series.length === 0 ? (
          <EmptyState
            message="Tidak ada data konsumsi energi real-time"
            description="Belum ada pembacaan sensor energi yang tercatat untuk 24 jam terakhir."
          />
        ) : (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4D1E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1B4D1E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} 
                  dy={10} 
                />
                <Tooltip 
                  cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => [`${val} kW`, 'Actual']}
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#1B4D1E" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorActual)" 
                  activeDot={{ r: 6, fill: "#1B4D1E", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
