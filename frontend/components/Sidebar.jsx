import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  TrendingUp,
  LineChart,
  Sparkles,
  FileBarChart,
  Gauge,
  DollarSign,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pricing", label: "Price Prediction", icon: TrendingUp },
  { href: "/forecasting", label: "Demand Forecasting", icon: LineChart },
  { href: "/optimization", label: "Revenue Optimization", icon: DollarSign },
  { href: "/insights", label: "AI Insights", icon: Sparkles },
  { href: "/reports", label: "BI Reports", icon: FileBarChart },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className="w-[260px] shrink-0 border-r border-border bg-panel px-5 py-6 flex flex-col">
      <div className="flex items-center gap-2.5 px-1">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Gauge size={17} className="text-white" />
        </div>
        <span className="font-bold text-[17px] tracking-tight text-ink">
          PricePilot <span className="text-primary">AI</span>
        </span>
      </div>
      <p className="text-xs text-muted mt-2 px-1 leading-relaxed">
        Dynamic pricing, demand forecasting, and revenue intelligence —
        one console.
      </p>

      <nav className="mt-7 flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = router.pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-light text-primary-dark"
                  : "text-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-border">
        <div className="flex items-center gap-2 px-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-ok" />
          </span>
          <span className="text-xs text-muted">Live pricing engine is on</span>
        </div>
      </div>
    </aside>
  );
}
