"use client";
import RequiresAuth from '@/guards/RequiresAuth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequiresAuth>
      {children}
    </RequiresAuth>
  );
}
