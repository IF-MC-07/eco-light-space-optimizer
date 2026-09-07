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
            <span className={`mt-1.5 mr-3 w-2 h-2 rounded-full ${status === 'saving' ? 'bg-green-500' : status === 'waste' ? 'bg-red-500' : 'bg-primary'} flex-shrink-0`}></span>
            <div className="text-xs text-secondary-dark leading-relaxed">
              {status === 'saving' ? (
                <>
                  <p><span className="font-bold text-green-700">Energy Saving (-{changePct}%):</span> Energy consumption decreased compared to the previous period due to effective automation rules.</p>
                  <p className="mt-1 text-[11px] text-green-800 font-semibold">Action: Maintain current automation rules and replicate eco-templates to other rooms.</p>
                </>
              ) : status === 'waste' ? (
                <>
                  <p><span className="font-bold text-red-700">Energy Waste (+{Math.abs(changePct)}%):</span> Energy consumption increased due to extended AC cooling duration or active lighting in unoccupied rooms.</p>
                  <p className="mt-1 text-[11px] text-red-800 font-semibold">Action: Enable automation schedules (08:00 AM - 05:00 PM) & set AC temperature to 24°C.</p>
                </>
              ) : (
                <>
                  <p><span className="font-bold text-black">Stable Consumption:</span> Energy consumption remains at a normal and stable baseline compared to the previous period.</p>
                  <p className="mt-1 text-[11px] text-secondary font-semibold">Action: Apply ambient light dimming thresholds for further efficiency.</p>
                </>
              )}
            </div>
          </li>
          
          <li className="flex items-start">
            <span className="mt-1.5 mr-3 w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
            <p className="text-xs text-secondary-dark leading-relaxed">
              System optimization prevented up to <span className="font-bold text-black">{co2SavedKg.toFixed(2)} kg</span> of CO2 emissions.
            </p>
          </li>

          <li className="flex items-start">
            <span className="mt-1.5 mr-3 w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
            <p className="text-xs text-secondary-dark leading-relaxed">
              Total energy saved is equivalent to offsetting <span className="font-bold text-black">{treesPlanted} trees</span> or powering a laptop for <span className="font-bold text-black">{laptopHours} hours</span>.
            </p>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
