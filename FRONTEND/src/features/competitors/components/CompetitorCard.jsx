import React from 'react';
import CompetitorStatusBadge from './CompetitorStatusBadge';
import CompetitorActions from './CompetitorActions';
import { Building2, Globe } from 'lucide-react';

export default function CompetitorCard({ competitor, onView, onEdit }) {
  if (!competitor) return null;

  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs hover:border-[#2563EB]/40 transition-all flex flex-col justify-between cursor-pointer group"
      onClick={() => onView && onView(competitor.id)}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors line-clamp-1">
                {competitor.name || '—'}
              </h4>
              <p className="font-mono text-[11px] text-[#94A3B8]">ID: {competitor.id}</p>
            </div>
          </div>
          <CompetitorStatusBadge isActive={competitor.is_active} />
        </div>

        {competitor.website && (
          <div className="mt-3">
            <a
              href={competitor.website.startsWith('http') ? competitor.website : `https://${competitor.website}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs text-[#2563EB] hover:underline"
            >
              <Globe className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="line-clamp-1">{competitor.website.replace(/^https?:\/\//, '')}</span>
            </a>
          </div>
        )}

        {competitor.description && (
          <p className="text-xs text-[#64748B] mt-2 line-clamp-2 leading-relaxed">
            {competitor.description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#94A3B8]">
        <span>
          {competitor.created_at ? `Added ${new Date(competitor.created_at).toLocaleDateString()}` : '—'}
        </span>
        <CompetitorActions
          website={competitor.website}
          onView={() => onView && onView(competitor.id)}
          onEdit={() => onEdit && onEdit(competitor)}
        />
      </div>
    </div>
  );
}
