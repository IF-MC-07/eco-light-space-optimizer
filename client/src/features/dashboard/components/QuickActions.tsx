import React from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Sun, Thermometer, Clock, ShieldCheck } from "lucide-react";

export function QuickActions() {
  const actions = [
    { label: "All Lights Off", icon: <Sun className="w-5 h-5 text-primary-dark" /> },
    { label: "Set Eco-Temp", icon: <Thermometer className="w-5 h-5 text-primary-dark" /> },
    { label: "Update Schedule", icon: <Clock className="w-5 h-5 text-primary-dark" /> },
    { label: "Night Mode", icon: <ShieldCheck className="w-5 h-5 text-primary-dark" /> },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {actions.map((action, idx) => (
        <Card key={idx} className="border-none shadow-sm hover:shadow-md cursor-pointer transition-shadow rounded-lg">
          <CardContent className="p-4 flex flex-col items-center justify-center space-y-3 h-full min-h-[100px]">
            {action.icon}
            <span className="font-semibold text-secondary-dark text-sm whitespace-nowrap">{action.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
