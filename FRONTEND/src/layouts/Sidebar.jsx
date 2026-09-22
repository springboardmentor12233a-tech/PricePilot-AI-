import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  TrendingUp,
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  LineChart,
  Users2,
  Cpu,
  Sparkles,
  IndianRupee,
  PieChart,
  Calculator,
  FileText,
  FileSpreadsheet,
  Building2,
  Users,
  Settings,
  Globe,
  BarChart3,
} from 'lucide-react';
import { APP_CONFIG } from '../utils/constants';

export const NAVIGATION_SECTIONS = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'CATALOG',
    items: [
      { name: 'Products', path: '/products', icon: Package },
      { name: 'Categories', path: '/categories', icon: FolderTree },
      { name: 'Inventory', path: '/inventory', icon: Boxes },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { name: 'Competitors', path: '/competitors', icon: Users2 },
      { name: 'Demand Forecasting', path: '/forecast', icon: LineChart },
      { name: 'Pricing Intelligence', path: '/pricing', icon: Cpu },
      { name: 'Revenue Optimization', path: '/revenue-simulation', icon: Calculator },
      { name: 'Pricing Analytics', path: '/pricing-analytics', icon: BarChart3 },
      { name: 'Pricing Recommendations', path: '/recommendations', icon: Sparkles },
      { name: 'Market Intelligence', path: '/market-intelligence', icon: Globe },
      { name: 'Revenue Analytics', path: '/revenue', icon: IndianRupee },
      { name: 'Profitability', path: '/profitability', icon: PieChart },
    ],
  },
  {
    title: 'REPORTS',
    items: [
      { name: 'Executive Report', path: '/executive', icon: FileText },
      { name: 'Pricing Report', path: '/reports', icon: FileSpreadsheet },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { name: 'Organization', path: '/organization', icon: Building2 },
      { name: 'Team', path: '/team', icon: Users },
      { name: 'Settings & Profile', path: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ onItemClick, onOpenAI, className = '' }) {
  const location = useLocation();

  return (
    <aside
      className={`w-64 bg-white border-r border-[#E2E8F0] flex flex-col h-full select-none ${className}`}
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shadow-2xs">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-bold text-[16px] text-[#0F172A] tracking-tight block leading-none">
              {APP_CONFIG.name}
            </span>
            <span className="text-[10px] text-[#64748B] font-medium tracking-wide">
              ENTERPRISE
            </span>
          </div>
        </div>
      </div>

      {/* AI Assistant Quick Trigger */}
      <div className="px-3.5 pt-3 pb-1">
        <button
          type="button"
          onClick={() => {
            if (onOpenAI) onOpenAI();
            if (onItemClick) onItemClick();
          }}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-[#EFF6FF] to-[#EEF2FF] border border-[#BFDBFE] hover:border-[#93C5FD] text-[#1D4ED8] transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-[#0F172A] block leading-tight">AI Assistant</span>
              <span className="text-[10px] text-[#64748B] block leading-tight">Ask PricePilot</span>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-[#2563EB] border border-[#BFDBFE]">
            AI
          </span>
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-3 space-y-5">
        {NAVIGATION_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 text-[11px] font-semibold text-[#94A3B8] tracking-wider uppercase mb-1.5">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/dashboard'
                    ? location.pathname === '/dashboard' || location.pathname === '/'
                    : item.path === '/forecast'
                    ? location.pathname.startsWith('/forecast') || location.pathname.startsWith('/forecasting')
                    : item.path === '/revenue-simulation'
                    ? location.pathname.startsWith('/revenue-simulation') || location.pathname.startsWith('/revenue-optimization')
                    : location.pathname.startsWith(item.path);

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onItemClick}
                      className={`relative flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-150 min-h-[38px] ${
                        isActive
                          ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#2563EB] before:rounded-r'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-[#2563EB]' : 'text-[#64748B]'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer Info */}
      <div className="p-4 border-t border-[#E2E8F0] shrink-0 bg-[#F8FAFC]/50">
        <div className="flex items-center justify-between text-xs text-[#64748B]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            FastAPI v1/v2
          </span>
          <span className="text-[11px] text-[#94A3B8]">Port 8000</span>
        </div>
      </div>
    </aside>
  );
}
