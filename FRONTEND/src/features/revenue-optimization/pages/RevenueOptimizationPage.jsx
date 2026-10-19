import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Cpu,
  SlidersHorizontal,
  FileDown,
  Package,
  BarChart3,
  LineChart,
  Trophy,
  Lightbulb,
  Scale,
  Store,
  Target,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Info,
} from 'lucide-react';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { useToast } from '../../../hooks/useToast';
import useRevenueOptimization from '../hooks/useRevenueOptimization';

// Subcomponents
import RevenueOptimizationHeader from '../components/RevenueOptimizationHeader';
import ProductSelector from '../components/ProductSelector';
import PricingContextCard from '../components/PricingContextCard';
import ScenarioBuilder from '../components/ScenarioBuilder';
import ScenarioComparison from '../components/ScenarioComparison';
import RevenueSummaryCard from '../components/RevenueSummaryCard';
import ProfitSummaryCard from '../components/ProfitSummaryCard';
import RevenueChart from '../components/RevenueChart';
import ProfitChart from '../components/ProfitChart';
import PricingRecommendationCard from '../components/PricingRecommendationCard';
import PricingConstraints from '../components/PricingConstraints';
import CompetitorContextCard from '../components/CompetitorContextCard';
import PricingHistoryCard from '../components/PricingHistoryCard';
import PriceDemandSimulationEngine from '../components/PriceDemandSimulationEngine';
import ReportConfigModal from '../../reports/components/ReportConfigModal';
import RevenueEmptyState from '../components/RevenueEmptyState';

/* -------------------------------------------------------------------------- */
/*  Scoped styles ("ro-" prefix)                                               */
/* -------------------------------------------------------------------------- */
const REVENUE_CSS = `
.ro-page { position: relative; isolation: isolate; }
.ro-ambient {
  position: absolute; inset: -24px -16px auto -16px; height: 520px; z-index: -1; pointer-events: none;
  background:
    radial-gradient(ellipse 45% 55% at 10% 0%, rgba(147,197,253,.36), transparent 70%),
    radial-gradient(ellipse 40% 50% at 92% 8%, rgba(110,231,183,.26), transparent 70%),
    radial-gradient(ellipse 30% 40% at 55% 0%, rgba(196,181,253,.2), transparent 70%);
  -webkit-mask-image: linear-gradient(#000 40%, transparent);
  mask-image: linear-gradient(#000 40%, transparent);
  animation: ro-ambient 14s ease-in-out infinite alternate;
}
@keyframes ro-ambient { from { opacity: .75; transform: translateY(0); } to { opacity: 1; transform: translateY(14px); } }

.ro-reveal { opacity: 0; transform: translateY(22px) scale(.992); transition: opacity .65s ease, transform .65s cubic-bezier(.2,.8,.2,1); }
.ro-reveal.is-visible { opacity: 1; transform: none; }
.ro-lift { transition: transform .3s cubic-bezier(.2,.8,.2,1), filter .3s ease; }
.ro-lift:hover { transform: translateY(-4px); filter: drop-shadow(0 18px 28px rgba(37,99,235,.16)); }

.ro-section { display: flex; align-items: center; gap: .75rem; }
.ro-section-icon {
  width: 2rem; height: 2rem; border-radius: .6rem; display: flex; align-items: center; justify-content: center; color: #fff;
  background: linear-gradient(135deg, #2563eb, #10b981); box-shadow: 0 8px 16px -8px rgba(37,99,235,.75);
}
.ro-section-title { font-size: .72rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #475569; }
.ro-section-line { flex: 1; height: 1px; background: linear-gradient(90deg, #cbd5e1, transparent); transform-origin: left; animation: ro-line 1s ease both; }
@keyframes ro-line { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* Tabs */
.ro-tabs { display: inline-flex; gap: .25rem; padding: .25rem; border-radius: .9rem; background: #F1F5F9; border: 1px solid #E2E8F0; }
.ro-tab {
  display: inline-flex; align-items: center; gap: .45rem; padding: .5rem .95rem; border-radius: .65rem;
  font-size: .75rem; font-weight: 700; color: #64748B; cursor: pointer;
  transition: transform .2s cubic-bezier(.2,.8,.2,1), background-color .2s ease, color .2s ease, box-shadow .25s ease;
}
.ro-tab:hover { color: #0F172A; transform: translateY(-1px); }
.ro-tab:active { transform: scale(.97); }
.ro-tab:focus-visible { outline: 2px solid #60a5fa; outline-offset: 2px; }
.ro-tab.is-active { color: #fff; background: linear-gradient(135deg, #2563eb, #4f46e5); box-shadow: 0 10px 20px -10px rgba(37,99,235,.8); }
.ro-export { position: relative; display: inline-flex; align-items: center; gap: .4rem; font-size: .75rem; font-weight: 700; color: #2563EB; cursor: pointer; padding: .45rem .8rem; border-radius: .65rem; border: 1px solid #BFDBFE; background: #EFF6FF; transition: transform .2s ease, box-shadow .25s ease, background-color .2s ease; }
.ro-export:hover { transform: translateY(-2px); background: #DBEAFE; box-shadow: 0 10px 20px -12px rgba(37,99,235,.7); }
.ro-export:active { transform: scale(.97); }
.ro-export svg { transition: transform .3s ease; }
.ro-export:hover svg { transform: translateY(2px); }
.ro-tab-body { animation: ro-pop .5s cubic-bezier(.2,.8,.2,1) both; }
@keyframes ro-pop { from { opacity: 0; transform: translateY(14px) scale(.99); } to { opacity: 1; transform: none; } }

/* Insight panels */
.ro-panel { background: #fff; border: 1px solid #E2E8F0; border-radius: 1rem; box-shadow: 0 1px 2px rgba(15,23,42,.04); transition: box-shadow .3s ease, border-color .3s ease; }
.ro-panel:hover { box-shadow: 0 18px 36px -22px rgba(37,99,235,.35); border-color: #BFDBFE; }
.ro-kpi { position: relative; overflow: hidden; transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s ease, border-color .3s ease; }
.ro-kpi::after { content: ''; position: absolute; right: -26px; top: -26px; width: 92px; height: 92px; border-radius: 9999px; background: var(--ro-accent, #3b82f6); opacity: .1; transition: transform .4s ease; }
.ro-kpi:hover { transform: translateY(-4px); border-color: var(--ro-accent, #3b82f6); box-shadow: 0 18px 32px -18px var(--ro-accent, #3b82f6); }
.ro-kpi:hover::after { transform: scale(1.5); }

/* SVG charts */
.ro-chart text { font-family: inherit; }
.ro-bar { transform-box: fill-box; transform-origin: 50% 100%; transform: scaleY(0); transition: transform .9s cubic-bezier(.2,.8,.2,1), opacity .2s ease; }
.ro-ready .ro-bar { transform: scaleY(1); }
.ro-line { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 1.5s ease; }
.ro-ready .ro-line { stroke-dashoffset: 0; }
.ro-dot { opacity: 0; transition: opacity .5s ease .9s, r .2s ease; }
.ro-ready .ro-dot { opacity: 1; }
.ro-hit { cursor: pointer; }
.ro-dim { opacity: .45; }

/* Takeaways */
.ro-take { opacity: 0; animation: ro-slide .55s cubic-bezier(.2,.8,.2,1) forwards; }
@keyframes ro-slide { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }

/* Market bar */
.ro-marker { position: absolute; top: 50%; transform: translate(-50%, -50%); transition: left 1.1s cubic-bezier(.2,.8,.2,1); }

@media (prefers-reduced-motion: reduce) {
  .ro-ambient, .ro-section-line, .ro-tab-body, .ro-take { animation: none !important; }
  .ro-take { opacity: 1; }
  .ro-reveal { opacity: 1; transform: none; transition: none; }
  .ro-bar { transform: none; transition: none; }
  .ro-line { stroke-dashoffset: 0; transition: none; }
  .ro-dot { opacity: 1; transition: none; }
  .ro-lift, .ro-kpi, .ro-tab, .ro-export, .ro-marker { transition: none; }
}
`;

