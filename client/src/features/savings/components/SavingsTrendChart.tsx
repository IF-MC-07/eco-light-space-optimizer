import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'JAN', current: 0, previous: 250 },
  { month: 'FEB', current: 0, previous: 250 },
  { month: 'MAR', current: 0, previous: 250 },
  { month: 'APR', current: 0, previous: 250 },
  { month: 'MAY', current: 300, previous: 250 },
  { month: 'JUN', current: 350, previous: 250 },
  { month: 'JUL', current: 400, previous: 250 },
  { month: 'AUG', current: 0, previous: 250 },
  { month: 'SEP', current: 0, previous: 250 },
  { month: 'OCT', current: 0, previous: 250 },
  { month: 'NOV', current: 0, previous: 250 },
  { month: 'DEC', current: 0, previous: 250 },
];

export function SavingsTrendChart() {
  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg text-black">Savings Trend</CardTitle>
          <p className="text-sm text-secondary mt-1">Monthly cumulative efficiency projection</p>
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
      <CardContent className="flex-1 pb-6">
        <div className="h-full w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={0}>
              <XAxis 
                dataKey="month" 
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
