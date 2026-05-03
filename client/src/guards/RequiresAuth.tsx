import React from 'react';

export default function RequiresAuth({ children }: { children: React.ReactNode }) {
  // Authentication is now primarily handled by middleware.ts using HTTP-only cookies.
  // This component remains as a wrapper to maintain compatibility with existing page structures.
  return <>{children}</>;
}
