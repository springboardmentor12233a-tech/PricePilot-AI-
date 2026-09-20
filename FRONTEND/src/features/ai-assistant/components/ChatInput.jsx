import React, { useState, useRef, useEffect } from 'react';
import { Send, CornerDownLeft, Loader2 } from 'lucide-react';

const MAX_CHAR_COUNT = 1000;

export default function ChatInput({ onSendMessage, isLoading, isOpen }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Auto-resize textarea
  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    adjustHeight();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading) return;

    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const isOverLimit = text.length > MAX_CHAR_COUNT;
  const canSubmit = text.trim().length > 0 && !isLoading && !isOverLimit;

  return (
    <div className="p-3 bg-white border-t border-[#E2E8F0] shrink-0">
      <form onSubmit={handleSubmit} className="relative flex flex-col gap-1.5">
        <div className="relative flex items-end rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] focus-within:bg-white focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/20 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            maxLength={MAX_CHAR_COUNT + 50}
            placeholder="Ask PricePilot about pricing, demand, margin..."
            aria-label="Ask PricePilot AI"
            className="w-full resize-none py-2.5 pl-3.5 pr-11 text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] bg-transparent focus:outline-none max-h-32 min-h-[42px] leading-relaxed"
          />

          {/* Send Button */}
          <div className="absolute right-2 bottom-2">
            <button
              type="submit"
              disabled={!canSubmit}
              title="Send message (Enter)"
              aria-label="Send message"
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                canSubmit
                  ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-2xs cursor-pointer'
                  : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Input helper / character count */}
        <div className="flex items-center justify-between px-1 text-[10px] text-[#94A3B8]">
          <span className="hidden sm:inline">
            Press <kbd className="font-mono bg-[#F1F5F9] px-1 py-0.5 rounded border border-[#E2E8F0] text-[#64748B]">Enter</kbd> to send, <kbd className="font-mono bg-[#F1F5F9] px-1 py-0.5 rounded border border-[#E2E8F0] text-[#64748B]">Shift+Enter</kbd> for newline
          </span>
          <span className={isOverLimit ? 'text-[#DC2626] font-semibold' : ''}>
            {text.length}/{MAX_CHAR_COUNT}
          </span>
        </div>
      </form>
    </div>
  );
}
