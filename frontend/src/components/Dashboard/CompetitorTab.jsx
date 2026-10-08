import React from "react";
import { 
  Crosshair, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Globe, 
  Shield 
} from "lucide-react";
import { 
  REGIONAL_INTELLIGENCE_DATA, 
  COMPETITOR_CATEGORY_BENCHMARKS 
} from "../../data/intelligenceData";

function CompetitorTab() {
  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>Competitor Intelligence & Market Positioning</h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Cross-regional benchmarking, category price elasticity ratios, and market opportunity alerts.
        </p>
      </div>

      {/* Regional Intelligence Cards */}
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: "16px" }}>Regional Market Position & Price Ratio Alerts</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {REGIONAL_INTELLIGENCE_DATA.map((reg, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={16} color="#10b981" />
                {reg.region}
              </span>
              <span className={`tag-badge ${reg.status === 'Optimal' ? 'active' : ''}`}>
                {reg.status}
              </span>
            </div>

            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
              ₹{reg.ourAvgPrice.toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: "12px" }}>
              Competitor Avg: ₹{reg.compAvgPrice.toFixed(2)} ({reg.diff < 0 ? `-₹${Math.abs(reg.diff).toFixed(2)}` : `+₹${reg.diff.toFixed(2)}`})
            </div>

            <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "10px", fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "var(--text-muted)" }}>Price Ratio:</span>
                <strong>{reg.ratio}x</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Alert:</span>
                <span style={{ color: reg.diff > 1 ? "#fb7185" : "#38bdf8", fontWeight: 600 }}>{reg.alert}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Benchmark Matrix Table */}
      <div className="table-container">
        <div className="table-header-bar">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Category Competitor Price Matrix</h3>
          <span className="badge-glow">Real-time Scraped Benchmarks</span>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Vertical Category</th>
              <th>Our Average Price</th>
              <th>Competitor Price</th>
              <th>Average Variance</th>
              <th>% Cheaper Share</th>
              <th>% Premium Share</th>
              <th>Strategic Action</th>
            </tr>
          </thead>
          <tbody>
            {COMPETITOR_CATEGORY_BENCHMARKS.map((item, idx) => (
              <tr key={idx}>
                <td><strong>{item.category}</strong></td>
                <td>₹{item.ourPrice.toFixed(2)}</td>
                <td style={{ color: "var(--text-muted)" }}>₹{item.compPrice.toFixed(2)}</td>
                <td>
                  <span className={`tag-badge ${item.diff < 0 ? 'active' : ''}`}>
                    {item.diff < 0 ? `-₹${Math.abs(item.diff).toFixed(2)}` : `+₹${item.diff.toFixed(2)}`}
                  </span>
                </td>
                <td>{item.cheaper}%</td>
                <td>{item.moreExpensive}%</td>
                <td>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#38bdf8" }}>
                    {item.recommendation}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CompetitorTab;
