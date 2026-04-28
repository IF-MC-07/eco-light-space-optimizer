import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export function ActivityFeed() {
  const alerts = [
    {
      id: 1,
      title: "Main Lobby AC Filter Overdue",
      description: "Efficiency dropped by 8%",
      time: "12 mins ago",
      icon: <AlertCircle className="w-4 h-4 text-tertiary" />,
      bgClass: "bg-tertiary/10"
    },
    {
      id: 2,
      title: "Night Schedule Initiated",
      description: "Zone 4 & Zone 7 entered low-power mode",
      time: "2 hours ago",
      icon: <Clock className="w-4 h-4 text-blue-600" />,
      bgClass: "bg-blue-50"
    },
    {
      id: 3,
      title: "Peak Demand Window Closed",
      description: "Systems returning to standard setpoints",
      time: "4 hours ago",
      icon: <CheckCircle2 className="w-4 h-4 text-primary" />,
      bgClass: "bg-[#bbf7d0]"
    }
  ];

  return (
    <Card className="border-transparent shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-sm font-bold text-black">Recent System Alerts</CardTitle>
        <a href="#" className="text-xs font-bold text-primary hover:text-primary-dark transition-colors">
          View History
        </a>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${alert.bgClass}`}>
                {alert.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-black mb-0.5 truncate">{alert.title}</p>
                <p className="text-xs text-secondary truncate">{alert.description}</p>
              </div>
              <div className="text-[11px] text-secondary-light font-medium whitespace-nowrap">
                {alert.time}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
