import React from 'react';
import { Eye, Edit3, ExternalLink } from 'lucide-react';

export default function CompetitorActions({
  onView,
  onEdit,
  website,
  size = 'md',
  className = '',
}) {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const buttonPadding = size === 'sm' ? 'p-1.5' : 'p-2';

  return (
    <div
      className={`inline-flex items-center gap-1 text-[#64748B] ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {website && (
        <a
          href={website.startsWith('http') ? website : `https://${website}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonPadding} rounded-lg hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors`}
          title={`Visit website: ${website}`}
          aria-label={`Visit website: ${website}`}
        >
          <ExternalLink className={iconSize} />
        </a>
      )}

      {onView && (
        <button
          type="button"
          onClick={onView}
          className={`${buttonPadding} rounded-lg hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors cursor-pointer`}
          title="View competitor details"
          aria-label="View competitor details"
        >
          <Eye className={iconSize} />
        </button>
      )}

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className={`${buttonPadding} rounded-lg hover:bg-blue-50 hover:text-[#2563EB] transition-colors cursor-pointer`}
          title="Edit competitor"
          aria-label="Edit competitor"
        >
          <Edit3 className={iconSize} />
        </button>
      )}
    </div>
  );
}
