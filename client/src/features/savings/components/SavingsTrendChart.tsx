"use client";
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useSavingsTrend } from '../hooks';

interface SavingsTrendChartProps {
  filters: {
    range_type: string;
    start_date: string;
    end_date: string;
  };
}

export function SavingsTrendChart({ filters }: SavingsTrendChartProps) {
  const { data: response, isLoading } = useSavingsTrend(filters);
  const trendData = response || [];

  const formattedData = useMemo(() => {
    if (trendData.length > 0) {
      return trendData.map((item: any) => ({
        dateLabel: item.label || 'N/A',
        kwh: Number(((item.total_watts || 0) / 1000).toFixed(3)),
        savedKwh: Number(((item.saved_watts || 0) / 1000).toFixed(3))
      }));
    }
    // Fallback static data
    return [
      { dateLabel: 'Mon', kwh: 1.2 },
      { dateLabel: 'Tue', kwh: 0.8 },
      { dateLabel: 'Wed', kwh: 1.5 },
      { dateLabel: 'Thu', kwh: 0.9 },
      { dateLabel: 'Fri', kwh: 1.1 },
      { dateLabel: 'Sat', kwh: 0.7 },
      { dateLabel: 'Sun', kwh: 0.6 }
    ];
  }, [trendData]);

  if (isLoading) {
    return <div className="text-center py-20 text-xs text-secondary">Loading savings chart...</div>;
  }

  return (
    <Card className="h-[400px] flex flex-col border-transparent bg-[#F5F7F5] shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between px-6 pt-6">
        <div>
          <CardTitle className="text-lg text-black font-heading font-bold">Accumulated Energy Consumption</CardTitle>
          <p className="text-xs text-secondary-light font-semibold mt-1">Total energy usage (kWh) across the selected period</p>
        </div>
        <div className="flex items-center space-x-4 text-[10px] font-bold text-secondary uppercase tracking-widest">
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-primary-dark mr-1.5"></span>
            Usage
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-6 pt-10 px-0 min-h-0">
        <div className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
              <defs>
                <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B4D1E" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#1B4D1E" stopOpacity={0}/>
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
                width={30}
              />
              <Tooltip 
                cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${value.toFixed(3)} kWh`, 'Energy Consumption']}
              />
              <Area 
                type="monotone" 
                dataKey="kwh" 
                stroke="#1B4D1E" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorKwh)" 
                activeDot={{ r: 6, fill: "#1B4D1E", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
