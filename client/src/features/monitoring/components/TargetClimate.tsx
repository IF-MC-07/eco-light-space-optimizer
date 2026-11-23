"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { SlidersHorizontal, Lock, Plus, Minus } from 'lucide-react';
import { useMonitoring } from '../../../hooks/useMonitoring';
import { useMe } from '../../../features/auth/hooks';

// Menunggu firmware subscribe topic AC dan integrasi IR oleh rekan IoT
export const FEATURE_AC_MASTER_ENABLED = false;

export function TargetClimate() {
  const { fetchClimate, updateClimate } = useMonitoring();
  const { data: userData } = useMe();
  const [temp, setTemp] = useState(24);

  const role = userData?.user?.role;
  const isAdmin = role === 'admin';

  useEffect(() => {
    fetchClimate().then(res => {
      if (res.success && res.data) {
        setTemp(Math.round(res.data.target_temperature || 24));
      }
    });
  }, [fetchClimate]);

  const handleApply = async () => {
    if (!isAdmin) return;
    await updateClimate(temp);
  };

  // Seluruh panel disembunyikan sampai fitur didukung oleh firmware IoT
  if (!FEATURE_AC_MASTER_ENABLED) {
    return null;
  }

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

        {/* Action Button */}
        {isAdmin && (
          <div className="w-full mt-4">
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
