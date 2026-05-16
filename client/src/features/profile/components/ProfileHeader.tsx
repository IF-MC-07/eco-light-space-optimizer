"use client";
import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Mail, ShieldCheck } from 'lucide-react';
import { useProfile } from '../hooks';

export function ProfileHeader() {
  const { data: response, isLoading } = useProfile();
  const user = response?.data;

  if (isLoading) return <div className="h-40 bg-[#F5F7F5] rounded-3xl animate-pulse" />;

  return (
    <div className="w-full bg-[#F5F7F5] rounded-3xl p-8 relative overflow-hidden">
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 rounded-3xl bg-primary-dark flex items-center justify-center text-white text-3xl font-bold shadow-lg">
          {user?.name.charAt(0)}
        </div>
        
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-heading font-black text-black">{user?.name}</h1>
            <Badge className="bg-primary/20 text-primary-dark border-transparent font-bold uppercase text-[10px] tracking-widest px-2 py-0.5">
              {user?.role}
            </Badge>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 text-sm font-medium text-secondary">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              {user?.email}
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Account Verified
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
    </div>
  );
}
