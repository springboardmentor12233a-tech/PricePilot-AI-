import React from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';

export default function AIAssistantButton({ onClick, isOpen }) {
  if (isOpen) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 print:hidden">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={isOpen}
        aria-label="Open PricePilot AI Assistant"
        className="group relative flex items-center gap-2.5 px-4 py-3 sm:px-4.5 sm:py-3.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#2563EB]/30"
      >
        {/* Ambient pulse ring */}
        <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#6366F1] opacity-30 group-hover:opacity-60 blur-xs transition-opacity -z-10 animate-pulse" />

        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>

        <span className="font-semibold text-xs sm:text-sm tracking-tight hidden xs:inline">
          Ask PricePilot
        </span>

        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#2563EB] shadow-2xs">
          AI
        </span>
      </button>
    </div>
  );
}
