import React from 'react';

export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-white/10 rounded w-1/4 mb-4"></div>
      <div className="h-8 bg-white/10 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-white/10 rounded w-3/4"></div>
    </div>
  );
}

export function StockAnalysisSkeleton() {
  return (
    <div className="space-y-6">
      <div className="card animate-pulse">
        <div className="flex justify-between">
          <div className="flex-1">
            <div className="h-6 bg-white/10 rounded w-32 mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-48"></div>
          </div>
          <div className="text-right">
            <div className="h-8 bg-white/10 rounded w-24 mb-2"></div>
            <div className="h-6 bg-white/10 rounded w-16"></div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <CardSkeleton key={i} />
        ))}
      </div>

      <CardSkeleton />
    </div>
  );
}