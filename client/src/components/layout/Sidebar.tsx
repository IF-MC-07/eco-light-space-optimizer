"use client";
import React from 'react';
import { 
  LayoutDashboard, 
  Lightbulb, 
  BarChart2, 
  Bot, 
  DoorOpen, 
  Plus, 
  HelpCircle, 
  LogOut,
  Activity,
  Users
} from 'lucide-react';
import { Button } from '../ui/Button';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useMe } from '@/features/auth/hooks';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuth } from '@/hooks/useAuth';

export function Sidebar() {
  const pathname = usePathname();
  const { data: userData } = useMe();
  const { logout } = useAuth();
  const role = userData?.user?.role;
  
  const allNavItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
    { label: 'Energy Monitor', icon: <Activity size={20} />, href: '/energy-monitor' },
    { label: 'Lighting & AC', icon: <Lightbulb size={20} />, href: '/lighting-ac' },
    { label: 'Savings Report', icon: <BarChart2 size={20} />, href: '/savings-report' },
    { label: 'Automation', icon: <Bot size={20} />, href: '/automation' },
    { label: 'Room Availability', icon: <DoorOpen size={20} />, href: '/room-availability' },
    { label: 'Users Management', icon: <Users size={20} />, href: '/users' },
  ];

  const allowedForUser = ['/dashboard', '/room-availability', '/lighting-ac', '/profile'];

  const navItems = ['admin', 'manager', 'ADMIN', 'MANAGER'].includes(role) 
    ? allNavItems 
    : allNavItems.filter(item => allowedForUser.includes(item.href));

  return (
    <>
    <aside className="w-64 h-screen bg-white border-r border-neutral-border flex flex-col justify-between flex-shrink-0 fixed left-0 top-0 z-20">
      <div>
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 mb-4">
          <div className="flex items-center gap-2">
            <img src="images/Logo Eco-Light.png" alt="Logo-Eco-Light" className="w-full h-full object-contain"/>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link 
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-semibold transition-colors ${
                  isActive 
                    ? 'bg-[#F0FDF4] text-primary shadow-[inset_4px_0_0_0_#2E7D32]' 
                    : 'text-secondary hover:bg-neutral hover:text-secondary-dark'
                }`}
              >
                <div className={isActive ? 'text-primary' : 'text-secondary-light'}>
                  {item.icon}
                </div>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area */}
      <div className="p-4 flex flex-col gap-2 border-t border-neutral-border">
        <RoleGuard allowedRoles={['admin']}>
          <Button variant="primary" fullWidth className="mb-2 justify-start pl-4 gap-2 text-sm shadow-sm">
            <Plus size={18} />
            Add New Device
          </Button>
        </RoleGuard>
        <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-secondary hover:text-secondary-dark hover:bg-neutral rounded-md">
          <HelpCircle size={20} className="text-secondary-light" />
          Help
        </a>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-secondary hover:text-secondary-dark hover:bg-neutral rounded-md">
          <LogOut size={20} className="text-secondary-light" />
          Logout
        </button>
      </div>
    </aside>
    {process.env.NODE_ENV === 'development' && (
      <div style={{
        position: 'fixed', bottom: 16, right: 16,
        background: '#1a1a1a', color: '#00ff00',
        padding: '8px 12px', borderRadius: 8,
        fontFamily: 'monospace', fontSize: 12, zIndex: 9999
      }}>
        role: {role ?? 'undefined'} |
        id: {userData?.user?.user_id ?? 'undefined'}
      </div>
    )}
    </>
  );
}
