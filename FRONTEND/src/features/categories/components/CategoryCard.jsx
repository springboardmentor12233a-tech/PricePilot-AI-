import React from 'react';
import { Tag, Calendar, FolderTree } from 'lucide-react';
import Badge from '../../../components/Badge';

export default function CategoryCard({ category, parentName }) {
  if (!category) return null;

  const formattedDate = category.created_at
    ? new Date(category.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs hover:border-[#CBD5E1] transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#0F172A] line-clamp-1">
              {category.name}
            </h3>
            {parentName && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-[#64748B]">Parent:</span>
                <Badge variant="default" size="sm">{parentName}</Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-[#64748B] line-clamp-2 min-h-[2rem]">
        {category.description || 'No description provided.'}
      </p>

      {formattedDate && (
        <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#94A3B8]">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Created {formattedDate}
          </span>
          <span className="font-mono text-[10px] text-[#94A3B8]">ID: {category.id}</span>
        </div>
      )}
    </div>
  );
}
