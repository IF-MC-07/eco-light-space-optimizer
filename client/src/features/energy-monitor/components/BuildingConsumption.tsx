"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';
import { useEnergyBreakdown } from '../hooks';

export function BuildingConsumption() {
  const { data: response, isLoading } = useEnergyBreakdown();
  const breakdown = response?.data || [];

  const maxVal = breakdown.length > 0 
    ? Math.max(...breakdown.map(b => b.total_watts), 1)
    : 10000;

  if (isLoading) {
    return <div className="text-center py-4">Loading room consumption...</div>;
  }

  return (
    <Card className="border-transparent shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-lg text-black font-heading font-bold">Consumption by Room</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-8 space-y-6">
        {breakdown.length === 0 ? (
          <div className="text-center py-4 text-secondary-light">No room breakdown available.</div>
        ) : (
          breakdown.map((row, idx) => {
            const valKwh = parseFloat((row.total_watts / 1000).toFixed(1));
            const progress = (row.total_watts / maxVal) * 100;
            return (
              <div key={row.room_id || idx} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-[#F1F5F9] text-primary-dark font-bold text-xs flex items-center justify-center">
                      {String.fromCharCode(65 + (idx % 26))}
                    </div>
                    <span className="text-sm font-bold text-black">{row.room_name}</span>
                  </div>
                  <span className="text-xs font-bold text-black">{valKwh} kWh</span>
                </div>
                <Progress 
                  value={progress} 
                  indicatorColor="bg-primary-dark" 
                  className="h-2 bg-[#E2E8F0]" 
                />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
