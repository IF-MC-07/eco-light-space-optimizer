"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';
import { useSavingsYoY } from '../hooks';

interface YoYComparisonProps {
  filters: {
    range_type: string;
    start_date: string;
    end_date: string;
  };
}

export function YoYComparison({ filters }: YoYComparisonProps) {
  const { data: yoy, isLoading } = useSavingsYoY(filters);

  if (isLoading) {
    return <div className="text-center py-10 text-xs text-secondary">Loading comparison...</div>;
  }

  const currentTotalKwh = yoy ? (yoy.current_period?.total_watts || 0) / 1000 : 0;
  const prevTotalKwh = yoy ? (yoy.previous_period?.total_watts || 0) / 1000 : 0;
  const changePct = yoy?.change_percentage ?? 0;
  const status = yoy?.status || 'neutral';

  const maxVal = Math.max(currentTotalKwh, prevTotalKwh, 1);
  const currentBarVal = (currentTotalKwh / maxVal) * 100;
  const prevBarVal = (prevTotalKwh / maxVal) * 100;

  return (
    <Card className="border-transparent shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-lg text-black font-heading font-bold">Period Comparison</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-6">
        {/* Status Indicator Banner */}
        {status === 'saving' ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest block mb-1">Energy Saving</span>
            <span className="text-2xl font-black text-green-800">-{changePct}%</span>
            <p className="text-[11px] text-green-700 mt-1 font-semibold">Lower consumption than previous period</p>
          </div>
        ) : status === 'waste' ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest block mb-1">Energy Waste</span>
            <span className="text-2xl font-black text-red-800">+{Math.abs(changePct)}%</span>
            <p className="text-[11px] text-red-700 mt-1 font-semibold">Higher consumption than previous period</p>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
            <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest block mb-1">Stable Usage</span>
            <span className="text-2xl font-black text-gray-800">0.0%</span>
            <p className="text-[11px] text-gray-700 mt-1 font-semibold">Same consumption as previous period</p>
          </div>
        )}

        {/* Comparative Bars */}
        <div className="space-y-4 pt-2">
          <div>
            <div className="flex justify-between items-end mb-1 text-xs">
              <span className="font-semibold text-secondary-dark">Previous Period</span>
              <span className="font-bold text-black">{prevTotalKwh.toFixed(2)} kWh</span>
            </div>
            <Progress value={prevBarVal} indicatorColor="bg-secondary-light" className="h-2.5 bg-neutral-border/40" />
          </div>

          <div>
            <div className="flex justify-between items-end mb-1 text-xs">
              <span className="font-semibold text-secondary-dark">Current Period</span>
              <span className="font-bold text-black">{currentTotalKwh.toFixed(2)} kWh</span>
            </div>
            <Progress 
              value={currentBarVal} 
              indicatorColor={status === 'saving' ? 'bg-primary-dark' : status === 'waste' ? 'bg-red-500' : 'bg-secondary'} 
              className="h-2.5 bg-neutral-border/40" 
            />
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-border/40">
          <p className="text-xs leading-relaxed text-secondary italic">
            {status === 'saving' 
              ? `"Your energy saving measures are working! The current usage is lower than the previous period."` 
              : status === 'waste' 
              ? `"Energy consumption increased. Check active devices or schedules to identify waste."` 
              : `"Your energy consumption has remained stable compared to the last period."`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
