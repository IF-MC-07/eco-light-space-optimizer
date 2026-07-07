"use client";
import React from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children }: RoleGuardProps) {
  return <>{children}</>; // Bypass sementara
}