"use client";
import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Leaf } from 'lucide-react';
import { useEnergySummary } from '../hooks';

export function CurrentStatusBox() {
  const { data: response, isLoading } = useEnergySummary();
  const summary = response;

  const kwDraw = summary ? (summary.current_consumption / 1000).toFixed(2) : '48.20';

  if (isLoading) {
    return <div className="text-center py-4">Loading current status...</div>;
  }

  return (
    <Card className="border-transparent shadow-sm mb-6">
      <CardContent className="p-6 mt-5">
        <p className="text-[11px] font-bold text-black uppercase tracking-widest mb-6">Current Status</p>
        <div className="flex flex-col items-center justify-center py-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-border p-8 mb-6 text-center w-3/4">
            <h2 className="text-4xl font-heading font-bold text-primary-dark mb-1">{kwDraw}</h2>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">kW Draw</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-primary-dark uppercase tracking-widest">
            <Leaf className="w-3.5 h-3.5" />
            Optimal Performance
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
