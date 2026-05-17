"use client";
import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Clock } from 'lucide-react';
import { useEnergySummary } from '../hooks';

export function MonitorStats() {
  const { data: response, isLoading } = useEnergySummary();
  const summary = response?.data;

  const todayUsageKwh = summary ? (summary.today_usage / 1000).toFixed(1) : '8.5';
  const todaySavedKwh = summary ? (summary.today_saved / 1000).toFixed(1) : '1.5';

  if (isLoading) {
    return <div className="text-center py-4">Loading energy stats...</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-6 mb-6">
      <Card className="border-transparent shadow-sm">
        <CardContent className="p-5 mt-5">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Today's Consumption</p>
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-2xl font-heading font-bold text-black">{todayUsageKwh} kWh</h3>
            <span className="text-xs font-bold text-primary">+8%</span>
          </div>
          <p className="text-xs text-secondary-light font-medium">vs yesterday average</p>
        </CardContent>
      </Card>

      <Card className="border-transparent shadow-sm">
        <CardContent className="p-5 mt-5">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Peak Usage Time</p>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-primary-dark" />
            <h3 className="text-xl font-heading font-bold text-black">2:00 PM - 4:00 PM</h3>
          </div>
          <p className="text-xs text-secondary-light font-medium">High load window</p>
        </CardContent>
      </Card>

      <Card className="border-transparent shadow-sm">
        <CardContent className="p-5 mt-5">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Energy Saved Today</p>
          <div className="mb-1">
            <h3 className="text-2xl font-heading font-bold text-black">{todaySavedKwh} kWh saved</h3>
          </div>
          <p className="text-xs text-secondary-light font-medium">This day's optimization</p>
        </CardContent>
      </Card>

      <Card className="border-transparent shadow-sm">
        <CardContent className="p-5 mt-5">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">System Efficiency</p>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-3xl font-heading font-bold text-black">94%</h3>
            <span className="px-2 py-0.5 bg-[#bbf7d0] text-primary-dark text-[10px] font-bold rounded-md uppercase tracking-wider">
              Optimal
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
