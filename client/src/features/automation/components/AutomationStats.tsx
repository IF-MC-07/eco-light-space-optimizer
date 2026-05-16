"use client";
import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Zap, Snowflake, Lightbulb, Leaf, TrendingUp } from 'lucide-react';
import { AutomationSchedule } from '../types';

export function AutomationStats({ schedules }: { schedules: AutomationSchedule[] }) {
  const totalSchedules = schedules.length;
  const estSavings = totalSchedules * 1.5; // Mock calculation

  return (
    <div className="grid grid-cols-3 gap-6 h-full ">
      <Card className="bg-primary-dark text-white overflow-hidden relative border-transparent h-full min-h-[180px] rounded-3xl">
        <div className="absolute -bottom-6 -right-4 opacity-10 pointer-events-none">
          <Zap size={160} />
        </div>
        <CardContent className="p-8 flex flex-col justify-between h-full relative z-10">
          <div>
            <p className="text-sm font-medium text-white/80 mb-2 uppercase tracking-widest">Active Logic</p>
            <h3 className="text-5xl font-heading text-bold text-white">{totalSchedules}</h3>
          </div>
          <div className="flex items-center text-xs font-semibold text-white/90">
            <TrendingUp size={14} className="mr-1.5" />
            Live System
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-sm h-full min-h-[180px] ">
        <CardContent className="p-8 flex flex-col justify-between h-full">
          <div>
            <p className="text-sm font-medium text-secondary mb-2 uppercase tracking-widest mt-5">Scheduled Tasks</p>
            <h3 className="text-5xl font-heading text-bold text-black">{totalSchedules}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Snowflake size={16} />
            </div>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <Lightbulb size={16} />
            </div>
            <div className="w-8 h-8 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
              <Leaf size={16} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-sm h-full min-h-[180px]">
        <CardContent className="p-8 flex flex-col justify-between h-full">
          <div>
            <p className="text-sm font-medium text-secondary mb-2 uppercase tracking-widest mt-5">Est. Savings Today</p>
            <h3 className="text-5xl font-heading text-bold text-black">${estSavings.toFixed(2)}</h3>
          </div>
          <div className="w-full">
            <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div className="h-full bg-primary-dark w-2/3 rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
