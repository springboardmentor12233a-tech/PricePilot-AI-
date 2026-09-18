import React, { useState } from "react";
import {
  SlidersHorizontal,
  Database,
  Cpu,
  RefreshCw,
  CheckCircle2,
  Server,
  Shield,
  Zap,
  HardDrive,
} from "lucide-react";
import { fetchHealth } from "../services/api";

export default function SettingsView({ isLiveBackend }) {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState(null);

  const handleCheckHealth = async () => {
    setChecking(true);
    const res = await fetchHealth();
    setStatus(res);
    setChecking(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
          System Settings & Model Architecture
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage backend endpoints, database credentials, and ML model
          hyperparameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend & DB Connection */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            Backend & Database Engine
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">
                FastAPI Backend URL
              </span>
              <div className="font-mono bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-slate-200">
                http://localhost:8000
              </div>
            </div>

            <div>
              <span className="text-slate-500 block mb-1">
                PostgreSQL Connection Dialect
              </span>
              <div className="font-mono bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-slate-200">
                postgresql+psycopg2://postgres:***@localhost:5432/pricepilot
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-400">Connection State:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-semibold border ${
                  isLiveBackend
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}
              >
                {isLiveBackend
                  ? "Live PostgreSQL Connected"
                  : "Simulated Data Mode"}
              </span>
            </div>

            <button
              onClick={handleCheckHealth}
              disabled={checking}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white rounded-xl font-semibold transition-all"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`}
              />
              <span>
                {checking ? "Pinging API..." : "Test Backend Connection"}
              </span>
            </button>
          </div>
        </div>

        {/* AI Model Hyperparameters */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Pricing AI Architecture (Random Forest)
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400">Model Algorithm:</span>
              <span className="font-mono text-cyan-300 font-semibold">
                RandomForestRegressor (n=300)
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400">Primary Anchor:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                lag_unit_price (R² = 0.97)
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400">Categorical Encoder:</span>
              <span className="font-mono text-slate-200">
                OneHotEncoder(handle_unknown='ignore')
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400">Features Included:</span>
              <span className="font-mono text-slate-200">
                Competitor avg, weight, rating, season
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
