"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

const allNavItems = [
  { label: "Dashboard", path: "/dashboard", icon: "📦", roles: ["Admin", "Business Analyst", "User"] },
  { label: "Forecasting", path: "/forecasting", icon: "📈", roles: ["Admin", "Business Analyst", "User"] },
  { label: "Stock & Alerts", path: "/inventory", icon: "🔔", roles: ["Admin", "Business Analyst", "User"] },
  { label: "Analyst Tools", path: "/analyst", icon: "🔬", roles: ["Admin", "Business Analyst"] },
  { label: "KPIs", path: "/kpis", icon: "💰", roles: ["Admin", "Business Analyst"] },
  { label: "Competitor", path: "/competitor", icon: "🎯", roles: ["Admin", "Business Analyst"] },
  { label: "Executive", path: "/executive", icon: "📊", roles: ["Admin", "Business Analyst"] },
  { label: "Calendar", path: "/calendar", icon: "📅", roles: ["Admin", "Business Analyst", "User"] },
  { label: "Admin Panel", path: "/admin", icon: "🛠️", roles: ["Admin"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setRole(payload.role || "");
      } catch {}
    }
  }, [pathname]);

  if (pathname === "/login" || pathname === "/") return null;

  const visibleItems = allNavItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-56 min-h-screen status-strip flex flex-col py-6 px-3 sticky top-0">
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-8 h-8 rounded-lg logo-mark flex items-center justify-center font-bold text-[#052018] text-sm">
          P
        </div>
        <span className="font-semibold tracking-tight text-sm">PricePilot AI</span>
      </div>

      <nav className="flex-1 space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition text-left ${
                isActive
                  ? "accent-btn"
                  : "muted-text hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <ThemeToggle className="w-full mb-3" />

      {role && (
        <div className="terminal-card px-3 py-2 mt-4">
          <p className="text-xs muted-text-2">Signed in as</p>
          <p className="text-xs font-semibold accent-text">{role}</p>
        </div>
      )}
    </aside>
  );
}