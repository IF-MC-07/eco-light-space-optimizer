import React from 'react';
import { ProfileHeader } from '../../../features/profile/components/ProfileHeader';
import { AccountDetails } from '../../../features/profile/components/AccountDetails';
import { SecuritySettings } from '../../../features/profile/components/SecuritySettings';
import { NotificationPreferences } from '../../../features/profile/components/NotificationPreferences';
import { Button } from '../../ui/Button';

export default function ProfileSettings() {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col min-h-[calc(100vh-80px)] p-6 md:p-8 space-y-6">
      <div className="mb-2">
        <h1 className="text-3xl font-heading font-bold text-black tracking-tight">Profile Settings</h1>
      </div>

      <ProfileHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2">
          <AccountDetails />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <SecuritySettings />
          <NotificationPreferences />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-6 pb-4 mt-auto border-t border-neutral-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-secondary-light">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Last active profile change: Oct 12, 2023 • 09:42 AM
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="px-8 font-bold border-none bg-neutral hover:bg-neutral-border/40 text-secondary-dark">
            Discard
          </Button>
          <Button className="px-8 font-bold bg-primary hover:bg-primary-dark text-white">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
