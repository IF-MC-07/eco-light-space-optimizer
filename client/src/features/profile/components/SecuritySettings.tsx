import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Shield, ChevronRight } from 'lucide-react';

export function SecuritySettings() {
  return (
    <Card className="border-transparent bg-[#F5F7F5] shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 flex flex-row items-center gap-2">
        <Shield className="w-5 h-5 text-primary-dark" />
        <CardTitle className="text-lg font-bold text-black font-heading">Security</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <button className="w-full flex items-center justify-between bg-white p-4 rounded-xl border border-transparent hover:border-neutral-border transition-colors shadow-sm group">
          <div className="text-left">
            <h4 className="font-bold text-sm text-black mb-0.5">Change Password</h4>
            <p className="text-xs font-medium text-secondary-light">Last updated 3 months ago</p>
          </div>
          <ChevronRight className="w-5 h-5 text-secondary-dark group-hover:text-primary transition-colors" />
        </button>
      </CardContent>
    </Card>
  );
}
