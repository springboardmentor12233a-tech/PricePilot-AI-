import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function SuggestedPrompt({ text, category, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(text)}
      className="group w-full text-left p-2.5 sm:p-3 rounded-xl bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] transition-all duration-150 flex items-center justify-between gap-2 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
    >
      <div className="flex-1 min-w-0">
        {category && (
          <span className="text-[10px] font-semibold text-[#2563EB] tracking-wider uppercase block mb-0.5">
            {category}
          </span>
        )}
        <p className="text-xs text-[#0F172A] font-medium leading-snug line-clamp-2 group-hover:text-[#1D4ED8]">
          {text}
        </p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-transform shrink-0" />
    </button>
  );
}
