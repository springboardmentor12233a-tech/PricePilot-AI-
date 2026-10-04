"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme, THEMES } from "@/lib/theme-context";
import { api } from "@/lib/api";
import ReportModal from "./ReportModal";
import {
  Bell,
  Download,
  LogOut,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Palette,
  Check,
} from "lucide-react";

export default function Navbar() {
  const { user, logout, hasRole } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const [openAlertsCount, setOpenAlertsCount] = useState<number>(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [modelBeta, setModelBeta] = useState<number>(-71.673);
  const [modelR2, setModelR2] = useState<number>(0.328);

  useEffect(() => {
    const fetchAlertsAndMeta = async () => {
      try {
        const [alerts, health] = await Promise.all([
          api.alerts.list(),
          fetch("/api/health").then((r) => r.json()),
        ]);
        if (Array.isArray(alerts)) {
          setOpenAlertsCount(alerts.length);
        }
        if (health && health.elasticity_coef) {
          setModelBeta(health.elasticity_coef);
          setModelR2(health.r_squared);
        }
      } catch (e) {
        // Silently tolerate if not authenticated or server booting
      }
    };
    fetchAlertsAndMeta();
    const interval = setInterval(fetchAlertsAndMeta, 30000);
    return () => clearInterval(interval);
  }, []);

  const canDownloadReports = hasRole(["admin", "analyst"]);

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "analyst":
        return "bg-teal-500/20 text-teal-400 border-teal-500/40";
      case "viewer":
      default:
        return "bg-slate-700/40 text-slate-300 border-slate-600/40";
    }
  };

  const currentThemeObj = themes.find((t) => t.id === theme) || themes[0];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-navy-950/85 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Left Brand Identity */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-amber-500 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-navy-950" />
              </div>
              <div>
                <span className="font-serif font-black tracking-tight text-lg group-hover:text-teal-400 transition-colors">
                  PricePilot<span className="text-teal-400">AI</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60">
                  v0.3.0 &bull; Electronics
                </span>
              </div>
            </Link>

            {/* Econometric Model Validation Tag */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-teal-500/30 text-xs">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="font-mono text-[11px] text-teal-300">
                OLS Elasticity (beta = {modelBeta.toFixed(2)}, R² = {modelR2.toFixed(3)})
              </span>
            </div>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* 6-Theme Switcher Control */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setThemeDropdownOpen(!themeDropdownOpen);
                  setUserDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs"
                title="Select 6-Theme Color Palette"
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 shadow-sm"
                  style={{ backgroundColor: currentThemeObj.dotColor }}
                />
                <span className="hidden md:inline font-medium text-[11px]">
                  {currentThemeObj.name}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {themeDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl glass-panel border border-slate-700/80 shadow-2xl py-2 z-50 animate-fadeIn">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800/80 mb-1">
                    Theme Palette (6 Options)
                  </div>
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTheme(t.id);
                        setThemeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left ${
                        theme === t.id
                          ? "bg-teal-500/15 text-teal-300 font-semibold"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0 shadow-sm"
                          style={{ backgroundColor: t.dotColor }}
                        />
                        <span>{t.name}</span>
                      </div>
                      {theme === t.id && <Check className="w-3.5 h-3.5 text-teal-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Download BI Report Button (Admin & Analyst only) */}
            {canDownloadReports && (
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-navy-950 shadow-md shadow-teal-500/15 transition-all"
                title="Download Executive BI Report (PDF / CSV / Excel)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report</span>
              </button>
            )}

            {/* Proactive Alerts Bell with live count */}
            <Link
              href="/alerts"
              className="relative p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Active Intelligence Alerts"
            >
              <Bell className="w-4 h-4" />
              {openAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm shadow-red-500/50 animate-pulse">
                  {openAlertsCount}
                </span>
              )}
            </Link>

            {/* User Profile Pill & Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setThemeDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-all text-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center text-[11px] font-bold">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="font-medium text-slate-200 truncate max-w-[120px]">
                      {user.full_name || user.email.split("@")[0]}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold ${getRoleBadgeStyle(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel border border-slate-700/80 shadow-2xl py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-800 text-xs">
                      <p className="font-semibold text-white">{user.full_name || "Enterprise User"}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <div className="mt-1.5 inline-block font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                        Role: {user.role.toUpperCase()}
                      </div>
                    </div>

                    {user.role === "admin" && (
                      <Link
                        href="/users"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Manage Users & Roles</span>
                      </Link>
                    )}

                    {canDownloadReports && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setIsReportModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-left"
                      >
                        <Download className="w-4 h-4 text-teal-400" />
                        <span>Download BI Reports</span>
                      </button>
                    )}

                    <div className="border-t border-slate-800/80 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-navy-950 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* BI Report Download Modal */}
      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </>
  );
}
