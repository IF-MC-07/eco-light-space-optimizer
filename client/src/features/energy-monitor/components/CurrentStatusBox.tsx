import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Leaf } from 'lucide-react';

export function CurrentStatusBox() {
  return (
    <Card className="border-transparent shadow-sm mb-6">
      <CardContent className="p-6">
        <p className="text-[11px] font-bold text-black uppercase tracking-widest mb-6">Current Status</p>
        <div className="flex flex-col items-center justify-center py-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-border p-8 mb-6 text-center w-3/4">
            <h2 className="text-4xl font-heading font-bold text-primary-dark mb-1">48.2</h2>
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
