"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Bell, 
  Settings, 
  User as UserIcon, 
  LayoutDashboard, 
  Activity, 
  Lightbulb, 
  BarChart2, 
  Bot, 
  DoorOpen, 
  Users,
  UserCircle,
  Map,
  PlusCircle,
  Zap,
  UserPlus
} from 'lucide-react';
import { RoleGuard } from '../auth/RoleGuard';
import { useProfile } from '../../features/profile/hooks';
import { useActivityLogList } from '../../features/dashboard/hooks';

interface NavbarProps {
  title?: string;
  searchPlaceholder?: string;
  variant?: "admin" | "public";
}

interface SearchItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  category: string;
  isQuickAction?: boolean;
}

function formatRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  
  if (isNaN(diffMs) || diffMs < 0) return "Just now";
  
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} mins ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export function Navbar({ 
  title = "Eco-Light & Space Optimizer", 
  searchPlaceholder = "Search features...",
  variant = "admin"
}: NavbarProps) {
  const router = useRouter();
  const { data: profileResponse } = useProfile();
  const user = profileResponse?.data;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { data: activityLogs } = useActivityLogList();

  const searchItems: SearchItem[] = [
    // Quick Actions (Priority 3)
    { label: 'Add New Room', href: '/room-availability', icon: <PlusCircle size={16} className="text-primary-dark" />, category: 'Quick Action', isQuickAction: true },
    { label: 'Create New User', href: '/users', icon: <UserPlus size={16} className="text-primary-dark" />, category: 'Quick Action', isQuickAction: true },
    { label: 'New Automation Rule', href: '/automation', icon: <Zap size={16} className="text-primary-dark" />, category: 'Quick Action', isQuickAction: true },
    
    // Regular Items
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={16} />, category: 'Main' },
    { label: 'Energy Monitoring', href: '/energy-monitor', icon: <Activity size={16} />, category: 'Analytics' },
    { label: 'Lighting & AC Control', href: '/lighting-ac', icon: <Lightbulb size={16} />, category: 'Control' },
    { label: 'Savings Reports', href: '/savings-report', icon: <BarChart2 size={16} />, category: 'Analytics' },
    { label: 'Room Availability', href: '/room-availability', icon: <DoorOpen size={16} />, category: 'Main' },
    { label: 'Room Management', href: '/room-availability', icon: <DoorOpen size={16} />, category: 'Admin' },
    { label: 'Zone Configuration', href: '/zone-configuration', icon: <Map size={16} />, category: 'Admin' },
    { label: 'Profile Settings', href: '/profile', icon: <UserCircle size={16} />, category: 'Personal' },
  ];

  const filteredItems = searchQuery 
    ? searchItems.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchItems.filter(item => item.isQuickAction).slice(0, 3);

  // Close search results and notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (href: string) => {
    router.push(href);
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  return (
    <header className="h-20 bg-white border-b border-neutral-border flex items-center justify-between px-8 z-50 w-full relative">
      <div className="flex items-center min-w-[300px]">
        <h2 className="text-primary font-heading font-bold text-xl tracking-tight">{title}</h2>
      </div>

      {variant === "public" ? (
        <>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-sm font-semibold text-primary border-b-2 border-primary pb-1">Home</a>
            <a href="#fitur" className="text-sm font-medium text-secondary hover:text-primary transition-colors">Fitur Utama</a>
            <a href="#carakerja" className="text-sm font-medium text-secondary hover:text-primary transition-colors">Cara Kerja</a>
            <a href="#tim" className="text-sm font-medium text-secondary hover:text-primary transition-colors">Tim</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
              Masuk
            </Link>
            <Link href="/register" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark transition-colors">
              Daftar
            </Link>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-6">
          {/* Search */}
          <div className="relative hidden md:block w-80" ref={searchRef}>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-light pointer-events-none z-10">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder={searchPlaceholder}
              className="w-full bg-[#F1F5F9] border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-sm text-secondary-dark placeholder-secondary-light focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary/20 transition-all shadow-sm"
            />

            {/* Search Results Dropdown */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-neutral-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                <div className="p-3 border-b border-neutral-border bg-neutral/30 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-secondary-light uppercase tracking-widest px-1">
                    {searchQuery ? 'Search Results' : 'Suggested Quick Actions'}
                  </span>
                  {!searchQuery && <span className="text-[9px] font-bold text-primary-dark bg-primary/10 px-1.5 py-0.5 rounded">Top 3</span>}
                </div>
                <div className="max-h-[360px] overflow-y-auto p-1">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <button
                        key={item.href + item.label}
                        onClick={() => handleItemClick(item.href)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm ${item.isQuickAction ? 'bg-primary/10' : 'bg-white border border-neutral-border text-secondary group-hover:text-primary'}`}>
                            {item.icon}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-secondary-dark">{item.label}</p>
                            <p className="text-[10px] text-secondary-light">{item.category}</p>
                          </div>
                        </div>
                        <div className="text-neutral-border group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-sm text-secondary-light">No features found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-4 text-secondary-light">
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="hover:text-secondary-dark transition-colors relative h-10 w-10 flex items-center justify-center rounded-xl hover:bg-neutral"
              >
                <Bell size={20} />
                {activityLogs && activityLogs.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-tertiary rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-neutral-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                  <div className="p-4 border-b border-neutral-border bg-neutral/30 flex justify-between items-center">
                    <span className="text-xs font-bold text-secondary-dark uppercase tracking-wider">
                      Notifications
                    </span>
                    {activityLogs && activityLogs.length > 0 && (
                      <span className="text-[10px] font-bold text-primary-dark bg-primary/10 px-2 py-0.5 rounded-full">
                        {activityLogs.length} New
                      </span>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-neutral-border">
                    {activityLogs && activityLogs.length > 0 ? (
                      activityLogs.slice(0, 5).map((log: any) => {
                        let title = 'System Activity';
                        let desc = log.details || log.action;
                        
                        if (log.action === 'DEVICE_ONLINE') {
                          title = 'Device Connected';
                        } else if (log.action === 'DEVICE_OFFLINE') {
                          title = 'Device Disconnected';
                        } else if (log.action.startsWith('POST')) {
                          const path = log.action.split(' ')[1] || '';
                          const resource = path.split('/')[2] || 'item';
                          title = `New ${resource.charAt(0).toUpperCase() + resource.slice(1)}`;
                          desc = `${log.User?.name || 'System'} added a ${resource}.`;
                        } else if (log.action.startsWith('PUT')) {
                          const path = log.action.split(' ')[1] || '';
                          const resource = path.split('/')[2] || 'item';
                          title = `Updated ${resource.charAt(0).toUpperCase() + resource.slice(1)}`;
                          desc = `${log.User?.name || 'System'} updated a ${resource}.`;
                        } else if (log.action.startsWith('DELETE')) {
                          const path = log.action.split(' ')[1] || '';
                          const resource = path.split('/')[2] || 'item';
                          title = `Deleted ${resource.charAt(0).toUpperCase() + resource.slice(1)}`;
                          desc = `${log.User?.name || 'System'} deleted a ${resource}.`;
                        }

                        return (
                          <div key={log.log_id} className="p-3.5 hover:bg-neutral/40 transition-colors">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-xs font-bold text-secondary-dark">{title}</span>
                              <span className="text-[9px] text-secondary-light font-medium whitespace-nowrap">
                                {formatRelativeTime(log.timestamp)}
                              </span>
                            </div>
                            <p className="text-[11px] text-secondary mt-1 line-clamp-2">{desc}</p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-xs text-secondary-light">No new notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <RoleGuard allowedRoles={['admin']}>
              <Link href="/zone-configuration" className="hover:text-secondary-dark transition-colors h-10 w-10 flex items-center justify-center rounded-xl hover:bg-neutral">
                <Settings size={20} />
              </Link>
            </RoleGuard>
          </div>

          {/* Profile */}
          <Link href="/profile" className="block h-10 w-10 rounded-xl overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all bg-neutral flex items-center justify-center shadow-sm">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt="User profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary-dark text-white text-xs font-bold flex items-center justify-center">
                {user?.name.charAt(0) || <UserIcon size={16} />}
              </div>
            )}
          </Link>
        </div>
      )}
    </header>
  );
}
