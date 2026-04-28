import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Zap, DollarSign, Cloud } from 'lucide-react';

export function SavingsStats() {
  return (
    <div className="grid grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 text-primary rounded-md">
              <Zap className="w-5 h-5" />
            </div>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent font-bold">
              +12.4%
            </Badge>
          </div>
          <p className="text-xs text-secondary mb-1 font-semibold uppercase tracking-wider">Energy Saved</p>
          <div className="flex items-baseline">
            <h3 className="text-3xl font-heading font-bold text-black">1,452</h3>
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
              +8.2%
            </Badge>
          </div>
          <p className="text-xs text-secondary mb-1 font-semibold uppercase tracking-wider">Cost Savings</p>
          <h3 className="text-3xl font-heading font-bold text-black">$284.50</h3>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-50 text-tertiary-light rounded-md">
              <Cloud className="w-5 h-5" />
            </div>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent font-bold">
              +15.1%
            </Badge>
          </div>
          <p className="text-xs text-secondary mb-1 font-semibold uppercase tracking-wider">CO2 Reduced</p>
          <div className="flex items-baseline">
            <h3 className="text-3xl font-heading font-bold text-black">0.82</h3>
            <span className="text-sm text-secondary ml-1 font-medium">Tons</span>
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col items-center justify-center text-center">
        <CardContent className="p-6">
          <h3 className="text-5xl font-heading font-bold mb-1 text-black">85</h3>
          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-3">Score</p>
          <p className="text-sm text-secondary-dark font-semibold uppercase tracking-wide">Efficiency Score</p>
        </CardContent>
      </Card>
    </div>
  );
}
