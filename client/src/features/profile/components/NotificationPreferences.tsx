"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Bell, Mail, BarChart, Info } from 'lucide-react';
import { useProfile, useUpdateProfile } from '../hooks';

export function NotificationPreferences() {
  const { data: response, isLoading } = useProfile();
  const { mutate: updateProfile } = useUpdateProfile();
  const user = response?.data;

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);

  useEffect(() => {
    if (user) {
      setEmailAlerts(user.email_notifications ?? true);
      setSystemAlerts(user.system_notifications ?? true);
      setDailyDigest(user.daily_digest ?? false);
    }
  }, [user]);

  const togglePreference = (key: string, value: boolean) => {
    if (!user) return;
    updateProfile({
      id: user.user_id,
      payload: { [key]: value }
    });
  };

  if (isLoading) return <div className="h-48 bg-[#F5F7F5] rounded-3xl animate-pulse" />;

  return (
    <Card className="border-transparent bg-[#F5F7F5] shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 flex flex-row items-center gap-2">
        <Bell className="w-5 h-5 text-primary-dark" />
        <CardTitle className="text-lg font-bold text-black font-heading">Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-5">
        
        {/* Email Alerts Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-secondary-dark" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-black">Email Alerts</span>
              <span className="text-[10px] text-secondary">Critical system updates via email</span>
            </div>
          </div>
          <button 
            type="button"
            role="switch"
            onClick={() => {
              const newVal = !emailAlerts;
              setEmailAlerts(newVal);
              togglePreference('email_notifications', newVal);
            }}
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

        {/* System Alerts Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info className="w-4 h-4 text-secondary-dark" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-black">System Alerts</span>
              <span className="text-[10px] text-secondary">In-app activity notifications</span>
            </div>
          </div>
          <button 
            type="button"
            role="switch"
            onClick={() => {
              const newVal = !systemAlerts;
              setSystemAlerts(newVal);
              togglePreference('system_notifications', newVal);
            }}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              systemAlerts ? 'bg-primary-dark' : 'bg-neutral-border'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                systemAlerts ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Daily Digest Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart className="w-4 h-4 text-secondary-dark" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-black">Daily Digest</span>
              <span className="text-[10px] text-secondary">Daily summary of energy savings</span>
            </div>
          </div>
          <button 
            type="button"
            role="switch"
            onClick={() => {
              const newVal = !dailyDigest;
              setDailyDigest(newVal);
              togglePreference('daily_digest', newVal);
            }}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              dailyDigest ? 'bg-primary-dark' : 'bg-neutral-border'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                dailyDigest ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

      </CardContent>
    </Card>
  );
}