/* -------------------------------------------------------------------------- */
/*  Generic helpers                                                            */
/* -------------------------------------------------------------------------- */
function Reveal({ children, delay = 0, className = '', lift = false }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`ro-reveal ${visible ? 'is-visible' : ''} ${className}`}
    >
      {lift ? <div className="ro-lift h-full">{children}</div> : children}
    </div>
  );
}

function SectionHeading({ icon: Icon, children }) {
  return (
    <Reveal>
      <div className="ro-section">
        <span className="ro-section-icon">
          <Icon className="w-4 h-4" />
        </span>
        <span className="ro-section-title">{children}</span>
        <span className="ro-section-line" />
      </div>
    </Reveal>
  );
}

function CountUp({ value, format, duration = 900 }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDisplay(value);
      fromRef.current = value;
      return undefined;
    }
    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{format ? format(display) : Math.round(display).toLocaleString()}</>;
}

/* -------------------------------------------------------------------------- */
/*  Scenario analytics (derived only from data the page already has)           */
/* -------------------------------------------------------------------------- */
const num = (v) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const pick = (obj, keys) => {
  if (!obj) return null;
  for (const k of keys) {
    const n = num(obj[k]);
    if (n !== null) return n;
  }
  return null;
};
const PRICE_KEYS = ['price', 'candidatePrice', 'scenarioPrice', 'candidate_price', 'scenario_price', 'newPrice', 'proposedPrice', 'currentPrice', 'current_price', 'basePrice'];
const DEMAND_KEYS = ['predictedDemand', 'predicted_demand', 'demand', 'baselineDemand', 'units'];
const REVENUE_KEYS = ['predictedRevenue', 'predicted_revenue', 'revenue', 'projectedRevenue', 'expectedRevenue'];
const PROFIT_KEYS = ['predictedProfit', 'predicted_profit', 'profit', 'projectedProfit', 'expectedProfit'];
const COST_KEYS = ['cost_price', 'costPrice', 'cost', 'unit_cost', 'unitCost'];
const COMP_PRICE_KEYS = ['price', 'competitor_price', 'competitorPrice', 'observed_price', 'observedPrice'];

