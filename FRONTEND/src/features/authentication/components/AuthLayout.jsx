import React, { useEffect, useState } from 'react';
import { TrendingUp, BarChart3, ShieldCheck, Zap, Sparkles, Lock, Award, CheckCircle2 } from 'lucide-react';
import { APP_CONFIG } from '../../../utils/constants';

/* -------------------------------------------------------------------------- */
/*  Scoped animation + visual styles ("al-" prefix)                            */
/* -------------------------------------------------------------------------- */
const AUTH_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.al-root { font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; }

/* Entrance */
.al-rise { opacity: 0; animation: al-rise .7s cubic-bezier(.2,.8,.2,1) forwards; }
@keyframes al-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }

/* Left side background */
.al-left-bg {
  background:
    radial-gradient(ellipse 60% 40% at 0% 0%, rgba(147,197,253,.35), transparent 70%),
    radial-gradient(ellipse 50% 40% at 100% 100%, rgba(199,210,254,.4), transparent 70%),
    #F8FAFC;
}

/* Auth card with animated gradient top edge */
.al-card { position: relative; transition: box-shadow .3s ease, transform .3s ease; }
.al-card:hover { box-shadow: 0 24px 50px -24px rgba(37,99,235,.28); }
.al-card::before {
  content: ''; position: absolute; left: 24px; right: 24px; top: -1px; height: 3px;
  border-radius: 0 0 6px 6px;
  background: linear-gradient(90deg, #3b82f6, #6366f1, #a855f7, #3b82f6);
  background-size: 200% 100%;
  animation: al-slide 6s linear infinite;
}
@keyframes al-slide { to { background-position: -200% 0; } }

/* Logo */
.al-logo { transition: transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .3s ease; }
.al-brand:hover .al-logo { transform: rotate(-8deg) scale(1.08); box-shadow: 0 10px 24px -6px rgba(37,99,235,.55); }

/* Trust badges */
.al-badge { transition: transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s ease, border-color .25s ease; }
.al-badge:hover { transform: translateY(-3px); box-shadow: 0 12px 24px -12px rgba(15,23,42,.25); border-color: #bfdbfe; }
.al-badge svg { transition: transform .3s cubic-bezier(.2,.8,.2,1); }
.al-badge:hover svg { transform: scale(1.25) rotate(-6deg); }

/* Right panel */
.al-right-bg {
  background:
    radial-gradient(ellipse 70% 50% at 20% 0%, rgba(37,99,235,.35), transparent 70%),
    radial-gradient(ellipse 60% 50% at 100% 100%, rgba(139,92,246,.3), transparent 70%),
    #0B1220;
}
.al-grid {
  background-image:
    linear-gradient(rgba(148,163,184,.09) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148,163,184,.09) 1px, transparent 1px);
  background-size: 44px 44px;
  -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 100%);
  mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 100%);
}
.al-orb { animation: al-orb 16s ease-in-out infinite; }
.al-orb-2 { animation-delay: -7s; animation-duration: 20s; }
@keyframes al-orb {
  0%,100% { transform: translate(0,0) scale(1); }
  33% { transform: translate(40px,-30px) scale(1.12); }
  66% { transform: translate(-30px,34px) scale(.94); }
}

/* Floating particles */
.al-particle { position: absolute; border-radius: 9999px; background: rgba(147,197,253,.6); animation: al-particle linear infinite; }
@keyframes al-particle {
  from { transform: translateY(0); opacity: 0; }
  10% { opacity: .9; }
  to { transform: translateY(-420px); opacity: 0; }
}

/* Gradient text */
.al-gradient-text {
  background: linear-gradient(90deg, #60a5fa, #a78bfa, #60a5fa);
  background-size: 200% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: al-slide 7s linear infinite;
}

/* Metric card tilt */
.al-tilt {
  transform: perspective(1100px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform .2s ease-out;
  will-change: transform;
}

/* Tiles */
.al-tile { transition: transform .25s cubic-bezier(.2,.8,.2,1), border-color .25s ease, box-shadow .25s ease; }
.al-tile:hover { transform: translateY(-3px); border-color: rgba(96,165,250,.6); box-shadow: 0 10px 24px -12px rgba(37,99,235,.6); }

/* Progress bars fill in */
.al-bar { transition: width 1.4s cubic-bezier(.2,.8,.2,1); position: relative; overflow: hidden; }
.al-bar::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent);
  transform: translateX(-100%);
  animation: al-bar-shine 3.2s ease-in-out infinite;
}
@keyframes al-bar-shine { 60%,100% { transform: translateX(100%); } }

