import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';

export function TopConsumers() {
  const consumers = [
    { name: 'HVAC Systems', value: 42 },
    { name: 'Lighting', value: 18 },
    { name: 'Lab Equipment', value: 25 },
    { name: 'Computing', value: 15 },
  ];

  return (
    <Card className="border-transparent shadow-sm mb-6">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-[11px] font-bold text-black uppercase tracking-widest">Top Consumers</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-5">
        {consumers.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-black">{item.name}</span>
              <span className="text-xs font-bold text-black">{item.value}%</span>
            </div>
            <Progress 
              value={item.value} 
              indicatorColor="bg-primary-dark" 
              className="h-1.5 bg-[#E2E8F0]" 
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
