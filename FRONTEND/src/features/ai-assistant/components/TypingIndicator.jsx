import React from 'react';
import { Sparkles } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-[#E2E8F0] max-w-[85%] sm:max-w-[75%] shadow-2xs">
      {/* Bot Avatar */}
      <div className="w-6 h-6 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5" />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-[#64748B]">PricePilot AI is thinking...</span>
        <div className="flex items-center gap-1 py-1">
          <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-[#93C5FD] animate-bounce" />
        </div>
      </div>
    </div>
  );
}
