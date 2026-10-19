import React, { useRef, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * Button
 * Variants: primary, secondary, outline, ghost, danger
 * States:   default, hover, active, focus, disabled, loading, success
 *
 * Motion
 *  - hover:   lifts 1px, colored glow grows, a soft shine sweeps across solid buttons
 *  - press:   springs down to 97% and rebounds with a slight overshoot
 *  - click:   ripple expands from the pointer (or from the center for keyboard use)
 *  - icons:   right icon nudges forward on hover
 *  - loading: spinner slides in from the left, icons collapse out of the way
 *  - success: button turns green and a check mark draws itself
 *  - focus:   outline eases out from the button instead of snapping on
 *
 * Extra props: `success` (boolean), `ripple` (boolean, default true)
 */

const CSS = `
.btn-root {
  position: relative;
  overflow: hidden;
  outline: 2px solid transparent;
  outline-offset: 0;
  box-shadow: 0 1px 2px var(--btn-rest, transparent);
  transition:
    transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 240ms ease,
    background-color 180ms ease,
    border-color 180ms ease,
    color 180ms ease,
    outline-offset 200ms ease,
    outline-color 200ms ease;
}
.btn-root:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px -6px var(--btn-glow, rgba(15, 23, 42, 0.2));
}
.btn-root:active:not(:disabled) {
  transform: translateY(0) scale(0.97);
  box-shadow: 0 1px 2px var(--btn-rest, transparent);
  transition-duration: 90ms;
}
.btn-root:focus-visible {
  outline-color: var(--btn-ring, #2563EB);
  outline-offset: 3px;
}
.btn-root[data-busy="true"] { opacity: 1 !important; }

/* soft shine on solid buttons */
.btn-shine::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, 0.3) 50%, transparent 65%);
  transform: translateX(-130%);
}
.btn-shine:hover:not(:disabled)::before {
  transform: translateX(130%);
  transition: transform 750ms cubic-bezier(0.22, 0.61, 0.36, 1);
}

/* success state */
.btn-root.btn-success,
.btn-root.btn-success:hover:not(:disabled) {
  background-color: #16A34A !important;
  border-color: transparent !important;
  color: #fff !important;
  --btn-glow: rgba(22, 163, 74, 0.5);
}

/* collapsing slots for icons and spinner */
.btn-slot {
  display: grid;
  grid-template-columns: 0fr;
  opacity: 0;
  transition: grid-template-columns 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease;
}
.btn-slot[data-open="true"] { grid-template-columns: 1fr; opacity: 1; }
.btn-slot > span { min-width: 0; overflow: hidden; display: flex; align-items: center; }

.btn-pop { animation: btn-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
@keyframes btn-pop {
  from { transform: scale(0.4); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

.btn-check path {
  stroke-dasharray: 22;
  stroke-dashoffset: 22;
  animation: btn-draw 380ms 120ms cubic-bezier(0.65, 0, 0.35, 1) forwards;
}
@keyframes btn-draw { to { stroke-dashoffset: 0; } }

.btn-ripple {
  position: absolute;
  border-radius: 9999px;
  pointer-events: none;
  transform: scale(0);
  animation: btn-ripple 650ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
}
@keyframes btn-ripple {
  to { transform: scale(1); opacity: 0; }
}

.btn-label { position: relative; z-index: 1; }

@media (prefers-reduced-motion: reduce) {
  .btn-root, .btn-root:hover:not(:disabled), .btn-root:active:not(:disabled) {
    transform: none;
    transition-duration: 1ms;
  }
  .btn-shine::before, .btn-ripple { display: none; }
  .btn-pop, .btn-check path { animation-duration: 1ms; animation-delay: 0s; }
  .btn-slot { transition-duration: 1ms; }
}
`;

const SIZE_STYLES = {
  sm: { cls: 'h-8 px-3 text-xs min-h-[32px]', gap: 6 },
  md: { cls: 'h-10 px-4 text-sm min-h-[40px]', gap: 8 },
  lg: { cls: 'h-11 px-5 text-base min-h-[44px]', gap: 10 },
};

const VARIANTS = {
  primary: {
    cls: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF]',
    vars: { '--btn-glow': 'rgba(37,99,235,0.5)', '--btn-rest': 'rgba(15,23,42,0.12)', '--btn-ring': '#2563EB' },
    shine: true,
    ripple: 'rgba(255,255,255,0.35)',
    spinner: 'white',
  },
  secondary: {
    cls: 'bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] active:bg-[#CBD5E1]',
    vars: { '--btn-glow': 'rgba(15,23,42,0.18)', '--btn-ring': '#94A3B8' },
    ripple: 'rgba(15,23,42,0.14)',
    spinner: 'currentColor',
  },
  outline: {
    cls: 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] active:bg-[#F1F5F9]',
    vars: { '--btn-glow': 'rgba(15,23,42,0.16)', '--btn-rest': 'rgba(15,23,42,0.06)', '--btn-ring': '#2563EB' },
    ripple: 'rgba(37,99,235,0.18)',
    spinner: 'currentColor',
  },
  ghost: {
    cls: 'bg-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] active:bg-[#E2E8F0]',
    vars: { '--btn-glow': 'rgba(15,23,42,0.08)', '--btn-ring': '#94A3B8' },
    ripple: 'rgba(15,23,42,0.12)',
    spinner: 'currentColor',
  },
  danger: {
    cls: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B]',
    vars: { '--btn-glow': 'rgba(220,38,38,0.5)', '--btn-rest': 'rgba(15,23,42,0.12)', '--btn-ring': '#DC2626' },
    shine: true,
    ripple: 'rgba(255,255,255,0.35)',
    spinner: 'white',
  },
};

