import React from 'react';

export default function ProductDetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E2E8F0]" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-[#E2E8F0] rounded" />
            <div className="h-3.5 w-32 bg-[#F1F5F9] rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-[#E2E8F0] rounded-xl" />
          <div className="h-9 w-20 bg-[#E2E8F0] rounded-xl" />
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl h-56" />
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl h-44" />
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl h-48" />
        </div>
        <div className="space-y-6">
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl h-64" />
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl h-72" />
        </div>
      </div>
    </div>
  );
}
