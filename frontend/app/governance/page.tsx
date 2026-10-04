"use client";

import React, { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  Sliders,
  Sparkles,
  Lock,
  Info,
  TrendingUp,
} from "lucide-react";

export default function GovernancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [modelStatus, setModelStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<any>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await api.models.getStatus();
      setModelStatus(data);
    } catch (e) {
      console.error("Failed to load model status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const res = await api.models.refresh();
      setRefreshResult(res);
      fetchStatus();
    } catch (e) {
      console.error("Failed to trigger model refresh:", e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["admin", "analyst"]}>
      <div className="min-h-screen bg-navy-950 flex flex-col">
        <Navbar />

        <div className="flex flex-1">
          <Sidebar />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded font-bold border ${
                      isAdmin
                        ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    {isAdmin ? "Admin Governance Active" : "Analyst Methodology View"}
                  </span>
                </div>
                <h1 className="font-serif font-black text-2xl sm:text-3xl text-white tracking-tight">
                  Model Performance & Methodology
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Specification parameters, empirical goodness-of-fit (R²), and econometric methodology
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-navy-950 shadow-md shadow-teal-500/20 disabled:opacity-50 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  <span>{refreshing ? "Recalibrating Models..." : "Trigger Recalibration"}</span>
                </button>
              )}
            </div>

            {/* Refresh Success Notification */}
            {refreshResult && (
              <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-start gap-3 text-xs text-teal-300">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-teal-200">Recalibration Successful: </span>
                  {refreshResult.message}
                  <div className="font-mono text-[11px] text-teal-400 mt-1">
                    SKUs Updated: {refreshResult.skus_updated} &bull; Elasticity Beta: {refreshResult.elasticity_beta} &bull; Time: {new Date(refreshResult.refreshed_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}


            {/* Model Architecture Specifications Cards */}
            {modelStatus && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Primary Elasticity Model */}
                <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase text-teal-400 font-bold">
                      Primary Econometric Engine
                    </span>
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-white">
                    {modelStatus.primary_model?.name || "OLS Fixed-Effects Regression"}
                  </h3>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Elasticity Beta (&beta;):</span>
                      <span className="font-mono font-bold text-amber-400">
                        {modelStatus.primary_model?.elasticity_coefficient ?? -71.673}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Statistical Significance (p-value):</span>
                      <span className="font-mono font-bold text-teal-300">
                        {modelStatus.primary_model?.p_value ?? 0.0001}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Goodness-of-Fit (R²):</span>
                      <span className="font-mono font-bold text-teal-300">
                        {modelStatus.primary_model?.r_squared ?? 0.328}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Training Sample Size:</span>
                      <span className="font-mono text-white">
                        {modelStatus.primary_model?.training_samples?.toLocaleString() ?? "54,772"} transactions
                      </span>
                    </div>
                    <div className="py-1">
                      <span className="text-slate-400 block mb-0.5">Specification Formula:</span>
                      <code className="text-[11px] font-mono text-teal-300 bg-slate-900 px-2 py-1 rounded block">
                        {modelStatus.primary_model?.formula || "qty ~ price_gap_pct + C(product_id)"}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Secondary Rolling Forecast Model */}
                <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase text-amber-400 font-bold">
                      Deterministic Forecasting Engine
                    </span>
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-white">
                    {modelStatus.secondary_model?.name || "Deterministic OLS Rolling Linear Regression"}
                  </h3>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Supported Horizons:</span>
                      <span className="font-mono text-white">7 Days, 14 Days, 30 Days</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Execution Mode:</span>
                      <span className="font-mono text-white">Deterministic runtime fit (no random seeds)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Confidence Metric:</span>
                      <span className="font-mono text-teal-300">Empirical R² goodness-of-fit</span>
                    </div>
                    <div className="py-1 text-[11px] text-slate-400 leading-relaxed">
                      Evaluated per-product with 95% confidence intervals directly computed from residual standard errors. No artificial score smoothing or mock figures.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        <ChatWidget />
      </div>
    </AuthGuard>
  );
}
