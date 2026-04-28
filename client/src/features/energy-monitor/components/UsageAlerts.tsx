import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';

export function UsageAlerts() {
  const alerts = [
    {
      id: 1,
      title: 'HVAC Optimization',
      desc: 'Building A: Load shifted to off-peak',
      time: '12m ago',
      color: 'bg-primary-dark'
    },
    {
      id: 2,
      title: 'Spike Detected',
      desc: 'Lab C: Abnormal draw in Sub-level 2',
      time: '45m ago',
      color: 'bg-red-500'
    },
    {
      id: 3,
      title: 'System Check Pass',
      desc: 'Solar array telemetry synchronized',
      time: '2h ago',
      color: 'bg-primary-dark'
    }
  ];

  return (
    <Card className="border-transparent shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 flex flex-row items-center justify-between">
        <CardTitle className="text-[11px] font-bold text-black uppercase tracking-widest">Usage Alerts</CardTitle>
        <span className="px-2 py-0.5 bg-[#FCE7F3] text-tertiary text-[10px] font-bold rounded-md tracking-wider">
          2 NEW
        </span>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-6">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex gap-4 relative">
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${alert.color}`}></div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-black mb-0.5">{alert.title}</h4>
              <p className="text-[10px] text-secondary-light font-medium mb-1">{alert.desc}</p>
              <span className="text-[9px] text-secondary font-bold uppercase tracking-widest">{alert.time}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
