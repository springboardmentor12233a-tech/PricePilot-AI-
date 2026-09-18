import React, { useState, useEffect, useRef, Component } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Key,
  Bot,
  User,
  ChevronDown,
  RefreshCw,
  HelpCircle,
  Check,
  AlertCircle,
  Minimize2,
  Trash2,
  Cpu,
} from "lucide-react";

// Error Boundary to prevent any chatbot error from breaking the entire page
class ChatErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Chatbot Render Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 border border-rose-500/50 rounded-2xl shadow-2xl text-xs text-slate-200 max-w-sm">
          <div className="flex items-center gap-2 text-rose-400 font-bold mb-1">
            <AlertCircle className="w-4 h-4" />
            <span>Chatbot Temporary Error</span>
          </div>
          <p className="text-slate-400 mb-2">
            A rendering issue occurred. Click reset to restore.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("groq_model");
              this.setState({ hasError: false });
            }}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
          >
            Reset Chatbot
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SYSTEM_PROMPT = `You are PricePilot AI Copilot, an expert dynamic pricing consultant.
PricePilot AI optimizes e-commerce retail prices dynamically using competitor benchmarks, price elasticity, and historical sales data.
Key model: Anchored Random Forest (R² = 0.9908, MAE = $3.32) and XGBoost (85.9ms latency).
Answer user questions clearly, concisely, and helpfully with markdown formatting.`;

const DEFAULT_MODELS = [
  { id: "openai/gpt-oss-20b", name: "OpenAI GPT-OSS 20B (Active / Fast)" },
  { id: "openai/gpt-oss-120b", name: "OpenAI GPT-OSS 120B (Deep Reasoning)" },
  { id: "qwen/qwen3.8-27b", name: "Qwen 3.8 27B" },
  { id: "groq/compound", name: "Groq Compound" },
  { id: "groq/compound-mini", name: "Groq Compound Mini" },
  { id: "allam-2-7b", name: "Allam 2 7B" },
];

const STARTER_QUESTIONS = [
  "How does dynamic pricing work?",
  "Which ML model is most accurate?",
  "How are competitor prices benchmarked?",
  "What is the lag_price anchor?",
];

