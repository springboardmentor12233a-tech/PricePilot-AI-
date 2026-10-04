"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Package,
  Crosshair,
  Scale,
  LineChart,
  TrendingUp,
  Sparkles,
  BarChart3,
  Coins,
  ShieldCheck,
  UserCheck,
  Cpu,
  Bot,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { hasRole } = useAuth();
  const [modelBeta, setModelBeta] = useState<number>(-71.673);
  const [modelR2, setModelR2] = useState<number>(0.328);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((h) => {
        if (h && h.elasticity_coef) {
          setModelBeta(h.elasticity_coef);
          setModelR2(h.r_squared);
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenAiAssistant = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-pricepilot-chat"));
    }
  };

  const isAdmin = hasRole(["admin"]);

  // Navigation structure adhering strictly to enterprise grouping
  const overviewNav = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
  ];

  const catalogNav = [
    { name: "Products", href: "/#catalog", icon: Package },
  ];

  const intelligenceNav = [
    { name: "Competitors", href: "/competitor-pricing", icon: Crosshair },
    { name: "Price Comparison", href: "/price-comparison", icon: Scale },
    { name: "Demand Forecasting", href: "/forecast", icon: LineChart },
    { name: "Pricing Intelligence", href: "/pricing", icon: TrendingUp },
    { name: "Pricing Recommendations", href: "/alerts", icon: Sparkles },
    { name: "Market Intelligence", href: "/eda", icon: BarChart3 },
    { name: "Revenue Analytics", href: "/#revenue-analytics", icon: Coins },
  ];

  const adminNav = [
    { name: "Audit Log", href: "/audit", icon: ShieldCheck },
    { name: "Users", href: "/users", icon: UserCheck },
    { name: "Governance", href: "/governance", icon: Cpu },
  ];

  return (
    <aside
      className="w-64 shrink-0 hidden md:flex flex-col border-r transition-colors duration-200 select-none overflow-hidden"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border-light)",
        minHeight: "calc(100vh - 4rem)",
      }}
    >
      {/* Scrollable Container for sections */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
        {/* Top of Sidebar: App Identity & Enterprise Badge */}
        <div
          className="pb-4 border-b transition-colors duration-200"
          style={{ borderColor: "var(--border-light)" }}
        >
          <div className="flex items-center gap-3 px-1.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md shrink-0 transition-transform hover:scale-105"
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, #f59e0b 100%)",
                color: "#070c18",
              }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span
                className="font-serif font-black tracking-tight text-sm leading-tight"
                style={{ color: "var(--text)" }}
              >
                PricePilot AI
              </span>
              <span
                className="text-[9px] font-mono uppercase tracking-widest font-semibold leading-none mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                ENTERPRISE
              </span>
            </div>
          </div>

          {/* AI Assistant Quick-Access Shortcut */}
          <button
            type="button"
            onClick={handleOpenAiAssistant}
            className="w-full mt-3 flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-200 group hover:shadow-md cursor-pointer"
            style={{
              backgroundColor: "rgba(20, 184, 166, 0.08)",
              borderColor: "var(--border-light)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200 group-hover:scale-105"
                style={{
                  backgroundColor: "rgba(20, 184, 166, 0.15)",
                  borderColor: "var(--accent)",
                  color: "var(--accent)",
                }}
              >
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span
                  className="text-xs font-semibold leading-tight flex items-center gap-1.5"
                  style={{ color: "var(--text)" }}
                >
                  AI Assistant
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-ping"
                    style={{ backgroundColor: "var(--accent)" }}
                  />
                </span>
                <span
                  className="text-[10px] font-mono leading-none mt-0.5"
                  style={{ color: "var(--accent)" }}
                >
                  Ask PricePilot
                </span>
              </div>
            </div>
            <ChevronRight
              className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              style={{ color: "var(--text-muted)" }}
            />
          </button>
        </div>

        {/* OVERVIEW Section */}
        <div>
          <p
            className="px-2.5 text-[10px] font-mono uppercase tracking-wider font-semibold mb-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            OVERVIEW
          </p>
          <nav className="space-y-0.5">
            {overviewNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 group"
                  style={{
                    backgroundColor: isActive ? "var(--surface-hover)" : "transparent",
                    color: isActive ? "var(--accent)" : "var(--text)",
                    borderWidth: 1,
                    borderColor: isActive ? "var(--border)" : "transparent",
                  }}
                >
                  <Icon
                    className="w-4 h-4 shrink-0 transition-colors"
                    style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* CATALOG Section */}
        <div>
          <p
            className="px-2.5 text-[10px] font-mono uppercase tracking-wider font-semibold mb-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            CATALOG
          </p>
          <nav className="space-y-0.5">
            {catalogNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 group"
                  style={{
                    backgroundColor: "transparent",
                    color: "var(--text)",
                    borderWidth: 1,
                    borderColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--surface-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Icon
                    className="w-4 h-4 shrink-0 transition-colors"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* INTELLIGENCE Section */}
        <div>
          <p
            className="px-2.5 text-[10px] font-mono uppercase tracking-wider font-semibold mb-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            INTELLIGENCE
          </p>
          <nav className="space-y-0.5">
            {intelligenceNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 group"
                  style={{
                    backgroundColor: isActive ? "var(--surface-hover)" : "transparent",
                    color: isActive ? "var(--accent)" : "var(--text)",
                    borderWidth: 1,
                    borderColor: isActive ? "var(--border)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "var(--surface-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Icon
                    className="w-4 h-4 shrink-0 transition-colors"
                    style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ADMIN Section (Admin-only — completely hidden for Business Analyst role) */}
        {isAdmin && (
          <div>
            <div className="flex items-center justify-between px-2.5 mb-1.5">
              <span
                className="text-[10px] font-mono uppercase tracking-wider font-semibold"
                style={{ color: "var(--warning)" }}
              >
                ADMIN
              </span>
              <span
                className="text-[8px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  color: "var(--warning)",
                }}
              >
                ADMIN ONLY
              </span>
            </div>
            <nav className="space-y-0.5">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 group"
                    style={{
                      backgroundColor: isActive ? "var(--surface-hover)" : "transparent",
                      color: isActive ? "var(--warning)" : "var(--text)",
                      borderWidth: 1,
                      borderColor: isActive ? "rgba(245, 158, 11, 0.4)" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "var(--surface-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <Icon
                      className="w-4 h-4 shrink-0 transition-colors"
                      style={{ color: isActive ? "var(--warning)" : "var(--text-muted)" }}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Model Spec Footer Tag */}
      <div
        className="p-3.5 border-t mt-auto transition-colors duration-200"
        style={{ borderColor: "var(--border-light)" }}
      >
        <div
          className="rounded-xl p-2.5 text-[11px] border transition-colors duration-200"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-light)",
            color: "var(--text-muted)",
          }}
        >
          <div className="flex items-center justify-between font-mono text-[10px] mb-1">
            <span style={{ color: "var(--accent)" }}>OLS ELASTICITY</span>
            <span className="font-bold" style={{ color: "var(--accent)" }}>
              {modelBeta.toFixed(3)}
            </span>
          </div>
          <p className="text-[9.5px] leading-tight" style={{ color: "var(--text-muted)" }}>
            p=0.0001 &bull; R²={modelR2.toFixed(3)} &bull; Dataset 1 Grounded
          </p>
        </div>
      </div>
    </aside>
  );
}
