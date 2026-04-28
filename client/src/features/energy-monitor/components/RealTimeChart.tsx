import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { time: '08:00', actual: 40, baseline: 30 },
  { time: '10:00', actual: 45, baseline: 40 },
  { time: '12:00', actual: 40, baseline: 45 },
  { time: '14:00', actual: 42, baseline: 50 },
  { time: '16:00', actual: 80, baseline: 55 },
  { time: '18:00', actual: 45, baseline: 50 },
  { time: '20:00', actual: 85, baseline: 40 },
];

export function RealTimeChart() {
  return (
    <Card className="h-[300px] flex flex-col border-transparent bg-[#F5F7F5] shadow-sm mb-6">
      <CardHeader className="pb-2 flex flex-row items-start justify-between px-6 pt-6">
        <div>
          <CardTitle className="text-lg text-black font-heading font-bold mb-1">Real-Time Energy Consumption</CardTitle>
          <p className="text-xs text-secondary font-medium">Live telemetry stream (5s resolution)</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-secondary uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary-dark"></div>
            Actual
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-neutral-border"></div>
            Baseline
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4 pt-4 px-0">
        <div className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B4D1E" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#1B4D1E" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E2E8F0" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#E2E8F0" stopOpacity={0}/>
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
              />
              <Area 
                type="monotone" 
                dataKey="baseline" 
                stroke="#E2E8F0" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorBaseline)" 
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
      </CardContent>
    </Card>
  );
}
