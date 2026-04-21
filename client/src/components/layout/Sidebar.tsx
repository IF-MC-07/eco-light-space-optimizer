import React from 'react';
import { 
  LayoutDashboard, 
  Lightbulb, 
  BarChart2, 
  Bot, 
  DoorOpen, 
  Plus, 
  HelpCircle, 
  LogOut 
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export function Sidebar() {
  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, active: false },
    { label: 'Lighting & AC', icon: <Lightbulb size={20} />, active: false },
    { label: 'Savings Report', icon: <BarChart2 size={20} />, active: true },
    { label: 'Automation', icon: <Bot size={20} />, active: false },
    { label: 'Room Availability', icon: <DoorOpen size={20} />, active: false },
  ];

  return (
    <aside className="w-64 h-screen bg-white border-r border-neutral-border flex flex-col justify-between flex-shrink-0 fixed left-0 top-0 z-20">
      <div>
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.06 19.43 4 16.05 4 12C4 7.95 7.06 4.57 11 4.07V19.93ZM13 4.07C16.94 4.57 20 7.95 20 12C20 16.05 16.94 19.43 13 19.93V4.07Z" fill="currentColor"/>
            </svg>
            <div className="flex flex-col">
              <span className="text-neutral-900 font-extrabold tracking-tight text-lg leading-none">Eco-Light</span>
              <span className="text-[10px] text-primary-light font-medium tracking-wide uppercase leading-tight">Space Optimizer</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <a 
              key={item.label}
              href="#"
              className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-semibold transition-colors ${
                item.active 
                  ? 'bg-[#F0FDF4] text-primary shadow-[inset_4px_0_0_0_#2E7D32]' 
                  : 'text-secondary hover:bg-neutral hover:text-secondary-dark'
              }`}
            >
              <div className={item.active ? 'text-primary' : 'text-secondary-light'}>
                {item.icon}
              </div>
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Bottom Area */}
      <div className="p-4 flex flex-col gap-2 border-t border-neutral-border">
        <Button variant="primary" fullWidth className="mb-2 justify-start pl-4 gap-2 text-sm shadow-sm">
          <Plus size={18} />
          Add New Device
        </Button>
        <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-secondary hover:text-secondary-dark hover:bg-neutral rounded-md">
          <HelpCircle size={20} className="text-secondary-light" />
          Help
        </a>
        <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-secondary hover:text-secondary-dark hover:bg-neutral rounded-md">
          <LogOut size={20} className="text-secondary-light" />
          Logout
        </a>
      </div>
    </aside>
  );
}
