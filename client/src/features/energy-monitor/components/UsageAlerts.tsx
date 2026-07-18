import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { usePowerSensors } from '../hooks';

const POWER_THRESHOLD = 100; // watts — alert if room avg exceeds this

function formatRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function UsageAlerts() {
  const { data: response } = usePowerSensors();
  const sensors = response || [];

  // Get latest reading per room
  const latestByRoom: Record<string, any> = {};
  sensors.forEach((s: any) => {
    if (!s.room_id) return;
    if (!latestByRoom[s.room_id] || new Date(s.read_at) > new Date(latestByRoom[s.room_id].read_at)) {
      latestByRoom[s.room_id] = s;
    }
  });

  const alertSensors = Object.values(latestByRoom)
    .sort((a: any, b: any) => new Date(b.read_at).getTime() - new Date(a.read_at).getTime())
    .slice(0, 3);

  const newAlertsCount = alertSensors.filter((s: any) => s.power_watts > POWER_THRESHOLD).length;

  const staticAlerts = [
    { title: 'HVAC Optimization', desc: 'Building A: Load shifted to off-peak', time: '12m ago', color: 'bg-primary-dark' },
    { title: 'Spike Detected', desc: 'Lab C: Abnormal draw in Sub-level 2', time: '45m ago', color: 'bg-red-500' },
    { title: 'System Check Pass', desc: 'Solar array telemetry synchronized', time: '2h ago', color: 'bg-primary-dark' },
  ];

  const displayAlerts = alertSensors.length > 0
    ? alertSensors.map((s: any) => {
        const isHigh = s.power_watts > POWER_THRESHOLD;
        return {
          title: isHigh ? 'High Usage Detected' : 'Normal Reading',
          desc: `${s.Room?.room_name || s.room_id}: ${s.power_watts?.toFixed(1)}W at ${s.voltage_v?.toFixed(0)}V`,
          time: formatRelativeTime(s.read_at),
          color: isHigh ? 'bg-red-500' : 'bg-primary-dark',
        };
      })
    : staticAlerts;

  return (
    <Card className="border-transparent shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 flex flex-row items-center justify-between">
        <CardTitle className="text-[11px] font-bold text-black uppercase tracking-widest">Usage Alerts</CardTitle>
        {newAlertsCount > 0 && (
          <span className="px-2 py-0.5 bg-[#FCE7F3] text-tertiary text-[10px] font-bold rounded-md tracking-wider">
            {newAlertsCount} NEW
          </span>
        )}
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-6">
        {displayAlerts.map((alert, idx) => (
          <div key={idx} className="flex gap-4 relative">
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${alert.color}`}></div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-black mb-0.5">{alert.title}</h4>
              <p className="text-[10px] text-secondary-light font-medium mb-1">{alert.desc}</p>
              <span className="text-[9px] text-secondary font-bold uppercase tracking-widest">{alert.time}</span>
            </div>
          </div>
        ))}
        {alertSensors.length === 0 && sensors.length === 0 && (
          <p className="text-xs text-secondary-light text-center py-2">No sensor data available.</p>
        )}
      </CardContent>
    </Card>
  );
}

