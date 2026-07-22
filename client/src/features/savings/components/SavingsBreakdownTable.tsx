"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Snowflake } from 'lucide-react';
import { useSavingsBreakdown } from '../hooks';

interface SavingsBreakdownTableProps {
  filters: {
    range_type: string;
    start_date: string;
    end_date: string;
  };
}

export function SavingsBreakdownTable({ filters }: SavingsBreakdownTableProps) {
  const { data: response, isLoading } = useSavingsBreakdown(filters);
  const breakdown = response || [];

  if (isLoading) {
    return <div className="text-center py-4">Loading savings breakdown...</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-black">Savings Breakdown by Room</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-secondary font-bold uppercase tracking-wider border-b border-neutral-border">
            <tr>
              <th className="pb-3 px-2">Room</th>
              <th className="pb-3 px-2">Total Energy</th>
              <th className="pb-3 px-2">Saved Energy</th>
              <th className="pb-3 px-2 text-right">Saving Ratio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-border/50">
            {breakdown.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-secondary-light">No savings data available.</td>
              </tr>
            ) : (
              breakdown.map((row, i) => {
                const totalEnergy = row.total_wh 
                  ? (row.total_wh >= 1000 
                      ? `${row.total_kwh.toFixed(3)} kWh` 
                      : `${row.total_wh.toFixed(1)} Wh`)
                  : '0 Wh';

                const savedEnergyDisplay = row.has_savings_data 
                  ? `${row.saved_watts?.toFixed(1) || 0} Wh` 
                  : 'Belum tersedia';

                const savingPercentage = row.has_savings_data 
                  ? `${row.percentage || 0}%` 
                  : 'N/A';

                return (
                  <tr key={row.room_id || i}>
                    <td className="py-4 px-2 font-medium text-secondary-dark flex items-center">
                      <Snowflake className="w-4 h-4 mr-3 text-primary" />
                      {row.room_name}
                    </td>
                    <td className="py-4 px-2 text-secondary">{totalEnergy}</td>
                    <td className="py-4 px-2 font-bold text-primary">
                      {savedEnergyDisplay}
                    </td>
                    <td className="py-4 px-2 text-right">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent font-bold">
                        {savingPercentage}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}