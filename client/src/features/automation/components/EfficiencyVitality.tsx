import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';

export function EfficiencyVitality() {
  return (
    <Card className="bg-[#F8FAFC]">
      <CardContent className="p-6 flex flex-col items-center text-center mt-5">
        <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-6">Energy Efficiency Vitality</p>
        
        <div className="relative w-32 h-32 mb-6">
          {/* Background Circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-neutral-border stroke-current"
              strokeWidth="8"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            ></circle>
            {/* Progress Circle (80%) */}
            <circle
              className="text-primary-dark stroke-current"
              strokeWidth="8"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray="251.2"
              strokeDashoffset="50.24" 
            ></circle>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h3 className="text-3xl font-heading font-black text-black">80%</h3>
            <span className="text-[8px] font-bold text-secondary uppercase tracking-wider mt-0.5">Optimal</span>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-secondary-dark px-2">
          Your automation rules saved enough energy to power a small office for 2 days.
        </p>
      </CardContent>
    </Card>
  );
}
