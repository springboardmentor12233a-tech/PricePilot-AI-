"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendChatMessage } from "../lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What's my total revenue?",
  "Which category needs attention?",
  "How do I compare to competitors?",
  "What's the demand forecast trend?",
];

export default function ChatWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your PricePilot AI assistant. Ask me anything about your revenue, pricing, or competitor data." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const history = newMessages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const result = await sendChatMessage(userMessage.content, history);
      setMessages([...newMessages, { role: "assistant", content: result.response }]);
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSuggestedClick(question: string) {
    if (loading) return;
    setInput(question);
    const userMessage: Message = { role: "user", content: question };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const history = newMessages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const result = await sendChatMessage(question, history);
      setMessages([...newMessages, { role: "assistant", content: result.response }]);
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full logo-mark flex items-center justify-center shadow-lg z-50 hover:scale-105 transition"
      >
        <span className="text-xl">{isOpen ? "✕" : "💬"}</span>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] glass-card flex flex-col z-50 overflow-hidden">
          <div className="status-strip px-4 py-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded logo-mark flex items-center justify-center text-xs font-bold text-[#052018]">P</div>
            <span className="font-semibold text-sm">PricePilot Assistant</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 1 && (
              <div className="px-4 pt-2 pb-1 flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestedClick(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] muted-text hover:text-white hover:border-[var(--accent)] transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                    msg.role === "user"
                      ? "accent-btn"
                      : "terminal-card"
                  }`}
                >
                  {msg.content.split("\n").map((line, idx) => {
                    const match = line.match(/See more:\s*(\/[a-z-]+)/i);
                    if (match) {
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            router.push(match[1]);
                            setIsOpen(false);
                          }}
                          className="block mt-2 text-xs accent-text underline hover:text-white transition"
                        >
                          → {match[1]}
                        </button>
                      );
                    }
                    return <span key={idx}>{line}<br /></span>;
                  })}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="terminal-card px-3 py-2 rounded-lg text-sm muted-text">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-[var(--border)] flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about your business..."
              className="input-field flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="accent-btn px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}