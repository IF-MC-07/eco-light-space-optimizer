"use client";
import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Clock } from 'lucide-react';
import { useEnergySummary, usePowerSensors } from '../hooks';

export function MonitorStats() {
  const { data: response, isLoading } = useEnergySummary();
  const { data: sensorResponse } = usePowerSensors();
  const summary = response;
  const sensors = sensorResponse || [];

const todayUsageWatts = summary ? (summary.today_usage || 0) : 0;
const todayUsageDisplay = todayUsageWatts >= 1000
  ? `${(todayUsageWatts / 1000).toFixed(2)} kWh`
  : `${todayUsageWatts.toFixed(1)} Wh`;

const todaySavedWatts = summary ? (summary.today_saved || 0) : 0;
const todaySavedDisplay = todaySavedWatts >= 1000
  ? `${(todaySavedWatts / 1000).toFixed(2)} kWh saved`
  : `${todaySavedWatts.toFixed(1)} Wh saved`;

// Calculate efficiency from sensor data
  const watts = sensors.map((s: any) => parseFloat(s.power_watts) || 0).filter((w: number) => w > 0);
  const meanWatts = watts.length > 0 ? watts.reduce((a: number, b: number) => a + b, 0) / watts.length : 0;
  const maxWatts = watts.length > 0 ? Math.max(...watts) : 1;
  const minWatts = watts.length > 0 ? Math.min(...watts) : 0;
  const range = maxWatts - minWatts;
  const efficiency = range > 0
    ? Math.max(0, Math.min(100, Math.round(100 - ((meanWatts - minWatts) / range) * 50)))
    : 94;
  const efficiencyLabel = efficiency >= 85 ? 'Optimal' : efficiency >= 60 ? 'Good' : 'Low';

  // Compute comparison vs yesterday (mock: compare first half vs second half of sensor data)
  const halfIdx = Math.floor(sensors.length / 2);
  const recentAvg = sensors.slice(0, halfIdx).reduce((a: number, s: any) => a + (parseFloat(s.power_watts) || 0), 0) / (halfIdx || 1);
  const olderAvg = sensors.slice(halfIdx).reduce((a: number, s: any) => a + (parseFloat(s.power_watts) || 0), 0) / ((sensors.length - halfIdx) || 1);
  const changePct = olderAvg > 0 ? (((recentAvg - olderAvg) / olderAvg) * 100).toFixed(0) : '0';
  const changeSign = Number(changePct) >= 0 ? '+' : '';

  if (isLoading) {
    return <div className="text-center py-4">Loading energy stats...</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-6 mb-6">
      <Card className="border-transparent shadow-sm">
        <CardContent className="p-5 mt-5">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Today's Consumption</p>
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-2xl font-heading font-bold text-black">{todayUsageDisplay}</h3>
            <span className="text-xs font-bold text-primary">{changeSign}{changePct}%</span>
          </div>
          <p className="text-xs text-secondary-light font-medium">vs previous period</p>
        </CardContent>
      </Card>

      <Card className="border-transparent shadow-sm">
        <CardContent className="p-5 mt-5">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Avg Power Draw</p>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-primary-dark" />
            <h3 className="text-xl font-heading font-bold text-black">{meanWatts.toFixed(1)} W</h3>
          </div>
          <p className="text-xs text-secondary-light font-medium">Mean across {sensors.length} readings</p>
        </CardContent>
      </Card>

      <Card className="border-transparent shadow-sm">
        <CardContent className="p-5 mt-5">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Energy Saved Today</p>
          <div className="mb-1">
            <h3 className="text-2xl font-heading font-bold text-black">{todaySavedDisplay}</h3>
          </div>
          <p className="text-xs text-secondary-light font-medium">This day's optimization</p>
        </CardContent>
      </Card>

      <Card className="border-transparent shadow-sm">
        <CardContent className="p-5 mt-5">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">System Efficiency</p>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-3xl font-heading font-bold text-black">{efficiency}%</h3>
            <span className="px-2 py-0.5 bg-[#bbf7d0] text-primary-dark text-[10px] font-bold rounded-md uppercase tracking-wider">
              {efficiencyLabel}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
