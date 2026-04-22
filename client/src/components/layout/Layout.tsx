import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
  navbarTitle?: string;
  searchPlaceholder?: string;
  variant?: "admin" | "public";
}

export function Layout({ children, navbarTitle, searchPlaceholder, variant = "admin" }: LayoutProps) {
  if (variant === "public") {
    return (
      <div className="flex flex-col min-h-screen bg-neutral">
        <Navbar variant="public" title={navbarTitle} searchPlaceholder={searchPlaceholder} />
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
        <Navbar title={navbarTitle} searchPlaceholder={searchPlaceholder} variant="admin" />
        <main className="flex-1 p-8 overflow-auto h-[calc(100vh-80px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
