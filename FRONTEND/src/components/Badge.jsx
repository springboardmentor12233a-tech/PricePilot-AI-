import React, { useState } from 'react';

/**
 * Badge
 * Variants: default/neutral, primary, success, warning, danger
 * Sizes:    sm, md, lg
 *
 * Props
 *  dot          show a status dot
 *  pulse        with `dot`, emit a soft ping ring (good for "live" or "syncing")
 *  icon         optional icon component rendered before the label
 *  onRemove     renders a close button; the badge shrinks away, then this is called
 *  removeLabel  accessible name for the close button (default "Remove")
 *  animate      play a small pop-in when the badge mounts (default true)
 */

const CSS = `
.bdg {
  position: relative;
  background-color: var(--bdg-bg);
  color: var(--bdg-fg);
  box-shadow:
    inset 0 0 0 1px var(--bdg-ring),
    inset 0 1px 0 rgba(255, 255, 255, 0.65);
  transition:
    background-color 220ms ease,
    color 220ms ease,
    box-shadow 220ms ease,
    transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.bdg-in { animation: bdg-in 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.bdg-out { animation: bdg-out 180ms ease-in forwards; }
@keyframes bdg-in  { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes bdg-out { to   { transform: scale(0.8); opacity: 0; } }

.bdg-dot {
  position: relative;
  display: inline-block;
  border-radius: 9999px;
  background-color: var(--bdg-dot);
  transition: background-color 220ms ease;
}
.bdg-dot[data-pulse="true"]::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-color: var(--bdg-dot);
  animation: bdg-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes bdg-ping {
  0%   { transform: scale(1);   opacity: 0.55; }
  80%, 100% { transform: scale(2.8); opacity: 0; }
}

.bdg-x {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  outline: 2px solid transparent;
  outline-offset: 0;
  transition:
    opacity 150ms ease,
    background-color 150ms ease,
    transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
    outline-offset 180ms ease,
    outline-color 180ms ease;
}
.bdg-x:hover { opacity: 1; background-color: var(--bdg-ring); transform: rotate(90deg); }
.bdg-x:active { transform: rotate(90deg) scale(0.85); }
.bdg-x:focus-visible { outline-color: var(--bdg-dot); outline-offset: 2px; opacity: 1; }

@media (prefers-reduced-motion: reduce) {
  .bdg-in, .bdg-out { animation-duration: 1ms; }
  .bdg-dot[data-pulse="true"]::after { animation: none; }
  .bdg, .bdg-x { transition-duration: 1ms; }
  .bdg-x:hover, .bdg-x:active { transform: none; }
}
`;

const VARIANTS = {
  default: { '--bdg-bg': '#F1F5F9', '--bdg-fg': '#475569', '--bdg-ring': '#E2E8F0', '--bdg-dot': '#64748B' },
  primary: { '--bdg-bg': '#EFF6FF', '--bdg-fg': '#1D4ED8', '--bdg-ring': '#BFDBFE', '--bdg-dot': '#2563EB' },
  success: { '--bdg-bg': '#F0FDF4', '--bdg-fg': '#15803D', '--bdg-ring': '#BBF7D0', '--bdg-dot': '#16A34A' },
  warning: { '--bdg-bg': '#FFFBEB', '--bdg-fg': '#B45309', '--bdg-ring': '#FDE68A', '--bdg-dot': '#F59E0B' },
  danger: { '--bdg-bg': '#FEF2F2', '--bdg-fg': '#B91C1C', '--bdg-ring': '#FECACA', '--bdg-dot': '#DC2626' },
};

const SIZES = {
  sm: { cls: 'text-[11px] h-5 px-2 gap-1', dot: 6, icon: 'w-3 h-3', x: 14 },
  md: { cls: 'text-[12px] h-6 px-2.5 gap-1.5', dot: 6, icon: 'w-3.5 h-3.5', x: 16 },
  lg: { cls: 'text-[13px] h-7 px-3 gap-1.5', dot: 8, icon: 'w-4 h-4', x: 18 },
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  icon: Icon,
  onRemove,
  removeLabel = 'Remove',
  animate = true,
  className = '',
  id,
}) {
  const [leaving, setLeaving] = useState(false);
  const v = VARIANTS[variant] || VARIANTS.default;
  const s = SIZES[size] || SIZES.md;

  const handleRemove = (e) => {
    e.stopPropagation();
    setLeaving(true);
    setTimeout(() => {
      onRemove?.();
      setLeaving(false);
    }, 180);
  };

  const classes = [
    'bdg inline-flex items-center whitespace-nowrap rounded-full font-medium select-none',
    s.cls,
    leaving ? 'bdg-out' : animate ? 'bdg-in' : '',
    onRemove ? 'pr-1' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <style>{CSS}</style>
      <span id={id} className={classes} style={v}>
        {dot && (
          <span
            className="bdg-dot shrink-0"
            data-pulse={pulse || undefined}
            style={{ width: s.dot, height: s.dot }}
            aria-hidden="true"
          />
        )}
        {Icon && <Icon className={`${s.icon} shrink-0`} aria-hidden="true" />}
        <span>{children}</span>
        {onRemove && (
          <button
            type="button"
            className="bdg-x shrink-0"
            style={{ width: s.x, height: s.x }}
            onClick={handleRemove}
            aria-label={removeLabel}
          >
            <svg viewBox="0 0 12 12" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
            </svg>
          </button>
        )}
      </span>
    </>
  );
}