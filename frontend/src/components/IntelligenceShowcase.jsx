import React, { useState } from "react";
import { 
  DEMAND_FORECAST_SERIES, 
  COMPETITOR_CATEGORY_BENCHMARKS, 
  CATEGORY_REVENUE_DATA, 
  REGIONAL_INTELLIGENCE_DATA 
} from "../data/intelligenceData";
import { 
  TrendingUp, 
  Calendar, 
  Layers, 
  Target, 
  Award, 
  BarChart2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  CheckCircle2, 
  Sparkles 
} from "lucide-react";

function IntelligenceShowcase({ onExploreWorkspace }) {
  const [activeTab, setActiveTab] = useState("forecasting");
  const [selectedHorizon, setSelectedHorizon] = useState("All");

  const filteredForecast = selectedHorizon === "All" 
    ? DEMAND_FORECAST_SERIES 
    : DEMAND_FORECAST_SERIES.filter(f => f.horizon.toLowerCase().includes(selectedHorizon.toLowerCase()));

  const maxDemand = Math.max(...DEMAND_FORECAST_SERIES.map(d => d.demand));

  return (
    <section className="section-wrapper" id="how-it-works">
      <div className="section-title-center">
        <div className="section-tagline">Comprehensive Analytics Suite</div>
        <h2 className="section-title">Built for Data-Driven Pricing Decisions</h2>
        <p className="section-description">
          Seamlessly navigate between machine learning demand forecasts, real-time competitor price benchmarks, and category revenue optimizations.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
        <div className="auth-tabs" style={{ maxWidth: 540 }}>
          <button 
            className={`auth-tab ${activeTab === 'forecasting' ? 'active' : ''}`}
            onClick={() => setActiveTab('forecasting')}
          >
            Demand Forecasting
          </button>
          <button 
            className={`auth-tab ${activeTab === 'competitor' ? 'active' : ''}`}
            onClick={() => setActiveTab('competitor')}
          >
            Competitor Intelligence
          </button>
          <button 
            className={`auth-tab ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue')}
          >
            Revenue Optimization
          </button>
        </div>
      </div>

      {/* Tab 1: Demand Forecasting */}
      {activeTab === 'forecasting' && (
        <div className="glass-panel" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 800 }}>12-Month Demand Horizon & Seasonality</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Predict future units sold across Short-Term (7-30 days), Medium-Term (3-6 mo), and Long-Term (12 mo).
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {["All", "Short-term", "Medium-term", "Long-term"].map((h) => (
                <button
                  key={h}
                  className={`btn btn-sm ${selectedHorizon === h ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedHorizon(h)}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Trajectory Chart */}
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>PREDICTED DEMAND VOLUME (UNITS)</div>
              <div style={{ display: 'flex', gap: '16px', fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-emerald)' }}></span>
                  Demand Peak (Dec: 8,357 units)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-indigo)' }}></span>
                  Forecast Confidence %
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${filteredForecast.length}, 1fr)`, gap: '12px', alignItems: 'flex-end', height: '220px', paddingTop: '20px' }}>
              {filteredForecast.map((item, idx) => {
                const heightPercent = (item.demand / maxDemand) * 100;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: item.demand > 7000 ? '#10b981' : '#f8fafc', marginBottom: 6 }}>
                      {item.demand}
                    </div>
                    <div 
                      style={{ 
                        width: '100%', 
                        height: `${heightPercent}%`, 
                        background: item.trendType === 'Increasing' ? 'linear-gradient(180deg, #10b981 0%, rgba(16, 185, 129, 0.2) 100%)' : 'linear-gradient(180deg, #6366f1 0%, rgba(99, 102, 241, 0.2) 100%)',
                        borderRadius: '6px 6px 2px 2px',
                        position: 'relative',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {item.month.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PEAK FORECAST CONFIDENCE</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginTop: 4 }}>99.6%</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Achieved in Feb with low variance historical validation.</p>
            </div>
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>SEASONAL SURGE</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>+36.5%</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Q4 holiday festival surge identified in December.</p>
            </div>
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ANNUAL DEMAND VOLUME</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>74,946 units</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Forecasted across multi-channel retail footprint.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Competitor Intelligence */}
      {activeTab === 'competitor' && (
        <div className="glass-panel" style={{ padding: '36px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: 22, fontWeight: 800 }}>Category-Wise Competitor Benchmark Matrix</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Real-time monitoring across 8 core product verticals comparing average pricing and position shares.
            </p>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Our Avg Price</th>
                  <th>Competitor Avg</th>
                  <th>Difference</th>
                  <th>Cheaper %</th>
                  <th>More Expensive %</th>
                  <th>AI Action Strategy</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITOR_CATEGORY_BENCHMARKS.map((cat, i) => (
                  <tr key={i}>
                    <td><strong>{cat.category}</strong></td>
                    <td>₹{cat.ourPrice.toFixed(2)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>₹{cat.compPrice.toFixed(2)}</td>
                    <td>
                      <span className={`tag-badge ${cat.diff < 0 ? 'active' : ''}`}>
                        {cat.diff < 0 ? `-₹${Math.abs(cat.diff).toFixed(2)}` : `+₹${cat.diff.toFixed(2)}`}
                      </span>
                    </td>
                    <td>{cat.cheaper}%</td>
                    <td>{cat.moreExpensive}%</td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#38bdf8' }}>
                        {cat.recommendation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Revenue Optimization */}
      {activeTab === 'revenue' && (
        <div className="glass-panel" style={{ padding: '36px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: 22, fontWeight: 800 }}>Revenue Contribution & Channel Mix</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Breakdown of ₹7,386,335 total generated revenue across categories, channels, and regions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {CATEGORY_REVENUE_DATA.slice(0, 4).map((c, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{c.category}</span>
                  <span className="price-delta-pill">{c.share}% Share</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: c.color, fontFamily: 'var(--font-heading)' }}>
                  ₹{c.totalRevenue.toLocaleString()}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: '10px' }}>
                  <span>Demand: {c.totalDemand.toLocaleString()} units</span>
                  <span>Avg Price: ₹{c.avgPrice}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default IntelligenceShowcase;
