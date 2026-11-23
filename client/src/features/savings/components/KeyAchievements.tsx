"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { useSavingsYoY } from '../hooks';
import { Skeleton, ErrorState } from '../../../components/ui/StateFeedback';
import type { Insight } from '../types';

interface KeyAchievementsProps {
  filters: {
    range_type: string;
    start_date: string;
    end_date: string;
  };
}

function InsightEvidenceDisclosure({ evidence }: { evidence: Record<string, any> }) {
  const [open, setOpen] = useState(false);

  if (!evidence) return null;

  return (
    <div className="mt-2 text-xs">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-[11px] font-bold text-primary-dark hover:underline flex items-center gap-1"
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>Lihat dasar perhitungan</span>
      </button>

      {open && (
        <div className="mt-2 p-2.5 bg-neutral-50 border border-neutral-border/70 rounded-xl font-mono text-[11px] space-y-1 text-secondary-dark">
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
            <pre className="bg-white p-2 rounded border border-neutral-border/50 text-[10px] overflow-x-auto text-black">
              {JSON.stringify(evidence, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function KeyAchievements({ filters }: KeyAchievementsProps) {
  const { data: yoy, isLoading, isError, refetch } = useSavingsYoY(filters);

  if (isLoading) {
    return (
      <Card className="border-transparent shadow-sm">
        <CardHeader className="pb-4 pt-6 px-6">
          <CardTitle className="text-lg text-black font-heading font-bold">Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-transparent shadow-sm">
        <CardHeader className="pb-4 pt-6 px-6">
          <CardTitle className="text-lg text-black font-heading font-bold">Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <ErrorState message="Gagal memuat wawasan penghematan" onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  const insights: Insight[] = yoy?.insights || [];

  return (
    <Card className="border-transparent shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6">
        <CardTitle className="text-lg text-black font-heading font-bold">Key Insights</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {insights.length === 0 ? (
          <p className="text-xs text-secondary-light italic">
            Belum ada wawasan analitik yang terpicu untuk periode ini.
          </p>
        ) : (
          <ul className="space-y-5">
            {insights.map((insight, idx) => {
              const isSuccess = insight.severity === 'success';
              const isWarning = insight.severity === 'warning' || insight.severity === 'error';
              const isInfo = insight.severity === 'info';

              const dotColor = isSuccess
                ? 'bg-green-500'
                : isWarning
                ? 'bg-red-500'
                : isInfo
                ? 'bg-blue-500'
                : 'bg-primary';

              const titleColor = isSuccess
                ? 'text-green-700'
                : isWarning
                ? 'text-red-700'
                : isInfo
                ? 'text-blue-700'
                : 'text-black';

              return (
                <li key={`${insight.rule_id}-${idx}`} className="flex items-start">
                  <span className={`mt-1.5 mr-3 w-2 h-2 rounded-full ${dotColor} flex-shrink-0`} />
                  <div className="text-xs text-secondary-dark leading-relaxed flex-1">
                    <p>
                      <span className={`font-bold ${titleColor}`}>{insight.title}: </span>
                      {insight.message}
                    </p>
                    {insight.recommendation && (
                      <p className="mt-1 text-[11px] text-secondary-dark font-medium">
                        <span className="font-bold text-black">Action: </span>
                        {insight.recommendation}
                      </p>
                    )}
                    <InsightEvidenceDisclosure evidence={insight.evidence} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