function Slot({ open, side, gap, slotKey, children }) {
  const pad = side === 'left' ? { paddingRight: gap } : { paddingLeft: gap };
  return (
    <span className="btn-slot" data-open={open} aria-hidden={!open}>
      <span style={pad}>
        {open && (
          <span key={slotKey} className="btn-pop inline-flex">
            {children}
          </span>
        )}
      </span>
    </span>
  );
}

function CheckIcon() {
  return (
    <svg
      className="btn-check w-4 h-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  success = false,
  ripple = true,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  onClick,
  id,
  ariaLabel,
  ...props
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZE_STYLES[size] || SIZE_STYLES.md;
  const ref = useRef(null);
  const [ripples, setRipples] = useState([]);

  const showSuccess = success && !loading;

  const handleClick = (e) => {
    if (ripple && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const diameter = Math.max(rect.width, rect.height) * 2;
      const fromKeyboard = e.detail === 0;
      const x = fromKeyboard ? rect.width / 2 : e.clientX - rect.left;
      const y = fromKeyboard ? rect.height / 2 : e.clientY - rect.top;
      const key = `${Date.now()}-${Math.random()}`;
      setRipples((r) => [...r, { key, x, y, diameter }]);
      setTimeout(() => setRipples((r) => r.filter((item) => item.key !== key)), 700);
    }
    if (onClick) onClick(e);
  };

  // Leading slot shows the spinner, the success check, or the left icon
  let leading = null;
  let leadingKey = 'none';
  if (loading) {
    leading = <LoadingSpinner size="xs" color={v.spinner} />;
    leadingKey = 'loading';
  } else if (showSuccess) {
    leading = <CheckIcon />;
    leadingKey = 'success';
  } else if (LeftIcon) {
    leading = <LeftIcon className="w-4 h-4 shrink-0" aria-hidden="true" />;
    leadingKey = 'icon';
  }

  const trailingOpen = Boolean(RightIcon) && !loading && !showSuccess;

  const classes = [
    'btn-root inline-flex items-center justify-center font-medium rounded-lg select-none',
    'focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer',
    'group',
    s.cls,
    v.cls,
    v.shine ? 'btn-shine' : '',
    showSuccess ? 'btn-success' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <style>{CSS}</style>
      <button
        ref={ref}
        id={id}
        type={type}
        disabled={disabled || loading}
        onClick={handleClick}
        aria-label={ariaLabel}
        aria-busy={loading || undefined}
        data-busy={loading || showSuccess ? 'true' : undefined}
        className={classes}
        style={v.vars}
        {...props}
      >
        {ripples.map((r) => (
          <span
            key={r.key}
            className="btn-ripple"
            style={{
              width: r.diameter,
              height: r.diameter,
              left: r.x - r.diameter / 2,
              top: r.y - r.diameter / 2,
              backgroundColor: showSuccess ? 'rgba(255,255,255,0.35)' : v.ripple,
            }}
          />
        ))}

        <Slot open={Boolean(leading)} side="left" gap={s.gap} slotKey={leadingKey}>
          {leading}
        </Slot>

        <span className="btn-label">{children}</span>

        <Slot open={trailingOpen} side="right" gap={s.gap} slotKey="right">
          {RightIcon && (
            <RightIcon
              className="w-4 h-4 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          )}
        </Slot>
      </button>
    </>
  );
}