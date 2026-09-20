import React, { useState } from 'react';
import { Sparkles, User, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { renderMarkdown, formatMessageTime, extractAssistantText } from '../utils/chatUtils';

export default function ChatMessage({ message, onRetry, isLatest }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isError = message.isError || false;

  // Ensure content is strictly a clean string, never raw JSON or object
  const contentText =
    typeof message.content === 'string'
      ? message.content
      : extractAssistantText(message.content) || (isUser ? '' : "Sorry, I didn't receive a response. Please try again.");

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(contentText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className={`flex items-start gap-2.5 my-3 ${
        isUser ? 'flex-row-reverse justify-start' : 'justify-start'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold select-none ${
          isUser
            ? 'bg-[#2563EB] text-white'
            : isError
            ? 'bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626]'
            : 'bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB]'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : isError ? <AlertCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Message Bubble */}
      <div
        className={`group relative max-w-[85%] sm:max-w-[80%] rounded-2xl p-3.5 transition-all ${
          isUser
            ? 'bg-[#EFF6FF] border border-[#BFDBFE] text-[#0F172A]'
            : isError
            ? 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]'
            : 'bg-white border border-[#E2E8F0] text-[#0F172A] shadow-2xs'
        }`}
      >
        {/* Header/Sender info on assistant messages */}
        {!isUser && (
          <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-[#E2E8F0]/70">
            <span className="text-[11px] font-bold text-[#0F172A] flex items-center gap-1.5">
              PricePilot AI
            </span>
            <span className="text-[10px] text-[#94A3B8]">
              {formatMessageTime(message.timestamp)}
            </span>
          </div>
        )}

        {/* Message Content */}
        <div className="text-xs sm:text-sm overflow-hidden break-words">
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{contentText}</p>
          ) : (
            <div>{renderMarkdown(contentText)}</div>
          )}
        </div>

        {/* Footer / Controls */}
        <div className="flex items-center justify-between gap-2 mt-2 pt-1">
          {isUser ? (
            <span className="text-[10px] text-[#64748B] ml-auto">
              {formatMessageTime(message.timestamp)}
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                title={copied ? 'Copied to clipboard' : 'Copy message'}
                aria-label={copied ? 'Copied' : 'Copy message'}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] py-0.5 px-1.5 rounded hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-[#16A34A]" />
                    <span className="text-[#16A34A]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* Retry button if error */}
              {isError && onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626] hover:text-[#B91C1C] py-0.5 px-1.5 rounded hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
