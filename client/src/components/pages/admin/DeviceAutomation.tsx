import React from 'react';
import { Layout } from '../../layout/Layout';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  TrendingUp, Sun, Focus, Thermometer,
  Edit2, Moon, Briefcase, Zap, ChevronDown
} from 'lucide-react';

function Toggle({ checked }: { checked: boolean }) {
  return (
    <div className={`w-10 h-5 rounded-full flex items-center p-0.5 transition-colors cursor-pointer ${checked ? 'bg-[#1B4D1E]' : 'bg-neutral-border'}`}>
      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
    </div>
  );
}

function Select({ value }: { value: string }) {
  return (
    <div className="w-full bg-[#E2E8F0] border-none text-secondary-dark text-sm rounded-md px-3 py-2 flex items-center justify-between cursor-pointer font-medium mb-5">
      {value}
      <ChevronDown size={14} className="text-secondary-light" />
    </div>
  );
}

export default function DeviceAutomation() {
  return (
    <Layout navbarTitle="Automation Rules" searchPlaceholder="Search routines...">
      <div className="max-w-[1200px] mx-auto w-full">
        {/* Top 3 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#1B4D1E] border-none p-6 text-white relative overflow-hidden h-[150px]">
            {/* Lightning watermark */}
            <div className="absolute -right-4 -bottom-6 w-32 justify-end flex opacity-20 pointer-events-none">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-32 h-32 text-[#4CAF50]">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"></path>
              </svg>
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full">
              <h3 className="text-[#86B690] font-medium text-xs mb-1 tracking-wide">Active Optimizations</h3>
              <div className="text-5xl font-heading font-extrabold mb-1">12</div>
              <div className="flex items-center gap-1.5 text-xs text-[#86B690] font-semibold">
                <TrendingUp size={14} />
                <span>+4 since yesterday</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 flex flex-col justify-between h-[150px]">
            <h3 className="text-secondary font-medium text-xs tracking-wide">Scheduled Tasks</h3>
            <div className="text-4xl font-heading font-extrabold text-neutral-900 mt-2">08</div>

            <div className="flex items-center mt-auto">
              <div className="flex -space-x-1.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                </div>
                <div className="w-6 h-6 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-orange-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                </div>
                <div className="w-6 h-6 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-primary">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-light"></div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 flex flex-col justify-between h-[150px]">
            <h3 className="text-secondary font-medium text-xs tracking-wide">Est. Savings Today</h3>
            <div className="text-4xl font-heading font-extrabold text-neutral-900 mt-2">$4.20</div>

            <div className="w-full bg-[#E2E8F0] h-2 rounded-full mt-auto mb-1 overflow-hidden">
              <div className="bg-[#1B4D1E] h-full" style={{ width: '65%' }}></div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column (Active Rules & Recommended) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Active Rules List */}
            <div className="space-y-4">
              <div className="flex items-end justify-between mb-2">
                <h2 className="text-xl font-heading font-bold text-neutral-900">Active Rules</h2>
                <div className="flex items-center gap-2 text-xs font-bold text-secondary-dark cursor-pointer">
                  <span className="text-secondary">SORT BY:</span> Most Frequent <ChevronDown size={14} />
                </div>
              </div>

              {/* Rule Item 1 */}
              <Card className="p-5 flex items-center shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-neutral flex items-center justify-center text-secondary-dark mr-4 border border-neutral-border/50 shadow-sm flex-shrink-0">
                  <Sun size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-neutral-900 leading-none">Morning Ambience</h4>
                    <span className="bg-[#E8F5E9] text-primary text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">Active</span>
                  </div>
                  <p className="text-xs text-secondary font-medium">
                    Trigger: 07:00 AM daily • Action: Gradient lights to 40%
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <Toggle checked={true} />
                  <Edit2 size={16} className="text-secondary-dark cursor-pointer hover:text-primary transition-colors" />
                </div>
              </Card>

              {/* Rule Item 2 */}
              <Card className="p-5 flex items-center shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-neutral flex items-center justify-center text-secondary-dark mr-4 border border-neutral-border/50 shadow-sm flex-shrink-0">
                  <Focus size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-neutral-900 leading-none">Hallway Auto-Off</h4>
                    <span className="bg-[#E8F5E9] text-primary text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">Active</span>
                  </div>
                  <p className="text-xs text-secondary font-medium">
                    Trigger: No motion for 5 mins • Action: Power off Hallway AC
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <Toggle checked={true} />
                  <Edit2 size={16} className="text-secondary-dark cursor-pointer hover:text-primary transition-colors" />
                </div>
              </Card>

              {/* Rule Item 3 */}
              <Card className="p-5 flex items-center shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-neutral flex items-center justify-center text-secondary-dark mr-4 border border-neutral-border/50 shadow-sm flex-shrink-0">
                  <Thermometer size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-neutral-900 leading-none">Peak Hour Saver</h4>
                    <span className="bg-red-50 text-tertiary text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">Paused</span>
                  </div>
                  <p className="text-xs text-secondary font-medium">
                    Trigger: Energy cost &gt; $0.15/kWh • Action: Set AC to 26°C
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <Toggle checked={false} />
                  <Edit2 size={16} className="text-secondary-dark cursor-pointer hover:text-primary transition-colors" />
                </div>
              </Card>
            </div>

            {/* Recommended Templates */}
            <div>
              <h3 className="text-xs font-bold text-secondary tracking-widest uppercase mb-4 mt-8">Recommended Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-[#EEF2F6] border-none p-5 shadow-none transition-transform hover:shadow-md cursor-pointer group">
                  <div className="flex items-start gap-3 mb-2">
                    <Moon size={18} className="text-secondary-dark group-hover:text-primary transition-colors mt-0.5" />
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm mb-1">Sleep Deep Routine</h4>
                      <p className="text-xs text-secondary-dark leading-relaxed">
                        Gradually dims lights and lowers AC over 30 minutes.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-[#EEF2F6] border-none p-5 shadow-none transition-transform hover:shadow-md cursor-pointer group">
                  <div className="flex items-start gap-3 mb-2">
                    <Briefcase size={18} className="text-secondary-dark group-hover:text-primary transition-colors mt-0.5" />
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm mb-1">Away Mode Eco</h4>
                      <p className="text-xs text-secondary-dark leading-relaxed">
                        Kill-switch for all non-essential devices when leaving.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Quick Rule Setup */}
            <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <h3 className="text-base font-bold font-heading text-neutral-900 mb-6">Quick Rule Setup</h3>

              <div className="mb-5">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2 block">When this happens</label>
                <Select value="Time of day (08:00 AM)" />
              </div>

              <div className="mb-6">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2 block">Do this action</label>
                <Select value="Turn off Living Room AC" />
              </div>

              <Button className="w-full bg-[#1B4D1E] hover:bg-primary text-white flex items-center justify-center gap-2 py-3 rounded-md shadow-sm transition-colors text-sm font-semibold">
                Create Logic <Zap size={16} className="fill-white" />
              </Button>
            </Card>

            {/* Weekly Schedule */}
            <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <h3 className="text-xs font-bold text-secondary tracking-widest uppercase mb-6">Weekly Schedule</h3>

              <div className="space-y-4 mb-6">
                {/* MON */}
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-secondary w-8">MON</span>
                  <div className="flex-1 flex gap-1 h-2 bg-[#F1F5F9] rounded-sm overflow-hidden">
                    <div className="bg-[#1B4D1E] w-[30%]"></div>
                    <div className="bg-[#86B690] w-[40%] ml-auto"></div>
                  </div>
                  <span className="text-[#1B4D1E] w-12 text-right">Active</span>
                </div>
                {/* TUE */}
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-secondary w-8">TUE</span>
                  <div className="flex-1 flex gap-1 h-2 bg-[#F1F5F9] rounded-sm overflow-hidden">
                    <div className="bg-[#1B4D1E] w-[30%]"></div>
                    <div className="bg-[#86B690] w-[40%] ml-auto"></div>
                  </div>
                  <span className="text-[#1B4D1E] w-12 text-right">Active</span>
                </div>
                {/* WED */}
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-secondary w-8">WED</span>
                  <div className="flex-1 flex gap-1 h-2 bg-[#F1F5F9] rounded-sm overflow-hidden">
                    <div className="bg-[#1B4D1E] w-[40%]"></div>
                    <div className="bg-[#86B690] w-[30%] ml-auto"></div>
                  </div>
                  <span className="text-[#1B4D1E] w-12 text-right">Active</span>
                </div>
                {/* THU (Holiday) */}
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-tertiary w-8">THU</span>
                  <div className="flex-1 h-2 rounded-sm border-[1px] border-tertiary-light opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiAvPgo8cGF0aCBkPSJNMSAzTDMgMSIgZnRyb2tlPSIjODgzNDU0IiBzdHJva2Utd2lkdGg9IjAuNSIgLz4KPC9zdmc+')]"></div>
                  <span className="text-tertiary w-12 text-right">Holiday</span>
                </div>
                {/* FRI */}
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-secondary w-8">FRI</span>
                  <div className="flex-1 flex gap-1 h-2 bg-[#F1F5F9] rounded-sm overflow-hidden">
                    <div className="bg-[#1B4D1E] w-[20%]"></div>
                    <div className="bg-[#86B690] w-[50%] ml-[10%]"></div>
                  </div>
                  <span className="text-[#1B4D1E] w-12 text-right">Active</span>
                </div>
              </div>

              <div className="flex justify-center">
                <a href="#" className="text-xs font-bold text-[#1B4D1E] hover:text-primary transition-colors">View Full Calendar</a>
              </div>
            </Card>

            {/* Energy Efficiency Vitality */}
            <Card className="p-6 bg-[#F8FAFC] border-none flex flex-col items-center text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <h3 className="text-[10px] font-bold text-secondary tracking-widest uppercase mb-6">Energy Efficiency Vitality</h3>

              <div className="relative w-32 h-32 mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" fill="transparent" stroke="#E2E8F0" strokeWidth="8" />
                  <circle cx="64" cy="64" r="56" fill="transparent" stroke="#0A2612" strokeWidth="8" strokeDasharray="351.858" strokeDashoffset="70.37" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-heading font-extrabold text-neutral-900 leading-none">80%</span>
                  <span className="text-[8px] font-bold text-secondary-dark tracking-widest uppercase mt-1">Optimal</span>
                </div>
              </div>

              <p className="text-xs text-secondary leading-relaxed px-4">
                Your automation rules saved enough energy to power a small office for 2 days.
              </p>
            </Card>

          </div>
        </div>
      </div>
    </Layout>
  );
}
