import React from "react";
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Award, 
  Layers, 
  Sparkles, 
  ArrowUpRight, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  BarChart3,
  Crosshair,
  Package
} from "lucide-react";
import { 
  EXECUTIVE_KPIS, 
  CATEGORY_REVENUE_DATA, 
  DEMAND_FORECAST_SERIES 
} from "../../data/intelligenceData";

function OverviewTab({ dashboardData, products = [], onNavigate }) {
  const data = dashboardData || EXECUTIVE_KPIS;

  // Calculate live real product statistics from database state
  const totalProducts = products.length;
  const totalStock = products.reduce((acc, p) => acc + Number(p.stock_availability || 0), 0);
  const avgCurrentPrice = totalProducts > 0
    ? (products.reduce((acc, p) => acc + Number(p.current_price || 0), 0) / totalProducts).toFixed(2)
    : "0.00";
  const avgCompetitorPrice = totalProducts > 0
    ? (products.reduce((acc, p) => acc + Number(p.competitor_price || 0), 0) / totalProducts).toFixed(2)
    : "0.00";

  const belowCompetitorCount = products.filter(
    (p) => Number(p.current_price) < Number(p.competitor_price)
  ).length;

  const aboveCompetitorCount = products.filter(
    (p) => Number(p.current_price) > Number(p.competitor_price)
  ).length;

  const parityCount = products.filter(
    (p) => Number(p.current_price) === Number(p.competitor_price)
  ).length;

  // Category distribution from live products
  const categoryCounts = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const categoryEntries = Object.entries(categoryCounts);

  return (
    <div>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{ padding: "24px 28px", marginBottom: "26px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "18px" }}>
        <div>
          <div className="badge-glow" style={{ marginBottom: "6px" }}>
            <Sparkles size={13} />
            <span>AI Dynamic Pricing Intelligence Active</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Executive Performance Command Center</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
            Live portfolio intelligence from PostgreSQL database, XGBoost demand modeling, and market differentials.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate("predict")}>
            <TrendingUp size={15} />
            Run ML Predictor
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("products")}>
            <ShoppingBag size={15} />
            Manage Catalog ({totalProducts})
          </button>
        </div>
      </div>

      {/* 5 Real-Time KPIs Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div>
            <div className="metric-label">Total Catalog Products</div>
            <div className="metric-value">{totalProducts}</div>
            <div className="metric-trend trend-up">
              <ShoppingBag size={14} />
              <span>Active in PostgreSQL</span>
            </div>
          </div>
          <div className="metric-icon-wrap" style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.12)" }}>
            <Package size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Avg Selling Price</div>
            <div className="metric-value">₹{avgCurrentPrice}</div>
            <div className="metric-trend trend-neutral">
              <span>Current catalog mean</span>
            </div>
          </div>
          <div className="metric-icon-wrap" style={{ color: "#38bdf8", background: "rgba(56, 189, 248, 0.12)" }}>
            <DollarSign size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Avg Competitor Price</div>
            <div className="metric-value">₹{avgCompetitorPrice}</div>
            <div className="metric-trend trend-neutral">
              <span>Market benchmark</span>
            </div>
          </div>
          <div className="metric-icon-wrap" style={{ color: "#818cf8", background: "rgba(129, 140, 248, 0.12)" }}>
            <Crosshair size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Total Inventory Stock</div>
            <div className="metric-value">{totalStock.toLocaleString()}</div>
            <div className="metric-trend trend-up">
              <span>Units available across regions</span>
            </div>
          </div>
          <div className="metric-icon-wrap" style={{ color: "#f59e0b", background: "rgba(245, 158, 11, 0.12)" }}>
            <Layers size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Below Competitor Price</div>
            <div className="metric-value" style={{ color: "#10b981" }}>{belowCompetitorCount} <span style={{ fontSize: 13, color: "var(--text-muted)" }}>SKUs</span></div>
            <div className="metric-trend trend-up">
              <span>{aboveCompetitorCount} priced at premium</span>
            </div>
          </div>
          <div className="metric-icon-wrap" style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.12)" }}>
            <TrendingUp size={22} />
          </div>
        </div>
      </div>

      {/* Charts Section: Current vs Competitor Price & Stock Availability */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", marginBottom: "28px" }}>
        
        {/* Current Price vs Competitor Price Visual Chart */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Our Price vs Competitor Price by Product</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Visual side-by-side comparison for each catalog item</p>
            </div>
            <div style={{ display: "flex", gap: "14px", fontSize: 11 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent-emerald)" }}></span>
                Our Price
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "#64748b" }}></span>
                Competitor
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "260px", overflowY: "auto" }}>
            {products.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "30px 0" }}>
                No products in catalog yet.
              </p>
            ) : (
              products.slice(0, 7).map((p) => {
                const maxVal = Math.max(Number(p.current_price || 0), Number(p.competitor_price || 0), 100);
                const ourPct = (Number(p.current_price) / maxVal) * 100;
                const compPct = (Number(p.competitor_price) / maxVal) * 100;

                return (
                  <div key={p.id} style={{ background: "rgba(0,0,0,0.2)", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-light)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: "#f8fafc", maxWidth: "200px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {p.product_name}
                      </span>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <span style={{ color: "var(--accent-emerald)", fontWeight: 700 }}>₹{Number(p.current_price).toFixed(2)}</span>
                        <span style={{ color: "var(--text-muted)" }}>vs ₹{Number(p.competitor_price).toFixed(2)}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <div className="gauge-meter-bar" style={{ height: 5, margin: 0 }}>
                        <div className="gauge-fill" style={{ width: `${ourPct}%`, background: "#10b981" }} />
                      </div>
                      <div className="gauge-meter-bar" style={{ height: 4, margin: 0, background: "rgba(255,255,255,0.05)" }}>
                        <div className="gauge-fill" style={{ width: `${compPct}%`, background: "#64748b" }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Stock Availability Chart */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Stock Availability by Product</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Inventory levels vs stockout threshold</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "260px", overflowY: "auto" }}>
            {products.slice(0, 6).map((p) => {
              const maxStock = 500;
              const pct = Math.min(100, (Number(p.stock_availability) / maxStock) * 100);
              const isLow = Number(p.stock_availability) < 50;
              return (
                <div key={p.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: "var(--text-secondary)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.product_name}
                    </span>
                    <strong style={{ color: isLow ? "#f59e0b" : "#38bdf8" }}>
                      {p.stock_availability} units
                    </strong>
                  </div>
                  <div className="gauge-meter-bar" style={{ height: 6, margin: 0 }}>
                    <div 
                      className="gauge-fill" 
                      style={{ 
                        width: `${pct}%`, 
                        background: isLow ? "#f59e0b" : "linear-gradient(90deg, #38bdf8 0%, #10b981 100%)" 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Distribution & Price Position Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "28px" }}>
        
        {/* Category Distribution Chart */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: "4px" }}>Category Distribution</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "18px" }}>Product catalog spread across market segments</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {categoryEntries.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No category data available.</p>
            ) : (
              categoryEntries.map(([cat, count], i) => {
                const pct = ((count / totalProducts) * 100).toFixed(0);
                const colors = ["#10b981", "#6366f1", "#f59e0b", "#ec4899", "#38bdf8", "#8b5cf6", "#f97316", "#14b8a6"];
                const color = colors[i % colors.length];

                return (
                  <div key={cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{cat}</span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ color: "var(--text-muted)" }}>{count} items</span>
                        <strong style={{ color: color }}>{pct}%</strong>
                      </div>
                    </div>
                    <div className="gauge-meter-bar" style={{ height: 6, margin: 0 }}>
                      <div className="gauge-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Price Position Chart (Cheaper / Parity / Above) */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: "4px" }}>Market Price Position Distribution</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "18px" }}>Our price vs competitor benchmark breakdown</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "12px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CheckCircle2 size={18} color="#10b981" />
                <div>
                  <h5 style={{ fontSize: 13, fontWeight: 700 }}>Below Competitor Price (Cheaper)</h5>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Favorable volume and market share capture</p>
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#10b981" }}>
                {belowCompetitorCount} <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({totalProducts > 0 ? ((belowCompetitorCount / totalProducts) * 100).toFixed(0) : 0}%)</span>
              </div>
            </div>

            <div style={{ background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "12px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Layers size={18} color="#38bdf8" />
                <div>
                  <h5 style={{ fontSize: 13, fontWeight: 700 }}>At Competitor Parity (Equal)</h5>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Balanced competitive alignment</p>
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#38bdf8" }}>
                {parityCount} <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({totalProducts > 0 ? ((parityCount / totalProducts) * 100).toFixed(0) : 0}%)</span>
              </div>
            </div>

            <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "12px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <AlertTriangle size={18} color="#f59e0b" />
                <div>
                  <h5 style={{ fontSize: 13, fontWeight: 700 }}>Above Competitor Price (Premium)</h5>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Requires value justification to prevent decay</p>
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b" }}>
                {aboveCompetitorCount} <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({totalProducts > 0 ? ((aboveCompetitorCount / totalProducts) * 100).toFixed(0) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OverviewTab;
