import React from 'react';
import CompetitorStatusBadge from './CompetitorStatusBadge';
import CompetitorActions from './CompetitorActions';
import { Building2, Globe } from 'lucide-react';

export default function CompetitorTable({
  competitors = [],
  onView,
  onEdit,
}) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
      <table className="w-full text-left text-sm text-[#0F172A]">
        <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
          <tr>
            <th scope="col" className="py-3.5 pl-5 pr-3">Competitor</th>
            <th scope="col" className="py-3.5 px-3">Website</th>
            <th scope="col" className="py-3.5 px-3">Description</th>
            <th scope="col" className="py-3.5 px-3 text-center">Status</th>
            <th scope="col" className="py-3.5 px-3">Added</th>
            <th scope="col" className="py-3.5 pl-3 pr-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F1F5F9]">
          {competitors.map((comp) => (
            <tr
              key={comp.id}
              className="hover:bg-[#F8FAFC]/80 transition-colors group cursor-pointer"
              onClick={() => onView && onView(comp.id)}
            >
              {/* Competitor Name */}
              <td className="py-3.5 pl-5 pr-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                    <Building2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors line-clamp-1">
                      {comp.name || '—'}
                    </span>
                    <span className="text-[11px] font-mono text-[#94A3B8]">
                      ID: {comp.id}
                    </span>
                  </div>
                </div>
              </td>

              {/* Website */}
              <td className="py-3.5 px-3">
                {comp.website ? (
                  <a
                    href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-xs text-[#2563EB] hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0 text-[#64748B]" />
                    <span className="line-clamp-1">{comp.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                ) : (
                  <span className="text-[#94A3B8]">—</span>
                )}
              </td>

              {/* Description */}
              <td className="py-3.5 px-3 max-w-xs">
                <p className="text-xs text-[#64748B] line-clamp-1">
                  {comp.description || '—'}
                </p>
              </td>

              {/* Status */}
              <td className="py-3.5 px-3 text-center">
                <CompetitorStatusBadge isActive={comp.is_active} />
              </td>

              {/* Created Date */}
              <td className="py-3.5 px-3 text-xs text-[#64748B]">
                {comp.created_at ? new Date(comp.created_at).toLocaleDateString() : '—'}
              </td>

              {/* Actions */}
              <td className="py-3.5 pl-3 pr-5 text-right">
                <CompetitorActions
                  website={comp.website}
                  onView={() => onView && onView(comp.id)}
                  onEdit={() => onEdit && onEdit(comp)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
