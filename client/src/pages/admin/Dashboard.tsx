import React from 'react';
import { Layout } from '../../layout/Layout';
import { Card } from '../../components/ui/Card';
import { 
  Building2, Users, Zap, AlertTriangle, 
  Sun, Thermometer, Clock, Shield,
  AlertCircle, CheckCircle2, Leaf
} from 'lucide-react';

export default function Dashboard() {
  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto w-full">
        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 flex flex-col justify-between h-[140px]">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded bg-blue-50 text-blue-500 flex items-center justify-center">
                <Building2 size={20} />
              </div>
              <h3 className="text-secondary-dark font-bold text-xs tracking-wider uppercase">Total Rooms</h3>
            </div>
            <div>
              <div className="text-4xl font-heading text-neutral-900 leading-none mb-1">128</div>
              <div className="text-xs text-secondary-light font-medium">4 newly configured</div>
            </div>
          </Card>

          <Card className="p-6 flex flex-col justify-between h-[140px] border-l-4 border-l-primary shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded bg-[#E8F5E9] text-primary flex items-center justify-center">
                <Users size={20} />
              </div>
              <h3 className="text-secondary-dark font-bold text-xs tracking-wider uppercase">Occupied Now</h3>
            </div>
            <div>
              <div className="text-4xl font-heading text-neutral-900 leading-none mb-1">84</div>
              <div className="text-xs text-primary font-bold">↗ 12% from last hour</div>
            </div>
          </Card>

          <Card className="p-6 flex flex-col justify-between h-[140px]">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded bg-primary text-white flex items-center justify-center">
                <Zap size={20} />
              </div>
              <h3 className="text-secondary-dark font-bold text-xs tracking-wider uppercase">Energy Saved</h3>
            </div>
            <div>
              <div className="text-4xl font-heading text-neutral-900 leading-none mb-1">
                42.8 <span className="text-base text-secondary font-medium font-body tracking-normal">kWh</span>
              </div>
              <div className="text-xs text-secondary italic">Equivalent to 3 trees planted</div>
            </div>
          </Card>

          <Card className="p-6 flex flex-col justify-between h-[140px]">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded bg-red-50 text-tertiary flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-secondary-dark font-bold text-xs tracking-wider uppercase">Active Alerts</h3>
            </div>
            <div>
              <div className="text-4xl font-heading text-tertiary leading-none mb-1">02</div>
              <div className="text-xs text-tertiary font-bold">Priority action required</div>
            </div>
          </Card>
        </div>

        {/* Row 2: Charts and System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Energy Usage Trends Chart Area */}
          <Card className="lg:col-span-2 p-6 bg-[#F8FAFC] border-none shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col h-[340px]">
             <div className="flex justify-between items-start mb-8 z-10 relative">
               <div>
                 <h2 className="text-xl font-heading text-neutral-900 mb-1">Energy Usage Trends</h2>
                 <p className="text-sm text-secondary">Consumption across all zones today</p>
               </div>
               <div className="flex bg-neutral-border/50 rounded-md p-1">
                 <button className="px-4 py-1.5 bg-white shadow-sm rounded-sm text-xs font-bold text-secondary-dark">Day</button>
                 <button className="px-4 py-1.5 text-xs font-semibold text-secondary hover:text-secondary-dark">Week</button>
                 <button className="px-4 py-1.5 text-xs font-semibold text-secondary hover:text-secondary-dark">Month</button>
               </div>
             </div>

             {/* Chart Placeholder SVG */}
             <div className="flex-1 w-full relative z-0 mt-4">
                <svg className="w-full h-[180px] overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 150">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#2E7D32" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  
                  {/* The filled area gradient */}
                  <path d="M0,100 C100,90 200,60 300,70 C400,80 430,95 500,95 C600,95 650,20 750,30 C780,35 800,80 800,80 L800,150 L0,150 Z" fill="url(#chartGradient)" />
                  {/* The chart line */}
                  <path d="M0,100 C100,90 200,60 300,70 C400,80 430,95 500,95 C600,95 650,20 750,30 C780,35 800,80 800,80" fill="none" stroke="#1B4D1E" strokeWidth="3" />
                  
                  {/* Tooltip Point */}
                  <circle cx="430" cy="88" r="4" fill="#1B4D1E" />
                  <rect x="415" y="65" width="45" height="16" rx="2" fill="#1E293B" />
                  <text x="425" y="76" fill="white" fontSize="8" fontWeight="bold">12.4kWh</text>
                </svg>

                {/* X-Axis labels */}
                <div className="absolute -bottom-6 w-full flex justify-between text-[10px] font-bold text-secondary-light">
                  <span>08:00 AM</span>
                  <span className="ml-[10%]">10:00 AM</span>
                  <span className="ml-[10%]">12:00 PM</span>
                  <span className="ml-[10%]">02:00 PM</span>
                  <span className="ml-[10%]">04:00 PM</span>
                  <span>06:00 PM</span>
                </div>
             </div>
          </Card>

          {/* System Health + Eco Score */}
          <div className="flex flex-col gap-6 lg:col-span-1 h-[340px]">
            {/* System Health */}
            <Card className="p-6 flex-1 flex flex-col justify-center">
              <h3 className="text-secondary-dark font-bold text-xs tracking-wider uppercase mb-5">System Health</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-semibold text-secondary-dark">AC Efficiency</span>
                    <span className="text-sm font-bold text-neutral-900">92%</span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-semibold text-secondary-dark">Light Optimization</span>
                    <span className="text-sm font-bold text-neutral-900">78%</span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-semibold text-secondary-dark">Grid Stability</span>
                    <span className="text-sm font-bold text-neutral-900">98%</span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                    <div className="bg-primary-dark h-full rounded-full" style={{ width: '98%' }}></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Eco Score */}
            <Card className="bg-[#0A2612] border-none p-6 text-white relative overflow-hidden flex-shrink-0">
              <div className="absolute -right-4 -top-8 text-white/5 pointer-events-none">
                <Leaf size={140} strokeWidth={1} />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg leading-tight">Eco Score</h3>
                  <p className="text-[#86B690] text-xs">Building optimization level</p>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-heading font-extrabold tracking-tight">A+</span>
                  <span className="text-[#86B690] text-sm font-semibold">Excellent</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Row 3: Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <Card className="py-5 px-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary transition-colors hover:shadow-md">
            <div className="text-secondary-dark hover:text-primary transition-colors">
              <Sun size={24} />
            </div>
            <span className="text-sm font-bold text-neutral-900">All Lights Off</span>
          </Card>

          <Card className="py-5 px-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary transition-colors hover:shadow-md">
            <div className="text-secondary-dark hover:text-primary transition-colors">
              <Thermometer size={24} />
            </div>
            <span className="text-sm font-bold text-neutral-900">Set Eco-Temp</span>
          </Card>

          <Card className="py-5 px-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary transition-colors hover:shadow-md">
            <div className="text-secondary-dark hover:text-primary transition-colors">
              <Clock size={24} />
            </div>
            <span className="text-sm font-bold text-neutral-900">Update Schedule</span>
          </Card>

          <Card className="py-5 px-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary transition-colors hover:shadow-md">
            <div className="text-secondary-dark hover:text-primary transition-colors">
              <Shield size={24} />
            </div>
            <span className="text-sm font-bold text-neutral-900">Night Mode</span>
          </Card>
        </div>

        {/* Row 4: Recent System Alerts */}
        <Card className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-neutral-900">Recent System Alerts</h3>
            <a href="#" className="text-sm font-bold text-primary hover:text-primary-dark">View History</a>
          </div>

          <div className="flex flex-col">
            {/* Alert 1 */}
            <div className="flex items-start gap-4 py-4 border-b border-neutral-border last:border-0 last:pb-0">
              <div className="w-10 h-10 rounded-full bg-red-50 text-tertiary flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-neutral-900 mb-0.5">Main Lobby AC Filter Overdue</h4>
                <p className="text-sm text-secondary">Efficiency dropped by 8%</p>
              </div>
              <div className="text-xs font-medium text-secondary-light mt-1">12 mins ago</div>
            </div>

            {/* Alert 2 */}
            <div className="flex items-start gap-4 py-4 border-b border-neutral-border last:border-0 last:pb-0">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-neutral-900 mb-0.5">Night Schedule Initiated</h4>
                <p className="text-sm text-secondary">Zone 4 & Zone 7 entered low-power mode</p>
              </div>
              <div className="text-xs font-medium text-secondary-light mt-1">2 hours ago</div>
            </div>

            {/* Alert 3 */}
            <div className="flex items-start gap-4 py-4 border-b border-neutral-border last:border-0 last:pb-0">
              <div className="w-10 h-10 rounded-full bg-[#E8F5E9] text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-neutral-900 mb-0.5">Peak Demand Window Closed</h4>
                <p className="text-sm text-secondary">Systems returning to standard setpoints</p>
              </div>
              <div className="text-xs font-medium text-secondary-light mt-1">4 hours ago</div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
