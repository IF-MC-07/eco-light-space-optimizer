"use client";
import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Building, Users, Zap, AlertTriangle } from 'lucide-react';
import { useOccupancy } from '../../occupancy/hooks';
import { useSystemHealthStatus } from '../hooks/useSystemHealth';
import { Skeleton } from '../../../components/ui/StateFeedback';

export function DashboardStats() {
  const { data: occupancyRes, isLoading: isOccLoading } = useOccupancy({ include_simulated: false });
  const { activeAlertsCount, isLoading: isHealthLoading } = useSystemHealthStatus();

  if (isOccLoading || isHealthLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[180px]">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-transparent shadow-sm">
            <CardContent className="p-6 mt-5">
              <Skeleton className="h-4 w-28 mb-4" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const rooms = (occupancyRes?.data || []).filter((r: any) => !r.is_simulated);
  const totalRooms = rooms.length;
  const unconfiguredCount = rooms.filter(
    (r: any) => r.capacity === null || r.capacity === undefined || Number(r.capacity) <= 0
  ).length;

  // Ruangan segar dan jumlah orang saat ini
  const freshRooms = rooms.filter((r: any) => !r.is_stale && r.person_count !== null && r.person_count !== undefined);
  const hasFreshData = freshRooms.length > 0;
  const totalFreshPersons = freshRooms.reduce((acc: number, r: any) => acc + (Number(r.person_count) || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[180px]">
      {/* Total Rooms */}
      <Card>
        <CardContent className="p-6 mt-5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
              <Building className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mt-1">Total Rooms</p>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-heading font-bold text-black mb-1">{totalRooms}</h3>
            {unconfiguredCount > 0 ? (
              <p className="text-xs text-amber-600 font-medium">{unconfiguredCount} {unconfiguredCount === 1 ? 'room lacks capacity config' : 'rooms lack capacity config'}</p>
            ) : (
              <p className="text-xs text-secondary font-medium">All room capacities configured</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orang saat ini */}
      <Card className="border-l-4 border-l-primary relative overflow-hidden">
        <CardContent className="p-6 mt-5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#bbf7d0] text-primary rounded-md">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mt-1">Current occupants</p>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-heading font-bold text-black mb-1">
              {hasFreshData ? totalFreshPersons : '—'}
            </h3>
            <p className="text-xs text-secondary font-medium">
              {hasFreshData ? `from ${freshRooms.length} ${freshRooms.length === 1 ? 'room' : 'rooms'} with fresh data` : 'No fresh data'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Energy Saved */}
      <Card>
        <CardContent className="p-6 mt-5">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-[#bbf7d0] text-primary rounded-md">
              <Zap className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mt-1">Energy Saved</p>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline mb-1">
              <h3 className="text-2xl font-heading font-bold text-black">Not available yet</h3>
            </div>
            <p className="text-xs text-secondary font-medium">Awaiting baseline calculation</p>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardContent className="p-6 mt-5">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-md ${activeAlertsCount > 0 ? 'bg-tertiary/10 text-tertiary' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mt-1">Active Alerts</p>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl font-heading font-bold text-black mb-1">{activeAlertsCount}</h3>
            <p className={`text-xs font-bold ${activeAlertsCount > 0 ? 'text-tertiary' : 'text-secondary-light'}`}>
              {activeAlertsCount > 0 ? 'Action required' : 'No alerts'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
