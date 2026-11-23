"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';
import { useSavingsYoY } from '../hooks';
import { Skeleton, ErrorState } from '../../../components/ui/StateFeedback';
import type { Insight } from '../types';

interface YoYComparisonProps {
  filters: {
    range_type: string;
    start_date: string;
    end_date: string;
  };
}

function EvidenceDisclosure({ evidence }: { evidence: Record<string, any> }) {
  const [open, setOpen] = useState(false);

  if (!evidence) return null;

  return (
    <div className="mt-2 pt-2 border-t border-neutral-border/40 text-xs">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-[11px] font-bold text-primary-dark hover:underline flex items-center gap-1"
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>Lihat dasar perhitungan</span>
      </button>

      {open && (
        <div className="mt-2 p-3 bg-white border border-neutral-border/70 rounded-xl font-mono text-[11px] space-y-1.5 text-secondary-dark shadow-xs">
          <div className="flex justify-between border-b border-neutral-border/40 pb-1">
            <span className="text-secondary font-sans font-semibold">Rule ID:</span>
            <span className="font-bold text-black">{evidence.rule_id || '—'}</span>
          </div>
          {evidence.threshold !== undefined && (
            <div className="flex justify-between border-b border-neutral-border/40 pb-1">
              <span className="text-secondary font-sans font-semibold">Ambang yang dipakai:</span>
              <span className="font-bold text-black">{String(evidence.threshold)}</span>
            </div>
          )}
          <div className="pt-1">
            <span className="text-secondary font-sans font-semibold block mb-1">Bukti Data (Evidence):</span>
            <pre className="bg-neutral-50 p-2 rounded border border-neutral-border/50 text-[10px] overflow-x-auto text-black">
              {JSON.stringify(evidence, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function YoYComparison({ filters }: YoYComparisonProps) {
  const { data: yoy, isLoading, isError, refetch } = useSavingsYoY(filters);

  if (isLoading) {
    return (
      <Card className="border-transparent shadow-sm">
        <CardHeader className="pb-4 pt-6 px-6">
          <CardTitle className="text-lg text-black font-heading font-bold">Period Comparison</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-transparent shadow-sm">
        <CardHeader className="pb-4 pt-6 px-6">
          <CardTitle className="text-lg text-black font-heading font-bold">Period Comparison</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <ErrorState message="Gagal memuat perbandingan periode" onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  const currentKwh = yoy?.current_kwh ?? yoy?.current_period?.total_kwh ?? 0;
  const baselineKwh = yoy?.baseline_kwh ?? yoy?.previous_period?.total_kwh ?? null;
  const deltaKwh = yoy?.delta_kwh ?? null;
  const changePct = yoy?.change_percentage ?? null;
  const status = yoy?.status || 'insufficient_baseline';
  const coverage = yoy?.coverage;
  const insights: Insight[] = yoy?.insights || [];

  const deltaDisplay =
    deltaKwh !== null
      ? `${deltaKwh > 0 ? '+' : ''}${deltaKwh.toFixed(3)} kWh`
      : '—';

  const maxVal = Math.max(currentKwh, baselineKwh || 0, 0.001);
  const currentBarVal = (currentKwh / maxVal) * 100;
  const baselineBarVal = baselineKwh !== null ? (baselineKwh / maxVal) * 100 : 0;

  const renderBanner = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest block mb-1">
              Hemat Energi
            </span>
            <div className="text-2xl font-black text-green-800">
              {deltaDisplay}
            </div>
            <p className="text-[11px] text-green-700 mt-1 font-semibold">
              Konsumsi aktual lebih rendah dari baseline ({Math.abs(changePct || 0).toFixed(1)}%)
            </p>
          </div>
        );

      case 'waste':
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest block mb-1">
              Konsumsi Di Atas Baseline
            </span>
            <div className="text-2xl font-black text-red-800">
              {deltaDisplay}
            </div>
            <p className="text-[11px] text-red-700 mt-1 font-semibold">
              Konsumsi aktual melebihi baseline ({Math.abs(changePct || 0).toFixed(1)}%)
            </p>
          </div>
        );

      case 'neutral':
        return (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
            <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest block mb-1">
              Konsumsi Stabil / Netral
            </span>
            <div className="text-2xl font-black text-gray-800">
              {deltaDisplay}
            </div>
            <p className="text-[11px] text-gray-700 mt-1 font-semibold">
              Konsumsi berada dalam batas toleransi netral (±5%)
            </p>
          </div>
        );

      case 'insufficient_baseline':
      default:
        return (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest block mb-1">
              Data Belum Cukup
            </span>
            <div className="text-2xl font-black text-blue-800">
              —
            </div>
            <p className="text-[11px] text-blue-700 mt-1 font-medium">
              Data riwayat atau rasio kelengkapan belum memenuhi syarat baseline minimum.
            </p>
          </div>
        );
    }
  };

  const renderInsights = () => {
    if (!insights || insights.length === 0) {
      return (
        <p className="text-xs text-secondary-light italic">
          Belum ada wawasan analitik untuk periode ini.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {insights.map((insight, idx) => {
          const isWarning = insight.severity === 'warning' || insight.severity === 'error';
          const isSuccess = insight.severity === 'success';
          const isInfo = insight.severity === 'info';

          return (
            <div
              key={`${insight.rule_id}-${idx}`}
              className={`p-3.5 rounded-xl border text-xs ${
                isSuccess
                  ? 'bg-green-50/70 border-green-200/70 text-green-950'
                  : isWarning
                  ? 'bg-red-50/70 border-red-200/70 text-red-950'
                  : isInfo
                  ? 'bg-blue-50/70 border-blue-200/70 text-blue-950'
                  : 'bg-neutral-50 border-neutral-200 text-secondary-dark'
              }`}
            >
              <div className="font-bold flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSuccess
                        ? 'bg-green-600'
                        : isWarning
                        ? 'bg-red-600'
                        : isInfo
                        ? 'bg-blue-600'
                        : 'bg-slate-500'
                    }`}
                  />
                  {insight.title}
                </span>
                <span className="text-[10px] uppercase tracking-wider opacity-75 font-mono">
                  {insight.rule_id}
                </span>
              </div>

              <p className="leading-relaxed mt-1 text-secondary-dark">{insight.message}</p>

              {insight.recommendation && (
                <div className="mt-2.5 pt-2 border-t border-black/5 font-medium">
                  <span className="font-bold block text-[11px] mb-0.5 text-black">Rekomendasi Tindakan:</span>
                  <p className="text-[11px] leading-relaxed text-secondary-dark">{insight.recommendation}</p>
                </div>
              )}

              <EvidenceDisclosure evidence={insight.evidence} />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="border-transparent shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-lg text-black font-heading font-bold">Period Comparison</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-6">
        {renderBanner()}

        <div className="space-y-4 pt-2">
          <div>
            <div className="flex justify-between items-end mb-1 text-xs">
              <span className="font-semibold text-secondary-dark">Baseline Riwayat</span>
              <span className="font-bold text-black">
                {baselineKwh !== null ? `${baselineKwh.toFixed(3)} kWh` : '—'}
              </span>
            </div>
            <Progress
              value={baselineBarVal}
              indicatorColor="bg-slate-400"
              className="h-2.5 bg-neutral-border/40"
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-1 text-xs">
              <span className="font-semibold text-secondary-dark">Konsumsi Aktual</span>
              <span className="font-bold text-black">{currentKwh.toFixed(3)} kWh</span>
            </div>
            <Progress
              value={currentBarVal}
              indicatorColor={
                status === 'saving'
                  ? 'bg-primary-dark'
                  : status === 'waste'
                  ? 'bg-red-500'
                  : 'bg-secondary'
              }
              className="h-2.5 bg-neutral-border/40"
            />
          </div>

          {coverage && (
            <div className="flex justify-between items-center text-[11px] text-secondary-light font-medium pt-1">
              <span>Kelengkapan Data (Coverage)</span>
              <span>
                {(coverage.ratio * 100).toFixed(0)}% ({coverage.days_with_data}/{coverage.expected_days} hari)
              </span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-neutral-border/40">
          <h4 className="text-xs font-bold text-secondary-dark uppercase tracking-wider mb-3">
            Explainability & Rekomendasi
          </h4>
          {renderInsights()}
        </div>
      </CardContent>
    </Card>
  );
}
