import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm h-28 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-200" />
            </div>
            <div className="h-6 w-12 bg-slate-300 rounded" />
            <div className="h-2 w-20 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Primary Panels Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-slate-100 shadow-sm h-80 flex flex-col justify-between">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="w-40 h-40 rounded-full border-8 border-slate-200 mx-auto" />
          <div className="h-3 w-32 bg-slate-200 rounded" />
        </div>

        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-slate-100 shadow-sm h-80 space-y-4">
          <div className="h-4 w-52 bg-slate-200 rounded" />
          <div className="space-y-3">
            <div className="h-14 bg-slate-100 rounded-lg" />
            <div className="h-14 bg-slate-100 rounded-lg" />
            <div className="h-14 bg-slate-100 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Secondary Tables Skeleton */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm space-y-3">
        <div className="h-4 w-60 bg-slate-200 rounded" />
        <div className="h-10 bg-slate-100 rounded-lg" />
        <div className="h-10 bg-slate-100 rounded-lg" />
        <div className="h-10 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
};
