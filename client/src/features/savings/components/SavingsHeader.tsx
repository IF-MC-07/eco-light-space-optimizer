import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Calendar, Download } from 'lucide-react';

interface SavingsHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function SavingsHeader({ activeTab, setActiveTab }: SavingsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center p-1 bg-neutral rounded-lg border border-neutral-border">
        {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab 
                ? 'bg-white shadow-sm text-secondary-dark' 
                : 'text-secondary hover:text-secondary-dark'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center text-sm font-medium text-secondary-dark px-4 py-2">
          <Calendar className="w-4 h-4 mr-2 text-secondary" />
          June 2024
        </div>
        <Button variant="primary">
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>
    </div>
  );
}
