"use client";
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { useEnergyLogs } from '../../energy-monitor/hooks';
import { ChartSkeleton, ErrorState, EmptyState } from '../../../components/ui/StateFeedback';

export function EnergyTrendsChart() {
  const { data: response, isLoading, isError, refetch } = useEnergyLogs({ range: 'day' });
  const source = response || [];

  const chartData = useMemo(() => {
    return source.map((item: any) => ({
      time: item.label || item.date || item.time || 'N/A',
      value: Number(item.usage ?? item.total_watts ?? item.value ?? 0),
    }));
  }, [source]);

  return (
    <Card className="min-h-[400px] flex flex-col bg-[#F5F7F5] border-transparent">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl text-black font-heading font-bold">Energy Usage Trends</CardTitle>
          <p className="text-sm text-secondary mt-1 font-medium">Daily consumption across all zones</p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-6 pt-6 flex flex-col justify-center">
        {isLoading ? (
          <div className="px-6">
            <ChartSkeleton height={260} />
          </div>
        ) : isError ? (
          <ErrorState
            message="Gagal memuat tren penggunaan energi"
            onRetry={() => refetch()}
          />
        ) : chartData.length === 0 ? (
          <EmptyState
            message="Tidak ada data tren energi hari ini"
            description="Belum ada pembacaan konsumsi energi yang tercatat untuk hari ini."
          />
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4D1E" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#1B4D1E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} 
                  dy={15} 
                />
                <YAxis hide domain={['dataMin - 10', 'dataMax + 20']} />
                <Tooltip 
                  cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value} W`, 'Power']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#1B4D1E" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
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
