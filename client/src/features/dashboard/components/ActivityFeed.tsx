import React from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";

export function ActivityFeed() {
  const alerts = [
    {
      id: 1,
      title: "Main Lobby AC Filter Overdue",
      description: "Efficiency dropped by 8%",
      time: "12 mins ago",
      icon: <AlertCircle className="w-4 h-4 text-tertiary" />,
      bg: "bg-tertiary/10",
    },
    {
      id: 2,
      title: "Night Schedule Initiated",
      description: "Zone 4 & Zone 7 entered low-power mode",
      time: "2 hours ago",
      icon: <Clock className="w-4 h-4 text-secondary" />,
      bg: "bg-secondary/10",
    },
    {
      id: 3,
      title: "Peak Demand Window Closed",
      description: "Systems returning to standard setpoints",
      time: "4 hours ago",
      icon: <CheckCircle2 className="w-4 h-4 text-primary-light" />,
      bg: "bg-primary-light/10",
    },
  ];

  return (
    <Card className="border-none shadow-sm w-full rounded-lg h-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-heading text-lg font-bold text-secondary-dark">Recent System Alerts</h3>
          <a href="#" className="text-sm font-semibold text-primary hover:underline">
            View History
          </a>
        </div>

        <div className="space-y-6">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start space-x-4">
              <div className={`p-2 rounded-full mt-1 ${alert.bg}`}>
                {alert.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-secondary-dark text-sm font-body">{alert.title}</p>
                <p className="text-xs text-secondary-light font-medium mt-0.5">{alert.description}</p>
              </div>
              <div className="text-xs text-secondary-light font-medium whitespace-nowrap">
                {alert.time}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
