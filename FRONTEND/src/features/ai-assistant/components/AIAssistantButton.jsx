import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * AIAssistantButton
 * Floating launcher for the PricePilot AI assistant.
 *
 * Props:
 *   onClick   - open handler
 *   isOpen    - hides the launcher while the assistant panel is open
 *   label     - visible text on larger screens (default: "Ask PricePilot")
 *   hasUpdate - shows a small notification dot (default: false)
 */
export default function AIAssistantButton({
  onClick,
  isOpen,
  label = 'Ask PricePilot',
  hasUpdate = false,
}) {
  if (isOpen) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 print:hidden sm:bottom-6 sm:right-6">
      <button
        type="button"
        onClick={onClick}
        aria-label={`${label} - open AI assistant`}
        aria-haspopup="dialog"
        aria-expanded={false}
        className="group relative flex h-12 items-center gap-2.5 rounded-full
                   bg-gradient-to-b from-[#2F6BF0] to-[#2250D8]
                   px-3.5 text-white cursor-pointer select-none
                   ring-1 ring-inset ring-white/15
                   shadow-[0_1px_2px_rgba(15,23,42,0.18),0_8px_24px_-6px_rgba(37,99,235,0.55)]
                   transition-all duration-200 ease-out
                   hover:-translate-y-0.5
                   hover:shadow-[0_2px_4px_rgba(15,23,42,0.18),0_14px_32px_-8px_rgba(37,99,235,0.65)]
                   active:translate-y-0 active:scale-[0.97]
                   focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/35
                   motion-reduce:transition-none motion-reduce:hover:translate-y-0
                   sm:pl-3 sm:pr-4"
      >
        {/* Top sheen for a subtle, premium finish */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 top-px h-px rounded-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
        />

        {/* Icon tile */}
        <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-inset ring-white/20 transition-colors group-hover:bg-white/20">
          <Sparkles className="h-4 w-4 text-white" strokeWidth={2} aria-hidden="true" />
        </span>

        {/* Label: icon-only on mobile, full pill from sm up */}
        <span className="hidden text-sm font-semibold tracking-tight sm:inline">
          {label}
        </span>

        {/* AI tag */}
        <span className="hidden rounded-md bg-white/95 px-1.5 py-[3px] text-[10px] font-bold uppercase leading-none tracking-wider text-[#2250D8] sm:inline">
          AI
        </span>

        {/* Optional notification dot */}
        {hasUpdate && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#F43F5E] opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#F43F5E] ring-2 ring-white" />
          </span>
        )}
      </button>
    </div>
  );
}