import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Calendar, Download } from 'lucide-react';

interface SavingsHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  onExport?: () => void;
  dateRangeLabel?: string;
}

export function SavingsHeader({
  activeTab,
  setActiveTab,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onExport,
  dateRangeLabel
}: SavingsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-neutral-border/40">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center p-1 bg-neutral rounded-lg border border-neutral-border">
          {['Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === tab 
                  ? 'bg-white shadow-sm text-secondary-dark' 
                  : 'text-secondary hover:text-secondary-dark'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Custom' && (
          <div className="flex items-center gap-2 bg-neutral p-1 rounded-lg border border-neutral-border text-xs">
            <div className="flex items-center gap-1">
              <span className="text-secondary-light font-bold uppercase pl-2">Start:</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none font-semibold text-secondary-dark cursor-pointer px-1 py-0.5"
              />
            </div>
            <div className="w-[1px] h-4 bg-neutral-border"></div>
            <div className="flex items-center gap-1">
              <span className="text-secondary-light font-bold uppercase">End:</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none font-semibold text-secondary-dark cursor-pointer px-1 py-0.5"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between md:justify-end gap-4">
        {dateRangeLabel && (
          <div className="flex items-center text-xs font-bold text-secondary-dark px-3 py-2 bg-neutral rounded-lg border border-neutral-border">
            <Calendar className="w-3.5 h-3.5 mr-2 text-secondary" />
            {dateRangeLabel}
          </div>
        )}
        <Button variant="primary" onClick={onExport} className="text-xs font-bold py-2 h-9">
          <Download className="w-3.5 h-3.5 mr-2" />
          Export PDF
        </Button>
      </div>
    </div>
  );
}
