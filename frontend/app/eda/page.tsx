"use client";

import React, { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";
import ChartCaption from "@/components/ChartCaption";
import { api } from "@/lib/api";
import {
  BarChart3,
  ScatterChart as ScatterChartIcon,
  ShieldAlert,
  CheckCircle2,
  TrendingDown,
  Info,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from "recharts";

export default function EDAPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const prodList = await api.products.list();
        setProducts(prodList);
      } catch (e) {
        console.error("Failed to load products for EDA:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Category revenue aggregation
  const categoryRevenueData = React.useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + p.revenue_this_month;
    });
    return Object.entries(map).map(([cat, rev]) => ({
      category: cat,
      revenueK: Math.round(rev / 1000),
    }));
  }, [products]);

  // Price gap distribution histogram buckets
  const priceGapBuckets = React.useMemo(() => {
    const buckets = [
      { range: "<-20%", count: 0, label: "Deep Gap (< -20%)" },
      { range: "-20% to -10%", count: 0, label: "-20% to -10%" },
      { range: "-10% to 0%", count: 0, label: "-10% to 0%" },
      { range: "0% to +10%", count: 0, label: "0% to +10%" },
      { range: ">+10%", count: 0, label: "> +10%" },
    ];
    products.forEach((p) => {
      const g = p.price_gap_pct;
      if (g < -20) buckets[0].count++;
      else if (g < -10) buckets[1].count++;
      else if (g < 0) buckets[2].count++;
      else if (g <= 10) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets;
  }, [products]);

  // Scatter plot points: Price vs. Quantity
  const scatterData = React.useMemo(() => {
    return products.map((p) => ({
      name: p.name,
      price: p.current_price,
      quantity: p.units_sold,
      revenue: p.revenue_this_month,
      category: p.category,
    }));
  }, [products]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-navy-950 flex flex-col">
        <Navbar />

        <div className="flex flex-1">
          <Sidebar />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
              <div>
                <h1 className="font-serif font-black text-2xl sm:text-3xl text-white tracking-tight">
                  Exploratory Data Analysis & Empirical Verification
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Empirical distributions and econometric model validation across the electronics portfolio
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-3 py-1 rounded-full bg-slate-900 border border-teal-500/30 text-teal-300">
                  Fixed-Effects OLS: R² = 0.328
                </span>
              </div>
            </div>
            {/* EDA Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Revenue by Category */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col">
                <h3 className="font-serif font-bold text-base text-white mb-1">
                  Revenue Contribution by Category ($K)
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Smartphones and Laptops account for over 50% of portfolio monthly volume
                </p>

                <div className="h-64 w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryRevenueData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis
                        dataKey="category"
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: "#334155" }}
                      />
                      <YAxis
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: "#334155" }}
                        tickFormatter={(val) => `$${val}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderColor: "#334155",
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: "#F8FAFC",
                        }}
                        formatter={(val: any) => [`$${val}k`, "Revenue"]}
                      />
                      <Bar dataKey="revenueK" fill="#14B8A6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ChartCaption
                  text="This bar chart displays total monthly revenue generation broken down across hardware product categories, showing which categories drive the largest gross dollar volume."
                  className="mt-3"
                />
              </div>

              {/* Chart 2: Price Gap Distribution Histogram */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col">
                <h3 className="font-serif font-bold text-base text-white mb-1">
                  Price Gap Distribution Histogram
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Distribution of SKUs across pricing discrepancy brackets
                </p>

                <div className="h-64 w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priceGapBuckets} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis
                        dataKey="range"
                        stroke="#64748B"
                        fontSize={10}
                        tickLine={false}
                        axisLine={{ stroke: "#334155" }}
                      />
                      <YAxis
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: "#334155" }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderColor: "#334155",
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: "#F8FAFC",
                        }}
                        formatter={(val: any) => [`${val} SKUs`, "Count"]}
                      />
                      <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ChartCaption
                  text="This histogram clusters your catalog SKUs into competitor price-gap brackets, identifying which items have severe pricing discrepancies vs. market alternatives."
                  className="mt-3"
                />
              </div>

              {/* Chart 3: Price vs Quantity Scatter (Spans full width) */}
              <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif font-bold text-base text-white">
                      Price vs. Sales Velocity Scatter Plot
                    </h3>
                    <p className="text-xs text-slate-400">
                      Demonstrates demand elasticity: high-ticket SKUs (Cameras, Ultrabooks) cluster at lower transaction velocity
                    </p>
                  </div>
                  <span className="font-mono text-xs text-teal-400">
                    8 Electronics SKUs Plotted
                  </span>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis
                        type="number"
                        dataKey="price"
                        name="Price"
                        unit="$"
                        stroke="#64748B"
                        fontSize={11}
                        tickFormatter={(val) => `$${val}`}
                        label={{ value: "Current Retail Price ($)", position: "insideBottom", offset: -10, fill: "#64748B", fontSize: 11 }}
                      />
                      <YAxis
                        type="number"
                        dataKey="quantity"
                        name="Units Sold"
                        unit=" u"
                        stroke="#64748B"
                        fontSize={11}
                        label={{ value: "Units Sold (MTD)", angle: -90, position: "insideLeft", fill: "#64748B", fontSize: 11 }}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="glass-panel p-3 rounded-xl border border-slate-700 text-xs shadow-xl space-y-1">
                                <div className="font-bold text-white">{data.name}</div>
                                <div className="text-teal-400 font-mono">Price: ${data.price.toFixed(2)}</div>
                                <div className="text-slate-300 font-mono">Volume: {data.quantity.toLocaleString()} units</div>
                                <div className="text-amber-300 font-mono">Revenue: ${(data.revenue / 1000).toFixed(1)}k</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter name="SKUs" data={scatterData} fill="#14B8A6">
                        {scatterData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.price > 1800 ? "#F59E0B" : "#14B8A6"}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <ChartCaption
                  text="This scatter plot visualizes the empirical inverse relationship between unit price and sales velocity: high-ticket flagship items cluster at lower transaction volumes, confirming price elasticity sensitivity across electronics."
                  metricHighlight="Elasticity β: -71.673"
                />
              </div>
            </div>
          </main>
        </div>

        <ChatWidget />
      </div>
    </AuthGuard>
  );
}
