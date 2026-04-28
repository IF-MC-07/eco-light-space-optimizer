import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ChevronDown, Zap } from 'lucide-react';

export function QuickRuleSetup() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-heading font-bold text-black">Quick Rule Setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">When this happens</label>
          <div className="relative">
            <select className="w-full appearance-none bg-[#E2E8F0]/50 border-none rounded-md py-3 pl-4 pr-10 text-sm font-semibold text-secondary-dark focus:outline-none focus:ring-1 focus:ring-primary">
              <option>Time of day (08:00 AM)</option>
              <option>Motion detected</option>
              <option>Temperature &gt; 25°C</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">Do this action</label>
          <div className="relative">
            <select className="w-full appearance-none bg-[#E2E8F0]/50 border-none rounded-md py-3 pl-4 pr-10 text-sm font-semibold text-secondary-dark focus:outline-none focus:ring-1 focus:ring-primary">
              <option>Turn off Living Room AC</option>
              <option>Turn on Hallway Lights</option>
              <option>Set Eco Mode</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        <Button variant="primary" fullWidth className="font-bold py-3 shadow-sm flex items-center justify-center gap-2 bg-primary-dark hover:bg-primary mt-2">
          Create Logic
          <Zap size={16} className="fill-current" />
        </Button>
      </CardContent>
    </Card>
  );
}
