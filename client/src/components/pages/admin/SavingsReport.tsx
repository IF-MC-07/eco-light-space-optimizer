import React, { useState } from 'react';
import { SavingsHeader } from '../../../features/savings/components/SavingsHeader';
import { SavingsStats } from '../../../features/savings/components/SavingsStats';
import { SavingsTrendChart } from '../../../features/savings/components/SavingsTrendChart';
import { SavingsBreakdownTable } from '../../../features/savings/components/SavingsBreakdownTable';
import { YoYComparison } from '../../../features/savings/components/YoYComparison';
import { KeyAchievements } from '../../../features/savings/components/KeyAchievements';

export default function SavingsReport() {
  const [activeTab, setActiveTab] = useState('Monthly');

  return (
    <div className="flex flex-col space-y-6 w-full max-w-6xl mx-auto">
      {/* Top Section */}
      <SavingsHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Stats Cards */}
      <SavingsStats />

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column (Span 2) */}
        <div className="col-span-2 space-y-6">
          <SavingsTrendChart />
          <SavingsBreakdownTable />
        </div>

        {/* Right Column (Span 1) */}
        <div className="col-span-1 space-y-6">
          <YoYComparison />
          <KeyAchievements />
        </div>
      </div>
    </div>
  );
}
