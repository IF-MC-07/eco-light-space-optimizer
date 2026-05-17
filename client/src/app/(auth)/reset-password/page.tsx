"use client";
import React, { Suspense } from 'react';
import ResetPassword from '@/components/pages/auth/ResetPassword';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-secondary-dark font-bold text-sm">Loading...</div>}>
      <ResetPassword />
    </Suspense>
  );
}

