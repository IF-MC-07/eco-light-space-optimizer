"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useSavingsTrend } from '../hooks';

export function SavingsTrendChart() {
  const { data: response, isLoading } = useSavingsTrend();
  const trendData = response?.data || [];

  const formattedData = trendData.length > 0 
    ? trendData.map((item: any) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        delta: Number((item.savings_percentage ?? 0).toFixed(1)),
      }))
    : [
        { date: 'Mon', delta: 12 },
        { date: 'Tue', delta: 8 },
        { date: 'Wed', delta: -3 },
        { date: 'Thu', delta: 15 },
        { date: 'Fri', delta: -2 },
        { date: 'Sat', delta: 10 },
        { date: 'Sun', delta: 6 },
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
            Saving
          </div>
          <div className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2"></span>
            Waste
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
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
              <Tooltip formatter={(value: number) => [`${value}%`, 'Savings delta']} />
              <Bar dataKey="delta" radius={[2, 2, 0, 0]} barSize={24}>
                {formattedData.map((entry, idx) => (
                  <Cell key={`${entry.date}-${idx}`} fill={entry.delta >= 0 ? '#1B4D1E' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
