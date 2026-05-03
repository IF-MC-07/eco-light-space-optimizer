"use client";
import React from 'react';
import { useMe } from '@/features/auth/hooks';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { data: userData, isLoading } = useMe();
  
  if (isLoading) {
    // Optionally return a small spinner or skeleton here, 
    // but returning nothing is safer to avoid flashing layout shifts
    return null; 
  }

  const role = userData?.user?.role;

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
