"use client";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { useSystemHealthStatus, type HealthStatusType } from '../hooks/useSystemHealth';
import { Skeleton } from '../../../components/ui/StateFeedback';
import { Video, Eye, Cpu, Zap } from 'lucide-react';

function getBadgeStyle(status: HealthStatusType) {
  switch (status) {
    case 'normal':
      return 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]';
    case 'warning':
      return 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]';
    case 'error':
      return 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]';
    case 'no_data':
    default:
      return 'bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]';
  }
}

function getComponentIcon(id: string) {
  switch (id) {
    case 'cameras':
      return <Video className="w-4 h-4 text-secondary-dark" />;
    case 'detection':
      return <Eye className="w-4 h-4 text-secondary-dark" />;
    case 'esp32':
      return <Cpu className="w-4 h-4 text-secondary-dark" />;
    case 'sensors':
      return <Zap className="w-4 h-4 text-secondary-dark" />;
    default:
      return <Cpu className="w-4 h-4 text-secondary-dark" />;
  }
}

export function SystemHealth() {
  const { components, isLoading } = useSystemHealthStatus();

  return (
    <Card className="h-full border-transparent shadow-sm flex flex-col justify-between">
      <CardHeader className="pb-3 pt-5 px-6">
        <CardTitle className="text-[11px] text-secondary font-bold uppercase tracking-widest">
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-1 flex-1 flex flex-col justify-around space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          components.map((comp) => {
            const badgeCls = getBadgeStyle(comp.status);
            return (
              <div
                key={comp.id}
                className="flex items-center justify-between py-2 border-b border-neutral-border/40 last:border-b-0"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="p-1.5 rounded-md bg-neutral-light/70 shrink-0">
                    {getComponentIcon(comp.id)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-black truncate">{comp.name}</p>
                    <p className="text-[11px] text-secondary-light truncate mt-0.5">
                      {comp.lastSeenText}
                    </p>
                    {comp.helpText && (
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {comp.helpText}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md border shrink-0 uppercase tracking-wider ${badgeCls}`}
                >
                  {comp.statusLabel}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
