import React from "react";
import { TrendingUp, ShieldCheck, Heart, Terminal } from "lucide-react";

function Footer() {
  return (
    <footer style={{ padding: "40px 5vw", borderTop: "1px solid var(--border-light)", background: "var(--bg-darker)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="brand-icon" style={{ width: 32, height: 32 }}>
            <TrendingUp size={18} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>PricePilot AI</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>| Dynamic Pricing Optimization & Revenue Intelligence</span>
        </div>

        <div style={{ display: "flex", gap: "16px", fontSize: 12, color: "var(--text-muted)", alignItems: "center" }}>
          <span>FastAPI</span>
          <span>•</span>
          <span>XGBoost</span>
          <span>•</span>
          <span>React 19</span>
          <span>•</span>
          <span>PostgreSQL</span>
          <span>•</span>
          <span>JWT Auth</span>
        </div>

        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          © 2026 PricePilot AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
