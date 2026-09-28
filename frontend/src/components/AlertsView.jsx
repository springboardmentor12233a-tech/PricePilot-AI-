import React, { useState } from "react";
import {
  Bell,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
} from "lucide-react";

export default function AlertsView({ onSelectProduct }) {
  const [filter, setFilter] = useState("all");
  const [acknowledged, setAcknowledged] = useState([]);

  const alertsData = [
    {
      id: "alert-1",
      severity: "critical",
      title: "Competitor Price Undercut Detected",
      category: "Competitor Intelligence",
      timestamp: "12 minutes ago",
      productId: "bed1",
      detail:
        "Competitor 1 lowered their retail price by 12.5% to $39.24. Your current unit price ($74.00) is now 188% of market parity, putting an estimated $28,000 monthly volume at acute defection risk.",
      recommendation:
        "Evaluate price repositioning to $44.50 or deploy defensive bundle promotion to protect market share.",
      impact: "High Churn Probability",
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      icon: ShieldAlert,
    },
    {
      id: "alert-2",
      severity: "warning",
      title: "Margin Compression Warning: Freight Spike",
      category: "Cost & Logistics",
      timestamp: "2 hours ago",
      productId: "telecom1",
      detail:
        "Average freight logistics cost on heavy SKUs (>2,000g) surged by 14.2% across coastal distribution centers, causing gross margin to decline from 38.4% to 35.1%.",
      recommendation:
        "Update shipping surcharge threshold or optimize unit retail price by +$1.85 to maintain target margins.",
      impact: "-3.3% Gross Margin",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      icon: AlertTriangle,
    },
    {
      id: "alert-3",
      severity: "opportunity",
      title: "Inelastic Demand Surge Forecasted",
      category: "Demand Forecasting",
      timestamp: "5 hours ago",
      productId: "computers1",
      detail:
        "Multi-horizon ML model forecasts a 14-day volume surge of +18.4% with price elasticity tightening to -0.14 (strongly inelastic). Premium pricing headroom exists.",
      recommendation:
        "Increase target price by 4.2% to capture an estimated $12,400 in incremental profit with negligible demand friction.",
      impact: "+$12.4k Profit Potential",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      icon: TrendingUp,
    },
  ];

  const handleAcknowledge = (id) => {
    if (acknowledged.includes(id)) {
      setAcknowledged(acknowledged.filter((item) => item !== id));
    } else {
      setAcknowledged([...acknowledged, id]);
    }
  };

  const filteredAlerts = alertsData.filter((a) => {
    if (filter === "critical") return a.severity === "critical";
    if (filter === "warning") return a.severity === "warning";
    if (filter === "opportunity") return a.severity === "opportunity";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-900/30 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>Real-Time Pricing Alert Center</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Critical Market & Price Alerts</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
              3 New
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated monitoring triggers alerts whenever competitor moves, elasticity shifts, or margin compression anomalies exceed confidence thresholds.
          </p>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {["all", "critical", "warning", "opportunity"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                filter === tab
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "all" ? "All Alerts (3)" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const Icon = alert.icon;
          const isAck = acknowledged.includes(alert.id);

          return (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border transition-all ${
                isAck
                  ? "bg-slate-900/40 border-slate-800/50 opacity-60"
                  : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl border ${alert.badgeColor} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {alert.title}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${alert.badgeColor} uppercase tracking-wider`}>
                        {alert.severity}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {alert.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                      {alert.detail}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 mt-2">
                      <strong className="text-slate-200">Recommended Action: </strong>
                      {alert.recommendation}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0 pt-2 lg:pt-0">
                  <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg">
                    {alert.impact}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer"
                    >
                      {isAck ? "Mark Unread" : "Acknowledge"}
                    </button>

                    {alert.productId && onSelectProduct && (
                      <button
                        onClick={() => onSelectProduct(alert.productId)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Investigate</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
