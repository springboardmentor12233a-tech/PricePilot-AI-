import React, { useState } from "react";
import { Sparkles, ArrowRight, Shield, Zap, TrendingUp, BarChart3, Sliders, CheckCircle2 } from "lucide-react";

function Hero({ onExplore, onOpenAuth }) {
  const [productPrice, setProductPrice] = useState(48.50);
  const [discount, setDiscount] = useState(12);
  const [competitorPrice, setCompetitorPrice] = useState(52.00);
  const [marketingSpend, setMarketingSpend] = useState(450);

  // Dynamic simulation calculations
  const effectivePrice = Number((productPrice * (1 - discount / 100)).toFixed(2));
  const priceDiff = Number((effectivePrice - competitorPrice).toFixed(2));
  const estimatedDemand = Math.max(120, Math.round(1850 - (effectivePrice * 18) + (marketingSpend * 0.45) - (priceDiff > 0 ? priceDiff * 35 : priceDiff * 15)));
  const projectedRevenue = (estimatedDemand * effectivePrice).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const marginScore = effectivePrice > competitorPrice ? "Premium Positioning" : "High Volume Capture";

  return (
    <section className="hero-section">
      <div className="hero-glow-blob glow-left"></div>
      <div className="hero-glow-blob glow-right"></div>

      <div className="hero-left">
        <div className="badge-glow hero-pill">
          <Sparkles size={14} />
          <span>Next-Gen Machine Learning Pricing Engine</span>
        </div>

        <h1 className="hero-title">
          Maximize Revenue with <br />
          <span className="gradient-text">Dynamic AI Pricing</span> Intelligence
        </h1>

        <p className="hero-subtitle">
          PricePilot AI combines XGBoost elasticity modeling, real-time competitor tracking, and 12-month demand forecasting into a single unified decision workspace.
        </p>

        <div className="hero-cta-group">
          <button className="btn btn-primary" onClick={onExplore}>
            <span>Launch Interactive Workspace</span>
            <ArrowRight size={17} />
          </button>
          <button className="btn btn-secondary" onClick={() => onOpenAuth('login')}>
            <span>Explore Demo Persona</span>
            <Zap size={16} color="#10b981" />
          </button>
        </div>

        <div className="hero-kpis-strip">
          <div className="kpi-item">
            <h4>₹7.38M</h4>
            <p>Optimized Revenue</p>
          </div>
          <div className="kpi-item">
            <h4>297k+</h4>
            <p>Demand Forecasted</p>
          </div>
          <div className="kpi-item">
            <h4>99.6%</h4>
            <p>Peak Model Accuracy</p>
          </div>
          <div className="kpi-item">
            <h4>8 Categories</h4>
            <p>Cross-Market Intel</p>
          </div>
        </div>
      </div>

      <div className="hero-right">
        <div className="hero-card-preview">
          <div className="preview-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}></div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Live Pricing Sandbox</span>
            </div>
            <div className="preview-tags">
              <span className="tag-badge active">Electronics · Central</span>
              <span className="tag-badge">XGBoost v1.2</span>
            </div>
          </div>

          <div className="preview-price-display">
            <div>
              <div className="price-box-label">Your Effective Price</div>
              <div className="price-box-val" style={{ color: '#10b981' }}>₹{effectivePrice}</div>
              <span className="price-delta-pill">
                {priceDiff < 0 ? `₹${Math.abs(priceDiff)} Below Market` : priceDiff === 0 ? "At Market Parity" : `₹${priceDiff} Premium`}
              </span>
            </div>

            <div style={{ color: 'var(--text-muted)', fontSize: 20 }}>vs</div>

            <div style={{ textAlign: 'right' }}>
              <div className="price-box-label">Competitor Benchmark</div>
              <div className="price-box-val" style={{ color: '#94a3b8' }}>₹{competitorPrice.toFixed(2)}</div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Market Avg: ₹36.80</span>
            </div>
          </div>

          <div className="simulator-controls">
            <div className="slider-group">
              <div className="slider-header">
                <span>Base Listing Price</span>
                <strong>₹{productPrice.toFixed(2)}</strong>
              </div>
              <input 
                type="range" 
                min="10" 
                max="150" 
                step="0.5"
                value={productPrice}
                onChange={(e) => setProductPrice(parseFloat(e.target.value))}
                className="slider-input"
              />
            </div>

            <div className="slider-group">
              <div className="slider-header">
                <span>Promotional Discount</span>
                <strong>{discount}%</strong>
              </div>
              <input 
                type="range" 
                min="0" 
                max="50" 
                step="1"
                value={discount}
                onChange={(e) => setDiscount(parseInt(e.target.value))}
                className="slider-input"
              />
            </div>

            <div className="slider-group">
              <div className="slider-header">
                <span>Competitor Price Shift</span>
                <strong>₹{competitorPrice.toFixed(2)}</strong>
              </div>
              <input 
                type="range" 
                min="20" 
                max="120" 
                step="1"
                value={competitorPrice}
                onChange={(e) => setCompetitorPrice(parseFloat(e.target.value))}
                className="slider-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Predicted Demand</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8' }}>{estimatedDemand.toLocaleString()} Units</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Projected Revenue</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>₹{projectedRevenue}</div>
            </div>
          </div>

          <div className="ai-recommendation-box">
            <div className="ai-icon-bubble">
              <Sparkles size={16} />
            </div>
            <div>
              <strong style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>Recommendation: {marginScore}</strong>
              <p>
                At ₹{effectivePrice}, your price ratio is {(effectivePrice / competitorPrice).toFixed(2)}x. Demand is stable with strong profitability headroom.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
