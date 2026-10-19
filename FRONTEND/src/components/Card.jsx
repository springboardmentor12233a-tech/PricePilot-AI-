import React from 'react';

/**
 * Card
 * Refined enterprise surface: hairline border, soft layered shadow, 16px radius.
 *
 * Backward compatible with the previous API:
 *   children, title, subtitle, action, footer, className, headerClassName,
 *   bodyClassName, footerClassName, id, onClick, hoverable, ...props
 *
 * New optional props:
 *   icon      - node shown in a soft tile beside the title
 *   noPadding - removes body padding (for tables, lists, edge-to-edge content)
 */
export default function Card({
  children,
  title,
  subtitle,
  action,
  footer,
  icon,
  noPadding = false,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  id,
  onClick,
  hoverable = false,
  ...props
}) {
  const isInteractive = hoverable || typeof onClick === 'function';
  const hasHeader = title || subtitle || action || icon;

  const handleKeyDown = (e) => {
    if (typeof onClick !== 'function') return;
    if (e.target !== e.currentTarget) return; // ignore keys from inner controls
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e);
    }
  };

  const interactiveProps =
    typeof onClick === 'function'
      ? { role: 'button', tabIndex: 0, onKeyDown: handleKeyDown }
      : {};

  return (
    <div
      id={id}
      onClick={onClick}
      {...interactiveProps}
      className={`group/card relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white
        shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_-8px_rgba(15,23,42,0.06)]
        transition-all duration-200 ease-out
        ${
          isInteractive
            ? `cursor-pointer hover:-translate-y-0.5 hover:border-[#CBD5E1]
               hover:shadow-[0_2px_4px_rgba(15,23,42,0.05),0_14px_28px_-12px_rgba(15,23,42,0.14)]
               active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0
               focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/20`
            : ''
        } ${className}`}
      {...props}
    >
      {hasHeader && (
        <div
          className={`flex items-center justify-between gap-4 border-b border-[#EEF2F6]
            bg-gradient-to-b from-white to-[#FAFBFD] px-6 py-[18px] ${headerClassName}`}
        >
          <div className="flex min-w-0 items-center gap-3.5">
            {icon && (
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#334155]
                           ring-1 ring-inset ring-[#E2E8F0]"
              >
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="truncate text-base font-semibold leading-tight tracking-[-0.01em] text-[#0F172A]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-[13px] leading-snug text-[#64748B]">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={`${noPadding ? '' : 'p-6'} ${bodyClassName}`}>{children}</div>

      {footer && (
        <div
          className={`border-t border-[#EEF2F6] bg-[#F8FAFC] px-6 py-3.5 text-[13px] text-[#475569] ${footerClassName}`}
        >
          {footer}
        </div>
      )}
    </div>
  );
}