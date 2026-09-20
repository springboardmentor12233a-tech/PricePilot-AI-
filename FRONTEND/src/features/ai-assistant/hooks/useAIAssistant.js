import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { aiAssistantApi } from '../services/aiApi';
import { generateMessageId, sanitizeContext, extractAssistantText } from '../utils/chatUtils';

const STORAGE_CHAT_KEY = 'pricepilot_ai_chat_history';

const INITIAL_ASSISTANT_MESSAGE = {
  id: 'welcome-message',
  role: 'assistant',
  content: `Hello! I'm **PricePilot AI**, your dynamic pricing and revenue intelligence assistant.

I can help you:
- Analyze **price elasticity** and demand trends
- Evaluate **competitor price positioning**
- Model **gross margin** and scenario simulations
- Explain **pricing recommendations** and constraint rules

What pricing question can I help you explore today?`,
  timestamp: new Date().toISOString(),
};

export function useAIAssistant() {
  const location = useLocation();

  // Load persisted history from sessionStorage if available
  const [messages, setMessages] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_CHAT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Defensively sanitize any previous messages so raw JSON is never rendered
          return parsed.map((msg) => ({
            ...msg,
            content:
              msg.role === 'assistant'
                ? extractAssistantText(msg.content) || msg.content
                : msg.content,
          }));
        }
      }
    } catch {
      // Ignore sessionStorage parsing errors
    }
    return [INITIAL_ASSISTANT_MESSAGE];
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUserPrompt, setLastUserPrompt] = useState('');

  // Persist messages whenever they change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch {
      // Ignore storage write errors (e.g. quota limits)
    }
  }, [messages]);

  // Context Awareness: derive safe metadata based on route
  const getPageContext = useCallback(() => {
    const path = location.pathname;
    let pageType = 'dashboard';

    if (path.includes('/products')) pageType = 'products';
    else if (path.includes('/categories')) pageType = 'categories';
    else if (path.includes('/inventory')) pageType = 'inventory';
    else if (path.includes('/competitors')) pageType = 'competitors';
    else if (path.includes('/forecast') || path.includes('/forecasting')) pageType = 'demand-forecasting';
    else if (path.includes('/pricing-analytics')) pageType = 'pricing-analytics';
    else if (path.includes('/pricing') || path.includes('/recommendations')) pageType = 'pricing-intelligence';
    else if (path.includes('/revenue') || path.includes('/profitability')) pageType = 'revenue-optimization';
    else if (path.includes('/reports') || path.includes('/executive')) pageType = 'executive-reports';

    return sanitizeContext({
      page: pageType,
      currentPath: path,
      timestamp: new Date().toISOString(),
    });
  }, [location.pathname]);

  // Send a message
  const sendMessage = useCallback(
    async (text) => {
      if (!text || typeof text !== 'string' || !text.trim()) return;
      const cleanText = text.trim();

      const userMsg = {
        id: generateMessageId(),
        role: 'user',
        content: cleanText,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setLastUserPrompt(cleanText);
      setIsLoading(true);
      setError(null);

      try {
        const context = getPageContext();
        // Send previous conversation context excluding the new message
        const response = await aiAssistantApi.sendQuery({
          prompt: cleanText,
          context,
          history: [...messages, userMsg],
        });

        // Defensively extract output from response or response.data
        const extracted =
          extractAssistantText(response) ||
          (typeof response?.output === 'string' ? response.output : response?.content);

        const answer =
          extracted && extracted.trim()
            ? extracted.trim()
            : "Sorry, I didn't receive a response. Please try again.";

        const assistantMsg = {
          id: response?.id || generateMessageId(),
          role: 'assistant',
          content: answer,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const status = err?.status || err?.response?.status;
        let errorContent = "Sorry, I couldn't generate a response. Please try again.";

        if (status === 401 || status === 403) {
          errorContent =
            'Authentication required to query PricePilot AI Assistant. Please verify you are signed in.';
        } else if (status === 429) {
          errorContent =
            'Rate limit reached for the AI assistant. Please wait a moment before asking another question.';
        } else if (status === 500 || status === 502 || status === 503) {
          errorContent =
            'The AI service is temporarily unavailable. Please try again shortly.';
        } else if (
          err?.message &&
          typeof err.message === 'string' &&
          !err.message.includes('object Object') &&
          !err.message.includes('at ')
        ) {
          errorContent = err.message;
        }

        setError(errorContent);

        const errorAssistantMsg = {
          id: generateMessageId(),
          role: 'assistant',
          content: errorContent,
          isError: true,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, errorAssistantMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, getPageContext]
  );

  // Retry the last user prompt
  const retryLast = useCallback(() => {
    if (lastUserPrompt) {
      sendMessage(lastUserPrompt);
    }
  }, [lastUserPrompt, sendMessage]);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    setError(null);
    setLastUserPrompt('');
    try {
      sessionStorage.removeItem(STORAGE_CHAT_KEY);
    } catch {
      // Ignore
    }
  }, []);

  // Start new conversation
  const startNewChat = useCallback(() => {
    clearChat();
  }, [clearChat]);

  // Open with an optional initial prompt
  const openChat = useCallback((initialPrompt) => {
    setIsOpen(true);
    if (initialPrompt && typeof initialPrompt === 'string') {
      setTimeout(() => {
        // Will be picked up or sent directly
      }, 50);
    }
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return {
    isOpen,
    isLoading,
    error,
    messages,
    sendMessage,
    retryLast,
    clearChat,
    startNewChat,
    openChat,
    closeChat,
    toggleChat,
    pageContext: getPageContext(),
  };
}

export default useAIAssistant;
