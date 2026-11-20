"use client";
import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { useAutomationStats } from '../hooks';
import { Skeleton, ErrorState, EmptyState } from '../../../components/ui/StateFeedback';

export function EfficiencyVitality() {
  const { data: response, isLoading, isError, refetch } = useAutomationStats();
  const stats = response?.data;

  if (isLoading) {
    return (
      <Card className="bg-[#F8FAFC]">
        <CardContent className="p-6 flex flex-col items-center text-center mt-5">
          <Skeleton className="h-3 w-32 mb-6" />
          <Skeleton className="w-32 h-32 rounded-full mb-6" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="bg-[#F8FAFC]">
        <CardContent className="p-6">
          <ErrorState message="Gagal memuat efisiensi otomasi" onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total_schedules === 0) {
    return (
      <Card className="bg-[#F8FAFC]">
        <CardContent className="p-6">
          <EmptyState
            title="Belum ada data otomasi"
            description="Konfigurasikan jadwal otomasi untuk mengaktifkan pemantauan efisiensi."
          />
        </CardContent>
      </Card>
    );
  }

  const rate = typeof stats.automation_rate === 'number' ? stats.automation_rate : 0;
  const strokeDashoffset = 251.2 * (1 - rate / 100);

  return (
    <Card className="bg-[#F8FAFC]">
      <CardContent className="p-6 flex flex-col items-center text-center mt-5">
        <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-6">Energy Efficiency Vitality</p>
        
        <div className="relative w-32 h-32 mb-6">
          {/* Background Circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-neutral-border stroke-current"
              strokeWidth="8"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            ></circle>
            {/* Progress Circle (dynamic) */}
            <circle
              className="text-primary-dark stroke-current"
              strokeWidth="8"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray="251.2"
              strokeDashoffset={strokeDashoffset} 
            ></circle>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h3 className="text-3xl font-heading font-black text-black">{rate}%</h3>
            <span className="text-[8px] font-bold text-secondary uppercase tracking-wider mt-0.5">
              {stats.active_schedules}/{stats.total_schedules} Aktif
            </span>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-secondary-dark px-2">
          {stats.active_schedules > 0
            ? `${stats.active_schedules} dari ${stats.total_schedules} aturan otomasi aktif mengontrol perangkat.`
            : 'Belum ada aturan otomasi yang aktif.'}
        </p>
      </CardContent>
    </Card>
  );
}
