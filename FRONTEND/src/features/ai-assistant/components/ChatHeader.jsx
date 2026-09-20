import React from 'react';
import { Sparkles, Plus, Trash2, X } from 'lucide-react';

export default function ChatHeader({ onNewChat, onClear, onClose }) {
  return (
    <div className="h-16 px-4 bg-white border-b border-[#E2E8F0] flex items-center justify-between shrink-0 select-none">
      {/* Brand & Identity */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#6366F1] flex items-center justify-center text-white shadow-2xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">PricePilot AI</h3>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              Online
            </span>
          </div>
          <p className="text-[11px] text-[#64748B]">AI Pricing & Revenue Assistant</p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onNewChat}
          title="Start new chat"
          aria-label="Start new chat"
          className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline font-medium text-[11px]">New</span>
        </button>

        <button
          type="button"
          onClick={onClear}
          title="Clear messages"
          aria-label="Clear messages"
          className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onClose}
          title="Close assistant"
          aria-label="Close assistant"
          className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer ml-1"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
}
