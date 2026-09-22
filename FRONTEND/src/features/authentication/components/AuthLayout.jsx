import React from 'react';
import { TrendingUp, BarChart3, ShieldCheck, Zap, Sparkles, Lock, Award, CheckCircle2 } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center antialiased overflow-x-hidden">
      <div className="flex min-h-screen">
        {/* Left Column: Form & Brand Area */}
        <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 lg:p-12 xl:p-16 max-w-xl mx-auto w-full">
          <div>
            {/* Brand Logo Header */}
            <div className="flex items-center gap-2.5 mb-8 sm:mb-10">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight block leading-none">
                  {APP_CONFIG.name}
                </span>
                <span className="text-[10px] text-[#64748B] font-semibold tracking-wider uppercase mt-1 block">
                  Enterprise Revenue Intelligence
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

            {/* Enterprise Security Badges below card */}
            <div className="mt-5 grid grid-cols-3 gap-2 px-1 text-center">
              <div className="p-2 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs flex flex-col items-center">
                <ShieldCheck className="w-4 h-4 text-[#2563EB] mb-1" />
                <span className="text-[10px] font-bold text-[#0F172A]">SOC2 Type II</span>
                <span className="text-[9px] text-[#64748B]">Certified Security</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs flex flex-col items-center">
                <Award className="w-4 h-4 text-[#16A34A] mb-1" />
                <span className="text-[10px] font-bold text-[#0F172A]">ISO 27001</span>
                <span className="text-[9px] text-[#64748B]">Data Governance</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs flex flex-col items-center">
                <Lock className="w-4 h-4 text-[#4F46E5] mb-1" />
                <span className="text-[10px] font-bold text-[#0F172A]">256-Bit TLS</span>
                <span className="text-[9px] text-[#64748B]">Encrypted Transit</span>
              </div>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="pt-6 sm:pt-8 border-t border-[#E2E8F0] mt-8 text-xs text-[#94A3B8] flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>&copy; {new Date().getFullYear()} PricePilot AI. India Enterprise Edition.</span>
            <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
              <span>Asia/Kolkata (IST)</span>
              <span>•</span>
              <span>INR (₹) Standard</span>
              <span>•</span>
              <span>AES-256</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Value Proposition (Desktop & Tablet) */}
        <div className="hidden lg:flex flex-1 bg-[#0F172A] border-l border-[#1E293B] flex-col justify-between p-10 lg:p-14 xl:p-16 relative overflow-hidden select-none text-white">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E293B] border border-[#334155] text-[#93C5FD] text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>{badgeText}</span>
            </div>

            <h2 className="text-3xl xl:text-4xl font-bold text-white tracking-tight leading-tight">
              Dynamic Pricing & Margin Intelligence
            </h2>

            <p className="text-[#94A3B8] text-sm sm:text-base mt-3.5 leading-relaxed">
              Synthesize competitor pricing moves, predict demand elasticity, and execute automated price recommendations with board-grade audit compliance.
            </p>
          </div>

          {/* Product Illustration / Metric Representation */}
          <div className="my-8 max-w-lg bg-[#1E293B]/90 border border-[#334155] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#334155] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#2563EB]/20 text-[#60A5FA] flex items-center justify-center border border-[#2563EB]/40">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Real-Time Elasticity Engine</p>
                  <p className="text-[11px] text-[#94A3B8]">XGBoost Demand Optimization</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#064E3B] text-[#34D399] border border-[#059669]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                Active Optimizing
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Pillar 1: Demand */}
              <div className="p-3 rounded-xl bg-[#0F172A] border border-[#334155]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">Demand</span>
                  <span className="text-[10px] font-medium text-[#60A5FA]">PED: -0.62</span>
                </div>
                <p className="text-sm font-bold text-white mt-1">Inelastic Segment</p>
                <div className="h-1.5 w-full bg-[#334155] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#2563EB] rounded-full w-3/4" />
                </div>
              </div>

              {/* Pillar 2: Price */}
              <div className="p-3 rounded-xl bg-[#0F172A] border border-[#334155]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">Price</span>
                  <span className="text-[10px] font-medium text-[#34D399]">+7.2% Lift</span>
                </div>
                <p className="text-sm font-bold text-white mt-1">Optimal Target</p>
                <div className="h-1.5 w-full bg-[#334155] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#10B981] rounded-full w-4/5" />
                </div>
              </div>

              {/* Pillar 3: Revenue */}
              <div className="p-3 rounded-xl bg-[#0F172A] border border-[#334155]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">Revenue</span>
                  <span className="text-[10px] font-medium text-[#A78BFA]">Gross Margin</span>
                </div>
                <p className="text-sm font-bold text-white mt-1">42.8% Realized</p>
                <div className="h-1.5 w-full bg-[#334155] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#8B5CF6] rounded-full w-2/3" />
                </div>
              </div>

              {/* Pillar 4: Competitor */}
              <div className="p-3 rounded-xl bg-[#0F172A] border border-[#334155]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">Competitor</span>
                  <span className="text-[10px] font-medium text-[#FBBF24]">Index: 98.4</span>
                </div>
                <p className="text-sm font-bold text-white mt-1">Competitive Parity</p>
                <div className="h-1.5 w-full bg-[#334155] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#F59E0B] rounded-full w-11/12" />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#1E293B] border border-[#334155] text-xs text-[#93C5FD] flex items-center gap-2">
              <Zap className="w-4 h-4 shrink-0 text-[#60A5FA]" />
              <span>Catalog pricing rules re-evaluate every 15 minutes across Indian e-commerce benchmarks.</span>
            </div>
          </div>

          {/* Trust and Assurance Badges */}
          <div className="flex items-center gap-6 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#60A5FA]" />
              <span>Multi-Tenant Organization Isolation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
              <span>Human-in-the-Loop Governance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
