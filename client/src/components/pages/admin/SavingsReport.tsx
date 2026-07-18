import React, { useState } from 'react';
import { SavingsHeader } from '../../../features/savings/components/SavingsHeader';
import { SavingsTrendChart } from '../../../features/savings/components/SavingsTrendChart';
import { SavingsBreakdownTable } from '../../../features/savings/components/SavingsBreakdownTable';
import { YoYComparison } from '../../../features/savings/components/YoYComparison';
import { KeyAchievements } from '../../../features/savings/components/KeyAchievements';
import { ExportReportModal } from '../../../features/dashboard/components/ExportReportModal';
import { useSavingsYoY } from '../../../features/savings/hooks';

export default function SavingsReport() {
  const [activeTab, setActiveTab] = useState('Monthly');
  const [startDate, setStartDate] = useState('2026-07-10');
  const [endDate, setEndDate] = useState('2026-07-16');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const filters = {
    range_type: activeTab.toLowerCase(),
    start_date: startDate,
    end_date: endDate,
  };

  const { data: yoy } = useSavingsYoY(filters);

  const dateRangeLabel = yoy?.current_period 
    ? `${new Date(yoy.current_period.start).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${new Date(yoy.current_period.end).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : 'Loading dates...';

  return (
    <div className="flex flex-col space-y-6 w-full max-w-6xl mx-auto">
      {/* Top Section */}
      <SavingsHeader 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        dateRangeLabel={dateRangeLabel}
        onExport={() => setIsExportModalOpen(true)}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column (Span 2) */}
        <div className="col-span-2 space-y-6">
          <SavingsTrendChart filters={filters} />
          <SavingsBreakdownTable filters={filters} />
        </div>

        {/* Right Column (Span 1) */}
        <div className="col-span-1 space-y-6">
          <YoYComparison filters={filters} />
          <KeyAchievements filters={filters} />
        </div>
      </div>

      {/* Modals */}
      <ExportReportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        reportType="savings"
      />
    </div>
  );
}
