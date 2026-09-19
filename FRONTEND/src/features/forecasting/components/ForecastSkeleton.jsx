import React from 'react';
import Skeleton from '../../../components/Skeleton';

/**
 * ForecastSkeleton Component
 * Provides smooth skeleton placeholders for the forecasting workspace.
 */
export default function ForecastSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Horizon & Controls Skeleton */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
        <Skeleton width="40%" height="20px" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} width="100%" height="48px" />
          ))}
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-2">
            <Skeleton width="50%" height="14px" />
            <Skeleton width="70%" height="28px" />
            <Skeleton width="40%" height="12px" />
          </div>
        ))}
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
          <Skeleton width="30%" height="20px" />
          <Skeleton width="100%" height="280px" />
        </div>
        <div className="space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-3">
            <Skeleton width="40%" height="18px" />
            <Skeleton width="100%" height="60px" />
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-3">
            <Skeleton width="40%" height="18px" />
            <Skeleton width="100%" height="60px" />
          </div>
        </div>
      </div>
    </div>
  );
}
