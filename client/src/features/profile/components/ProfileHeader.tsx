import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Pencil } from 'lucide-react';

export function ProfileHeader() {
  return (
    <Card className="border-transparent shadow-sm overflow-visible relative z-0">
      <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6">
        {/* Avatar Section */}
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-[#3B82F6] overflow-hidden border-4 border-white shadow-md flex items-center justify-center">
            {/* Using a placeholder SVG for the avatar character */}
            <svg viewBox="0 0 100 100" className="w-full h-full bg-[#4E9B8D] text-white" fill="none">
              {/* Simple avatar drawing */}
              <circle cx="50" cy="40" r="20" fill="#FCD5CE"/>
              <path d="M30 40 Q50 30 70 40" stroke="#3D2B1F" strokeWidth="4" strokeLinecap="round" />
              <path d="M25 100 Q50 60 75 100" fill="#1E293B"/>
            </svg>
          </div>
          <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-dark hover:bg-primary text-white rounded-full flex items-center justify-center shadow-lg transition-colors border-2 border-white">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Info Section */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-heading font-bold text-black mb-1">Admin User</h2>
          <p className="text-sm font-medium text-secondary-light mb-3">admin@campus.edu</p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="px-3 py-1 bg-[#86EFAC] text-primary-dark text-[10px] font-bold rounded-full uppercase tracking-wider">
              Super Admin
            </span>
            <span className="px-3 py-1 bg-neutral-border/50 text-secondary-dark text-[10px] font-bold rounded-full uppercase tracking-wider">
              Building Alpha-7
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <Button variant="secondary" className="bg-neutral border-none text-secondary-dark font-bold hover:bg-neutral-border/40">
            Edit Avatar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
