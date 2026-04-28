import React from 'react';
import { AutomationStats } from '../../../features/automation/components/AutomationStats';
import { ActiveRulesList } from '../../../features/automation/components/ActiveRulesList';
import { RecommendedTemplates } from '../../../features/automation/components/RecommendedTemplates';
import { QuickRuleSetup } from '../../../features/automation/components/QuickRuleSetup';
import { WeeklySchedule } from '../../../features/automation/components/WeeklySchedule';
import { EfficiencyVitality } from '../../../features/automation/components/EfficiencyVitality';

export default function AutomationRules() {
  return (
    <div className="flex flex-col space-y-8 w-full max-w-6xl mx-auto pb-10 mt-5">
      <AutomationStats />

      <div className="grid grid-cols-3 gap-8">
        {/* Left Column (Span 2) */}
        <div className="col-span-2 flex flex-col space-y-8">
          <ActiveRulesList />
          <RecommendedTemplates />
        </div>

        {/* Right Column (Span 1) */}
        <div className="col-span-1 flex flex-col space-y-6">
          <QuickRuleSetup />
          <WeeklySchedule />
          <EfficiencyVitality />
        </div>
      </div>
    </div>
  );
}
