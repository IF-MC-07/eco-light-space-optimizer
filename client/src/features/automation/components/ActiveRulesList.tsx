"use client";
import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Pencil, Clock } from 'lucide-react';
import { AutomationSchedule } from '../types';

interface ActiveRulesListProps {
  schedules: AutomationSchedule[];
  onEdit?: (rule: AutomationSchedule) => void;
}

export function ActiveRulesList({ schedules, onEdit }: ActiveRulesListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-heading text-bold text-black">Active Rules</h2>
      </div>

      <div className="space-y-4">
        {schedules.length === 0 ? (
          <div className="text-sm text-secondary-light py-4">No active rules found.</div>
        ) : (
          schedules.map((rule) => (
            <Card key={rule.schedule_id} className="border border-neutral-border shadow-sm">
              <CardContent className="p-4 flex items-center justify-between mt-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-md bg-neutral flex items-center justify-center text-secondary shrink-0 border border-neutral-border/60">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-bold text-black">{rule.schedule_name}</h3>
                      <Badge className="text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border-transparent bg-[#bbf7d0] text-primary">
                        ACTIVE
                      </Badge>
                    </div>
                    <p className="text-xs text-secondary font-medium">
                      Time: {rule.start_time} - {rule.end_time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => onEdit?.(rule)}
                    className="text-secondary hover:text-black transition-colors p-2"
                  >
                    <Pencil size={16} />
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
