import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';

export function SystemHealth() {
  return (
    <Card className="h-full border-transparent shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-[11px] text-secondary font-bold uppercase tracking-widest">System Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-black">AC Efficiency</span>
            <span className="text-xs font-bold text-black">92%</span>
          </div>
          <Progress value={92} indicatorColor="bg-primary-dark" className="h-2 bg-neutral-border" />
        </div>
        
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-black">Light Optimization</span>
            <span className="text-xs font-bold text-black">78%</span>
          </div>
          <Progress value={78} indicatorColor="bg-primary-dark" className="h-2 bg-neutral-border" />
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-black">Grid Stability</span>
            <span className="text-xs font-bold text-black">98%</span>
          </div>
          <Progress value={98} indicatorColor="bg-primary-dark" className="h-2 bg-neutral-border" />
        </div>
      </CardContent>
    </Card>
  );
}
