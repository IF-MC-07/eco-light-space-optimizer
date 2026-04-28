import React from 'react';
import { Navigate } from 'react-router-dom';

export default function RequiresAuth({ children }: { children: React.ReactNode }) {
  // 🔍 Assumption: Simple mock auth check for UI development
  const isAuthenticated = true;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
