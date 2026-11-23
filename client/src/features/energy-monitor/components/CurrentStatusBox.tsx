"use client";
import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { useEnergySummary } from '../hooks';
import { Skeleton, ErrorState, EmptyState } from '../../../components/ui/StateFeedback';

export function CurrentStatusBox() {
  const { data: response, isLoading, isError, refetch } = useEnergySummary();
  const summary = response;

  const hasData = summary && summary.current_consumption !== null && summary.current_consumption !== undefined;
  const kwDraw = hasData ? (summary.current_consumption / 1000).toFixed(2) : null;

  return (
    <Card className="border-transparent shadow-sm mb-6">
      <CardContent className="p-6 mt-5">
        <p className="text-[11px] font-bold text-black uppercase tracking-widest mb-6">Current Status</p>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Skeleton className="h-32 w-3/4 rounded-xl" />
          </div>
        ) : isError ? (
          <ErrorState message="Gagal memuat status daya terkini" onRetry={() => refetch()} />
        ) : !hasData || kwDraw === null ? (
          <EmptyState message="Tidak ada data" description="Belum ada pembacaan daya terkini dari sensor." />
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-border p-8 mb-2 text-center w-3/4">
              <h2 className="text-4xl font-heading font-bold text-primary-dark mb-1">{kwDraw}</h2>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">kW Draw</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
