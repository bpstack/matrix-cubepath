import React from 'react';

/** Animated shimmer bar — mimics loading content. */
export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded bg-matrix-border/40 ${className}`} style={style} />;
}

/** A skeleton that looks like a SectionCard with placeholder bars. */
export function CardSkeleton({ lines = 3, hasTitle = true }: { lines?: number; hasTitle?: boolean }) {
  return (
    <div className="bg-matrix-surface border border-matrix-border rounded-md p-4">
      {hasTitle && (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-matrix-border">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-3.5 w-28" />
        </div>
      )}
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: `${65 + Math.sin(i * 2.3) * 25}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Grid skeleton matching the Overview two-column card layout. */
export function StatsCardSkeleton() {
  return (
    <div className="bg-matrix-surface border border-matrix-border rounded-md p-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-matrix-border">
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="h-3.5 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-center space-y-1.5">
            <Skeleton className="h-5 w-12 mx-auto" />
            <Skeleton className="h-2.5 w-16 mx-auto" />
          </div>
        ))}
      </div>
      <Skeleton className="h-1 w-full mt-3 rounded-full" />
    </div>
  );
}

/** Skeleton for a list-style card (activity, focus queue). */
export function ListCardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-matrix-surface border border-matrix-border rounded-md p-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-matrix-border">
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="h-3.5 w-32" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-3 h-3 rounded-full shrink-0" />
            <Skeleton className="h-3 flex-1" style={{ width: `${55 + Math.sin(i * 1.7) * 30}%` }} />
            <Skeleton className="w-8 h-2.5 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Large schema area skeleton. */
export function SchemaSkeleton() {
  return (
    <div className="bg-matrix-surface border border-matrix-border rounded-md p-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-matrix-border">
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="h-3.5 w-36" />
      </div>
      <div className="space-y-4">
        {/* Mission bar */}
        <Skeleton className="h-8 w-full rounded" />
        {/* Objective rows */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="ml-4 space-y-2">
            <Skeleton className="h-5 w-3/4 rounded" />
            <div className="ml-4 space-y-1.5">
              {Array.from({ length: 2 }).map((_, j) => (
                <Skeleton key={j} className="h-4 rounded" style={{ width: `${50 + Math.sin((i + j) * 1.5) * 30}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full Overview skeleton that mirrors the actual layout. */
export function OverviewSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top row: Schema left, side cards right */}
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-4">
          <SchemaSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StatsCardSkeleton />
            <CardSkeleton lines={4} />
            <ListCardSkeleton rows={5} />
            <CardSkeleton lines={5} />
          </div>
        </div>
        {/* Right column (xl+) */}
        <div className="hidden xl:flex flex-col gap-4 w-80 shrink-0">
          <CardSkeleton lines={4} />
          <ListCardSkeleton rows={6} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={4} />
          <ListCardSkeleton rows={4} />
        </div>
      </div>
    </div>
  );
}
