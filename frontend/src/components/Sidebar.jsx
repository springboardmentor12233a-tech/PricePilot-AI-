import React from "react";
import {
  LayoutDashboard,
  Users2,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  Bell,
  FileText,
  BarChart3,
  BrainCircuit,
  Lock,
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, role, counts }) {
  const sections = [
    {
      title: "Core Modules",
      items: [
        {
          id: "dashboard",
          label: "Executive Overview",
          icon: LayoutDashboard,
          badge: null,
        },
        {
          id: "recommendations",
          label: "Price Prediction",
          icon: Sparkles,
          badge: "Active",
          badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        },
        {
          id: "forecasting",
          label: "Demand Forecasting",
          icon: TrendingUp,
          badge: "AI ML",
        },
        {
          id: "competitors",
          label: "Competitor Analysis",
          icon: Users2,
          badge: "3 rivals",
        },
      ],
    },
    {
      title: "Market Intelligence",
      items: [
        {
          id: "ai_insights",
          label: "AI Insights",
          icon: Sparkles,
          badge: null,
        },
        {
          id: "alerts",
          label: "Alerts",
          icon: Bell,
          badge: "3 New",
          badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold",
        },
      ],
    },
    {
      title: "Reporting",
      items: [
        {
          id: "bi_reports",
          label: "BI Reports",
          icon: FileText,
          badge: null,
        },
        {
          id: "analytics",
          label: "Analytics",
          icon: BarChart3,
          badge: null,
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          id: "settings",
          label: "Model & DB Settings",
          icon: SlidersHorizontal,
          badge: null,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-950/40 backdrop-blur-md flex flex-col justify-between p-4 shrink-0 overflow-y-auto">
      <div className="space-y-6">
        {/* Role Badge Indicator */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-inner">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Active Session Role</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <div className="font-semibold text-sm text-slate-200 capitalize flex items-center gap-1.5">
            {role === "pricing_manager" ? (
              <>
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <span>Pricing Manager</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Business User (Read)</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-tight">
            {role === "pricing_manager"
              ? "Authorized to simulate & deploy new price rules."
              : "View-only access for marketing & sales analytics."}
          </p>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-1.5">
                {section.title}
              </p>
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activeTab === item.id ||
                    (item.id === "competitors" && activeTab === "market_analysis") ||
                    (item.id === "market_analysis" && activeTab === "competitors");

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? "text-indigo-400" : "text-slate-400"
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            item.badgeColor ||
                            "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800/80 mt-6">
        <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 p-3 rounded-xl border border-indigo-900/30">
          <p className="text-xs font-medium text-indigo-300">
            PricePilot Enterprise
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            ML Demand & Competitor Radar
          </p>
        </div>
      </div>
    </aside>
  );
}
