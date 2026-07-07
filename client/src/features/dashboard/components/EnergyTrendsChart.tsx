"use client";
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { usePowerSensors } from '../../energy-monitor/hooks';

export function EnergyTrendsChart() {
  const [activeTab, setActiveTab] = useState('Day');
  const { data: response } = usePowerSensors();
  const sensors = response?.data || [];

  const chartData = useMemo(() => {
    if (sensors.length === 0) {
      // Fallback static data
      return [
        { time: '08:00 AM', value: 40 },
        { time: '10:00 AM', value: 45 },
        { time: '12:00 PM', value: 60 },
        { time: '02:00 PM', value: 35 },
        { time: '04:00 PM', value: 80 },
        { time: '06:00 PM', value: 45 },
      ];
    }

    // Group sensor readings by time bucket
    const buckets: Record<string, number[]> = {};

    sensors.forEach((s: any) => {
      const date = new Date(s.read_at);
      if (isNaN(date.getTime())) return;

      let key: string;
      if (activeTab === 'Day') {
        // Group by hour
        const hour = date.getHours();
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        key = `${String(displayHour).padStart(2, '0')}:00 ${ampm}`;
      } else if (activeTab === 'Week') {
        // Group by day of week
        key = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        // Group by date
        key = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      }

      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(parseFloat(s.power_watts) || 0);
    });

    return Object.entries(buckets)
      .map(([time, readings]) => ({
        time,
        value: parseFloat((readings.reduce((a, b) => a + b, 0) / readings.length).toFixed(1)),
      }))
      .slice(0, activeTab === 'Day' ? 12 : activeTab === 'Week' ? 7 : 30);
  }, [sensors, activeTab]);

  return (
    <Card className="min-h-[400px] flex flex-col bg-[#F5F7F5] border-transparent">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl text-black font-heading font-bold">Energy Usage Trends</CardTitle>
          <p className="text-sm text-secondary mt-1 font-medium">Consumption across all zones today</p>
        </div>
        <div className="flex items-center p-1 bg-neutral-border/30 rounded-lg border border-neutral-border">
          {['Day', 'Week', 'Month'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1 text-xs font-bold rounded-md transition-colors ${
                activeTab === tab 
                  ? 'bg-white shadow-sm text-black' 
                  : 'text-secondary hover:text-black'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-6 pt-10">
        <div className="h-full w-full">
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
      </CardContent>
    </Card>
  );
}

