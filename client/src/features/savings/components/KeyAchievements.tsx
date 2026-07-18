"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { useSavingsYoY, useSavingsSummary } from '../hooks';

interface KeyAchievementsProps {
  filters: {
    range_type: string;
    start_date: string;
    end_date: string;
  };
}

export function KeyAchievements({ filters }: KeyAchievementsProps) {
  const { data: yoy, isLoading: isYoyLoading } = useSavingsYoY(filters);
  const { data: summary, isLoading: isSummaryLoading } = useSavingsSummary(filters);

  if (isYoyLoading || isSummaryLoading) {
    return <div className="text-center py-10 text-xs text-secondary">Loading achievements...</div>;
  }

  const changePct = yoy?.change_percentage ?? 0;
  const status = yoy?.status || 'neutral';
  const kwhSaved = summary ? (summary.total_saved_watts || 0) / 1000 : 0;
  const co2SavedKg = summary ? (summary.co2_saved_kg || 0) : 0;

  // Dynamically compute equivalent units
  const laptopHours = Math.round(kwhSaved * 66.7); // 1 kWh runs a typical laptop for ~66.7 hours
  const treesPlanted = (co2SavedKg * 0.045).toFixed(1); // 1 kg CO2 is roughly offset by 0.045 trees/year

  return (
    <Card className="border-transparent shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-lg text-black font-heading font-bold">Key Insights</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <ul className="space-y-5">
          <li className="flex items-start">
            <span className="mt-1.5 mr-3 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
            <p className="text-xs text-secondary-dark leading-relaxed">
              {status === 'saving' ? (
                <>
                  Energy consumption decreased by <span className="font-bold text-black">{changePct}%</span> compared to the last period.
                </>
              ) : status === 'waste' ? (
                <>
                  Energy consumption increased by <span className="font-bold text-black">{Math.abs(changePct)}%</span>. Look into automating devices to limit waste.
                </>
              ) : (
                <>
                  Your energy consumption was stable compared to the last period.
                </>
              )}
            </p>
          </li>
          
          <li className="flex items-start">
            <span className="mt-1.5 mr-3 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
            <p className="text-xs text-secondary-dark leading-relaxed">
              Optimizations prevented <span className="font-bold text-black">{co2SavedKg.toFixed(2)} kg</span> of CO2 from being released into the atmosphere.
            </p>
          </li>

          <li className="flex items-start">
            <span className="mt-1.5 mr-3 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
            <p className="text-xs text-secondary-dark leading-relaxed">
              Total energy saved is equivalent to offsetting <span className="font-bold text-black">{treesPlanted} trees</span> or powering a laptop for <span className="font-bold text-black">{laptopHours} hours</span>.
            </p>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
