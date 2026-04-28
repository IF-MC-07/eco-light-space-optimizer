import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Bell, Mail, BarChart } from 'lucide-react';

export function NotificationPreferences() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  return (
    <Card className="border-transparent bg-[#F5F7F5] shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 flex flex-row items-center gap-2">
        <Bell className="w-5 h-5 text-primary-dark" />
        <CardTitle className="text-lg font-bold text-black font-heading">Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-4">
        
        {/* Email Alerts Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-secondary-dark" />
            <span className="text-sm font-bold text-black">Email Alerts</span>
          </div>
          <button 
            type="button"
            role="switch"
            aria-checked={emailAlerts}
            onClick={() => setEmailAlerts(!emailAlerts)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              emailAlerts ? 'bg-primary-dark' : 'bg-neutral-border'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                emailAlerts ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Weekly Reports Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart className="w-4 h-4 text-secondary-dark" />
            <span className="text-sm font-bold text-black">Weekly Reports</span>
          </div>
          <button 
            type="button"
            role="switch"
            aria-checked={weeklyReports}
            onClick={() => setWeeklyReports(!weeklyReports)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              weeklyReports ? 'bg-primary-dark' : 'bg-neutral-border'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                weeklyReports ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

      </CardContent>
    </Card>
  );
}
