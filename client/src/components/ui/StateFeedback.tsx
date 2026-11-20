"use client";
import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-neutral-border/60', className)}
      {...props}
    />
  );
}

export interface ChartSkeletonProps {
  height?: number | string;
  className?: string;
}

export function ChartSkeleton({ height = 280, className }: ChartSkeletonProps) {
  return (
    <div
      style={{ height }}
      className={cn(
        'w-full flex flex-col justify-end gap-3 p-6 bg-slate-50/50 rounded-xl animate-pulse',
        className
      )}
    >
      <div className="flex items-end justify-between gap-3 h-full pb-4 border-b border-slate-200">
        <Skeleton className="w-full h-1/3 rounded" />
        <Skeleton className="w-full h-2/3 rounded" />
        <Skeleton className="w-full h-1/2 rounded" />
        <Skeleton className="w-full h-4/5 rounded" />
        <Skeleton className="w-full h-3/5 rounded" />
        <Skeleton className="w-full h-1/2 rounded" />
        <Skeleton className="w-full h-2/3 rounded" />
      </div>
      <div className="flex justify-between gap-2">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  );
}

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = 'Terjadi kesalahan saat memuat data',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center text-secondary',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <p className="text-sm font-semibold text-secondary-dark mb-1">{message}</p>
      <p className="text-xs text-secondary-light mb-4">Silakan coba beberapa saat lagi</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outlined"
          className="text-xs font-bold gap-2 py-1 px-3"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Coba lagi
        </Button>
      )}
    </div>
  );
}

export interface EmptyStateProps {
  title?: string;
  message?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title,
  message = 'Tidak ada data',
  description,
  icon,
  className,
  action,
}: EmptyStateProps) {
  const displayTitle = title || message;
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center text-secondary',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <p className="text-sm font-semibold text-secondary-dark">{displayTitle}</p>
      {description && (
        <p className="text-xs text-secondary-light mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
