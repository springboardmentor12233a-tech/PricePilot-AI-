import React from 'react';

/**
 * PageHeader
 * A refined page title block with optional eyebrow, icon, badge, description,
 * breadcrumbs and actions.
 *
 * Backward compatible with the previous API:
 *   title, description, badge, actions, breadcrumbs, className
 *
 * New optional props:
 *   eyebrow  - small uppercase label above the title (e.g. "Workspace")
 *   icon     - node rendered in a soft tile beside the title
 *   divider  - show the hairline divider under the header (default: true)
 *
 * `breadcrumbs` accepts either:
 *   - a ReactNode (rendered as-is, as before), or
 *   - an array of { label, href?, onClick? } objects (rendered with chevrons)
 */

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5 shrink-0 text-[#CBD5E1]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
    </svg>
  );
}

function Breadcrumbs({ items }) {
  if (!Array.isArray(items)) {
    return (
      <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-[#64748B]">
        {items}
      </div>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-[#64748B]">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const interactive = !isLast && (item.href || item.onClick);
          const Tag = item.href ? 'a' : 'button';

          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {interactive ? (
                <Tag
                  href={item.href}
                  onClick={item.onClick}
                  type={item.href ? undefined : 'button'}
                  className="rounded-md px-1 py-0.5 -mx-1 transition-colors hover:text-[#0F172A] hover:bg-[#F1F5F9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A]/20"
                >
                  {item.label}
                </Tag>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={isLast ? 'text-[#0F172A]' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronIcon />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function PageHeader({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  eyebrow,
  icon,
  divider = true,
  className = '',
}) {
  return (
    <header className={`relative mb-10 ${className}`}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {icon && (
            <div
              className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl
                         bg-gradient-to-br from-white to-[#F1F5F9] text-[#0F172A]
                         ring-1 ring-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_-4px_rgba(15,23,42,0.08)]"
            >
              {icon}
            </div>
          )}

          <div className="min-w-0">
            {eyebrow && (
              <div className="mb-2 flex items-center gap-2">
                <span className="h-[2px] w-5 rounded-full bg-gradient-to-r from-[#0F172A] to-[#94A3B8]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                  {eyebrow}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-[36px] font-semibold leading-[1.1] tracking-[-0.025em] text-[#0F172A]">
                {title}
              </h1>
              {badge && <div className="shrink-0 translate-y-px">{badge}</div>}
            </div>

            {description && (
              <p className="mt-2.5 max-w-2xl text-sm sm:text-[15px] leading-relaxed text-[#64748B]">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
        )}
      </div>

      {divider && (
        <div
          aria-hidden="true"
          className="mt-8 h-px w-full bg-gradient-to-r from-[#CBD5E1] via-[#E2E8F0] to-transparent"
        />
      )}
    </header>
  );
}