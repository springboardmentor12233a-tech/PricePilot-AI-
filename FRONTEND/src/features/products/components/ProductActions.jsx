import React from 'react';
import { Eye, Edit3, Trash2 } from 'lucide-react';

export default function ProductActions({
  onView,
  onEdit,
  onDelete,
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
      {onView && (
        <button
          type="button"
          onClick={onView}
          className={`${buttonPadding} rounded-lg hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors cursor-pointer`}
          title="View product details"
          aria-label="View product details"
        >
          <Eye className={iconSize} />
        </button>
      )}

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className={`${buttonPadding} rounded-lg hover:bg-blue-50 hover:text-[#2563EB] transition-colors cursor-pointer`}
          title="Edit product"
          aria-label="Edit product"
        >
          <Edit3 className={iconSize} />
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={`${buttonPadding} rounded-lg hover:bg-red-50 hover:text-[#DC2626] transition-colors cursor-pointer`}
          title="Delete product"
          aria-label="Delete product"
        >
          <Trash2 className={iconSize} />
        </button>
      )}
    </div>
  );
}
