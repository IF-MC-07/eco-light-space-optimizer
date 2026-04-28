import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Building, Users, Zap, AlertTriangle } from 'lucide-react';

export function DashboardStats() {
  return (
    <div className="grid grid-cols-4 gap-6">
      {/* Total Rooms */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
              <Building className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mt-1">Total Rooms</p>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-heading font-bold text-black mb-1">128</h3>
            <p className="text-xs text-secondary font-medium">4 newly configured</p>
          </div>
        </CardContent>
      </Card>

      {/* Occupied Now */}
      <Card className="border-l-4 border-l-primary relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#bbf7d0] text-primary rounded-md">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mt-1">Occupied Now</p>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-heading font-bold text-black mb-1">84</h3>
            <p className="text-xs font-bold text-primary flex items-center">
              <span className="mr-1 text-[10px]">↗</span> 12% from last hour
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Energy Saved */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#bbf7d0] text-primary rounded-md">
              <Zap className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mt-1">Energy Saved</p>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline mb-1">
              <h3 className="text-3xl font-heading font-bold text-black">42.8</h3>
              <span className="text-sm font-semibold text-secondary ml-1">kWh</span>
            </div>
            <p className="text-xs text-secondary font-medium italic">Equivalent to 3 trees planted</p>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary/10 text-tertiary rounded-md">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mt-1">Active Alerts</p>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-heading font-bold text-black mb-1">02</h3>
            <p className="text-xs font-bold text-tertiary">Priority action required</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
