"use client";

import React, { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  AlertTriangle,
  ShieldAlert,
  TrendingDown,
  Package,
  CheckCircle,
  X,
  ExternalLink,
  Sparkles,
  Info,
  Clock,
  Filter,
} from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [dismissedCount, setDismissedCount] = useState(0);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.alerts.list();
      setAlerts(data);
    } catch (e) {
      console.error("Failed to load alerts:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleDismiss = async (alertId: string) => {
    try {
      await api.alerts.dismiss(alertId);
      setAlerts((prev) => prev.filter((a) => a.alert_id !== alertId));
      setDismissedCount((prev) => prev + 1);
    } catch (e) {
      console.error("Failed to dismiss alert:", e);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === "all") return true;
    return a.severity === filterSeverity;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "LOW_CONFIDENCE":
        return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case "PRICE_GAP":
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case "DEMAND_DROP":
        return <TrendingDown className="w-5 h-5 text-amber-400" />;
      case "CRITICAL_STOCK":
        return <Package className="w-5 h-5 text-red-400" />;
      default:
        return <Info className="w-5 h-5 text-teal-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse";
      case "high":
        return "bg-red-500/15 text-red-400 border-red-500/30";
      case "medium":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "low":
      default:
        return "bg-teal-500/15 text-teal-300 border-teal-500/30";
    }
  };

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
                  Proactive Pricing & Inventory Alerts
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Automated threshold detectors triggering on elasticity deviation, low model confidence (R² &lt; 0.35), and stock hazards
                </p>
              </div>

              {/* Severity Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                {["all", "critical", "high", "medium"].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={`px-3 py-1 rounded-lg text-xs capitalize transition-colors ${
                      filterSeverity === sev
                        ? "bg-teal-500 text-navy-950 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification summary counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="glass-card rounded-xl p-3 border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-400">Active Flags</span>
                <div className="font-mono text-xl font-bold text-white mt-0.5">{alerts.length}</div>
              </div>
              <div className="glass-card rounded-xl p-3 border border-red-500/20">
                <span className="text-[10px] uppercase font-mono text-red-400">Critical / High</span>
                <div className="font-mono text-xl font-bold text-red-400 mt-0.5">
                  {alerts.filter((a) => a.severity === "critical" || a.severity === "high").length}
                </div>
              </div>
              <div className="glass-card rounded-xl p-3 border border-amber-500/20">
                <span className="text-[10px] uppercase font-mono text-amber-400">Medium</span>
                <div className="font-mono text-xl font-bold text-amber-300 mt-0.5">
                  {alerts.filter((a) => a.severity === "medium").length}
                </div>
              </div>
              <div className="glass-card rounded-xl p-3 border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-teal-400">Dismissed Today</span>
                <div className="font-mono text-xl font-bold text-teal-300 mt-0.5">{dismissedCount}</div>
              </div>
            </div>

            {/* Alerts Feed */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 font-mono text-xs">
                Scanning econometric thresholds across 8 catalog SKUs...
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center border border-slate-800">
                <CheckCircle className="w-12 h-12 text-teal-400 mx-auto mb-3" />
                <h3 className="font-serif font-bold text-lg text-white mb-1">Portfolio Operating Within Bounds</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  No proactive warnings active for current filter. All catalog prices are within acceptable variance thresholds.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.alert_id}
                    className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                          {getAlertIcon(alert.type)}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-full font-bold border ${getSeverityBadge(
                                alert.severity
                              )}`}
                            >
                              {alert.severity}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {alert.product_id} &bull; {alert.category}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Active Flag
                            </span>
                          </div>

                          <h3 className="text-sm font-serif font-bold text-white">{alert.title}</h3>
                          <div className="text-xs text-teal-300 font-medium mt-0.5">{alert.product_name}</div>
                        </div>
                      </div>

                      {/* Dismiss Action */}
                      <button
                        onClick={() => handleDismiss(alert.alert_id)}
                        className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Dismiss this alert"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Alert Message Body */}
                    <p className="text-xs text-slate-300 leading-relaxed pl-13">
                      {alert.message}
                    </p>

                    {/* AI Suggested Action */}
                    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-teal-300">Prescriptive Action: </span>
                          <span className="text-slate-200">{alert.suggested_action}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/pricing?product=${alert.product_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-medium transition-colors"
                        >
                          <span>Review Sweep</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <Link
                          href={`/forecast?product=${alert.product_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                        >
                          <span>Forecast</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>

        <ChatWidget />
      </div>
    </AuthGuard>
  );
}
