import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { UserCircle2 } from 'lucide-react';

export function AccountDetails() {
  return (
    <Card className="h-full border-transparent bg-[#F5F7F5] shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 flex flex-row items-center gap-2">
        <UserCircle2 className="w-5 h-5 text-primary-dark" />
        <CardTitle className="text-lg font-bold text-black font-heading">Account Details</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Full Name</label>
            <Input 
              value="Admin User" 
              readOnly
              className="bg-neutral-border/30 border-none font-medium text-black focus:ring-0"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Email Address</label>
            <Input 
              value="admin@campus.edu" 
              readOnly
              className="bg-neutral-border/30 border-none font-medium text-black focus:ring-0"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Department</label>
            <div className="relative">
              <select className="w-full px-4 py-2.5 bg-neutral-border/30 border-none text-black font-medium text-sm rounded-lg appearance-none focus:ring-0 focus:outline-none">
                <option>Operations & Energy</option>
                <option>Facilities Management</option>
                <option>IT Administration</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                <svg className="w-4 h-4 text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-widest">Phone Number</label>
            <Input 
              value="+1 (555) 000-1234" 
              readOnly
              className="bg-neutral-border/30 border-none font-medium text-black focus:ring-0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
