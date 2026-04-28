import React from 'react';
import { Navigate } from 'react-router-dom';

export default function RequiresAuth({ children }: { children: React.ReactNode }) {
  // Real token-based auth check
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const isAuthenticated = Boolean(token);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
