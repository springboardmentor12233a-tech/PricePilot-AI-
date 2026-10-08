import React, { useState } from "react";
import { 
  BarChart4, 
  TrendingUp, 
  TrendingDown, 
  Sliders, 
  DollarSign, 
  Sparkles, 
  Layers, 
  ArrowUpRight, 
  CheckCircle2 
} from "lucide-react";
import { CATEGORY_REVENUE_DATA, EXECUTIVE_KPIS } from "../../data/intelligenceData";

function OptimizationTab() {
  const [selectedCategory, setSelectedCategory] = useState("Electronics");
  const [priceAdjustmentPct, setPriceAdjustmentPct] = useState(5);
  const [elasticityCoeff, setElasticityCoeff] = useState(1.4);

  const currentCat = CATEGORY_REVENUE_DATA.find(c => c.category === selectedCategory) || CATEGORY_REVENUE_DATA[0];

  const basePrice = currentCat.avgPrice;
  const simulatedPrice = Number((basePrice * (1 + priceAdjustmentPct / 100)).toFixed(2));
  
  // Price Elasticity formula: % Delta Demand = - Elasticity * % Delta Price
  const demandShiftPct = Number((-elasticityCoeff * priceAdjustmentPct).toFixed(1));
  const baseDemand = currentCat.totalDemand;
  const simulatedDemand = Math.round(baseDemand * (1 + demandShiftPct / 100));

  const baseRevenue = currentCat.totalRevenue;
  const simulatedRevenue = simulatedDemand * simulatedPrice;
  const revenueDelta = simulatedRevenue - baseRevenue;
  const revenueDeltaPct = Number(((revenueDelta / baseRevenue) * 100).toFixed(2));

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>Revenue Optimization & What-If Simulation Engine</h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Simulate price adjustment scenarios, model consumer elasticity, and quantify expected revenue deltas.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "28px", marginBottom: "28px" }}>
        
        {/* Simulation Controls */}
        <div className="glass-panel" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Scenario Levers</h3>
            <span className="badge-glow">Elasticity Model</span>
          </div>

          <div className="form-group">
            <label className="form-label">Target Product Category</label>
            <select 
              className="form-select" 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {CATEGORY_REVENUE_DATA.map(c => <option key={c.category} value={c.category}>{c.category}</option>)}
            </select>
          </div>

          <div style={{ background: "rgba(0,0,0,0.25)", padding: "18px", borderRadius: "14px", border: "1px solid var(--border-light)", margin: "20px 0" }}>
            <div className="slider-group">
              <div className="slider-header">
                <span>Proposed Price Shift</span>
                <strong style={{ color: priceAdjustmentPct > 0 ? "#10b981" : "#fb7185" }}>
                  {priceAdjustmentPct > 0 ? `+${priceAdjustmentPct}%` : `${priceAdjustmentPct}%`}
                </strong>
              </div>
              <input 
                type="range" 
                min="-20" 
                max="25" 
                step="1"
                value={priceAdjustmentPct}
                onChange={(e) => setPriceAdjustmentPct(parseInt(e.target.value))}
                className="slider-input"
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                <span>-20% (Aggressive Discount)</span>
                <span>0%</span>
                <span>+25% (Margin Harvest)</span>
              </div>
            </div>

            <div className="slider-group" style={{ marginTop: "18px" }}>
              <div className="slider-header">
                <span>Category Elasticity Index (η)</span>
                <strong>{elasticityCoeff}</strong>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2.5" 
                step="0.1"
                value={elasticityCoeff}
                onChange={(e) => setElasticityCoeff(parseFloat(e.target.value))}
                className="slider-input"
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                <span>0.5 (Inelastic / Essential)</span>
                <span>1.4 (Standard)</span>
                <span>2.5 (Highly Elastic)</span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Current Baseline Price</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>₹{basePrice.toFixed(2)}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Simulated Selling Price</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent-emerald)" }}>₹{simulatedPrice}</div>
            </div>
          </div>
        </div>

        {/* Projected Simulation Results */}
        <div className="prediction-result-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              PROJECTED REVENUE IMPACT
            </span>
            <span className={`tag-badge ${revenueDelta >= 0 ? 'active' : ''}`}>
              {revenueDelta >= 0 ? `+${revenueDeltaPct}% Projected Delta` : `${revenueDeltaPct}% Projected Delta`}
            </span>
          </div>

          <div style={{ background: "rgba(0,0,0,0.3)", padding: "20px", borderRadius: "16px", marginBottom: "20px", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Simulated Category Revenue</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: revenueDelta >= 0 ? "var(--accent-emerald)" : "#fb7185", fontFamily: "var(--font-heading)", margin: "6px 0" }}>
              ₹{Math.round(simulatedRevenue).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Baseline: ₹{Math.round(baseRevenue).toLocaleString()} (Net Difference: {revenueDelta >= 0 ? '+' : ''}₹{Math.round(revenueDelta).toLocaleString()})
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Projected Demand Shift</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: demandShiftPct >= 0 ? "#10b981" : "#fb7185" }}>
                {demandShiftPct >= 0 ? `+${demandShiftPct}%` : `${demandShiftPct}%`}
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{simulatedDemand.toLocaleString()} Units</span>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Optimization Yield</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#38bdf8" }}>
                {revenueDelta >= 0 ? "Positive Gain" : "Volume Contraction"}
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Risk Profile: Low</span>
            </div>
          </div>

          <div className="ai-recommendation-box">
            <div className="ai-icon-bubble">
              <Sparkles size={16} />
            </div>
            <div>
              <strong style={{ fontSize: 13, display: "block", marginBottom: 2 }}>Simulation Summary</strong>
              <p style={{ fontSize: 12, color: "#cbd5e1" }}>
                {revenueDelta >= 0 
                  ? `Increasing price by ${priceAdjustmentPct}% on ${selectedCategory} yields net positive revenue (+₹${Math.round(revenueDelta).toLocaleString()}) because margin expansion outweighs the ${Math.abs(demandShiftPct)}% demand elasticity contraction.`
                  : `Price increase on ${selectedCategory} causes severe volume decay exceeding margin gains. Consider targeted bundle discounting instead.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OptimizationTab;
