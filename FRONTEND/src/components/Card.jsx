import React from 'react';

/**
 * Reusable Card Component
 * Premium enterprise styling with 1px border (#E2E8F0), 16px radius, and subtle shadow
 */
export default function Card({
  children,
  title,
  subtitle,
  action,
  footer,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  id,
  onClick,
  hoverable = false,
  ...props
}) {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white border border-[#E2E8F0] rounded-2xl shadow-xs transition-all duration-150 ${
        hoverable ? 'hover:border-[#CBD5E1] hover:shadow-sm cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className={`px-6 py-4.5 border-b border-[#E2E8F0] flex items-center justify-between gap-4 ${headerClassName}`}>
          <div>
            {title && <h3 className="text-[16px] font-semibold text-[#0F172A] tracking-tight">{title}</h3>}
            {subtitle && <p className="text-[13px] text-[#64748B] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={`p-6 ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className={`px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] rounded-b-2xl ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
}
