"use client";
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMe } from '@/features/auth/hooks';

const MAHASISWA_ALLOWED_ROUTES = ['/dashboard', '/lighting-ac', '/rooms', '/room-availability'];

export default function RequiresAuth({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: userData, isLoading } = useMe();
  const role = userData?.user?.role;

  useEffect(() => {
    if (!isLoading && role === 'mahasiswa') {
      const isAllowed = MAHASISWA_ALLOWED_ROUTES.some(route => 
        pathname === route || pathname?.startsWith(route + '/')
      );
      if (!isAllowed) {
        router.push('/dashboard');
      }
    }
  }, [role, pathname, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
}
