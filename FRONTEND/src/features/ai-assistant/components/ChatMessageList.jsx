import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import EmptyChatState from './EmptyChatState';

export default function ChatMessageList({
  messages = [],
  isLoading = false,
  onRetry,
  onSelectPrompt,
  contextPage,
}) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages or loading state
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const showEmptyState = messages.length <= 1 && !isLoading;

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      role="log"
      aria-live="polite"
      aria-label="Chat messages history"
    >
      {/* Messages */}
      {messages.map((msg, index) => (
        <ChatMessage
          key={msg.id || index}
          message={msg}
          onRetry={onRetry}
          isLatest={index === messages.length - 1}
        />
      ))}

      {/* Empty State with Suggested Prompts */}
      {showEmptyState && (
        <EmptyChatState onSelectPrompt={onSelectPrompt} contextPage={contextPage} />
      )}

      {/* Loading / Typing Indicator */}
      {isLoading && (
        <div className="pt-1">
          <TypingIndicator />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