/* Rotating insight text */
.al-fade { animation: al-fade .5s ease both; }
@keyframes al-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

/* Status ping */
.al-ping { position: relative; }
.al-ping::after {
  content: ''; position: absolute; inset: 0; border-radius: 9999px; background: inherit;
  animation: al-ping 1.8s cubic-bezier(0,0,.2,1) infinite;
}
@keyframes al-ping { 75%,100% { transform: scale(2.6); opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .al-rise, .al-card::before, .al-orb, .al-particle, .al-gradient-text, .al-bar::after, .al-fade, .al-ping::after { animation: none !important; }
  .al-rise { opacity: 1; }
  .al-tilt { transform: none !important; }
  .al-bar, .al-tile, .al-badge, .al-logo { transition: none !important; }
}
`;

const tiltMove = (e) => {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  el.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
  el.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
};
const tiltLeave = (e) => {
  e.currentTarget.style.setProperty('--rx', '0deg');
  e.currentTarget.style.setProperty('--ry', '0deg');
};

const PARTICLES = [
  { left: '8%', bottom: '4%', size: 4, dur: 11, delay: 0 },
  { left: '22%', bottom: '10%', size: 3, dur: 14, delay: 3 },
  { left: '38%', bottom: '2%', size: 5, dur: 12, delay: 6 },
  { left: '55%', bottom: '8%', size: 3, dur: 15, delay: 1 },
  { left: '70%', bottom: '3%', size: 4, dur: 13, delay: 8 },
  { left: '86%', bottom: '9%', size: 3, dur: 10, delay: 4 },
];

const INSIGHTS = [
  'Catalog pricing rules re-evaluate every 15 minutes across Indian e-commerce benchmarks.',
  'Margin floors are enforced on every recommendation before it reaches your team.',
  'Every price change is logged, so reviews and audits stay traceable.',
];

const PILLARS = [
  { label: 'Demand', tag: 'PED: -0.62', tagColor: 'text-[#60A5FA]', title: 'Inelastic Segment', bar: 'bg-gradient-to-r from-[#2563EB] to-[#60A5FA]', pct: 75 },
  { label: 'Price', tag: '+7.2% Lift', tagColor: 'text-[#34D399]', title: 'Optimal Target', bar: 'bg-gradient-to-r from-[#059669] to-[#34D399]', pct: 80 },
  { label: 'Revenue', tag: 'Gross Margin', tagColor: 'text-[#A78BFA]', title: '42.8% Realized', bar: 'bg-gradient-to-r from-[#7C3AED] to-[#A78BFA]', pct: 67 },
  { label: 'Competitor', tag: 'Index: 98.4', tagColor: 'text-[#FBBF24]', title: 'Competitive Parity', bar: 'bg-gradient-to-r from-[#D97706] to-[#FBBF24]', pct: 92 },
];

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
  const [barsReady, setBarsReady] = useState(false);
  const [insightIdx, setInsightIdx] = useState(0);

  // Fill the progress bars shortly after mount
  useEffect(() => {
    const t = setTimeout(() => setBarsReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  // Rotate the insight line
  useEffect(() => {
    const id = setInterval(() => setInsightIdx((i) => (i + 1) % INSIGHTS.length), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="al-root min-h-screen bg-[#F8FAFC] flex flex-col justify-center antialiased overflow-x-hidden">
      <style>{AUTH_CSS}</style>

      <div className="flex min-h-screen">
        {/* Left Column: Form & Brand Area */}
        <div className="al-left-bg flex-1 flex flex-col justify-between p-4 sm:p-8 lg:p-12 xl:p-16 w-full">
          <div className="max-w-xl mx-auto w-full">
            {/* Brand Logo Header */}
            <div className="al-rise al-brand flex items-center gap-2.5 mb-8 sm:mb-10 cursor-default">
              <div className="al-logo w-11 h-11 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#4F46E5] flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-extrabold text-[#0F172A] tracking-tight block leading-none">
                  {APP_CONFIG.name}
                </span>
                <span className="text-[10px] text-[#64748B] font-semibold tracking-wider uppercase mt-1 block">
                  Enterprise Revenue Intelligence
                </span>
              </div>
            </div>

            {/* Auth Card Container */}
            <div
              className="al-rise al-card bg-white/90 backdrop-blur border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 w-full"
              style={{ animationDelay: '120ms' }}
            >
              <div className="mb-6 sm:mb-7">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
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
            {/* NOTE: Only keep certification claims (SOC2, ISO 27001) that your organization can verify. */}
            <div className="mt-5 grid grid-cols-3 gap-2 px-1 text-center">
              {[
                { icon: ShieldCheck, color: 'text-[#2563EB]', title: 'SOC2 Type II', sub: 'Certified Security' },
                { icon: Award, color: 'text-[#16A34A]', title: 'ISO 27001', sub: 'Data Governance' },
                { icon: Lock, color: 'text-[#4F46E5]', title: '256-Bit TLS', sub: 'Encrypted Transit' },
              ].map((b, i) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.title}
                    className="al-rise al-badge p-2.5 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs flex flex-col items-center"
                    style={{ animationDelay: `${300 + i * 90}ms` }}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${b.color}`} />
                    <span className="text-[10px] font-bold text-[#0F172A]">{b.title}</span>
                    <span className="text-[9px] text-[#64748B]">{b.sub}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="max-w-xl mx-auto w-full pt-6 sm:pt-8 border-t border-[#E2E8F0] mt-8 text-xs text-[#94A3B8] flex flex-col sm:flex-row items-center justify-between gap-2">
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
        <div className="al-right-bg hidden lg:flex flex-1 border-l border-[#1E293B] flex-col justify-between p-10 lg:p-14 xl:p-16 relative overflow-hidden select-none text-white">
          {/* Background layers */}
          <div aria-hidden className="al-grid absolute inset-0" />
          <div aria-hidden className="al-orb absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div aria-hidden className="al-orb al-orb-2 absolute bottom-0 -right-24 w-[26rem] h-[26rem] rounded-full bg-purple-500/20 blur-3xl" />
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              aria-hidden
              className="al-particle"
              style={{
                left: p.left,
                bottom: p.bottom,
                width: p.size,
                height: p.size,
                animationDuration: `${p.dur}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}

          <div className="relative max-w-lg">
            <div className="al-rise inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1E293B]/80 backdrop-blur border border-[#334155] text-[#93C5FD] text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>{badgeText}</span>
            </div>

            <h2
              className="al-rise text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight"
              style={{ animationDelay: '120ms' }}
            >
              Dynamic Pricing & <span className="al-gradient-text">Margin Intelligence</span>
            </h2>

            <p
              className="al-rise text-[#94A3B8] text-sm sm:text-base mt-3.5 leading-relaxed"
              style={{ animationDelay: '240ms' }}
            >
              Synthesize competitor pricing moves, predict demand elasticity, and execute automated price recommendations with board-grade audit compliance.
            </p>
          </div>

          {/* Product Illustration / Metric Representation */}
          <div
            onMouseMove={tiltMove}
            onMouseLeave={tiltLeave}
            className="al-tilt al-rise relative my-8 max-w-lg bg-[#1E293B]/80 backdrop-blur-md border border-[#334155] rounded-2xl p-6 shadow-[0_30px_70px_-20px_rgba(37,99,235,0.45)] ring-1 ring-white/5 space-y-4"
            style={{ animationDelay: '360ms' }}
          >
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
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#064E3B] text-[#34D399] border border-[#059669]">
                <span className="al-ping w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                Active Optimizing
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {PILLARS.map((p, i) => (
                <div key={p.label} className="al-tile p-3 rounded-xl bg-[#0F172A]/90 border border-[#334155]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">{p.label}</span>
                    <span className={`text-[10px] font-medium ${p.tagColor}`}>{p.tag}</span>
                  </div>
                  <p className="text-sm font-bold text-white mt-1">{p.title}</p>
                  <div className="h-1.5 w-full bg-[#334155] rounded-full mt-2 overflow-hidden">
                    <div
                      className={`al-bar h-full rounded-full ${p.bar}`}
                      style={{ width: barsReady ? `${p.pct}%` : '0%', transitionDelay: `${i * 150}ms` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-[#1E293B] border border-[#334155] text-xs text-[#93C5FD] flex items-center gap-2 min-h-[3rem]">
              <Zap className="w-4 h-4 shrink-0 text-[#60A5FA]" />
              <span key={insightIdx} className="al-fade">{INSIGHTS[insightIdx]}</span>
            </div>
          </div>

          {/* Trust and Assurance Badges */}
          <div className="relative flex items-center gap-6 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <ShieldCheck className="w-4 h-4 text-[#60A5FA]" />
              <span>Multi-Tenant Organization Isolation</span>
            </div>
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
              <span>Human-in-the-Loop Governance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}