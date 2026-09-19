import React from 'react';

export default function CompetitorFilters({ status, onStatusChange }) {
  return (
    <div className="w-36 shrink-0">
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="w-full h-10.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] transition-all focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
        aria-label="Filter by competitor status"
      >
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
}
