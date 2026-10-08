import React, { useState } from "react";
import { 
  HelpCircle, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Search, 
  ArrowRight, 
  BookOpen, 
  Layers, 
  Calculator, 
  TrendingUp, 
  Crosshair, 
  BarChart4, 
  FileText, 
  ShieldCheck,
  Send
} from "lucide-react";

function AIGuideModal({ isOpen, onClose }) {
  const [activeTopic, setActiveTopic] = useState("quickstart");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState(null);
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  if (!isOpen) return null;

  const topics = [
    {
      id: "quickstart",
      title: "1. Quick Start Guide",
      icon: <Sparkles size={16} color="#10b981" />,
      steps: [
        "Sign in using your role credentials or use the 1-Click Persona chips (Admin, Pricing Manager, Analyst).",
        "Navigate using the left sidebar to explore Real-time Dashboard KPIs, Product Catalog, or the ML Pricing Engine.",
        "Check topbar status to verify the backend FastAPI connection is healthy."
      ]
    },
    {
      id: "products",
      title: "2. Product Catalog Management",
      icon: <Layers size={16} color="#38bdf8" />,
      steps: [
        "View all active SKUs loaded from PostgreSQL with live stock and competitor price benchmarks.",
        "Use Search & Dropdown Filters to filter products by category (Electronics, Grocery, Fashion, etc.) or region.",
        "Click '+ Add New Product' (Admin / Pricing Manager only) to add new catalog items.",
        "Click the Edit or Delete icon next to a product to update prices or stock. Note: Deletions are restricted to ADMIN accounts."
      ]
    },
    {
      id: "predict",
      title: "3. ML Pricing & Demand Engine",
      icon: <Calculator size={16} color="#818cf8" />,
      steps: [
        "Select Category, Region, Channel, Season, and input your Base Selling Price and Competitor Benchmark.",
        "Adjust promotional discount %, marketing spend, and website visits.",
        "Toggle event flags (e.g. Active Promotion, Holiday Period, New Product Launch).",
        "Click 'Execute ML Demand & Revenue Inference' to trigger the XGBoost regressor model.",
        "The model returns Predicted Demand (units), Effective Price, Price Ratio Index, and AI Strategic Recommendation."
      ]
    },
    {
      id: "forecast",
      title: "4. Demand Forecasting & Seasonality",
      icon: <TrendingUp size={16} color="#f59e0b" />,
      steps: [
        "Toggle between Short-Term (7-30 days), Medium-Term (3-6 months), and Long-Term (12 months) horizons.",
        "Inspect the month-by-month trajectory graph to identify peak seasonality (e.g., December surge of +36.5%).",
        "Check the Statistical Confidence Score (0-100%) to validate inventory replenishment timelines."
      ]
    },
    {
      id: "competitor",
      title: "5. Competitor Matrix & Regional Alerts",
      icon: <Crosshair size={16} color="#ec4899" />,
      steps: [
        "Review Regional Price Ratio Alerts (e.g., West region alert for +₹2.21 premium vs competitor average).",
        "Inspect the Category Benchmark Matrix to see the percentage of your products priced cheaper, at parity, or more expensive.",
        "Follow the automated strategic actions (e.g., 'Maintain price parity', 'Capture seasonal demand surge')."
      ]
    },
    {
      id: "optimize",
      title: "6. Revenue What-If Simulator",
      icon: <BarChart4 size={16} color="#10b981" />,
      steps: [
        "Select a product category from the dropdown (e.g., Electronics or Grocery).",
        "Move the Proposed Price Shift slider between -20% and +25%.",
        "Adjust the Category Elasticity Index (η) to simulate how consumers react to price changes.",
        "Observe the Net Projected Revenue Delta to determine if margin gains outweigh demand volume shifts."
      ]
    },
    {
      id: "reports",
      title: "7. Executive Reports & CSV Export",
      icon: <FileText size={16} color="#06b6d4" />,
      steps: [
        "Open the Reports & Export tab to view the live portfolio audit summary.",
        "Click 'Export Live CSV Report' to download a timestamped CSV file with real database records.",
        "Click 'Print / Save PDF' to trigger a clean browser print layout for stakeholder presentations."
      ]
    },
    {
      id: "rbac",
      title: "8. Role-Based Access Control (RBAC)",
      icon: <ShieldCheck size={16} color="#f43f5e" />,
      steps: [
        "ADMIN: Full permissions across all modules, product CRUD, audit trails, and user management.",
        "PRICING_MANAGER: Product catalog additions/updates, ML pricing simulations, and report exports (cannot delete products or access audit logs).",
        "ANALYST: Read-only access to catalog, forecasting, competitor analytics, and AI copilot.",
        "CUSTOMER: Restricted view only. Any unauthorized actions will display an explicit Access Denied notice."
      ]
    }
  ];

  const handleAskAi = (e) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setLoadingAnswer(true);
    setAiAnswer(null);

    setTimeout(() => {
      const q = aiQuestion.toLowerCase();
      let res = "";

      if (q.includes("add") || q.includes("new product")) {
        res = "To add a new product:\n1. Open the 'Products' tab from the sidebar.\n2. Click the '+ Add New Product' button at the top right.\n3. Fill in product name, category, region, selling price, competitor price, and stock.\n4. Click 'Create Product'. (Note: You must be logged in as ADMIN or PRICING_MANAGER).";
      } else if (q.includes("predict") || q.includes("xgboost") || q.includes("demand")) {
        res = "To run ML Demand Prediction:\n1. Open the 'Pricing ML Engine' tab.\n2. Enter product parameters and competitor benchmark.\n3. Adjust discount % and marketing spend sliders.\n4. Click 'Execute ML Demand & Revenue Inference'. The XGBoost model calculates exact unit demand and projected revenue.";
      } else if (q.includes("export") || q.includes("csv") || q.includes("report") || q.includes("pdf")) {
        res = "To export reports:\n1. Click 'Reports & Export' in the sidebar.\n2. Click 'Export Live CSV Report' to download the spreadsheet, or click 'Print / Save PDF' to save as a PDF document.";
      } else if (q.includes("denied") || q.includes("permission") || q.includes("role") || q.includes("blocked")) {
        res = "If your action is blocked by RBAC:\n• Deleting products, inspecting audit logs, or modifying user accounts requires the ADMIN role.\n• If you are logged in as an ANALYST or CUSTOMER, switch to the 'admin_test' account using the Sign In modal.";
      } else {
        res = `Here is how to use PricePilot AI for "${aiQuestion}":\nUse the sidebar to choose between Overview, Products, Pricing Engine, Forecast, Competitor Intel, Revenue Simulator, Reports, and AI Copilot. Each module contains automated machine learning recommendations based on live database data.`;
      }

      setAiAnswer(res);
      setLoadingAnswer(false);
    }, 400);
  };

  const currentTopicData = topics.find(t => t.id === activeTopic) || topics[0];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-card" style={{ maxWidth: 840, width: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column", padding: "28px" }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", borderBottom: "1px solid var(--border-light)", paddingBottom: "16px" }}>
          <div className="brand-icon" style={{ width: 36, height: 36 }}>
            <BookOpen size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800 }}>PricePilot AI — Interactive User Guide & Manual</h3>
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Step-by-step instructions for all platform modules, machine learning tools, and security roles.
            </p>
          </div>
        </div>

        {/* Modal Body: Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "20px", flex: 1, minHeight: 0, overflow: "hidden" }}>
          
          {/* Topic Navigation Sidebar */}
          <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: "12px", padding: "10px", border: "1px solid var(--border-light)", overflowY: "auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", padding: "6px 10px 10px" }}>
              SYSTEM MODULES
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setActiveTopic(t.id); setAiAnswer(null); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    fontSize: "12.5px",
                    fontWeight: activeTopic === t.id ? "700" : "500",
                    color: activeTopic === t.id ? "#ffffff" : "var(--text-secondary)",
                    background: activeTopic === t.id ? "rgba(16, 185, 129, 0.18)" : "transparent",
                    border: activeTopic === t.id ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid transparent",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {t.icon}
                  <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{t.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topic Content Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", paddingRight: "4px" }}>
            <div className="glass-panel" style={{ padding: "20px", background: "rgba(15, 23, 42, 0.7)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                {currentTopicData.icon}
                <h4 style={{ fontSize: 17, fontWeight: 800 }}>{currentTopicData.title}</h4>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {currentTopicData.steps.map((step, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: "rgba(0,0,0,0.2)", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border-light)" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(16, 185, 129, 0.2)", color: "#10b981", display: "grid", placeItems: "center", fontSize: "11px", fontWeight: "800", flexShrink: 0, marginTop: 1 }}>
                      {idx + 1}
                    </div>
                    <p style={{ fontSize: "13px", color: "#e2e8f0", lineHeight: 1.5, margin: 0 }}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive "Ask AI Guide" search bar */}
            <div style={{ background: "rgba(0,0,0,0.3)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-emerald)", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Sparkles size={14} />
                Ask AI Guide a Question
              </div>

              <form onSubmit={handleAskAi} style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: "8px 12px", fontSize: "13px" }}
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="e.g. How do I add a product? or How does XGBoost prediction work?"
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={!aiQuestion.trim() || loadingAnswer}>
                  <Send size={13} />
                  Ask
                </button>
              </form>

              {loadingAnswer && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, fontStyle: "italic" }}>
                  AI Guide is generating instructions...
                </div>
              )}

              {aiAnswer && (
                <div style={{ marginTop: 12, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", color: "#f8fafc", whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
                  {aiAnswer}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIGuideModal;
