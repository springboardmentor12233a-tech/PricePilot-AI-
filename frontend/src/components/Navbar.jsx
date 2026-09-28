import React from "react";
import {
  Sparkles,
  ShieldCheck,
  UserCheck,
  Search,
  Database,
  LogIn,
  LogOut,
  User,
  ShieldAlert,
} from "lucide-react";

export default function Navbar({
  currentUser,
  onOpenAuthModal,
  onLogout,
  isLiveBackend,
  searchQuery,
  setSearchQuery,
  activePage,
  setActivePage,
}) {
  const isPricingManager = currentUser?.role === "pricing_manager";

  const getInitials = () => {
    if (!currentUser) return "?";
    if (currentUser.full_name) {
      const parts = currentUser.full_name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return currentUser.full_name.slice(0, 2).toUpperCase();
    }
    return currentUser.email ? currentUser.email.slice(0, 2).toUpperCase() : "U";
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between gap-3">
      <div
        onClick={() => setActivePage("home")}
        className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
      >
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">
              PricePilot<span className="text-indigo-400">.AI</span>
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
              Enterprise
            </span>
          </div>
          <p className="text-[10px] text-slate-400 hidden sm:block">
            Dynamic Pricing & Market Intelligence
          </p>
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActivePage("home")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activePage === "home"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setActivePage("prediction")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activePage === "dashboard"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Dashboard
        </button>
      </nav>

      <div className="hidden lg:flex items-center relative max-w-xs w-full">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
        <input
          type="text"
          placeholder="Search product or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isLiveBackend
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
          }`}
        >
          <Database className="w-3 h-3" />
          <span className="text-[11px]">
            {isLiveBackend ? "Postgres Live" : "Fallback Data"}
          </span>
        </div>

        {currentUser ? (
          <div className="flex items-center gap-2.5 bg-slate-950/80 p-1.5 pl-2.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <div
                className={`h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                  isPricingManager
                    ? "bg-indigo-600 text-white"
                    : "bg-emerald-600 text-white"
                }`}
                title={currentUser.email}
              >
                {getInitials()}
              </div>

              <div className="hidden sm:block text-left pr-1">
                <div className="text-xs font-bold text-white leading-tight truncate max-w-[130px]">
                  {currentUser.full_name || currentUser.email}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {isPricingManager ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-400">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>Pricing Manager</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                      <UserCheck className="w-2.5 h-2.5" />
                      <span>Business Analyst</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Not Signed In
            </span>
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
