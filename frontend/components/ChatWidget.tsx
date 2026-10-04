"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Sparkles, User as UserIcon, Loader2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  source?: string;
  timestamp: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_init",
      sender: "bot",
      text: "Hello! I am PricePilot's Econometric AI Copilot. Ask me about our electronics SKUs, optimal prices, elasticity beta, or revenue lift potential.",
      source: "local-engine",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [suggestions, setSuggestions] = useState<string[]>([
    "What is the recommended price for Sony WH-1000XM5?",
    "Why is Canon EOS R6 flagged with low confidence?",
    "Show portfolio revenue lift",
    "Explain the elasticity model formula",
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-pricepilot-chat", handleOpen);
    return () => window.removeEventListener("open-pricepilot-chat", handleOpen);
  }, []);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.insight.chat(q);
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: "bot",
        text: response.answer || "No response received.",
        source: response.source,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "bot",
          text: "I could not connect to the Pricing Intelligence engine. Please verify the backend is running.",
          source: "error",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-navy-950 font-bold shadow-xl shadow-teal-500/25 transition-all hover:scale-105"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-navy-950" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </div>
          <span className="text-xs tracking-wide">Ask Pilot AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="glass-panel w-96 max-w-[calc(100vw-2rem)] h-[520px] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 bg-navy-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-serif font-bold text-white">PricePilot AI Copilot</h4>
                <p className="text-[10px] text-teal-400 font-mono">Dataset 1 Grounded &bull; Hybrid LLM</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "bot" && (
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    m.sender === "user"
                      ? "bg-teal-500 text-navy-950 font-medium rounded-br-xs"
                      : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-xs shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 border-t border-white/10 text-[9px] text-slate-400">
                    {m.source && (
                      <span className="font-mono text-[9px] text-teal-300">
                        {m.source === "groq-llm" ? "Groq LLM" : "Local Engine"}
                      </span>
                    )}
                    <span>{m.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                <span>Consulting econometric models...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Pill Strip */}
          {suggestions.length > 0 && (
            <div className="px-3 py-2 bg-navy-950/60 border-t border-slate-800/80 overflow-x-auto flex gap-1.5 no-scrollbar">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-[10px] text-slate-300 hover:text-teal-300 hover:border-teal-500/40 transition-colors shrink-0"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-navy-900/90 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about SKU prices, gaps, elasticity..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-teal-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
