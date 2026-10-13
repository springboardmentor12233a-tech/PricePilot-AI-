import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import api from "../services/api";

const SUGGESTIONS = [
  "What is our top revenue product?",
  "Which products have declining demand?",
  "What price should I consider for product P1000?",
  "What is the next 30-day demand forecast for P1000?",
  "Which category generates the most revenue?",
  "Which products have stockout risk?",
];

export default function Copilot() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi, I'm PricePilot Copilot. Ask me about revenue, pricing, forecasts, competitors, or inventory — I only answer from real backend data." },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text) => {
    const question = text ?? input;
    if (!question.trim()) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/api/chat", { session_id: sessionId, message: question });
      setSessionId(res.data.session_id);
      setMessages((m) => [...m, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't process that. " + (err.response?.data?.detail || "") }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <h1 className="text-xl font-display font-semibold mb-4">PricePilot Copilot</h1>
      <div className="flex-1 overflow-y-auto card p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-2xl ${m.role === "user" ? "ml-auto text-right" : ""}`}>
            <div className={`inline-block px-4 py-2 rounded-xl text-sm whitespace-pre-wrap ${
              m.role === "user" ? "bg-accent text-white" : "bg-slate-100 dark:bg-slate-800"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-slate-400">Copilot is thinking...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-2 my-3">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s)} className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
        <input className="input" placeholder="Ask about revenue, pricing, forecasts..." value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn-primary flex items-center gap-2" disabled={loading}><Send size={16} /> Send</button>
      </form>
    </div>
  );
}
