"use client";
import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Zap, DollarSign, Cloud } from 'lucide-react';
import { useSavingsSummary, usePowerStats } from '../hooks';

export function SavingsStats() {
  const { data: response, isLoading } = useSavingsSummary();
  const { data: powerStatsResponse } = usePowerStats();
  const stats = response?.data;
  const powerStats = powerStatsResponse?.data;

  // Formatting values
  const kwhSaved = stats ? (stats.total_saved_watts / 1000).toFixed(1) : '0';
  const co2ReducedTons = stats ? (stats.co2_saved_kg / 1000).toFixed(2) : '0';
  const costSavedFormatted = stats 
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stats.cost_saved_idr)
    : 'Rp 0';

  const efficiencyScore = powerStats?.efficiency_score ?? 88;
  const totalKwh = powerStats?.total_kwh ?? 0;

  // Compute percentage badges from power stats
  const meanWatts = powerStats?.mean_watts ?? 0;
  const maxWatts = powerStats?.max_watts ?? 1;
  const efficiencyPct = maxWatts > 0 ? ((1 - meanWatts / maxWatts) * 100).toFixed(1) : '0';

  if (isLoading) {
    return <div className="text-center py-4">Loading savings stats...</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 text-primary rounded-md">
              <Zap className="w-5 h-5" />
            </div>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent font-bold">
              +{efficiencyPct}%
            </Badge>
          </div>
          <p className="text-xs text-secondary mb-1 font-semibold uppercase tracking-wider">Energy Saved</p>
          <div className="flex items-baseline">
            <h3 className="text-3xl font-heading font-bold text-black">{kwhSaved}</h3>
            <span className="text-sm text-secondary ml-1 font-medium">kWh</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
              <DollarSign className="w-5 h-5" />
            </div>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent font-bold">
              {totalKwh.toFixed(1)} kWh
            </Badge>
          </div>
          <p className="text-xs text-secondary mb-1 font-semibold uppercase tracking-wider">Cost Savings</p>
          <h3 className="text-xl font-heading font-bold text-black">{costSavedFormatted}</h3>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-50 text-tertiary-light rounded-md">
              <Cloud className="w-5 h-5" />
            </div>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent font-bold">
              {powerStats?.sample_count ?? 0} readings
            </Badge>
          </div>
          <p className="text-xs text-secondary mb-1 font-semibold uppercase tracking-wider">CO2 Reduced</p>
          <div className="flex items-baseline">
            <h3 className="text-3xl font-heading font-bold text-black">{co2ReducedTons}</h3>
            <span className="text-sm text-secondary ml-1 font-medium">Tons</span>
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col items-center justify-center text-center">
        <CardContent className="p-6">
          <h3 className="text-5xl font-heading font-bold mb-1 text-black">{efficiencyScore}</h3>
          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-3">Score</p>
          <p className="text-sm text-secondary-dark font-semibold uppercase tracking-wide">Efficiency Score</p>
        </CardContent>
      </Card>
    </div>
  );
}