const pctDelta = (a, b) => (a === null || b === null || b === 0 ? null : ((a - b) / Math.abs(b)) * 100);
const fmtPct = (v) => (v === null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`);
const tone = (v) => (v === null ? 'text-slate-400' : v > 0 ? 'text-emerald-600' : v < 0 ? 'text-rose-600' : 'text-slate-500');

const niceMax = (v) => {
  if (!(v > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return m * p;
};

function makeFormatters(currency) {
  try {
    const full = new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 });
    const compact = new Intl.NumberFormat('en-IN', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 });
    return { full: (v) => full.format(v), compact: (v) => compact.format(v) };
  } catch {
    const f = (v) => `${currency} ${Math.round(v).toLocaleString()}`;
    return { full: f, compact: f };
  }
}

function buildPoints({ product, currentBaseline, baselinePrediction, scenarios }) {
  const cost = pick(product, COST_KEYS);
  const raw = [];

  const basePrice = pick(currentBaseline, PRICE_KEYS) ?? pick(product, ['current_price', 'price', 'currentPrice', 'selling_price']);
  const baseDemand = pick(currentBaseline, DEMAND_KEYS) ?? pick(baselinePrediction, DEMAND_KEYS);
  if (basePrice !== null && baseDemand !== null) {
    raw.push({ id: 'baseline', label: 'Current', price: basePrice, demand: baseDemand, src: currentBaseline, isBaseline: true });
  }

  (scenarios || []).forEach((s, i) => {
    const price = pick(s, PRICE_KEYS);
    const demand = pick(s, ['predictedDemand', 'predicted_demand', 'demand']);
    if (price === null || demand === null) return;
    raw.push({
      id: String(s.id ?? `s-${i}`),
      label: s.name || s.label || s.title || `Scenario ${i + 1}`,
      price,
      demand,
      src: s,
      isBaseline: false,
    });
  });

  // Use model-provided revenue/profit only when every point has it (keeps comparisons consistent)
  const allHaveRevenue = raw.length > 0 && raw.every((p) => pick(p.src, REVENUE_KEYS) !== null);
  const allHaveProfit = raw.length > 0 && raw.every((p) => pick(p.src, PROFIT_KEYS) !== null);

  return raw.map((p) => ({
    id: p.id,
    label: p.label,
    price: p.price,
    demand: p.demand,
    isBaseline: p.isBaseline,
    revenue: allHaveRevenue ? pick(p.src, REVENUE_KEYS) : p.price * p.demand,
    profit: allHaveProfit ? pick(p.src, PROFIT_KEYS) : cost !== null ? (p.price - cost) * p.demand : null,
    cost,
  }));
}

/* -------------------------------------------------------------------------- */
/*  Enhanced charts (SVG, no extra dependencies)                               */
/* -------------------------------------------------------------------------- */
function GroupedBarChart({ points, fmt, hasProfit, activeId, onActive, baseline, bestRevId, bestProfId }) {
  const W = 640, H = 310, L = 58, R = 14, T = 30, B = 58;
  const iw = W - L - R;
  const ih = H - T - B;
  const maxV = Math.max(0, ...points.map((p) => Math.max(p.revenue, hasProfit ? p.profit ?? 0 : 0)));
  const yMax = niceMax(maxV);
  const ticks = [0, 1, 2, 3, 4].map((i) => (yMax / 4) * i);
  const y = (v) => T + ih - (Math.max(v, 0) / yMax) * ih;
  const gw = iw / points.length;
  const series = hasProfit ? 2 : 1;
  const bw = Math.min(36, (gw * 0.7) / series);
  const gap = 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ro-chart w-full h-auto" role="img" aria-label="Projected revenue and profit by price scenario">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#E2E8F0" strokeDasharray={t === 0 ? '0' : '3 4'} />
          <text x={L - 8} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#94A3B8">{fmt.compact(t)}</text>
        </g>
      ))}

      {points.map((p, i) => {
        const cx = L + gw * (i + 0.5);
        const totalW = series * bw + (series - 1) * gap;
        const x0 = cx - totalW / 2;
        const isActive = activeId === p.id;
        const dim = activeId && !isActive;
        const revDelta = baseline && !p.isBaseline ? pctDelta(p.revenue, baseline.revenue) : null;
        return (
          <g key={p.id} className={dim ? 'ro-dim' : ''} onMouseEnter={() => onActive(p.id)} onMouseLeave={() => onActive(null)}>
            {isActive && <rect x={cx - gw / 2 + 4} y={T - 6} width={gw - 8} height={ih + 6} rx="10" fill="rgba(59,130,246,.07)" />}
            <rect
              className="ro-bar"
              x={x0}
              y={y(p.revenue)}
              width={bw}
              height={Math.max(y(0) - y(p.revenue), 0)}
              rx="5"
              fill={p.isBaseline ? '#94A3B8' : 'url(#roRevGrad)'}
              style={{ transitionDelay: `${i * 90}ms` }}
            />
            {hasProfit && p.profit !== null && (
              <rect
                className="ro-bar"
                x={x0 + bw + gap}
                y={y(p.profit)}
                width={bw}
                height={Math.max(y(0) - y(p.profit), 0)}
                rx="5"
                fill={p.isBaseline ? '#CBD5E1' : 'url(#roProfGrad)'}
                style={{ transitionDelay: `${i * 90 + 60}ms` }}
              />
            )}
            {revDelta !== null && (
              <text x={cx} y={y(Math.max(p.revenue, p.profit ?? 0)) - 7} textAnchor="middle" fontSize="10" fontWeight="700" fill={revDelta >= 0 ? '#059669' : '#E11D48'}>
                {fmtPct(revDelta)}
              </text>
            )}
            {(p.id === bestRevId || p.id === bestProfId) && (
              <text x={cx} y={y(Math.max(p.revenue, p.profit ?? 0)) - 20} textAnchor="middle" fontSize="11" fill="#F59E0B">★</text>
            )}
            <text x={cx} y={H - B + 18} textAnchor="middle" fontSize="10.5" fontWeight={isActive ? '700' : '500'} fill={isActive ? '#0F172A' : '#64748B'}>
              {p.label.length > 13 ? `${p.label.slice(0, 12)}…` : p.label}
            </text>
            <text x={cx} y={H - B + 32} textAnchor="middle" fontSize="9.5" fill="#94A3B8">{fmt.compact(p.price)}</text>
            <rect x={cx - gw / 2} y={T - 6} width={gw} height={ih + 40} fill="transparent" className="ro-hit" />
          </g>
        );
      })}

      <defs>
        <linearGradient id="roRevGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="roProfGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function PriceDemandChart({ points, fmt, activeId, onActive, bestRevId, bestProfId }) {
  const W = 640, H = 310, L = 58, R = 62, T = 30, B = 52;
  const iw = W - L - R;
  const ih = H - T - B;
  const sorted = [...points].sort((a, b) => a.price - b.price);
  const minP = sorted[0].price;
  const maxP = sorted[sorted.length - 1].price;
  const range = maxP - minP || 1;
  const x = (p) => L + 22 + ((p - minP) / range) * (iw - 44);
  const dMax = niceMax(Math.max(...sorted.map((p) => p.demand)));
  const rMax = niceMax(Math.max(...sorted.map((p) => p.revenue)));
  const yD = (v) => T + ih - (Math.max(v, 0) / dMax) * ih;
  const yR = (v) => T + ih - (Math.max(v, 0) / rMax) * ih;
  const ticks = [0, 1, 2, 3, 4];
  const path = (fn) => sorted.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.price).toFixed(1)} ${fn(p).toFixed(1)}`).join(' ');
  const bestRev = sorted.find((p) => p.id === bestRevId);
  const bestProf = sorted.find((p) => p.id === bestProfId);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ro-chart w-full h-auto" role="img" aria-label="Price versus predicted demand and revenue">
      {ticks.map((i) => {
        const yy = T + ih - (ih / 4) * i;
        return (
          <g key={i}>
            <line x1={L} x2={W - R} y1={yy} y2={yy} stroke="#E2E8F0" strokeDasharray={i === 0 ? '0' : '3 4'} />
            <text x={L - 8} y={yy + 3.5} textAnchor="end" fontSize="10" fill="#8B5CF6">{Math.round((dMax / 4) * i).toLocaleString()}</text>
            <text x={W - R + 8} y={yy + 3.5} textAnchor="start" fontSize="10" fill="#2563EB">{fmt.compact((rMax / 4) * i)}</text>
          </g>
        );
      })}
      <text x={14} y={T + ih / 2} transform={`rotate(-90 14 ${T + ih / 2})`} textAnchor="middle" fontSize="10" fontWeight="700" fill="#8B5CF6">Predicted demand (units)</text>
      <text x={W - 10} y={T + ih / 2} transform={`rotate(90 ${W - 10} ${T + ih / 2})`} textAnchor="middle" fontSize="10" fontWeight="700" fill="#2563EB">Projected revenue</text>

      {bestRev && (
        <g>
          <line x1={x(bestRev.price)} x2={x(bestRev.price)} y1={T - 4} y2={T + ih} stroke="#F59E0B" strokeDasharray="4 4" />
          <text x={x(bestRev.price)} y={T - 10} textAnchor="middle" fontSize="10" fontWeight="700" fill="#D97706">Revenue peak</text>
        </g>
      )}
      {bestProf && bestProf.id !== bestRev?.id && (
        <g>
          <line x1={x(bestProf.price)} x2={x(bestProf.price)} y1={T - 4} y2={T + ih} stroke="#10B981" strokeDasharray="4 4" />
          <text x={x(bestProf.price)} y={T - 10} textAnchor="middle" fontSize="10" fontWeight="700" fill="#059669">Profit peak</text>
        </g>
      )}

      {sorted.length > 1 && (
        <>
          <path className="ro-line" pathLength="1" d={path((p) => yD(p.demand))} fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path className="ro-line" pathLength="1" d={path((p) => yR(p.revenue))} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}

      {sorted.map((p, i) => {
        const isActive = activeId === p.id;
        return (
          <g key={p.id} onMouseEnter={() => onActive(p.id)} onMouseLeave={() => onActive(null)}>
            {isActive && <line x1={x(p.price)} x2={x(p.price)} y1={T} y2={T + ih} stroke="#94A3B8" strokeDasharray="2 3" />}
            <circle className="ro-dot" cx={x(p.price)} cy={yD(p.demand)} r={isActive ? 7 : p.isBaseline ? 6 : 4.5} fill={p.isBaseline ? '#fff' : '#8B5CF6'} stroke="#8B5CF6" strokeWidth="2.5" />
            <circle className="ro-dot" cx={x(p.price)} cy={yR(p.revenue)} r={isActive ? 7 : p.isBaseline ? 6 : 4.5} fill={p.isBaseline ? '#fff' : '#2563EB'} stroke="#2563EB" strokeWidth="2.5" />
            {(sorted.length <= 7 || i % 2 === 0) && (
              <text x={x(p.price)} y={H - B + 18} textAnchor="middle" fontSize="10" fontWeight={isActive ? '700' : '500'} fill={isActive ? '#0F172A' : '#64748B'}>{fmt.compact(p.price)}</text>
            )}
            <rect x={x(p.price) - 16} y={T - 6} width="32" height={ih + 30} fill="transparent" className="ro-hit" />
          </g>
        );
      })}
      <text x={L + iw / 2} y={H - 6} textAnchor="middle" fontSize="10" fontWeight="700" fill="#64748B">Price point</text>
    </svg>
  );
}

