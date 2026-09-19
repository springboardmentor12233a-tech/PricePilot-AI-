import React from 'react';

/**
 * Reusable PageHeader Component
 * Standardized 32-40px page title hierarchy with optional description and action buttons
 */
export default function PageHeader({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  className = '',
}) {
  return (
    <div className={`mb-8 ${className}`}>
      {breadcrumbs && <div className="mb-2.5 text-xs text-[#64748B] flex items-center gap-1.5">{breadcrumbs}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#0F172A] tracking-tight">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {description && (
            <p className="text-sm sm:text-[15px] text-[#64748B] mt-1.5 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-3 shrink-0 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
