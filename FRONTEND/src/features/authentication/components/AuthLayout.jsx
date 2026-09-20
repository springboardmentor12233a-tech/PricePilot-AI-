import React from 'react';
import { TrendingUp, BarChart3, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { APP_CONFIG } from '../../../utils/constants';

/**
 * Enterprise AuthLayout with responsive two-column presentation
 * Left: Authentication card
 * Right: Value proposition visual (“Turn Data Into Profits”)
 */
export default function AuthLayout({
  title,
  subtitle,
  children,
  badgeText = 'Pricing Intelligence Engine',
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center antialiased overflow-x-hidden">
      <div className="flex min-h-screen">
        {/* Left Column: Form & Brand Area */}
        <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 lg:p-12 xl:p-16 max-w-xl mx-auto w-full">
          <div>
            {/* Brand Logo Header */}
            <div className="flex items-center gap-2.5 mb-8 sm:mb-10">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-2xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight block leading-none">
                  {APP_CONFIG.name}
                </span>
                <span className="text-[10px] text-[#64748B] font-semibold tracking-wider uppercase">
                  Enterprise Platform
                </span>
              </div>
            </div>

            {/* Auth Card Container */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs w-full transition-all duration-200">
              <div className="mb-6 sm:mb-7">
                <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>

              {children}
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="pt-6 sm:pt-8 border-t border-[#E2E8F0] mt-8 text-xs text-[#94A3B8] flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>&copy; {new Date().getFullYear()} PricePilot AI. All rights reserved.</span>
            <div className="flex items-center gap-4 text-[11px] text-[#64748B]">
              <span>FastAPI Backend v1</span>
              <span>•</span>
              <span>AES-256 TLS</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Value Proposition (Desktop & Tablet) */}
        <div className="hidden lg:flex flex-1 bg-[#F8FAFC] border-l border-[#E2E8F0] flex-col justify-between p-10 lg:p-14 xl:p-16 relative overflow-hidden select-none">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{badgeText}</span>
            </div>

            <h2 className="text-3xl xl:text-4xl font-bold text-[#0F172A] tracking-tight leading-tight">
              Turn Data Into Profits
            </h2>

            <p className="text-[#64748B] text-sm sm:text-base mt-3.5 leading-relaxed">
              Get real-time insights, AI-powered recommendations, and stay ahead of your competition.
            </p>
          </div>

          {/* Subtle Product Illustration / Metric Representation */}
          <div className="my-8 max-w-lg bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#0F172A]">Real-Time Elasticity Modeling</p>
                  <p className="text-[11px] text-[#64748B]">FastAPI Intelligence Engine</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                Optimal
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Pillar 1: Demand */}
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Demand</span>
                  <span className="text-[10px] font-medium text-[#2563EB]">PED: -1.24</span>
                </div>
                <p className="text-sm font-bold text-[#0F172A] mt-1">High Elasticity</p>
                <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#2563EB] rounded-full w-3/4" />
                </div>
              </div>

              {/* Pillar 2: Price */}
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Price</span>
                  <span className="text-[10px] font-medium text-[#16A34A]">+4.8% Lift</span>
                </div>
                <p className="text-sm font-bold text-[#0F172A] mt-1">Optimized Point</p>
                <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#16A34A] rounded-full w-4/5" />
                </div>
              </div>

              {/* Pillar 3: Revenue */}
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Revenue</span>
                  <span className="text-[10px] font-medium text-[#6366F1]">Gross Margin</span>
                </div>
                <p className="text-sm font-bold text-[#0F172A] mt-1">Expansion Curve</p>
                <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#6366F1] rounded-full w-2/3" />
                </div>
              </div>

              {/* Pillar 4: Competitor */}
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Competitor</span>
                  <span className="text-[10px] font-medium text-[#D97706]">Index: 99.2</span>
                </div>
                <p className="text-sm font-bold text-[#0F172A] mt-1">Market Parity</p>
                <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#D97706] rounded-full w-11/12" />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#EFF6FF]/60 border border-[#BFDBFE]/60 text-xs text-[#1D4ED8] flex items-center gap-2">
              <Zap className="w-4 h-4 shrink-0 text-[#2563EB]" />
              <span>Dynamic pricing rules update with every competitor scrape.</span>
            </div>
          </div>

          {/* Trust and Assurance Badges */}
          <div className="flex items-center gap-6 text-xs text-[#64748B]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              <span>Enterprise JWT Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#2563EB]" />
              <span>Sub-second API Ingestion</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
