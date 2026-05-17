import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Progress } from '../../../components/ui/Progress';
import { SlidersHorizontal, Lock, Plus, Minus } from 'lucide-react';
import { useMonitoring } from '../../../hooks/useMonitoring';
import { useMe } from '../../../features/auth/hooks';

export function TargetClimate() {
  const { fetchClimate, updateClimate } = useMonitoring();
  const { data: userData } = useMe();
  const [temp, setTemp] = useState(22);
  const [humidity, setHumidity] = useState(45);
  const [airPurity, setAirPurity] = useState('OPTIMAL');

  const role = userData?.user?.role;
  const isAdmin = role === 'admin';

  useEffect(() => {
    fetchClimate().then(res => {
      if (res.success && res.data) {
        setTemp(Math.round(res.data.target_temperature || 22));
        setHumidity(res.data.humidity || 45);
        setAirPurity(res.data.air_purity || 'OPTIMAL');
      }
    });
  }, [fetchClimate]);

  const handleApply = async () => {
    if (!isAdmin) return;
    await updateClimate(temp);
  };

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
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button 
                  onClick={() => setTemp(prev => Math.max(16, prev - 1))}
                  className="w-8 h-8 rounded-md bg-neutral border border-neutral-border flex items-center justify-center text-black hover:bg-neutral-border transition-colors font-bold"
                >
                  <Minus size={14} />
                </button>
              )}
              <h2 className="text-4xl font-heading font-black text-black">{temp}°C</h2>
              {isAdmin && (
                <button 
                  onClick={() => setTemp(prev => Math.min(30, prev + 1))}
                  className="w-8 h-8 rounded-md bg-neutral border border-neutral-border flex items-center justify-center text-black hover:bg-neutral-border transition-colors font-bold"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
            <p className="text-[10px] font-bold tracking-widest text-secondary mt-1">TARGET</p>
          </div>
        </div>

        {/* Controls */}
        <div className="w-full space-y-6">
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Humidity Control</span>
              <span className="text-xs font-bold text-black">{humidity}%</span>
            </div>
            <Progress value={humidity} indicatorColor="bg-primary-dark" className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Air Purity</span>
              <span className="text-xs font-bold text-black">{airPurity}</span>
            </div>
            <Progress value={85} indicatorColor="bg-primary-dark" className="h-2" />
          </div>
        </div>

        {/* Action Button */}
        {isAdmin && (
          <div className="w-full mt-8">
            <Button 
              onClick={handleApply}
              variant="primary" 
              fullWidth 
              className="font-bold py-3 shadow-sm flex items-center justify-center gap-2 bg-primary-dark hover:bg-primary"
            >
              <Lock size={16} />
              Apply Settings
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
