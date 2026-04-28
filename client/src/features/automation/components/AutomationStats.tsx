import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Zap, Snowflake, Lightbulb, Leaf, TrendingUp } from 'lucide-react';

export function AutomationStats() {
  return (
    <div className="grid grid-cols-3 gap-6 mt-5">
      {/* Active Optimizations Card */}
      <Card className="bg-primary-dark text-white overflow-hidden relative border-transparent">
        <div className="absolute -bottom-6 -right-4 opacity-10 pointer-events-none">
          <Zap size={160} />
        </div>
        <CardContent className="p-6 flex flex-col justify-between h-full relative z-10 ">
          <div>
            <p className="text-sm font-medium text-white/80 mb-2">Active Optimizations</p>
            <h3 className="text-5xl font-heading font-bold text-white">12</h3>
          </div>
          <div className="flex items-center text-xs font-semibold text-white/90 mt-8">
            <TrendingUp size={14} className="mr-1.5" />
            +4 since yesterday
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Tasks Card */}
      <Card>
        <CardContent className="p-6 flex flex-col justify-between h-full mt-5 ">
          <div>
            <p className="text-sm font-medium text-secondary mb-2">Scheduled Tasks</p>
            <h3 className="text-5xl font-heading font-bold text-black">08</h3>
          </div>
          <div className="flex items-center gap-2 mt-8 mb-5">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center">
              <Snowflake size={12} />
            </div>
            <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
              <Lightbulb size={12} />
            </div>
            <div className="w-6 h-6 rounded-full bg-green-100 text-green-500 flex items-center justify-center">
              <Leaf size={12} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Est. Savings Today Card */}
      <Card>
        <CardContent className="p-6 flex flex-col justify-between h-full mt-5">
          <div>
            <p className="text-sm font-medium text-secondary mb-2">Est. Savings Today</p>
            <h3 className="text-5xl font-heading font-bold text-black">$4.20</h3>
          </div>
          <div className="mt-8 mb-5">
            <div className="w-full h-2 bg-neutral-border rounded-full overflow-hidden">
              <div className="h-full bg-primary-dark w-2/3 rounded-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
