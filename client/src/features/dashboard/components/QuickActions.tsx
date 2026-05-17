import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Sun, Thermometer, Clock, Shield, Download } from 'lucide-react';

interface QuickActionsProps {
  onExport?: () => void;
}

export function QuickActions({ onExport }: QuickActionsProps) {
  const actions = [
    { label: "All Lights Off", icon: <Sun className="w-5 h-5 text-primary-dark" />, onClick: () => {} },
    { label: "Set Eco-Temp", icon: <Thermometer className="w-5 h-5 text-primary-dark" />, onClick: () => {} },
    { label: "Update Schedule", icon: <Clock className="w-5 h-5 text-primary-dark" />, onClick: () => {} },
    { label: "Night Mode", icon: <Shield className="w-5 h-5 text-primary-dark" />, onClick: () => {} },
    { label: "Export Reports", icon: <Download className="w-5 h-5 text-primary-dark" />, onClick: onExport },
  ];

  return (
    <div className="grid grid-cols-5 gap-6 w-full">
      {actions.map((action, idx) => (
        <Card 
          key={idx} 
          className="border-transparent shadow-sm hover:border-neutral-border cursor-pointer transition-colors bg-white"
          onClick={action.onClick}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center space-y-3 mt-5">
            {action.icon}
            <span className="font-bold text-black text-sm whitespace-nowrap">{action.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
