import React from 'react';
import Skeleton from '../../../components/Skeleton';

/**
 * PricingSkeleton Component
 * Provides clean skeleton loaders matching the exact card and grid layouts of the Pricing UI.
 */
export default function PricingSkeleton({ variant = 'overview', className = '' }) {
  if (variant === 'overview') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton width="45%" height="12px" />
              <Skeleton variant="circular" width="32px" height="32px" />
            </div>
            <Skeleton width="65%" height="28px" />
            <div className="pt-2 border-t border-[#F1F5F9] flex justify-between">
              <Skeleton width="30%" height="12px" />
              <Skeleton width="25%" height="12px" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'prediction') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3">
              <Skeleton width="40%" height="12px" />
              <Skeleton width="60%" height="28px" />
              <Skeleton width="80%" height="12px" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-2">
          <Skeleton width="25%" height="14px" />
          <Skeleton width="90%" height="12px" />
          <Skeleton width="75%" height="12px" />
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton width="30%" height="16px" />
          <Skeleton width="15%" height="16px" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[#F8FAFC]">
              <Skeleton width="25%" height="14px" />
              <Skeleton width="15%" height="14px" />
              <Skeleton width="20%" height="14px" />
              <Skeleton width="15%" height="14px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full Page Skeleton
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton width="220px" height="28px" />
          <Skeleton width="340px" height="14px" />
        </div>
        <Skeleton width="160px" height="36px" />
      </div>

      {/* Product selector skeleton */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
        <Skeleton width="100%" height="48px" />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3">
            <Skeleton width="40%" height="12px" />
            <Skeleton width="55%" height="24px" />
            <Skeleton width="80%" height="12px" />
          </div>
        ))}
      </div>
    </div>
  );
}
