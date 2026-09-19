import React from 'react';
import { BarChart3, AlertCircle, Info, Database } from 'lucide-react';

export default function AnalyticsEmptyState({
  title = 'No Data Available',
  description = 'There are currently no observations to display for this metric.',
  type = 'default',
  action = null,
  compact = false,
}) {
  const getIcon = () => {
    switch (type) {
      case 'warning':
      case 'cost':
        return AlertCircle;
      case 'info':
        return Info;
      case 'database':
        return Database;
      default:
        return BarChart3;
    }
  };

  const Icon = getIcon();

  const getIconColors = () => {
    switch (type) {
      case 'warning':
      case 'cost':
        return 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
      case 'info':
        return 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]';
      default:
        return 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]';
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] ${
        compact ? 'py-6 px-4' : 'py-10 px-6'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${getIconColors()}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-[#0F172A]">{title}</h4>
      <p className="text-xs text-[#64748B] mt-1 max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
