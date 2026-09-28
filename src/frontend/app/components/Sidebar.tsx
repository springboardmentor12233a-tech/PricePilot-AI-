"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: "📦" },
  { label: "Forecasting", path: "/forecasting", icon: "📈" },
  { label: "KPIs", path: "/kpis", icon: "💰" },
  { label: "Competitor", path: "/competitor", icon: "🎯" },
  { label: "Executive", path: "/executive", icon: "📊" },
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

  // Don't show sidebar on login page
  if (pathname === "/login" || pathname === "/") return null;

  return (
    <aside className="w-56 min-h-screen status-strip flex flex-col py-6 px-3 sticky top-0">
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-8 h-8 rounded-lg logo-mark flex items-center justify-center font-bold text-[#052018] text-sm">
          P
        </div>
        <span className="font-semibold tracking-tight text-sm">PricePilot AI</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
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

      {role && (
        <div className="terminal-card px-3 py-2 mt-4">
          <p className="text-xs muted-text-2">Signed in as</p>
          <p className="text-xs font-semibold accent-text">{role}</p>
        </div>
      )}
    </aside>
  );
}