import React, { useEffect, useId, useState } from 'react';

/**
 * LoadingSpinner
 *
 * Variants
 *  - "arc"   : a single gradient arc with a soft track (default)
 *  - "orbit" : two counter-rotating arcs around a pulsing core
 *  - "dots"  : three dots rising in sequence
 *
 * Props
 *  size       'xs' | 'sm' | 'md' | 'lg' | 'xl' | number (px)
 *  variant    'arc' | 'orbit' | 'dots'
 *  color      any CSS color (defaults to #2563EB)
 *  label      accessible text, also shown when `showLabel` is true
 *  showLabel  render the label beneath the spinner
 *  delay      ms to wait before showing, avoids flicker on fast loads
 *  overlay    cover the parent (or viewport with `fixed`) with a frosted backdrop
 *  fixed      with `overlay`, pin to the viewport instead of the parent
 *  className  extra classes on the wrapper
 */

const SIZES = { xs: 14, sm: 18, md: 28, lg: 40, xl: 56 };

const CSS = `
@keyframes ls-spin { to { transform: rotate(360deg); } }
@keyframes ls-spin-rev { to { transform: rotate(-360deg); } }
@keyframes ls-sweep {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes ls-breathe {
  0%, 100% { transform: scale(0.55); opacity: 0.45; }
  50%      { transform: scale(1);    opacity: 1; }
}
@keyframes ls-rise {
  0%, 80%, 100% { transform: translateY(0);    opacity: 0.35; }
  40%           { transform: translateY(-38%); opacity: 1; }
}
@keyframes ls-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes ls-label { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }

.ls-sweep { animation: ls-sweep 1.4s cubic-bezier(0.65, 0.05, 0.36, 1) infinite; transform-origin: center; }
.ls-spin  { animation: ls-spin 1.8s linear infinite; transform-origin: center; }
.ls-rev   { animation: ls-spin-rev 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; transform-origin: center; }
.ls-core  { animation: ls-breathe 1.8s ease-in-out infinite; transform-origin: center; }
.ls-dot   { animation: ls-rise 1.2s ease-in-out infinite; }
.ls-in    { animation: ls-fade-in 200ms ease-out both; }
.ls-label { animation: ls-label 2.4s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .ls-sweep, .ls-spin, .ls-rev { animation-duration: 4s; }
  .ls-core, .ls-dot, .ls-label { animation-duration: 3s; }
}
`;

function Arc({ id, color }) {
  const gid = `${id}-g`;
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className="w-full h-full">
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="20" stroke={color} strokeOpacity="0.12" strokeWidth="3" />
      <g className="ls-sweep">
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke={`url(#${gid})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="78 126"
        />
      </g>
    </svg>
  );
}

function Orbit({ id, color }) {
  const gid = `${id}-o`;
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className="w-full h-full">
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" stroke={color} strokeOpacity="0.1" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="13" stroke={color} strokeOpacity="0.1" strokeWidth="1.5" />
      <g className="ls-spin">
        <circle
          cx="24"
          cy="24"
          r="21"
          stroke={`url(#${gid})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="60 132"
        />
      </g>
      <g className="ls-rev" style={{ opacity: 0.7 }}>
        <circle
          cx="24"
          cy="24"
          r="13"
          stroke={`url(#${gid})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="36 82"
        />
      </g>
      <circle className="ls-core" cx="24" cy="24" r="3.5" fill={color} />
    </svg>
  );
}

function Dots({ color }) {
  return (
    <div className="flex items-end justify-center gap-[12%] w-full h-full pb-[22%]" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="ls-dot block rounded-full"
          style={{
            width: '20%',
            aspectRatio: '1 / 1',
            backgroundColor: color,
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function LoadingSpinner({
  size = 'md',
  variant = 'arc',
  color = '#2563EB',
  label = 'Loading',
  showLabel = false,
  delay = 0,
  overlay = false,
  fixed = false,
  className = '',
}) {
  const id = useId().replace(/:/g, '');
  const [visible, setVisible] = useState(delay <= 0);

  useEffect(() => {
    if (delay <= 0) return undefined;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!visible) return null;

  const px = typeof size === 'number' ? size : SIZES[size] || SIZES.md;
  const Graphic = variant === 'orbit' ? Orbit : variant === 'dots' ? Dots : Arc;

  const spinner = (
    <div
      role="status"
      aria-live="polite"
      className={`ls-in inline-flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div style={{ width: px, height: px, color }}>
        <Graphic id={id} color={color} />
      </div>

      {showLabel ? (
        <span
          className="ls-label text-sm font-medium tracking-wide"
          style={{ color: 'inherit', opacity: 0.7 }}
        >
          {label}
        </span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      {overlay ? (
        <div
          className={`${fixed ? 'fixed' : 'absolute'} inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm text-slate-600`}
        >
          {spinner}
        </div>
      ) : (
        spinner
      )}
    </>
  );
}