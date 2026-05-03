"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';

  // Public routes that don't need the admin sidebar
  const isPublicRoute = 
    pathname === '/' || 
    pathname.startsWith('/login') || 
    pathname.startsWith('/register') || 
    pathname.startsWith('/forgot-password') || 
    pathname.startsWith('/reset-password');

  // Dynamic titles based on route
  let title = "Eco-Light & Space Optimizer";
  let searchPlaceholder = "Search systems...";

  if (pathname.startsWith('/dashboard')) {
    title = "Dashboard";
    searchPlaceholder = "Search...";
  } else if (pathname.startsWith('/energy-monitor')) {
    title = "Energy Monitor";
    searchPlaceholder = "Search...";
  } else if (pathname.startsWith('/lighting-ac')) {
    title = "Lighting & AC Status";
    searchPlaceholder = "Search rooms...";
  } else if (pathname.startsWith('/savings-report')) {
    title = "Savings Report";
    searchPlaceholder = "Search reports...";
  } else if (pathname.startsWith('/automation')) {
    title = "Automation Rules";
    searchPlaceholder = "Search routines...";
  } else if (pathname.startsWith('/device-automation')) {
    title = "Device Automation";
    searchPlaceholder = "Search devices...";
  } else if (pathname.startsWith('/room-availability')) {
    title = "Eco-Light & Space Optimizer";
    searchPlaceholder = "Search...";
  } else if (pathname.startsWith('/zone-configuration')) {
    title = "Zone Configuration";
    searchPlaceholder = "Search zones...";
  } else if (pathname.startsWith('/profile')) {
    title = "Profile Settings";
    searchPlaceholder = "Search settings...";
  }

  // If it's auth pages (login/register), we might not even want the public navbar.
  // But to keep it simple and match previous behavior:
  if (isPublicRoute) {
    // Hide navbar entirely on auth pages if desired, but for now we show public navbar 
    // unless we specifically want a different layout. Wait, the main layout used Navbar variant="public".
    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password');
    
    if (isAuthRoute) {
      return (
        <div className="flex flex-col min-h-screen bg-neutral">
          <main className="flex-1 w-full">
            {children}
          </main>
        </div>
      );
    }

    return (
      <div className="flex flex-col min-h-screen bg-neutral">
        <Navbar variant="public" />
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col pt-0">
        <Navbar title={title} searchPlaceholder={searchPlaceholder} variant="admin" />
        <main className="flex-1 p-8 overflow-auto h-[calc(100vh-80px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
