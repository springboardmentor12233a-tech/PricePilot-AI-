'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import { ChatMessage } from '@/lib/types';
import { MOCK_CHAT_SUGGESTIONS_BY_ROLE } from '@/lib/mockData';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Trash2,
  Minimize2,
  Maximize2,
  Bot,
  Layers,
  Zap,
} from 'lucide-react';

export function AiChatAssistant() {
  const pathname = usePathname();
  const { role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Active page context (SKU & Store)
  const [activeSku, setActiveSku] = useState<string | undefined>(undefined);
  const [activeStore, setActiveStore] = useState<number | undefined>(undefined);

  // Detect active SKU / Store from URL & query parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(window.location.search);
    const qSku = searchParams.get('sku') || searchParams.get('item_id');
    const qStore = searchParams.get('store_id');

    let detectedSku = qSku || undefined;
    if (!detectedSku && pathname) {
      const match = pathname.match(/\/products\/([^\/\?]+)/);
      if (match && match[1] && match[1] !== 'undefined') {
        detectedSku = match[1];
      }
    }

    const detectedStore = qStore ? parseInt(qStore, 10) : undefined;
    setActiveSku(detectedSku);
    setActiveStore(detectedStore && !isNaN(detectedStore) ? detectedStore : undefined);
  }, [pathname]);

  const getInitialMessage = () => {
    if (role === 'ADMIN') {
      return 'Hello Administrator! I am your **PricePilot AI Copilot**. Ask me about portfolio revenue metrics, system-wide retail KPIs, or high-priority opportunity alerts.';
    }
    if (role === 'BUSINESS_ANALYST') {
      return 'Hello Analyst! I am your **PricePilot AI Merchandising Copilot**. Ask me why recommended prices differ from current prices, demand forecasting trends, or gross margin opportunities.';
    }
    return 'Hello! I am your **PricePilot AI Assistant**. Ask me about pricing recommendations, sales projections, or category benchmarks.';
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: getInitialMessage(),
      timestamp: 'Just now',
      source: 'OFFLINE_FALLBACK',
    },
  ]);

  // Update initial message when role changes
  useEffect(() => {
    setMessages([
      {
        id: `msg-init-${role}`,
        sender: 'assistant',
        text: getInitialMessage(),
        timestamp: 'Just now',
        source: 'OFFLINE_FALLBACK',
      },
    ]);
  }, [role]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Don't render on public landing / login / register pages
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    return null;
  }

  const roleSuggestions = MOCK_CHAT_SUGGESTIONS_BY_ROLE[role || 'BUSINESS_ANALYST'] || [
    'Why is the recommended price lower than the current price?',
    'Explain the demand forecast for this product.',
    'What products have high-priority pricing opportunities?',
    'Summarize portfolio revenue and margin performance.',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputMessage;
    if (!message.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: message.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sku: activeSku,
      store_id: activeStore,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await api.chat(message.trim(), activeSku, activeStore);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: response.source,
        sku: response.sku,
        store_id: response.store_id,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: 'I could not connect to the PricePilot AI service. Please verify backend availability or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'OFFLINE_FALLBACK',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'assistant',
        text: getInitialMessage(),
        timestamp: 'Just now',
        source: 'OFFLINE_FALLBACK',
      },
    ]);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 80,
      }}
    >
      {/* Floating Action Launcher */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            borderRadius: 'var(--radius-full)',
            background:
              role === 'ADMIN'
                ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                : role === 'BUSINESS_ANALYST'
                ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                : 'linear-gradient(135deg, #64748b, #475569)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow:
              role === 'ADMIN'
                ? '0 4px 20px rgba(139, 92, 246, 0.45)'
                : role === 'BUSINESS_ANALYST'
                ? '0 4px 20px rgba(6, 182, 212, 0.45)'
                : '0 4px 20px rgba(100, 116, 139, 0.4)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Sparkles size={18} />
          <span>Ask PricePilot AI</span>
          {activeSku && (
            <span
              style={{
                fontSize: '0.7rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              SKU #{activeSku.slice(-4)}
            </span>
          )}
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          style={{
            width: isMinimized ? '340px' : '420px',
            height: isMinimized ? '48px' : '580px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'height 0.25s ease, width 0.25s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(90deg, #1e293b, #0f172a)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background:
                    role === 'ADMIN'
                      ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                      : role === 'BUSINESS_ANALYST'
                      ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                      : 'linear-gradient(135deg, #64748b, #475569)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={16} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff' }}>
                  PricePilot AI
                </div>
                {!isMinimized && (
                  <div style={{ fontSize: '0.675rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="pulse-dot online" style={{ width: '6px', height: '6px' }} />
                    Connected to Intelligence API
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {!isMinimized && (
                <button
                  onClick={clearChat}
                  title="Clear conversation"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <Trash2 size={15} />
                </button>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Active Context Banner */}
              {activeSku && (
                <div
                  style={{
                    padding: '6px 14px',
                    backgroundColor: 'rgba(6, 182, 212, 0.08)',
                    borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.725rem',
                    color: 'var(--accent-cyan)',
                  }}
                >
                  <Layers size={13} />
                  <span>
                    Active Context: <strong>SKU #{activeSku}</strong>
                    {activeStore ? ` (Store #${activeStore})` : ''}
                  </span>
                </div>
              )}

              {/* Message List */}
              <div
                style={{
                  flex: 1,
                  padding: '16px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isUser ? 'flex-end' : 'flex-start',
                        gap: '4px',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '88%',
                          padding: '10px 14px',
                          borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          backgroundColor: isUser
                            ? role === 'ADMIN'
                              ? 'var(--accent-purple)'
                              : role === 'BUSINESS_ANALYST'
                              ? 'var(--accent-primary)'
                              : '#475569'
                            : 'var(--bg-surface)',
                          border: isUser ? 'none' : '1px solid var(--border-subtle)',
                          color: isUser ? '#ffffff' : 'var(--text-primary)',
                          fontSize: '0.85rem',
                          lineHeight: 1.55,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.text}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {!isUser && msg.source && (
                          <span
                            className={msg.source === 'LIVE' ? 'badge badge-emerald' : 'badge badge-amber'}
                            style={{ fontSize: '0.625rem', padding: '1px 5px' }}
                          >
                            {msg.source === 'LIVE' ? 'LIVE (Gemini)' : 'OFFLINE FALLBACK'}
                          </span>
                        )}
                        <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg-surface)',
                      width: 'fit-content',
                    }}
                  >
                    <Bot size={15} color="var(--accent-cyan)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Analyzing real pricing, demand, and catalog context...
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Suggestions */}
              {messages.length <= 2 && (
                <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Suggested queries:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {roleSuggestions.slice(0, 3).map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        style={{
                          fontSize: '0.725rem',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input Bar */}
              <div
                style={{
                  padding: '12px 14px',
                  borderTop: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    activeSku
                      ? `Ask about SKU #${activeSku}...`
                      : 'Ask a pricing or revenue question...'
                  }
                  className="form-input"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.825rem' }}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || loading}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: role === 'ADMIN' ? 'var(--accent-purple)' : undefined,
                    borderColor: role === 'ADMIN' ? 'var(--accent-purple)' : undefined,
                  }}
                  aria-label="Send message"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
