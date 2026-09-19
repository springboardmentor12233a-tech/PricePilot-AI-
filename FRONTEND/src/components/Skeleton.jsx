import React from 'react';

/**
 * Reusable Skeleton Component with Shimmer Animation
 * Provides card, table, chart, and page loading primitives
 */
export default function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'card':
        return 'rounded-2xl h-48 w-full';
      case 'button':
        return 'rounded-lg h-10 w-28';
      case 'table-row':
        return 'rounded-md h-12 w-full';
      case 'text':
      default:
        return 'rounded h-4 w-full';
    }
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  const renderSingle = (key) => (
    <div
      key={key}
      style={style}
      className={`bg-slate-200/70 animate-pulse ${getVariantStyles()} ${className}`}
      aria-hidden="true"
    />
  );

  if (count > 1) {
    return (
      <div className="space-y-3 w-full">
        {Array.from({ length: count }).map((_, i) => renderSingle(i))}
      </div>
    );
  }

  return renderSingle(0);
}

/**
 * Skeleton presets for structured layouts
 */
export function CardSkeleton({ count = 1 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="w-8 h-8 bg-slate-200 rounded-lg" />
          </div>
          <div className="h-8 bg-slate-200 rounded w-36 mb-2" />
          <div className="h-3 bg-slate-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs animate-pulse">
      <div className="px-6 py-4 border-b border-[#E2E8F0] flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 rounded flex-1" />
        ))}
      </div>
      <div className="divide-y divide-[#E2E8F0]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-6 py-4 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-4 bg-slate-100 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-5 bg-slate-200 rounded w-32" />
        <div className="h-8 bg-slate-200 rounded-lg w-24" />
      </div>
      <div className="h-64 bg-slate-100 rounded-xl flex items-end justify-between p-6 gap-3">
        {[40, 65, 30, 80, 55, 90, 70, 85].map((h, i) => (
          <div key={i} style={{ height: `${h}%` }} className="bg-slate-200 rounded-t w-full" />
        ))}
      </div>
    </div>
  );
}
