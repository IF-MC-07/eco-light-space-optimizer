import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Moon, Briefcase } from 'lucide-react';

export function RecommendedTemplates() {
  return (
    <div className="space-y-4 ">
      <h2 className="text-sm font-bold text-secondary uppercase tracking-wider mb-2">Recommended Templates</h2>
      <div className="grid grid-cols-2 gap-4">
        {/* Sleep Deep Routine */}
        <Card className="bg-[#F1F5F9] border-transparent hover:border-neutral-border cursor-pointer transition-colors">
          <CardContent className="p-4 flex flex-col gap-3 mt-5">
            <div className="flex items-center gap-3">
              <Moon size={18} className="text-black" />
              <h3 className="text-sm font-bold text-black">Sleep Deep Routine</h3>
            </div>
            <p className="text-xs text-secondary-dark leading-relaxed">
              Gradually dims lights and lowers AC over 30 minutes.
            </p>
          </CardContent>
        </Card>

        {/* Away Mode Eco */}
        <Card className="bg-[#F1F5F9] border-transparent hover:border-neutral-border cursor-pointer transition-colors">
          <CardContent className="p-4 flex flex-col gap-3 mt-5">
            <div className="flex items-center gap-3">
              <Briefcase size={18} className="text-black" />
              <h3 className="text-sm font-bold text-black">Away Mode Eco</h3>
            </div>
            <p className="text-xs text-secondary-dark leading-relaxed">
              Kill-switch for all non-essential devices when leaving.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
