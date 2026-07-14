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
import { AlertDialog } from '../../../components/ui/AlertDialog';
import { Plus, Trash2 } from 'lucide-react';
import { useRemoveAllSchedule, useSchedules } from '../../../features/automation/hooks';
import type { AutomationSchedule } from '../../../features/automation/types';

export default function AutomationRules() {
  const [selectedRule, setSelectedRule] = useState<AutomationSchedule | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDeleteAllAlertOpen, setIsDeleteAllAlertOpen] = useState(false);

  const { data: response, isLoading, isError } = useSchedules();
  const { mutate: removeAllSchedules, isPending: isDeletingAll } = useRemoveAllSchedule();
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

  const handleDeleteAll = () => {
    removeAllSchedules(undefined, {
      onSuccess: () => {
        setIsDeleteAllAlertOpen(false);
      },
    });
  };

  if (isLoading) return <div className="text-center py-20">Loading automation data...</div>;

  return (
    <div className="flex flex-col space-y-8 w-full max-w-6xl mx-auto pb-10 mt-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-heading font-extrabold text-black tracking-tight">Automation Schedules</h1>
          <p className="text-sm text-secondary font-medium mt-1">Manage and optimize smart room schedules.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDeleteAllAlertOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B91C1C] transition-colors hover:bg-[#FEE2E2]"
          >
            <Trash2 size={16} />
            Delete All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 items-stretch">
        <div className="col-span-3">
          <AutomationStats schedules={schedules} />
        </div>
        <div className="flex flex-col justify-end pb-0.5">
          <Button 
            onClick={handleAddNew}
            className="w-full h-full min-h-[180px] bg-primary-dark hover:bg-primary text-white font-bold rounded-[32px] shadow-lg flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] border-none group relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Plus size={120} />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all group-hover:rotate-90 duration-500 shadow-inner">
              <Plus size={32} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-heading font-black tracking-tight">Add New Rule</span>
              <span className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-bold">New Automation</span>
            </div>
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

      <AlertDialog
        isOpen={isDeleteAllAlertOpen}
        onClose={() => setIsDeleteAllAlertOpen(false)}
        onConfirm={handleDeleteAll}
        title="Delete all automation schedules"
        description="This will permanently remove all automation schedules from the system. This action cannot be undone."
        cancelText="Cancel"
        confirmText={isDeletingAll ? "Deleting..." : "Delete All"}
      />
    </div>
  );
}
