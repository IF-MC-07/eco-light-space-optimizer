import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Progress } from '../../../components/ui/Progress';
import { SlidersHorizontal, Lock } from 'lucide-react';

export function TargetClimate() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <CardTitle className="text-base text-black font-heading font-bold">Target Climate</CardTitle>
        <button className="text-primary hover:text-primary-dark transition-colors">
          <SlidersHorizontal size={18} />
        </button>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {/* Graphic */}
        <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#F1F5F9] rounded-lg"></div>
          <div className="absolute inset-0 bg-white border-4 border-primary-dark rounded-lg transform -rotate-6 shadow-sm flex flex-col items-center justify-center">
            <h2 className="text-4xl font-heading font-black text-black">22°C</h2>
            <p className="text-[10px] font-bold tracking-widest text-secondary mt-1">TARGET</p>
          </div>
        </div>

        {/* Controls */}
        <div className="w-full space-y-6">
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Humidity Control</span>
              <span className="text-xs font-bold text-black">45%</span>
            </div>
            <Progress value={45} indicatorColor="bg-primary-dark" className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Air Purity</span>
              <span className="text-xs font-bold text-black">OPTIMAL</span>
            </div>
            <Progress value={85} indicatorColor="bg-primary-dark" className="h-2" />
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full mt-8">
          <Button variant="primary" fullWidth className="font-bold py-3 shadow-sm flex items-center justify-center gap-2 bg-primary-dark hover:bg-primary">
            <Lock size={16} />
            Apply Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
