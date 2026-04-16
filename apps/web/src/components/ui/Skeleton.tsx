'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--radius-md)] bg-primary-surface',
        className,
      )}
    />
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-[2.5rem] border border-border bg-background-card p-5 shadow-card', className)}>
      <Skeleton className="mb-4 h-3 w-24" />
      <Skeleton className="mb-2 h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonTaskRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
      <Skeleton className="h-6 w-6 rounded-full" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[800px] px-6 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-11 w-11 rounded-full" />
      </div>

      {/* Score card */}
      <div className="rounded-[2.5rem] border border-border bg-background-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-14 w-24" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-28 w-28 rounded-full" />
        </div>
      </div>

      {/* Equity bar */}
      <SkeletonCard />

      {/* Alert cards */}
      <div className="grid grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Tasks */}
      <div>
        <Skeleton className="mb-3 h-3 w-24" />
        <div className="rounded-[2rem] border border-border bg-background-card overflow-hidden">
          <SkeletonTaskRow />
          <SkeletonTaskRow />
          <SkeletonTaskRow />
        </div>
      </div>
    </div>
  );
}

export function TasksSkeleton() {
  return (
    <div className="animate-in fade-in duration-200">
      <div className="flex items-center justify-between px-1 pt-2 pb-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-none" />
        <Skeleton className="h-10 flex-1 rounded-none" />
      </div>
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-9 w-16 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-16 mb-2" />
        <div className="rounded-[var(--radius-lg)] border border-border bg-background-card overflow-hidden">
          <SkeletonTaskRow />
          <SkeletonTaskRow />
          <SkeletonTaskRow />
          <SkeletonTaskRow />
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl pb-24 animate-in fade-in duration-200">
      <div className="px-6 pt-6 pb-4">
        <Skeleton className="h-7 w-36" />
      </div>
      <div className="flex gap-2 px-6 mb-6">
        <Skeleton className="h-9 w-16 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
      <div className="px-6 space-y-6">
        <div className="flex flex-col items-center py-6">
          <Skeleton className="h-20 w-28 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
