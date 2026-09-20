import React from 'react';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';

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
  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 sm:hidden transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Panel Container */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="PricePilot AI Assistant"
        className="fixed sm:bottom-5 sm:right-5 inset-0 sm:inset-auto sm:w-[420px] sm:max-w-[calc(100vw-40px)] sm:h-[min(650px,calc(100vh-100px))] bg-white sm:rounded-2xl shadow-2xl border border-[#E2E8F0] z-50 flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200"
      >
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
