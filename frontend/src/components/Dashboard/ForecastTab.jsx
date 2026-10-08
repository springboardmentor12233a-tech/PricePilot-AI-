import React, { useState } from "react";
import { 
  CalendarRange, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Clock, 
  CheckCircle2 
} from "lucide-react";
import { DEMAND_FORECAST_SERIES } from "../../data/intelligenceData";

function ForecastTab() {
  const [horizonFilter, setHorizonFilter] = useState("All");

  const filteredData = horizonFilter === "All"
    ? DEMAND_FORECAST_SERIES
    : DEMAND_FORECAST_SERIES.filter(f => f.horizon.toLowerCase().includes(horizonFilter.toLowerCase()));

  const avgConfidence = (DEMAND_FORECAST_SERIES.reduce((acc, curr) => acc + curr.confidence, 0) / DEMAND_FORECAST_SERIES.length).toFixed(1);
  const totalProjected = DEMAND_FORECAST_SERIES.reduce((acc, curr) => acc + curr.demand, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Time-Series Demand Forecasting</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Prophet & ARIMA models predicting multi-horizon inventory requirements and peak seasonality.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {["All", "Short-term", "Medium-term", "Long-term"].map((h) => (
            <button
              key={h}
              className={`btn btn-sm ${horizonFilter === h ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setHorizonFilter(h)}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div>
            <div className="metric-label">12-Month Total Demand</div>
            <div className="metric-value">{totalProjected.toLocaleString()} <span style={{ fontSize: 14 }}>Units</span></div>
            <div className="metric-trend trend-up">
              <TrendingUp size={15} />
              <span>Full horizon coverage</span>
            </div>
          </div>
          <div className="metric-icon-wrap" style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.12)" }}>
            <Layers size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Average Confidence Score</div>
            <div className="metric-value">{avgConfidence}%</div>
            <div className="metric-trend trend-up">
              <ShieldCheck size={15} />
              <span>High statistical significance</span>
            </div>
          </div>
          <div className="metric-icon-wrap" style={{ color: "#38bdf8", background: "rgba(56, 189, 248, 0.12)" }}>
            <Sparkles size={22} />
          </div>
        </div>

        <div className="metric-card">
          <div>
            <div className="metric-label">Peak Demand Month</div>
            <div className="metric-value">December</div>
            <div className="metric-trend trend-up">
              <span>8,357 units (+36.5%)</span>
            </div>
          </div>
          <div className="metric-icon-wrap" style={{ color: "#f59e0b", background: "rgba(245, 158, 11, 0.12)" }}>
            <CalendarRange size={22} />
          </div>
        </div>
      </div>

      {/* Forecast Data Table */}
      <div className="table-container" style={{ marginTop: "24px" }}>
        <div className="table-header-bar">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Monthly Projections & Horizon Classification</h3>
          <span className="badge-glow">Model Validated</span>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Month & Year</th>
              <th>Horizon Classification</th>
              <th>Predicted Units</th>
              <th>Monthly Trend %</th>
              <th>Trend Classification</th>
              <th>Confidence Score</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => {
              const isIncrease = row.trendType === "Increasing";
              const isDecrease = row.trendType === "Decreasing";

              return (
                <tr key={idx}>
                  <td><strong>{row.month}</strong></td>
                  <td>
                    <span className="tag-badge">{row.horizon}</span>
                  </td>
                  <td>
                    <strong style={{ fontSize: 15, color: "var(--text-primary)" }}>
                      {row.demand.toLocaleString()} units
                    </strong>
                  </td>
                  <td>
                    <span style={{ 
                      color: isIncrease ? "#10b981" : isDecrease ? "#fb7185" : "#94a3b8",
                      fontWeight: 600
                    }}>
                      {row.trend}
                    </span>
                  </td>
                  <td>
                    <span className={`tag-badge ${isIncrease ? 'active' : ''}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {isIncrease ? <TrendingUp size={13} /> : isDecrease ? <TrendingDown size={13} /> : <Minus size={13} />}
                      {row.trendType}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="gauge-meter-bar" style={{ width: 80, margin: 0 }}>
                        <div 
                          className="gauge-fill" 
                          style={{ 
                            width: `${row.confidence}%`,
                            background: row.confidence > 90 ? "#10b981" : row.confidence > 75 ? "#38bdf8" : "#f59e0b"
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{row.confidence}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ForecastTab;