// Helper to sanitize API keys (strips square brackets, quotes, spaces)
const cleanApiKey = (raw) => {
  if (!raw || typeof raw !== "string") return "";
  return raw.replace(/[\[\]"'\s]/g, "").trim();
};

const getSafeModelBadge = (m) => {
  if (!m || typeof m !== "string") return "gpt-oss-20b";
  return m.split("/").pop() || "gpt-oss-20b";
};

function ChatbotInner() {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() =>
    cleanApiKey(localStorage.getItem("groq_api_key") || ""),
  );
  const [tempKey, setTempKey] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [modelList, setModelList] = useState(DEFAULT_MODELS);
  const [model, setModel] = useState(() => {
    try {
      const saved = localStorage.getItem("groq_model");
      if (saved && typeof saved === "string" && !saved.includes("llama"))
        return saved;
    } catch (e) {}
    return "openai/gpt-oss-20b";
  });
  const [customModel, setCustomModel] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 **Hi there!** I'm your **PricePilot AI Assistant** powered by Groq. Ask me anything about our dynamic pricing algorithms, competitor benchmarking, or elasticity models!",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Fetch live active models from Groq when API key is present
  const fetchLiveModels = async (keyToUse) => {
    const key = cleanApiKey(keyToUse || apiKey);
    if (!key) return;
    setIsFetchingModels(true);
    try {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        const activeIds = (data.data || [])
          .map((m) => m.id)
          .filter(
            (id) =>
              id &&
              typeof id === "string" &&
              !id.includes("whisper") &&
              !id.includes("guard") &&
              !id.includes("safeguard"),
          )
          .sort();

        if (activeIds.length > 0) {
          const formatted = activeIds.map((id) => ({
            id: id,
            name: id
              .replace("openai/", "OpenAI ")
              .replace("groq/", "Groq ")
              .replace("qwen/", "Qwen "),
          }));
          setModelList(formatted);
          if (!activeIds.includes(model)) {
            const preferred =
              activeIds.find((id) => id.includes("gpt-oss-20b")) ||
              activeIds[0];
            if (preferred) {
              setModel(preferred);
              localStorage.setItem("groq_model", preferred);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch models directly, trying proxy:", e);
      try {
        const proxyRes = await fetch(
          `http://localhost:8000/api/groq-models?api_key=${key}`,
        );
        if (proxyRes.ok) {
          const data = await proxyRes.json();
          if (
            data.models &&
            Array.isArray(data.models) &&
            data.models.length > 0
          ) {
            const formatted = data.models.map((id) => ({ id, name: id }));
            setModelList(formatted);
            if (!data.models.includes(model) && data.models[0]) {
              setModel(data.models[0]);
              localStorage.setItem("groq_model", data.models[0]);
            }
          }
        }
      } catch (err2) {
        console.warn("Proxy model fetch error:", err2);
      }
    } finally {
      setIsFetchingModels(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      fetchLiveModels(apiKey);
    }
  }, [apiKey]);

  const handleSaveKey = (keyToSave) => {
    const raw = keyToSave !== undefined ? keyToSave : tempKey;
    const sanitized = cleanApiKey(raw);
    if (sanitized) {
      localStorage.setItem("groq_api_key", sanitized);
      setApiKey(sanitized);
      setTempKey("");
      setShowKeyModal(false);
      fetchLiveModels(sanitized);
    }
  };

  const handleModelChange = (newModel) => {
    if (newModel && typeof newModel === "string") {
      setModel(newModel);
      localStorage.setItem("groq_model", newModel);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! How can I assist you with PricePilot AI today?",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  const handleSendMessage = async (queryText) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const currentKey = cleanApiKey(apiKey);
    if (!currentKey) {
      setShowKeyModal(true);
      return;
    }

    const userTimestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const updatedMessages = [
      ...messages,
      { role: "user", content: textToSend, timestamp: userTimestamp },
    ];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    // Filter valid conversation messages strictly
    const validHistory = updatedMessages
      .filter(
        (m) =>
          m.content &&
          typeof m.content === "string" &&
          !m.content.startsWith("⚠️") &&
          !m.content.startsWith("👋"),
      )
      .map((m) => ({ role: m.role, content: m.content }));

    // Ensure the first message after system is ALWAYS 'user'
    const firstUserIdx = validHistory.findIndex((m) => m.role === "user");
    const cleanHistory =
      firstUserIdx >= 0
        ? validHistory.slice(firstUserIdx)
        : [{ role: "user", content: textToSend }];

    const targetModel =
      customModel && typeof customModel === "string" && customModel.trim()
        ? customModel.trim()
        : model || "openai/gpt-oss-20b";

    const requestPayload = {
      model: targetModel,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...cleanHistory.slice(-6),
      ],
      temperature: 0.6,
      max_tokens: 800,
    };

    let replyText = "";
    let success = false;

    // Strategy 1: Direct Groq API call
    try {
      console.log(
        `[PricePilot Chat] Querying Groq with active model: ${targetModel}`,
      );
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentKey}`,
          },
          body: JSON.stringify(requestPayload),
        },
      );

      const resData = await res.json().catch(() => ({}));
      console.log("[PricePilot Chat] Groq Response:", res.status, resData);

      if (res.ok && resData.choices?.[0]?.message?.content) {
        replyText = resData.choices[0].message.content;
        success = true;
      } else {
        throw new Error(resData.error?.message || `HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn(
        "[PricePilot Chat] Direct call failed, attempting backend proxy:",
        err.message,
      );

      // Strategy 2: Proxy via FastAPI /api/chat
      try {
        const proxyRes = await fetch("http://localhost:8000/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: cleanHistory.slice(-6),
            model: targetModel,
            api_key: currentKey,
          }),
        });

        const proxyData = await proxyRes.json().catch(() => ({}));
        if (proxyRes.ok && proxyData.reply) {
          replyText = proxyData.reply;
          success = true;
        } else {
          throw new Error(proxyData.detail || err.message);
        }
      } catch (proxyErr) {
        replyText = `⚠️ **Error**: ${err.message || proxyErr.message || "Request failed"}.\n\n*Tip: Click the 🔑 key icon in the chat header to select an active model (e.g. \`openai/gpt-oss-20b\`, \`qwen/qwen3.8-27b\`, or \`groq/compound\`).*`;
      }
    }

    const botTimestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: replyText, timestamp: botTimestamp },
    ]);
    setLoading(false);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:shadow-[0_0_35px_rgba(99,102,241,0.8)] hover:scale-105 transition-all duration-300 flex items-center gap-2 group cursor-pointer"
          title="Ask PricePilot AI Copilot"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>
          </div>
          <span className="hidden sm:inline text-xs font-bold tracking-wide pr-1">
            Ask PricePilot AI
          </span>
        </button>
      )}

      {/* Main Chat Popup Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[440px] h-[600px] max-h-[85vh] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    PricePilot Copilot
                  </h3>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold font-mono truncate max-w-[130px]"
                    title={model || ""}
                  >
                    {getSafeModelBadge(model)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ask any questions about pricing & models
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Clear Chat */}
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* API Key Status / Setting button */}
              <button
                onClick={() => setShowKeyModal(!showKeyModal)}
                className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 cursor-pointer ${
                  apiKey
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse"
                }`}
                title="Configure Groq Key & Active Model"
              >
                <Key className="w-3.5 h-3.5" />
              </button>

              {/* Close / Minimize */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Minimize chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* API Key & Active Model Settings Drawer */}
          {(!apiKey || showKeyModal) && (
            <div className="p-4 bg-slate-900 border-b border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Groq Configuration & Model Selection</span>
                </span>
                {apiKey && (
                  <button
                    onClick={() => setShowKeyModal(false)}
                    className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Done
                  </button>
                )}
              </div>

              {/* Active Model Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-cyan-400" />
                    <span>Select Active Model</span>
                  </label>
                  <button
                    onClick={() => fetchLiveModels(apiKey)}
                    disabled={isFetchingModels}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    title="Refresh live models list from Groq"
                  >
                    <RefreshCw
                      className={`w-2.5 h-2.5 ${isFetchingModels ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isFetchingModels ? "Syncing..." : "Sync Models"}
                    </span>
                  </button>
                </div>
                <select
                  value={model || "openai/gpt-oss-20b"}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  {(modelList || []).map((m) => (
                    <option
                      key={m.id}
                      value={m.id}
                      className="bg-slate-900 text-slate-200"
                    >
                      {m.name || m.id} ({m.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Custom Model Override */}
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">
                  Or enter custom model ID (optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. openai/gpt-oss-20b"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* API Key Input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Groq API Key (starts with gsk_)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="gsk_..."
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleSaveKey()}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {(messages || []).map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="h-6 w-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-300 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 shadow-sm leading-relaxed ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    <span
                      className={`block text-[9px] mt-1 ${isUser ? "text-indigo-200 text-right" : "text-slate-500"}`}
                    >
                      {m.timestamp}
                    </span>
                  </div>

                  {isUser && (
                    <div className="h-6 w-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <div className="h-6 w-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-2xl flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] text-slate-400 ml-1">
                    Thinking with {getSafeModelBadge(model)}...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Suggestions */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/60">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5 font-semibold">
                Suggested Questions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {STARTER_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-left cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/70 flex items-center gap-2">
            <input
              type="text"
              placeholder={
                apiKey
                  ? "Ask about dynamic pricing, models..."
                  : "Paste your Groq API key above first..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSendMessage()
              }
              disabled={loading}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className={`p-2.5 rounded-xl transition-all ${
                input.trim() && !loading
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 cursor-pointer"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Export wrapped with ErrorBoundary to guarantee the page never goes black
export default function CustomerQueryChatbot() {
  return (
    <ChatErrorBoundary>
      <ChatbotInner />
    </ChatErrorBoundary>
  );
}
