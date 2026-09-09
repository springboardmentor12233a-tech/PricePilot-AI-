"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart
} from "recharts";
import { getDemandForecast, getPriceRecommendation } from "../lib/api";

interface ForecastPoint {
  date: string;
  predicted_units: number;
  lower_bound: number;
  upper_bound: number;
}

interface PriceScenario {
  discount_pct: number;
  price: number;
  predicted_units_sold: number;
  projected_revenue: number;
}

export default function ForecastingPage() {
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [trend, setTrend] = useState("");
  const [changePct, setChangePct] = useState(0);
  const [horizon, setHorizon] = useState(30);

  const [scenarios, setScenarios] = useState<PriceScenario[]>([]);
  const [recommended, setRecommended] = useState<PriceScenario | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadForecast(horizon);
    loadPriceRecommendation();
  }, []);

  async function loadForecast(days: number) {
    try {
      const data = await getDemandForecast(days);
      setForecast(data.forecast);
      setTrend(data.trend);
      setChangePct(data.change_pct);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPriceRecommendation() {
    try {
      const data = await getPriceRecommendation({
        category: "Shoes",
        brand: "Nike",
        region: "AU",
        channel: "mobile",
        season: "Winter",
        base_price: 173.55,
        inventory_level: 153,
        month: 1,
        day_of_week: 3,
      });
      setScenarios(data.scenarios);
      setRecommended(data.recommended);
    } catch (err) {
      console.error(err);
    }
  }

  const handleHorizonChange = (days: number) => {
    setHorizon(days);
    setLoading(true);
    loadForecast(days);
  };

  const trendColor =
    trend === "Increasing Demand" ? "var(--accent)" :
    trend === "Decreasing Demand" ? "#f87171" : "var(--muted)";

  return (
    <div className="min-h-screen">
      {/* Top Nav */}
      <div className="status-strip px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg logo-mark flex items-center justify-center font-bold text-[#052018] text-sm">
            P
          </div>
          <span className="font-semibold tracking-tight">PricePilot AI</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm muted-text hover:text-white transition px-3 py-1.5 rounded-lg border border-[var(--border)]"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Pricing Intelligence</h1>
          <p className="muted-text text-sm">Demand forecasts & price recommendations</p>
        </div>

        {/* Demand Forecast Section */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold mb-1">Demand Forecast</h2>
              <p className="text-xs muted-text-2">
                Product P1001 · Prophet time-series model
              </p>
            </div>
            <div className="flex gap-2">
              {[7, 14, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => handleHorizonChange(days)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    horizon === days
                      ? "accent-btn border-transparent"
                      : "border-[var(--border)] muted-text hover:text-white"
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 mb-5">
            <div className="terminal-card px-4 py-3">
              <p className="text-xs muted-text mb-1">Trend</p>
              <p className="mono font-bold" style={{ color: trendColor }}>{trend}</p>
            </div>
            <div className="terminal-card px-4 py-3">
              <p className="text-xs muted-text mb-1">Change</p>
              <p className="mono font-bold violet-text">{changePct > 0 ? "+" : ""}{changePct}%</p>
            </div>
          </div>

          {loading ? (
            <p className="muted-text text-sm">Loading forecast...</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecast}>
                <defs>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0fd8a0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0fd8a0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#8b909a" fontSize={11} />
                <YAxis stroke="#8b909a" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "#0d0f14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                />
                <Legend />
                <Area type="monotone" dataKey="upper_bound" stroke="none" fill="url(#colorForecast)" name="Upper Bound" />
                <Line type="monotone" dataKey="predicted_units" stroke="#0fd8a0" strokeWidth={2} name="Predicted Units" dot={false} />
                <Line type="monotone" dataKey="lower_bound" stroke="#565d66" strokeWidth={1} strokeDasharray="4 4" name="Lower Bound" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Price Recommendation Section */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-1">Price Recommendation</h2>
          <p className="text-xs muted-text-2 mb-5">
            Product P1001 (Shoes, Nike) · Revenue-optimized discount scenarios
          </p>

          {recommended && (
            <div className="terminal-card p-4 mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs muted-text mb-1">Recommended Price</p>
                <p className="mono accent-text font-bold text-xl">${recommended.price}</p>
              </div>
              <div>
                <p className="text-xs muted-text mb-1">Discount</p>
                <p className="mono font-bold">{recommended.discount_pct}%</p>
              </div>
              <div>
                <p className="text-xs muted-text mb-1">Predicted Units</p>
                <p className="mono font-bold">{recommended.predicted_units_sold}</p>
              </div>
              <div>
                <p className="text-xs muted-text mb-1">Projected Revenue</p>
                <p className="mono violet-text font-bold">${recommended.projected_revenue}</p>
              </div>
            </div>
          )}

          {scenarios.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={scenarios}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="discount_pct" stroke="#8b909a" fontSize={11} label={{ value: "Discount %", position: "insideBottom", offset: -5, fill: "#8b909a", fontSize: 11 }} />
                <YAxis stroke="#8b909a" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "#0d0f14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                />
                <Legend />
                <Line type="monotone" dataKey="projected_revenue" stroke="#9d7cf9" strokeWidth={2} name="Projected Revenue ($)" dot={{ fill: "#9d7cf9", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}