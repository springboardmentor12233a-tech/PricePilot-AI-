import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { api } from "../lib/api";

export default function ChatWidget({ productId = null }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm PricePilot AI. Ask me about pricing, demand or competitors.",
    },
  ]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const history = messages.slice(1); // skip the greeting
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const data = await api.aiAsk({ message: text, history, product_id: productId });
      setMessages((m) => [...m, { role: "assistant", content: data.response }]);
    } catch (e) {
      let msg = "The AI service is unavailable right now. Please try again.";
      if (e.status === 401) {
        msg = "Please log in again to use the assistant.";
      } else {
        try {
          msg = JSON.parse(e.body).detail || msg;
        } catch {}
      }
      setMessages((m) => [...m, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 flex h-[30rem] w-[22rem] flex-col overflow-hidden rounded-xl2 border border-border bg-white shadow-xl">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-white">
            <span className="text-sm font-semibold">PricePilot AI Assistant</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto bg-canvas p-3 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-white"
                      : "border border-border bg-white text-ink"
                  }`}
                >
                  {m.content}
                </span>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <Loader2 size={13} className="animate-spin" /> PricePilot is thinking…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 border-t border-border bg-white p-2.5">
            <input
              className="flex-1 rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:border-primary"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about pricing…"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="rounded-lg bg-primary px-3 text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              aria-label="Send"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-primary-dark"
        aria-label="Toggle chat"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
}