import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Package, Tag, TrendingUp, Radar, Users, DollarSign,
  BarChart3, Sparkles, Bell, MessageSquare, FileText, History, Activity,
  ShieldCheck, ScrollText, Settings, Moon, Sun, LogOut, Menu,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { section: null, items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "BUSINESS_MANAGER", "BUSINESS_ANALYST", "VIEWER"] }] },
  { section: null, items: [{ to: "/products", label: "Products", icon: Package, roles: ["ADMIN", "BUSINESS_MANAGER", "BUSINESS_ANALYST", "VIEWER"] }] },
  {
    section: "Pricing", items: [
      { to: "/pricing/analytics", label: "Pricing Analytics", icon: BarChart3, roles: ["ADMIN", "BUSINESS_MANAGER", "BUSINESS_ANALYST"] },
      { to: "/pricing/prediction", label: "Price Prediction", icon: Tag, roles: ["ADMIN", "BUSINESS_MANAGER", "BUSINESS_ANALYST"] },
    ]
  },
  {
    section: "Forecasting", items: [
      { to: "/forecasting/demand", label: "Demand Forecasting", icon: TrendingUp, roles: ["ADMIN", "BUSINESS_MANAGER", "BUSINESS_ANALYST"] },
    ]
  },
  {
    section: "Market Intelligence", items: [
      { to: "/market/competitors", label: "Competitor Analysis", icon: Radar, roles: ["ADMIN", "BUSINESS_MANAGER", "BUSINESS_ANALYST"] },
      { to: "/market/customers", label: "Customer Analytics", icon: Users, roles: ["ADMIN", "BUSINESS_MANAGER", "BUSINESS_ANALYST"] },
    ]
  },
  {
    section: "Revenue", items: [
      { to: "/revenue/optimization", label: "Revenue Optimization", icon: DollarSign, roles: ["ADMIN", "BUSINESS_MANAGER"] },
    ]
  },
  {
    section: "Data Intelligence", items: [
      { to: "/data/eda", label: "EDA & Insights", icon: Activity, roles: ["ADMIN", "BUSINESS_ANALYST"] },
    ]
  },
  {
    section: "AI Intelligence", items: [
      { to: "/ai/recommendations", label: "AI Recommendations", icon: Sparkles, roles: ["ADMIN", "BUSINESS_MANAGER", "BUSINESS_ANALYST"] },
      { to: "/ai/alerts", label: "AI Alerts", icon: Bell, roles: ["ADMIN", "BUSINESS_MANAGER", "BUSINESS_ANALYST"] },
      { to: "/ai/copilot", label: "PricePilot Copilot", icon: MessageSquare, roles: ["ADMIN", "BUSINESS_MANAGER", "BUSINESS_ANALYST"] },
    ]
  },
  {
    section: "Reports", items: [
      { to: "/reports/bi", label: "BI Reports", icon: FileText, roles: ["ADMIN", "BUSINESS_MANAGER", "BUSINESS_ANALYST", "VIEWER"] },
      { to: "/reports/history", label: "Report History", icon: History, roles: ["ADMIN", "BUSINESS_MANAGER", "BUSINESS_ANALYST", "VIEWER"] },
    ]
  },
  {
    section: "Administration", items: [
      { to: "/admin/users", label: "Users", icon: ShieldCheck, roles: ["ADMIN"] },
      { to: "/admin/models", label: "Model Performance", icon: Activity, roles: ["ADMIN", "BUSINESS_MANAGER", "BUSINESS_ANALYST", "VIEWER"] },
      { to: "/admin/audit", label: "Audit Logs", icon: ScrollText, roles: ["ADMIN"] },
      { to: "/admin/settings", label: "Settings", icon: Settings, roles: ["ADMIN", "BUSINESS_MANAGER", "BUSINESS_ANALYST", "VIEWER"] },
    ]
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const toggleDark = () => {
    setDark((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });
  };

  return (
    <div className={`min-h-screen flex text-slate-100 ${dark ? "dark" : ""}`}>
      <aside className={`relative shrink-0 flex flex-col border-r border-white/10 bg-[rgba(11,17,32,0.72)] backdrop-blur-xl shadow-[0_0_40px_rgba(15,23,42,0.45)] transition-all ${collapsed ? "w-16" : "w-64"}`}>
        <div className="h-14 flex items-center gap-2 px-4 border-b border-white/10">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 font-display text-sm font-bold text-white shadow-lg shadow-blue-500/30">P</div>
          {!collapsed && <span className="font-display text-base font-semibold tracking-tight text-slate-50">PricePilot AI</span>}
        </div>
        <nav className="flex-1 overflow-y-auto py-3 text-sm">
          {NAV.map((group, gi) => {
            const visibleItems = group.items.filter((i) => i.roles.includes(user?.role));
            if (visibleItems.length === 0) return null;
            return (
              <div key={gi} className="mb-2">
                {group.section && !collapsed && (
                  <div className="px-4 mt-3 mb-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">{group.section}</div>
                )}
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl transition-all ${isActive ? "bg-gradient-to-r from-blue-500/20 via-indigo-500/15 to-violet-500/20 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.18)]" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"}`
                    }
                  >
                    <item.icon size={16} className={"shrink-0"} />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex min-w-0 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-white/10 bg-[rgba(11,17,32,0.72)] px-4 backdrop-blur-xl text-slate-100">
          <button onClick={() => setCollapsed((c) => !c)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-3">
            <button onClick={toggleDark} className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="text-right text-sm">
              <div className="font-medium text-slate-50">{user?.full_name}</div>
              <div className="text-xs text-slate-400">{user?.role}</div>
            </div>
            <button onClick={logout} className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10" title="Log out">
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 text-slate-100 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_28%),linear-gradient(180deg,_rgba(7,11,20,0.96),_rgba(11,17,32,0.98))]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
