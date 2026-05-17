"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';
import { useSavingsTrend } from '../hooks';

export function SavingsTrendChart() {
  const { data: response, isLoading } = useSavingsTrend();
  const trendData = response?.data || [];

  const formattedData = trendData.length > 0 
    ? trendData.map(t => ({
        date: new Date(t.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        current: parseFloat((t.saved_watts / 1000).toFixed(1)),
        previous: parseFloat((t.saved_watts / 1000 * 0.85).toFixed(1)) // Mock comparison
      }))
    : [
        { date: 'Mon', current: 1.2, previous: 1.0 },
        { date: 'Tue', current: 1.5, previous: 1.2 },
        { date: 'Wed', current: 1.8, previous: 1.4 },
        { date: 'Thu', current: 1.4, previous: 1.2 },
        { date: 'Fri', current: 2.0, previous: 1.6 },
        { date: 'Sat', current: 0.8, previous: 0.7 },
        { date: 'Sun', current: 0.9, previous: 0.8 },
      ];

  if (isLoading) {
    return <div className="text-center py-4">Loading savings trend...</div>;
  }

  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg text-black">Savings Trend</CardTitle>
          <p className="text-sm text-secondary mt-1">Daily cumulative efficiency comparison (kWh)</p>
        </div>
        <div className="flex items-center space-x-4 text-sm font-medium text-secondary">
          <div className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-dark mr-2"></span>
            Current
          </div>
          <div className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 mr-2"></span>
            Previous
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-6 min-h-0">
        <div className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={4}>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} 
                dy={10} 
              />
              <Bar dataKey="previous" fill="#E2E8F0" radius={[2, 2, 0, 0]} barSize={24} />
              <Bar dataKey="current" fill="#1B4D1E" radius={[2, 2, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
