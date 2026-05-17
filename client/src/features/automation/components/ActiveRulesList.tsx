"use client";
import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Pencil, Clock, Power } from 'lucide-react';
import type { AutomationSchedule } from '../types';

interface ActiveRulesListProps {
  schedules: AutomationSchedule[];
  onEdit?: (rule: AutomationSchedule) => void;
}

export function ActiveRulesList({ schedules, onEdit }: ActiveRulesListProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-heading font-black text-black tracking-tight">Active Automation Rules</h2>
          <span className="bg-primary/10 text-primary-dark text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-primary/20">
            {schedules.length} Live
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {schedules.length === 0 ? (
          <div className="text-sm text-secondary-light py-12 text-center bg-neutral/30 rounded-[32px] border-2 border-dashed border-neutral-border">
            No active automation rules found.
          </div>
        ) : (
          schedules.map((rule) => (
            <Card key={rule.schedule_id} className="border-none shadow-sm bg-white rounded-[24px] group hover:shadow-md transition-all duration-300">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-neutral flex items-center justify-center text-secondary-light group-hover:text-primary-dark group-hover:bg-primary/5 transition-all shrink-0">
                    <Clock size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-base font-black text-secondary-dark tracking-tight">{rule.schedule_name}</h3>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-dark animate-pulse"></div>
                        <span className="text-[9px] font-black text-primary-dark uppercase tracking-widest">ACTIVE</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-secondary">
                        <Clock size={12} className="text-primary-dark/60" />
                        <span>{rule.start_time.substring(0, 5)} — {rule.end_time.substring(0, 5)}</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-neutral-border"></div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-secondary">
                        <Power size={12} className="text-primary-dark/60" />
                        <span>Optimized Power State</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onEdit?.(rule)}
                    className="w-10 h-10 rounded-xl bg-neutral text-secondary-light hover:text-primary-dark hover:bg-primary/10 transition-all flex items-center justify-center"
                    title="Edit Rule"
                  >
                    <Pencil size={18} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