function PointDetail({ point, baseline, fmt }) {
  if (!point) return null;
  const dp = baseline && !point.isBaseline ? pctDelta(point.price, baseline.price) : null;
  const dq = baseline && !point.isBaseline ? pctDelta(point.demand, baseline.demand) : null;
  const dr = baseline && !point.isBaseline ? pctDelta(point.revenue, baseline.revenue) : null;
  const dpr = baseline && !point.isBaseline && point.profit !== null ? pctDelta(point.profit, baseline.profit) : null;
  const cells = [
    { label: 'Price', value: fmt.full(point.price), d: dp },
    { label: 'Demand', value: `${Math.round(point.demand).toLocaleString()} units`, d: dq },
    { label: 'Revenue', value: fmt.full(point.revenue), d: dr },
    ...(point.profit !== null ? [{ label: 'Profit', value: fmt.full(point.profit), d: dpr }] : []),
  ];
  return (
    <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold text-[#0F172A]">{point.label}</span>
        {point.isBaseline && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">Baseline</span>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cells.map((c) => (
          <div key={c.label}>
            <span className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-semibold block">{c.label}</span>
            <span className="text-sm font-bold font-mono text-[#0F172A] block">{c.value}</span>
            {c.d !== null && <span className={`text-[11px] font-bold ${tone(c.d)}`}>{fmtPct(c.d)} vs current</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Scenario Intelligence section                                              */
/* -------------------------------------------------------------------------- */
function ScenarioIntelligence({ points, product, competitorData, pendingCount, currency }) {
  const fmt = useMemo(() => makeFormatters(currency), [currency]);
  const [activeId, setActiveId] = useState(null);
  const [ready, setReady] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setReady(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const baseline = points.find((p) => p.isBaseline) || null;
  const hasProfit = points.length > 0 && points.every((p) => p.profit !== null);

  const bestRev = useMemo(() => points.reduce((a, b) => (b.revenue > a.revenue ? b : a), points[0]), [points]);
  const bestProf = useMemo(() => (hasProfit ? points.reduce((a, b) => (b.profit > a.profit ? b : a), points[0]) : null), [points, hasProfit]);

  const rows = useMemo(
    () =>
      points.map((p) => {
        const dp = baseline && !p.isBaseline ? pctDelta(p.price, baseline.price) : null;
        const dq = baseline && !p.isBaseline ? pctDelta(p.demand, baseline.demand) : null;
        const dr = baseline && !p.isBaseline ? pctDelta(p.revenue, baseline.revenue) : null;
        const dpr = baseline && !p.isBaseline && p.profit !== null ? pctDelta(p.profit, baseline.profit) : null;
        const elasticity = dp !== null && dp !== 0 && dq !== null ? dq / dp : null;
        const margin = p.cost !== null && p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : null;
        return { ...p, dp, dq, dr, dpr, elasticity, margin };
      }),
    [points, baseline]
  );

  const avgElasticity = useMemo(() => {
    const vals = rows.map((r) => r.elasticity).filter((v) => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [rows]);

  const market = useMemo(() => {
    const prices = (competitorData?.observations || []).map((o) => pick(o, COMP_PRICE_KEYS)).filter((v) => v !== null);
    if (!prices.length) return null;
    return { min: Math.min(...prices), max: Math.max(...prices), avg: prices.reduce((a, b) => a + b, 0) / prices.length, count: prices.length };
  }, [competitorData]);

  const bestRevRow = rows.find((r) => r.id === bestRev.id);
  const bestProfRow = bestProf ? rows.find((r) => r.id === bestProf.id) : null;
  const activePoint = points.find((p) => p.id === activeId) || bestRev;

  const takeaways = useMemo(() => {
    const items = [];
    if (baseline) {
      if (bestRev.isBaseline) {
        items.push({ icon: Target, color: 'text-blue-600 bg-blue-50', text: 'Your current price already delivers the highest projected revenue among the evaluated scenarios.' });
      } else {
        items.push({
          icon: TrendingUp,
          color: 'text-emerald-600 bg-emerald-50',
          text: `${bestRev.label} at ${fmt.full(bestRev.price)} lifts projected revenue by ${fmtPct(bestRevRow?.dr ?? null)} compared with the current price.`,
        });
      }
    }
    if (bestProf) {
      if (bestProf.id === bestRev.id) {
        items.push({ icon: Trophy, color: 'text-amber-600 bg-amber-50', text: `${bestProf.label} leads on both revenue and profit, so there is no volume versus margin trade-off to manage.` });
      } else {
        items.push({
          icon: Scale,
          color: 'text-violet-600 bg-violet-50',
          text: `The revenue-maximising price (${fmt.full(bestRev.price)}) differs from the profit-maximising one (${fmt.full(bestProf.price)}). Chasing volume costs margin here.`,
        });
      }
    }
    if (avgElasticity !== null) {
      const absE = Math.abs(avgElasticity);
      items.push({
        icon: Lightbulb,
        color: 'text-sky-600 bg-sky-50',
        text:
          absE < 1
            ? `Implied elasticity averages ${avgElasticity.toFixed(2)}: demand is relatively inelastic here, so moderate price increases tend to raise revenue.`
            : `Implied elasticity averages ${avgElasticity.toFixed(2)}: demand is elastic here, so price increases lose volume faster than they add margin.`,
      });
    }
    if (market) {
      const pos = pctDelta(bestRev.price, market.avg);
      items.push({
        icon: Store,
        color: 'text-indigo-600 bg-indigo-50',
        text: `${bestRev.label} sits ${fmtPct(pos)} versus the average competitor price (${fmt.full(market.avg)}, ${market.count} observation${market.count === 1 ? '' : 's'}).`,
      });
    }
    if (pendingCount > 0) {
      items.push({ icon: Info, color: 'text-slate-600 bg-slate-100', text: `${pendingCount} scenario${pendingCount === 1 ? ' is' : 's are'} still waiting for evaluation. Run them to complete this comparison.` });
    }
    return items;
  }, [baseline, bestRev, bestRevRow, bestProf, avgElasticity, market, pendingCount, fmt]);

  const kpis = [
    { label: 'Baseline Revenue', value: baseline ? baseline.revenue : null, format: (v) => fmt.compact(v), accent: '#64748b', icon: Package },
    { label: 'Best Revenue Uplift', value: bestRevRow?.dr ?? null, format: (v) => fmtPct(v), accent: '#2563eb', icon: TrendingUp, tone: tone(bestRevRow?.dr ?? null) },
    ...(hasProfit
      ? [{ label: 'Best Profit Uplift', value: bestProfRow?.dpr ?? null, format: (v) => fmtPct(v), accent: '#10b981', icon: Sparkles, tone: tone(bestProfRow?.dpr ?? null) }]
      : []),
    { label: 'Scenarios Evaluated', value: points.filter((p) => !p.isBaseline).length, format: (v) => String(Math.round(v)), accent: '#8b5cf6', icon: BarChart3 },
  ];

  const marketDomain = market
    ? {
        min: Math.min(market.min, baseline?.price ?? market.min, bestRev.price),
        max: Math.max(market.max, baseline?.price ?? market.max, bestRev.price),
      }
    : null;
  const marketPos = (v) => (marketDomain ? Math.min(Math.max(((v - marketDomain.min) / (marketDomain.max - marketDomain.min || 1)) * 100, 2), 98) : 0);

  return (
    <div ref={wrapRef} className={`space-y-6 ${ready ? 'ro-ready' : ''}`}>
      {/* KPI strip */}
      <div className={`grid grid-cols-2 ${kpis.length > 3 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="ro-kpi ro-panel p-4" style={{ '--ro-accent': k.accent }}>
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-[#64748B]">{k.label}</span>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md" style={{ background: k.accent }}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <span className={`relative block text-2xl font-extrabold font-mono mt-2 ${k.tone || 'text-[#0F172A]'}`}>
                {k.value === null ? '—' : <CountUp value={k.value} format={k.format} />}
              </span>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="ro-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <h4 className="text-sm font-bold text-[#0F172A]">Revenue {hasProfit ? '& Profit ' : ''}by Price Scenario</h4>
              <p className="text-[11px] text-[#64748B]">Percentages compare each scenario with your current price. ★ marks the best performer.</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#64748B] font-medium">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500" />Revenue</span>
              {hasProfit && <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" />Profit</span>}
            </div>
          </div>
          <GroupedBarChart
            points={points}
            fmt={fmt}
            hasProfit={hasProfit}
            activeId={activeId}
            onActive={setActiveId}
            baseline={baseline}
            bestRevId={bestRev.id}
            bestProfId={bestProf?.id}
          />
        </div>

        <div className="ro-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <h4 className="text-sm font-bold text-[#0F172A]">Price–Demand–Revenue Curve</h4>
              <p className="text-[11px] text-[#64748B]">How predicted demand and revenue move as price changes. Dashed lines mark the peaks.</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#64748B] font-medium">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-500" />Demand</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" />Revenue</span>
            </div>
          </div>
          <PriceDemandChart points={points} fmt={fmt} activeId={activeId} onActive={setActiveId} bestRevId={bestRev.id} bestProfId={bestProf?.id} />
        </div>
      </div>

      <PointDetail point={activePoint} baseline={baseline} fmt={fmt} />

      {/* Scorecard + takeaways */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="ro-panel p-5 xl:col-span-3 overflow-hidden">
          <h4 className="text-sm font-bold text-[#0F172A] mb-3">Scenario Scorecard</h4>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs min-w-[520px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-[#94A3B8]">
                  <th className="px-2 py-2 font-semibold">Scenario</th>
                  <th className="px-2 py-2 font-semibold text-right">Price</th>
                  <th className="px-2 py-2 font-semibold text-right">Demand</th>
                  <th className="px-2 py-2 font-semibold text-right">Revenue</th>
                  {hasProfit && <th className="px-2 py-2 font-semibold text-right">Profit</th>}
                  <th className="px-2 py-2 font-semibold text-right">Elasticity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isBest = r.id === bestRev.id || r.id === bestProf?.id;
                  return (
                    <tr
                      key={r.id}
                      onMouseEnter={() => setActiveId(r.id)}
                      onMouseLeave={() => setActiveId(null)}
                      className={`border-t border-[#F1F5F9] transition-colors cursor-default ${activeId === r.id ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-2 py-2.5">
                        <span className="font-bold text-[#0F172A]">{r.label}</span>
                        {r.isBaseline && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600">Baseline</span>}
                        {isBest && !r.isBaseline && <span className="ml-2 text-amber-500">★</span>}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono">
                        {fmt.full(r.price)}
                        {r.dp !== null && <span className={`block text-[10px] font-bold ${tone(r.dp)}`}>{fmtPct(r.dp)}</span>}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono">
                        {Math.round(r.demand).toLocaleString()}
                        {r.dq !== null && <span className={`block text-[10px] font-bold ${tone(r.dq)}`}>{fmtPct(r.dq)}</span>}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono">
                        {fmt.compact(r.revenue)}
                        {r.dr !== null && <span className={`block text-[10px] font-bold ${tone(r.dr)}`}>{fmtPct(r.dr)}</span>}
                      </td>
                      {hasProfit && (
                        <td className="px-2 py-2.5 text-right font-mono">
                          {fmt.compact(r.profit)}
                          {r.dpr !== null && <span className={`block text-[10px] font-bold ${tone(r.dpr)}`}>{fmtPct(r.dpr)}</span>}
                        </td>
                      )}
                      <td className="px-2 py-2.5 text-right font-mono">
                        {r.elasticity === null ? '—' : (
                          <>
                            {r.elasticity.toFixed(2)}
                            <span className={`block text-[10px] font-bold ${Math.abs(r.elasticity) > 1 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {Math.abs(r.elasticity) > 1 ? 'Elastic' : 'Inelastic'}
                            </span>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-[#94A3B8] mt-3 leading-relaxed">
            Revenue and profit are {hasProfit ? '' : 'revenue is '}calculated from price × predicted demand{hasProfit ? ' and unit cost' : ''}. Elasticity is the implied % demand change per % price change versus the current price.
          </p>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="ro-panel p-5">
            <h4 className="text-sm font-bold text-[#0F172A] mb-3">Key Takeaways</h4>
            <ul className="space-y-3">
              {takeaways.length === 0 && <li className="text-xs text-[#64748B]">Evaluate more scenarios to unlock insights.</li>}
              {takeaways.map((t, i) => {
                const Icon = t.icon;
                return (
                  <li key={i} className="ro-take flex items-start gap-3" style={{ animationDelay: `${i * 110}ms` }}>
                    <span className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${t.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs text-[#475569] leading-relaxed pt-0.5">{t.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {market && (
            <div className="ro-panel p-5">
              <h4 className="text-sm font-bold text-[#0F172A] mb-1">Market Position</h4>
              <p className="text-[11px] text-[#64748B] mb-5">Competitor price range from {market.count} observation{market.count === 1 ? '' : 's'}.</p>
              <div className="relative h-2.5 rounded-full bg-gradient-to-r from-emerald-200 via-amber-200 to-rose-200 mb-8">
                <span className="ro-marker w-3 h-3 rounded-full bg-slate-500 ring-2 ring-white" style={{ left: `${ready ? marketPos(market.avg) : 0}%` }} title={`Market average ${fmt.full(market.avg)}`} />
                {baseline && (
                  <span className="ro-marker w-4 h-4 rounded-full bg-white border-[3px] border-slate-700 shadow" style={{ left: `${ready ? marketPos(baseline.price) : 0}%` }} title={`Current ${fmt.full(baseline.price)}`} />
                )}
                <span className="ro-marker w-4 h-4 rounded-full bg-blue-600 ring-2 ring-white shadow" style={{ left: `${ready ? marketPos(bestRev.price) : 0}%` }} title={`${bestRev.label} ${fmt.full(bestRev.price)}`} />
              </div>
              <div className="flex justify-between text-[10px] text-[#94A3B8] font-medium -mt-4 mb-3">
                <span>Low {fmt.compact(market.min)}</span>
                <span>Avg {fmt.compact(market.avg)}</span>
                <span>High {fmt.compact(market.max)}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#64748B]">
                {baseline && <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border-2 border-slate-700 bg-white" />Current</span>}
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" />Best revenue</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-500" />Market avg</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */
export default function RevenueOptimizationPage() {
  const { selectedOrganization, selectedOrganizationId: storedOrgId } = useOrganization();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const organizationId = selectedOrganization?.id || storedOrgId;
  const initialProductId = searchParams.get('productId') || searchParams.get('product_id') || null;
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const [activeEngineTab, setActiveEngineTab] = useState('engine'); // 'engine' | 'custom-scenarios'
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const {
    product,
    isProductLoading,
    productError,
    inventory,
    isInventoryLoading,
    competitorData,
    isCompetitorsLoading,
    currentBaseline,
    baselinePrediction,
    isBaselinePredicting,
    runBaselinePrediction,
    scenarios,
    addScenario,
    removeScenario,
    runScenarioPrediction,
    runAllScenarios,
    recommendation,
    isGeneratingRec,
    recommendationError,
    generateRecommendation,
    applyRecommendation,
    isApplying,
    applySuccess,
    pricingHistory,
    isHistoryLoading,
    historyError,
    refreshAll,
  } = useRevenueOptimization(selectedProductId, organizationId);

  // Sync state with URL parameter
  useEffect(() => {
    if (initialProductId && initialProductId !== selectedProductId) {
      setSelectedProductId(initialProductId);
    }
  }, [initialProductId, selectedProductId]);

  const handleSelectProduct = useCallback((prod) => {
    if (!prod) {
      setSelectedProductId(null);
      setSearchParams({});
      return;
    }
    setSelectedProductId(prod.id);
    setSearchParams({ productId: prod.id });
  }, [setSearchParams]);

  const handleRefresh = async () => {
    try {
      await refreshAll();
      setLastUpdated(new Date().toISOString());
      toast.success('Catalog & pricing data refreshed.');
    } catch {
      toast.error('Failed to refresh data.');
    }
  };

  const handleAddScenario = (scenarioInput) => {
    try {
      addScenario(scenarioInput);
      toast.success(`Scenario created. Ready for demand evaluation.`);
    } catch (err) {
      toast.error(err?.message || 'Failed to create scenario.');
    }
  };

  const handleRunSingleScenario = async (scenarioId) => {
    try {
      await runScenarioPrediction(scenarioId);
      toast.success('Demand prediction evaluated.');
    } catch (err) {
      toast.error(err?.message || 'Failed to evaluate scenario.');
    }
  };

  const handleRunAllScenarios = async () => {
    try {
      await runAllScenarios();
      toast.success('All pending scenarios evaluated.');
    } catch (err) {
      toast.error(err?.message || 'Error evaluating some scenarios.');
    }
  };

  const handleGenerateRecommendation = async () => {
    try {
      await generateRecommendation();
      toast.success('Model pricing recommendation generated.');
    } catch (err) {
      toast.error(err?.message || 'Failed to generate recommendation.');
    }
  };

  const handleApplyRecommendation = async (recId) => {
    try {
      await applyRecommendation(recId);
      toast.success('Pricing recommendation applied successfully.');
    } catch (err) {
      toast.error(err?.message || 'Failed to apply recommendation.');
    }
  };

  const pendingScenariosCount = scenarios.filter((s) => s.predictedDemand === null && !s.isLoading).length;
  const isAnyScenarioLoading = scenarios.some((s) => s.isLoading);
  const currency = product?.currency || 'INR';

  // Evaluated data points for the enhanced charts (baseline + evaluated scenarios)
  const insightPoints = useMemo(
    () => buildPoints({ product, currentBaseline, baselinePrediction, scenarios }),
    [product, currentBaseline, baselinePrediction, scenarios]
  );
  const hasEvaluatedScenario = insightPoints.some((p) => !p.isBaseline);

  return (
    <div className="ro-page space-y-6 pb-12">
      <style>{REVENUE_CSS}</style>
      <div aria-hidden className="ro-ambient" />

      {/* Page Header */}
      <Reveal>
        <RevenueOptimizationHeader
          onRefresh={handleRefresh}
          isLoading={isProductLoading || isInventoryLoading || isCompetitorsLoading}
          lastUpdated={lastUpdated}
        />
      </Reveal>

      {/* Product Selector Panel */}
      <Reveal delay={80}>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
            Target Product Catalog Selection
          </label>
          <ProductSelector
            organizationId={organizationId}
            selectedProductId={selectedProductId}
            onSelectProduct={handleSelectProduct}
          />
        </div>
      </Reveal>

      {/* No Product Empty State */}
      {!selectedProductId ? (
        <Reveal delay={140}>
          <RevenueEmptyState
            type="no-product"
            title="Select a product to begin revenue optimization."
            description="Choose a product from your organization catalog above to inspect pricing context, simulate what-if candidate price scenarios, and evaluate revenue and profit yields."
          />
        </Reveal>
      ) : (
        <>
          {/* Engine Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <div className="ro-tabs" role="tablist" aria-label="Optimization workspace">
              <button
                type="button"
                role="tab"
                aria-selected={activeEngineTab === 'engine'}
                onClick={() => setActiveEngineTab('engine')}
                className={`ro-tab ${activeEngineTab === 'engine' ? 'is-active' : ''}`}
              >
                <Cpu className="w-3.5 h-3.5" />
                Price–Demand Simulation Engine
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeEngineTab === 'custom-scenarios'}
                onClick={() => setActiveEngineTab('custom-scenarios')}
                className={`ro-tab ${activeEngineTab === 'custom-scenarios' ? 'is-active' : ''}`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Custom Scenarios & Guardrails
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="ro-export"
            >
              <FileDown className="w-3.5 h-3.5" />
              Export Business Report (PDF)
            </button>
          </div>

          {activeEngineTab === 'engine' ? (
            /* Primary Milestone 3 Price-Demand Simulation & Scenario Analysis Engine */
            <div key="engine" className="ro-tab-body">
              <PriceDemandSimulationEngine
                product={product}
                inventory={inventory}
                competitorData={competitorData}
                currentBaseline={currentBaseline}
                pricingHistory={pricingHistory}
                onOpenReportModal={() => setIsReportModalOpen(true)}
              />
            </div>
          ) : (
            <div key="custom" className="ro-tab-body space-y-6">
              {/* Current Pricing Context Card */}
              <Reveal lift>
                <PricingContextCard
                  product={product}
                  inventory={inventory}
                  competitorData={competitorData}
                  baselinePrediction={baselinePrediction}
                  isBaselinePredicting={isBaselinePredicting}
                  onRunBaselinePrediction={runBaselinePrediction}
                  isLoading={isProductLoading}
                />
              </Reveal>

              {/* Revenue & Profit Summary Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Reveal lift>
                  <RevenueSummaryCard
                    currentBaseline={currentBaseline}
                    scenarios={scenarios}
                    currency={currency}
                  />
                </Reveal>
                <Reveal lift delay={120}>
                  <ProfitSummaryCard
                    currentBaseline={currentBaseline}
                    scenarios={scenarios}
                    product={product}
                    currency={currency}
                  />
                </Reveal>
              </div>

              {/* Candidate Scenario Builder */}
              <SectionHeading icon={SlidersHorizontal}>Scenario Builder</SectionHeading>
              <Reveal>
                <ScenarioBuilder
                  onAddScenario={handleAddScenario}
                  product={product}
                  inventory={inventory}
                  competitorData={competitorData}
                  onRunAll={handleRunAllScenarios}
                  pendingCount={pendingScenariosCount}
                  isEvaluating={isAnyScenarioLoading}
                />
              </Reveal>

              {/* Scenario Comparison Ledger */}
              <Reveal>
                <ScenarioComparison
                  currentBaseline={currentBaseline}
                  scenarios={scenarios}
                  product={product}
                  onRunScenario={handleRunSingleScenario}
                  onRemoveScenario={removeScenario}
                  isEvaluating={isAnyScenarioLoading}
                />
              </Reveal>

              {/* Enhanced, data-driven impact analysis (falls back to the original charts until a scenario is evaluated) */}
              <SectionHeading icon={LineChart}>Scenario Intelligence</SectionHeading>
              {hasEvaluatedScenario ? (
                <ScenarioIntelligence
                  points={insightPoints}
                  product={product}
                  competitorData={competitorData}
                  pendingCount={pendingScenariosCount}
                  currency={currency}
                />
              ) : (
                <div className="space-y-4">
                  <Reveal>
                    <div className="ro-panel p-4 flex items-start gap-3 bg-gradient-to-r from-blue-50/70 to-violet-50/60">
                      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-white flex items-center justify-center shrink-0">
                        <Lightbulb className="w-4 h-4" />
                      </span>
                      <p className="text-xs text-[#475569] leading-relaxed">
                        Add a price scenario and run its demand evaluation to unlock the enhanced analysis: revenue and profit comparison,
                        the price–demand curve, implied elasticity, a scenario scorecard and auto-generated takeaways.
                      </p>
                    </div>
                  </Reveal>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <Reveal lift>
                      <RevenueChart
                        currentBaseline={currentBaseline}
                        scenarios={scenarios}
                        currency={currency}
                      />
                    </Reveal>
                    <Reveal lift delay={120}>
                      <ProfitChart
                        currentBaseline={currentBaseline}
                        scenarios={scenarios}
                        product={product}
                        currency={currency}
                      />
                    </Reveal>
                  </div>
                </div>
              )}

              {/* Intelligence & History Grid */}
              <SectionHeading icon={Trophy}>Recommendation &amp; Market Context</SectionHeading>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Reveal lift>
                  <PricingRecommendationCard
                    recommendation={recommendation}
                    product={product}
                    isGenerating={isGeneratingRec}
                    error={recommendationError}
                    onGenerate={handleGenerateRecommendation}
                    onApply={handleApplyRecommendation}
                    isApplying={isApplying}
                    applySuccess={applySuccess}
                  />
                </Reveal>

                <div className="space-y-5">
                  <Reveal lift delay={80}>
                    <CompetitorContextCard
                      product={product}
                      competitorData={competitorData}
                      isLoading={isCompetitorsLoading}
                    />
                  </Reveal>

                  <Reveal delay={140}>
                    <PricingConstraints />
                  </Reveal>

                  <Reveal lift delay={200}>
                    <PricingHistoryCard
                      history={pricingHistory}
                      product={product}
                      isLoading={isHistoryLoading}
                      error={historyError}
                    />
                  </Reveal>
                </div>
              </div>
            </div>
          )}

          {/* Business Report Configuration Modal */}
          <ReportConfigModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            reportContext={{
              selectedProduct: product,
              organizationName: selectedOrganization?.name,
              currentBaseline,
              scenarios,
              competitors: competitorData?.observations || [],
            }}
          />
        </>
      )}
    </div>
  );
}