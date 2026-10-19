import React, { useEffect, useRef, useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function AIAssistantPanel({
  isOpen,
  onClose,
  onNewChat,
  onClear,
  messages,
  isLoading,
  onSendMessage,
  onRetry,
  onSelectPrompt,
  contextPage,
}) {
  const panelRef = useRef(null);
  const [entered, setEntered] = useState(false);

  // Enter animation (no animation plugin required)
  useEffect(() => {
    if (!isOpen) {
      setEntered(false);
      return undefined;
    }
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  // Escape to close, Tab focus trap, scroll lock, focus restore
  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    const originalOverflow = document.body.style.overflow;

    // Lock page scroll only on small screens where the panel is a bottom sheet
    if (window.matchMedia('(max-width: 639px)').matches) {
      document.body.style.overflow = 'hidden';
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const nodes = Array.from(panelRef.current.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;

      // The launcher unmounts while the panel is open, so wait a frame for it
      // to remount. Add data-ai-launcher to the launcher button to enable this.
      requestAnimationFrame(() => {
        const target = previouslyFocused?.isConnected
          ? previouslyFocused
          : document.querySelector('[data-ai-launcher]');
        target?.focus?.();
      });
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[2px] transition-opacity duration-300 sm:hidden ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel: bottom sheet on mobile, floating card on desktop */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="PricePilot AI Assistant"
        className={`fixed z-50 flex flex-col overflow-hidden bg-white
          inset-x-0 bottom-0 h-[92dvh] rounded-t-3xl
          sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(680px,calc(100dvh-96px))]
          sm:w-[420px] sm:max-w-[calc(100vw-48px)] sm:rounded-2xl
          border border-[#E2E8F0] ring-1 ring-black/[0.02]
          shadow-[0_24px_60px_-12px_rgba(15,23,42,0.28),0_8px_20px_-8px_rgba(15,23,42,0.14)]
          pb-[env(safe-area-inset-bottom)] sm:pb-0
          origin-bottom sm:origin-bottom-right
          transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          motion-reduce:transition-none
          ${
            entered
              ? 'translate-y-0 opacity-100 sm:scale-100'
              : 'translate-y-6 opacity-0 sm:translate-y-2 sm:scale-[0.97]'
          }`}
      >
        {/* Mobile drag handle (visual affordance) */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-[#CBD5E1]" />
        </div>

        {/* Panel Header */}
        <ChatHeader onNewChat={onNewChat} onClear={onClear} onClose={onClose} />

        {/* Message Stream */}
        <ChatMessageList
          messages={messages}
          isLoading={isLoading}
          onRetry={onRetry}
          onSelectPrompt={onSelectPrompt}
          contextPage={contextPage}
        />

        {/* Message Input */}
        <ChatInput
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          isOpen={isOpen}
        />
      </aside>
    </>
  );
}