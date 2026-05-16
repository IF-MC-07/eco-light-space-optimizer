"use client";
import React, { useState } from 'react';
import { AutomationStats } from '../../../features/automation/components/AutomationStats';
import { ActiveRulesList } from '../../../features/automation/components/ActiveRulesList';
import { RecommendedTemplates } from '../../../features/automation/components/RecommendedTemplates';
import { QuickRuleSetup } from '../../../features/automation/components/QuickRuleSetup';
import { WeeklySchedule } from '../../../features/automation/components/WeeklySchedule';
import { EfficiencyVitality } from '../../../features/automation/components/EfficiencyVitality';
import { EditScheduleModal } from '../../../features/automation/components/EditScheduleModal';
import { FullCalendarModal } from '../../../features/automation/components/FullCalendarModal';
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';
import { useSchedules } from '../../../features/automation/hooks';
import { AutomationSchedule } from '../../../features/automation/types';

export default function AutomationRules() {
  const [selectedRule, setSelectedRule] = useState<AutomationSchedule | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const { data: response, isLoading, isError } = useSchedules();
  const schedules = response?.data || [];

  const handleAddNew = () => {
    setIsAddingNew(true);
    // Mocking a new schedule structure
    setSelectedRule({ 
      schedule_id: "", 
      room_id: "", 
      user_id: "", 
      schedule_name: '', 
      start_time: '08:00', 
      end_time: '17:00' 
    });
  };

  const handleCloseModal = () => {
    setSelectedRule(null);
    setIsAddingNew(false);
  };

  if (isLoading) return <div className="text-center py-20">Loading automation data...</div>;

  return (
    <div className="flex flex-col space-y-8 w-full max-w-6xl mx-auto pb-10 mt-5">
      <div className="grid grid-cols-4 gap-6 items-stretch">
        <div className="col-span-3">
          <AutomationStats schedules={schedules} />
        </div>
        <div className="flex flex-col justify-end pb-0.5">
          <Button 
            onClick={handleAddNew}
            className="w-full h-[180px] bg-primary-dark hover:bg-primary text-white font-bold rounded-3xl shadow-lg flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] border-none group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Plus size={28} />
            </div>
            <span className="text-lg">Add New Rule</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 flex flex-col space-y-8">
          <ActiveRulesList 
            schedules={schedules}
            onEdit={(rule) => {
              setSelectedRule(rule);
              setIsAddingNew(false);
            }} 
          />
          <RecommendedTemplates />
        </div>

        <div className="col-span-1 flex flex-col space-y-6">
          <QuickRuleSetup />
          <WeeklySchedule onViewFullCalendar={() => setIsCalendarOpen(true)} />
          <EfficiencyVitality />
        </div>
      </div>

      {selectedRule && (
        <EditScheduleModal 
          isOpen={!!selectedRule} 
          onClose={handleCloseModal} 
          schedule={selectedRule}
          isAddingNew={isAddingNew}
        />
      )}

      <FullCalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
      />
    </div>
  );
}
