import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';

interface NavbarProps {
  title?: string;
  searchPlaceholder?: string;
  variant?: "admin" | "public";
}

export function Navbar({ 
  title = "Eco-Light & Space Optimizer", 
  searchPlaceholder = "Search systems...",
  variant = "admin"
}: NavbarProps) {
  return (
    <header className="h-20 bg-white border-b border-neutral-border flex items-center justify-between px-8 z-10 w-full">
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
            <button className="text-secondary-light hover:text-secondary-dark transition-colors relative">
              <Bell size={20} />
            </button>
            <div className="h-8 w-8 rounded-full bg-[#1E293B] flex items-center justify-center text-white overflow-hidden">
               <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-6">
          {/* Search */}
          <div className="relative hidden md:block w-72">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-light pointer-events-none">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder={searchPlaceholder}
              className="w-full bg-[#F1F5F9] border-none rounded-md py-2.5 pl-10 pr-4 text-sm text-secondary-dark placeholder-secondary-light focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-4 text-secondary-light">
            <button className="hover:text-secondary-dark transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-tertiary rounded-full border border-white"></span>
            </button>
            <button className="hover:text-secondary-dark transition-colors">
              <Settings size={20} />
            </button>
          </div>

          {/* Profile */}
          <div className="h-9 w-9 rounded-full overflow-hidden border border-neutral-border">
            <img 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
              alt="User profile" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </header>
  );
}
