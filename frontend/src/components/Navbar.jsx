import React from "react";
import {
  Sparkles,
  ShieldCheck,
  UserCheck,
  Activity,
  Search,
  Bell,
  Database,
} from "lucide-react";

export default function Navbar({
  role,
  setRole,
  isLiveBackend,
  searchQuery,
  setSearchQuery,
  activePage,
  setActivePage,
}) {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-white tracking-tight">
              PricePilot<span className="text-indigo-400">.AI</span>
            </span>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              v0.1 MVP
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Dynamic Pricing & Revenue Intelligence
          </p>
        </div>
      </div>

      {/* Primary Page Navigation */}
      <nav className="hidden lg:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActivePage("home")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activePage === "home"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setActivePage("prediction")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activePage === "prediction"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI Predictor</span>
        </button>
        <button
          onClick={() => setActivePage("dashboard")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activePage === "dashboard"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Dashboard
        </button>
      </nav>

      {/* Global Search */}
      <div className="hidden md:flex items-center relative max-w-xs w-full mx-4">
        <Search className="w-4 h-4 text-slate-400 absolute left-3" />
        <input
          type="text"
          placeholder="Search SKU or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
      </div>

      {/* Actions & Role Switcher */}
      <div className="flex items-center gap-4">
        {/* Backend Connectivity Status */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isLiveBackend
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>
            {isLiveBackend ? "FastAPI Connected" : "Simulated Data Mode"}
          </span>
        </div>

        {/* Role Toggle Switch */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setRole("pricing_manager")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              role === "pricing_manager"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Full permissions: approve & apply AI price updates"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pricing Manager</span>
          </button>
          <button
            onClick={() => setRole("business_user")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              role === "business_user"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Read-only view for sales & marketing analytics"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Business User</span>
          </button>
        </div>

        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-indigo-300">
          {role === "pricing_manager" ? "PM" : "BU"}
        </div>
      </div>
    </header>
  );
}
