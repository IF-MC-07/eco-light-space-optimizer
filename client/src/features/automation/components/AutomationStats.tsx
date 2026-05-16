"use client";
import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Zap, Snowflake, Lightbulb, Leaf, TrendingUp, Sparkles, ShieldCheck } from 'lucide-react';
import { AutomationSchedule } from '../types';

export function AutomationStats({ schedules }: { schedules: AutomationSchedule[] }) {
  const totalSchedules = schedules.length;
  const estSavings = totalSchedules * 1.5; // Mock calculation

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {/* Active Logic Card */}
      <Card className="bg-white border-none shadow-sm h-full min-h-[180px] rounded-[32px] overflow-hidden group relative">
        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
          <Zap size={80} className="text-primary-dark" />
        </div>
        <CardContent className="p-8 flex flex-col justify-between h-full relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary-dark animate-pulse"></div>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Active Logic</p>
            </div>
            <h3 className="text-6xl font-heading font-black text-black tracking-tighter">{totalSchedules}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary/10 text-primary-dark text-[10px] font-bold rounded-full border border-primary/20 flex items-center gap-1.5">
              <TrendingUp size={12} />
              LIVE SYSTEM SYNC
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Tasks Card */}
      <Card className="bg-white border-none shadow-sm h-full min-h-[180px] rounded-[32px] group overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
          <Sparkles size={80} className="text-secondary" />
        </div>
        <CardContent className="p-8 flex flex-col justify-between h-full relative z-10">
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-2">Scheduled Tasks</p>
            <h3 className="text-6xl font-heading font-black text-black tracking-tighter">{totalSchedules}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 border-2 border-white text-blue-500 flex items-center justify-center shadow-sm">
                <Snowflake size={14} />
              </div>
              <div className="w-8 h-8 rounded-full bg-orange-50 border-2 border-white text-orange-500 flex items-center justify-center shadow-sm">
                <Lightbulb size={14} />
              </div>
              <div className="w-8 h-8 rounded-full bg-green-50 border-2 border-white text-green-500 flex items-center justify-center shadow-sm">
                <Leaf size={14} />
              </div>
            </div>
            <span className="text-[10px] font-bold text-secondary-light ml-2 uppercase tracking-wider">Multi-device</span>
          </div>
        </CardContent>
      </Card>

      {/* Est. Savings Card */}
      <Card className="bg-white border-none shadow-sm h-full min-h-[180px] rounded-[32px] group overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
          <TrendingUp size={80} className="text-primary-dark" />
        </div>
        <CardContent className="p-8 flex flex-col justify-between h-full relative z-10">
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-2">Daily Est. Savings</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary-dark">$</span>
              <h3 className="text-6xl font-heading font-black text-black tracking-tighter">{estSavings.toFixed(2)}</h3>
            </div>
          </div>
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-[9px] font-bold text-secondary-light uppercase tracking-widest">
              <span>Efficiency Goal</span>
              <span>85%</span>
            </div>
            <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div className="h-full bg-primary-dark w-[85%] rounded-full shadow-[0_0_8px_rgba(46,125,50,0.4)]"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
