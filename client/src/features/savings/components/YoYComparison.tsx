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

  // Langsung pakai total_kwh dari backend — jangan turunkan lagi dari field lain
  const currentTotalKwh = yoy?.current_period?.total_kwh ?? 0;
  const prevTotalKwh = yoy?.previous_period?.total_kwh ?? 0;
  const changePct = yoy?.change_percentage;
  const status = yoy?.status || 'insufficient_baseline';
  const differenceWh = Math.abs(yoy?.difference_wh ?? 0);

const differenceDisplay =
  differenceWh >= 1000
    ? `${(differenceWh / 1000).toFixed(3)} kWh`
    : `${differenceWh.toFixed(1)} Wh`;

const showPercentage =
  changePct !== null &&
  changePct !== undefined &&
  status !== 'insufficient_baseline';

  const maxVal = Math.max(currentTotalKwh, prevTotalKwh, 0.001);
  const currentBarVal = (currentTotalKwh / maxVal) * 100;
  const prevBarVal = (prevTotalKwh / maxVal) * 100;

const renderBanner = () => {
  switch (status) {

    case 'saving':
      return (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
          <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest block mb-1">
            Energy Saving
          </span>

          <div className="text-2xl font-black text-green-800">
            -{differenceDisplay}
          </div>

          <p className="text-[11px] text-green-700 mt-1 font-semibold">
            Lower energy usage than previous period
          </p>

          {showPercentage && (
            <p className="text-[10px] text-green-600 mt-2">
              ({Math.abs(changePct).toFixed(1)}%)
            </p>
          )}
        </div>
      );

    case 'waste':
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
          <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest block mb-1">
            Higher Energy Consumption
          </span>

          <div className="text-2xl font-black text-red-800">
            +{differenceDisplay}
          </div>

          <p className="text-[11px] text-red-700 mt-1 font-semibold">
            More energy used than previous period
          </p>

          {showPercentage && (
            <p className="text-[10px] text-red-600 mt-2">
              ({Math.abs(changePct).toFixed(1)}%)
            </p>
          )}
        </div>
      );

    case 'neutral':
      return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest block mb-1">
            Stable Usage
          </span>

          <div className="text-2xl font-black text-gray-800">
            No Significant Change
          </div>

          <p className="text-[11px] text-gray-700 mt-1 font-semibold">
            Energy consumption is similar to the previous period
          </p>
        </div>
      );

    default:
      return (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest block mb-1">
            Comparison Limited
          </span>

          <div className="text-2xl font-black text-blue-800">
            N/A
          </div>

          <p className="text-[11px] text-blue-700 mt-2">
            Previous period recorded very low energy usage.
            Percentage comparison is unavailable.
          </p>
        </div>
      );
  }
};

const renderInsight = () => {
  switch (status) {

    case 'saving':
      return `Energy consumption decreased by ${differenceDisplay} compared to the previous period, indicating improved energy efficiency.`;

    case 'waste':
      return `Energy consumption increased by ${differenceDisplay}. Review active electrical devices or operating schedules to reduce unnecessary energy usage.`;

    case 'neutral':
      return `Energy consumption remained relatively stable compared to the previous period.`;

    default:
      return `The previous period recorded very low energy usage, therefore percentage comparison is not displayed to avoid misleading interpretation.`;
  }
};

  return (
    <Card className="border-transparent shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-lg text-black font-heading font-bold">Period Comparison</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-6">
        {renderBanner()}

        <div className="space-y-4 pt-2">
          <div>
            <div className="flex justify-between items-end mb-1 text-xs">
              <span className="font-semibold text-secondary-dark">Previous Period</span>
              <span className="font-bold text-black">
                {prevTotalKwh.toFixed(3)} kWh
              </span>
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
          <p className="text-xs leading-relaxed text-secondary italic">{renderInsight()}</p>
        </div>
      </CardContent>
    </Card>
  );
}