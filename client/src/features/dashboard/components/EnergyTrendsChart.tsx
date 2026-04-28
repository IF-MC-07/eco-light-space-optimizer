import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

const data = [
  { time: '08:00 AM', value: 40 },
  { time: '10:00 AM', value: 45 },
  { time: '12:00 PM', value: 60 },
  { time: '02:00 PM', value: 35 },
  { time: '04:00 PM', value: 80 },
  { time: '06:00 PM', value: 45 },
];

export function EnergyTrendsChart() {
  const [activeTab, setActiveTab] = useState('Day');

  return (
    <Card className="h-[400px] flex flex-col bg-[#F5F7F5] border-transparent">
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
            <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
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
