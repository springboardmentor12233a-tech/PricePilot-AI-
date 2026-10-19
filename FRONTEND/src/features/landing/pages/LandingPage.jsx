import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Sliders,
  Users,
  Lock,
  LineChart,
  FileCode,
  Menu,
  X,
  ArrowUp,
  Quote,
} from 'lucide-react';
import { useAuth } from '../../authentication/hooks/useAuth';

/* -------------------------------------------------------------------------- */
/*  Animation styles (scoped with the "pp-" prefix, no Tailwind config needed) */
/* -------------------------------------------------------------------------- */
const ANIMATION_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.pp-root { font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; }
html { scroll-behavior: smooth; }
section[id] { scroll-margin-top: 88px; }

/* ---------- Buttons ---------- */
.pp-btn {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  transition: transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .3s ease, background-color .2s ease, color .2s ease, border-color .2s ease;
  will-change: transform;
}
.pp-btn:hover { transform: translateY(-2px); }
.pp-btn:active { transform: translateY(0) scale(.97); transition-duration: .08s; }
.pp-btn:focus-visible { outline: 2px solid #60a5fa; outline-offset: 3px; }

/* Shimmer sweep */
.pp-shine::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.4) 50%, transparent 70%);
  transform: translateX(-130%);
  transition: transform .8s ease;
  pointer-events: none;
}
.pp-shine:hover::after { transform: translateX(130%); }

/* Glow on hover for primary buttons */
.pp-glow:hover { box-shadow: 0 10px 30px -6px rgba(37,99,235,.55); }

/* Continuous attention pulse (hero CTA) */
.pp-pulse { animation: pp-pulse-ring 2.4s ease-out infinite; }
.pp-pulse:hover { animation-play-state: paused; }
@keyframes pp-pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(37,99,235,.45); }
  70%  { box-shadow: 0 0 0 16px rgba(37,99,235,0); }
  100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
}

/* Arrow nudge */
.pp-arrow { transition: transform .25s cubic-bezier(.2,.8,.2,1); }
.pp-btn:hover .pp-arrow { transform: translateX(5px); }
.pp-icon-spin { transition: transform .4s cubic-bezier(.2,.8,.2,1); }
.pp-btn:hover .pp-icon-spin { transform: rotate(90deg) scale(1.15); }

/* Ghost button: background slides in from the left */
.pp-ghost {
  background-image: linear-gradient(#eff6ff, #eff6ff);
  background-repeat: no-repeat;
  background-size: 0% 100%;
  transition: background-size .35s ease, transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .3s ease, border-color .2s ease, color .2s ease;
}
.pp-ghost:hover { background-size: 100% 100%; border-color: #93c5fd; }

/* Click ripple */
.pp-ripple {
  position: absolute;
  border-radius: 9999px;
  background: rgba(255,255,255,.45);
  transform: scale(0);
  animation: pp-ripple .6s ease-out forwards;
  pointer-events: none;
  z-index: 0;
}
@keyframes pp-ripple { to { transform: scale(4); opacity: 0; } }

/* Subtle link underline animation */
.pp-link { position: relative; }
.pp-link::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: -4px;
  height: 2px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform .3s ease;
}
.pp-link:hover::after { transform: scaleX(1); }

/* ---------- Scroll reveal ---------- */
.pp-reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity .7s ease, transform .7s cubic-bezier(.2,.8,.2,1);
}
.pp-reveal.is-visible { opacity: 1; transform: none; }

/* Card hover lift */
.pp-card { transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s ease, border-color .3s ease; }
.pp-card:hover { transform: translateY(-6px); box-shadow: 0 18px 40px -16px rgba(15,23,42,.25); border-color: #bfdbfe; }
.pp-card:hover .pp-card-icon { transform: scale(1.1) rotate(-4deg); }
.pp-card-icon { transition: transform .3s cubic-bezier(.2,.8,.2,1); }

/* ---------- Ambient motion ---------- */
.pp-float { animation: pp-float 6s ease-in-out infinite; }
@keyframes pp-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

.pp-blob { animation: pp-blob 14s ease-in-out infinite; }
.pp-blob-2 { animation-delay: -6s; animation-duration: 18s; }
@keyframes pp-blob {
  0%,100% { transform: translate(0,0) scale(1); }
  33% { transform: translate(40px,-30px) scale(1.1); }
  66% { transform: translate(-30px,30px) scale(.95); }
}

.pp-gradient-move {
  background-size: 200% 200%;
  animation: pp-gradient 12s ease infinite;
}
@keyframes pp-gradient { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

.pp-fade-in { animation: pp-fade-in .45s ease both; }
@keyframes pp-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

.pp-pop { display: inline-block; animation: pp-pop .35s cubic-bezier(.2,.8,.2,1); }
@keyframes pp-pop { 0% { transform: scale(.88); opacity: .4; } 100% { transform: scale(1); opacity: 1; } }

.pp-marker { transition: left 1.2s cubic-bezier(.2,.8,.2,1); }

.pp-slide-down { animation: pp-slide-down .3s ease both; }
@keyframes pp-slide-down { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }

/* ---------- Visual polish ---------- */
::-webkit-scrollbar { width: 10px; }
::-webkit-scrollbar-track { background: #f1f5f9; }
::-webkit-scrollbar-thumb { background: linear-gradient(#93c5fd, #a5b4fc); border-radius: 9999px; border: 2px solid #f1f5f9; }

.pp-eyebrow {
  display: inline-flex; align-items: center; gap: .5rem;
  padding: .3rem .9rem; margin-bottom: 1rem;
  border-radius: 9999px;
  font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
  color: #1d4ed8;
  background: linear-gradient(90deg, #eff6ff, #eef2ff);
  border: 1px solid #c7d2fe;
}
.pp-eyebrow::before {
  content: ''; width: 6px; height: 6px; border-radius: 9999px;
  background: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.22);
}

.pp-grid-bg {
  background-image:
    linear-gradient(rgba(148,163,184,.2) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148,163,184,.2) 1px, transparent 1px);
  background-size: 52px 52px;
  -webkit-mask-image: radial-gradient(ellipse 75% 65% at 50% 25%, #000 35%, transparent 100%);
  mask-image: radial-gradient(ellipse 75% 65% at 50% 25%, #000 35%, transparent 100%);
}
.pp-grid-light {
  background-image:
    linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px);
  background-size: 44px 44px;
  -webkit-mask-image: radial-gradient(ellipse 70% 80% at 50% 50%, #000 30%, transparent 100%);
  mask-image: radial-gradient(ellipse 70% 80% at 50% 50%, #000 30%, transparent 100%);
}
.pp-dots { background-image: radial-gradient(rgba(100,116,139,.2) 1px, transparent 1px); background-size: 22px 22px; }

/* Gradient border that fades in on card hover */
.pp-card { position: relative; }
.pp-card::before {
  content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1.5px;
  background: linear-gradient(135deg, #60a5fa, #818cf8, #c084fc);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  opacity: 0; transition: opacity .3s ease; pointer-events: none;
}
.pp-card:hover::before { opacity: 1; }
.pp-card-icon { box-shadow: inset 0 0 0 1px rgba(255,255,255,.7), 0 8px 16px -8px currentColor; }

/* 3D tilt (driven by mouse position) */
.pp-tilt {
  transform: perspective(1100px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform .2s ease-out;
  will-change: transform;
}

/* Integrations marquee */
.pp-marquee { display: flex; width: max-content; animation: pp-marquee 32s linear infinite; }
.pp-marquee:hover { animation-play-state: paused; }
@keyframes pp-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

@media (prefers-reduced-motion: reduce) {
  .pp-marquee { animation: none !important; }
  .pp-tilt { transform: none !important; }
}

/* Respect reduced-motion preferences */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .pp-btn, .pp-card, .pp-reveal, .pp-ghost, .pp-arrow { transition: none !important; }
  .pp-pulse, .pp-float, .pp-blob, .pp-gradient-move, .pp-fade-in, .pp-pop, .pp-slide-down { animation: none !important; }
  .pp-reveal { opacity: 1; transform: none; }
  .pp-shine::after { display: none; }
}
`;

/* -------------------------------------------------------------------------- */
/*  Small animation helpers                                                    */
/* -------------------------------------------------------------------------- */
function useInView(options = { threshold: 0.15 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, options);
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [ref, inView];
}

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

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`pp-reveal ${inView ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

function CountUp({ to, decimals = 0, prefix = '', suffix = '', duration = 1600 }) {
  const [ref, inView] = useInView({ threshold: 0.4 });
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setValue(to);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return (
    <span ref={ref}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Static content                                                             */
/* -------------------------------------------------------------------------- */
const FEATURES = [
  {
    icon: TrendingUp,
    tone: 'bg-blue-50 text-blue-600',
    title: 'Dynamic Pricing Engine',
    text: 'Real-time price recommendations calculated from elasticity curves, competitor shifts, and current inventory positions with instant single-click application.',
    points: ['Elasticity curves per product category', 'Cost-plus floor and ceiling constraints'],
  },
  {
    icon: Target,
    tone: 'bg-indigo-50 text-indigo-600',
    title: 'Real-Time Competitor Tracking',
    text: 'Automated monitoring across competing e-commerce storefronts, matching identical or substitute items to surface competitive price gaps immediately.',
    points: ['Automated catalog matching pipeline', 'Price gap detection and alerts'],
  },
  {
    icon: LineChart,
    tone: 'bg-emerald-50 text-emerald-600',
    title: 'Demand & Revenue Forecasting',
    text: 'Machine learning algorithms predict demand response, gross revenue, and contribution margin across 30, 60, and 90-day time horizons.',
    points: ['Unit velocity impact simulation', 'Confidence interval bounds'],
  },
  {
    icon: ShieldCheck,
    tone: 'bg-amber-50 text-amber-600',
    title: 'Profitability Protection',
    text: 'Hard margin boundaries guarantee that algorithm recommendations will never violate your organization’s required gross profit margins or contractual MAP pricing.',
    points: ['Rule-based margin floor enforcement', 'Inventory holding cost factoring'],
  },
  {
    icon: Users,
    tone: 'bg-cyan-50 text-cyan-600',
    title: 'Multi-Tenant Workspaces',
    text: 'Enterprise organization partitioning with strict role-based access control (RBAC), multi-user team collaboration, and isolated catalog governance.',
    points: ['Organization & team member management', 'JWT-authenticated API security'],
  },
  {
    icon: Bot,
    tone: 'bg-purple-50 text-purple-600',
    title: 'Gemini AI Pricing Copilot',
    text: 'Conversational pricing analyst powered by Gemini 3.6 Flash. Query your catalog, diagnose margin leaks, and receive clear strategic pricing recommendations.',
    points: ['Context-aware catalog queries', 'Clean markdown answers grounded in your data'],
  },
];

const STEPS = [
  { color: 'bg-blue-600', title: 'Connect Catalog & Cost Structure', text: 'Import product SKUs, COGS, inventory velocity levels, and category groupings via our unified REST API or batch manager.' },
  { color: 'bg-indigo-600', title: 'Monitor Market & Competitor Benchmarks', text: 'Automated scrapers and feeds capture competitor price changes, stock availability, and promotion cycles around the clock.' },
  { color: 'bg-emerald-600', title: 'Run AI Elasticity & Demand Simulation', text: 'Microeconomic elasticity algorithms simulate price points against inventory velocity to pinpoint the optimal margin-revenue balance.' },
  { color: 'bg-purple-600', title: 'Execute & Automate Optimal Prices', text: 'Apply recommendations with one click or configure autonomous rules within your strict margin boundaries.' },
];

const SECURITY = [
  { icon: Lock, tone: 'bg-blue-50 text-blue-600', title: 'Multi-Tenant Isolation', text: 'All catalog, competitor, and sales records are partitioned strictly at the database and API gateway level.' },
  { icon: ShieldCheck, tone: 'bg-indigo-50 text-indigo-600', title: 'JWT Authentication', text: 'Stateless token validation with automatic refresh token rotation and client storage abstractions.' },
  { icon: Users, tone: 'bg-emerald-50 text-emerald-600', title: 'Granular RBAC', text: 'Fine-grained permissions for Administrator, Pricing Manager, and Analyst seats with immutable audit logging.' },
  { icon: Zap, tone: 'bg-purple-50 text-purple-600', title: 'Sub-50ms Gateway', text: 'High-throughput pricing calculation microservices engineered for real-time checkout and catalog repricing.' },
];

// NOTE: These are placeholder testimonials. Replace with real, permissioned customer quotes before launch.
const TESTIMONIALS = [
  { quote: 'PricePilot AI automated our repricing across 8,000 electronics SKUs. We lifted gross profit by 21% in our first quarter without hurting order volumes.', name: 'Marcus Vance', role: 'VP of Revenue & Pricing, OmniRetail Global' },
  { quote: 'The Gemini conversational copilot has completely changed our pricing team’s workflow. We ask tactical elasticity questions and get answers grounded in our actual catalog.', name: 'Elena Rostova', role: 'Chief Commercial Officer, Apex Direct Commerce' },
  { quote: 'The margin guardrails are bulletproof. We never have to worry about an algorithmic race-to-the-bottom with competitors. It protects our brand and bottom line.', name: 'David Chen', role: 'Director of Merchandising, Veloce Brands' },
];

const INTEGRATIONS = ['Shopify', 'Magento', 'BigCommerce', 'SAP', 'NetSuite', 'REST API', 'OpenAPI 3.0', 'Google Gemini'];

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'Workflow' },
  { href: '#simulator', label: 'Live Simulator' },
  { href: '#modules', label: 'Platform Modules' },
  { href: '#faq', label: 'FAQ' },
];

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */
export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const ctaTarget = isAuthenticated ? '/dashboard' : '/login';

  // Interactive Simulator State
  const [basePrice, setBasePrice] = useState(4999);
  const [competitorPrice, setCompetitorPrice] = useState(5499);
  const [inventoryLevel, setInventoryLevel] = useState('optimal');
  const [elasticity, setElasticity] = useState('medium');

  const [activeModuleTab, setActiveModuleTab] = useState('pricing');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // UI state
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [markerReady, setMarkerReady] = useState(false);

  // Scroll progress + back-to-top
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setScrollPct(max > 0 ? (window.scrollY / max) * 100 : 0);
      setShowTop(window.scrollY > 700);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Hero spread-bar marker slides in after mount
  useEffect(() => {
    const t = setTimeout(() => setMarkerReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Click ripple for every .pp-btn (event delegation)
  useEffect(() => {
    const onClick = (e) => {
      const btn = e.target.closest?.('.pp-btn');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'pp-ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Live Simulator Calculation
  const simulationResult = useMemo(() => {
    const cost = basePrice * 0.48;
    let priceMultiplier = 1.0;

    const gap = competitorPrice - basePrice;
    if (gap > 0) {
      priceMultiplier += Math.min(0.12, (gap / basePrice) * 0.5);
    } else {
      priceMultiplier += Math.max(-0.08, (gap / basePrice) * 0.35);
    }

    if (inventoryLevel === 'low') priceMultiplier += 0.04;
    if (inventoryLevel === 'excess') priceMultiplier -= 0.05;

    const elasticityFactor = elasticity === 'inelastic' ? 0.7 : elasticity === 'high' ? 1.4 : 1.0;

    const recommendedPrice = Math.round(basePrice * priceMultiplier * 100) / 100;
    const priceChangePct = ((recommendedPrice - basePrice) / basePrice) * 100;
    const demandChangePct = Math.round(-priceChangePct * elasticityFactor * 0.7 * 10) / 10;

    const baseDemand = 1000;
    const newDemand = Math.round(baseDemand * (1 + demandChangePct / 100));
    const baseRevenue = baseDemand * basePrice;
    const projectedRevenue = newDemand * recommendedPrice;
    const revenueImpactPct = Math.round(((projectedRevenue - baseRevenue) / baseRevenue) * 1000) / 10;
    const marginPct = Math.round(((recommendedPrice - cost) / recommendedPrice) * 1000) / 10;

    return {
      recommendedPrice,
      priceChangePct: Math.round(priceChangePct * 10) / 10,
      demandChangePct,
      revenueImpactPct,
      marginPct,
      annualUplift: Math.round((projectedRevenue - baseRevenue) * 12),
    };
  }, [basePrice, competitorPrice, inventoryLevel, elasticity]);

  const modules = [
    {
      id: 'pricing',
      title: 'Dynamic Pricing Engine',
      icon: TrendingUp,
      badge: 'Core ML Engine',
      headline: 'Microeconomic pricing models tuned to actual market response',
      description:
        'Continuously models price elasticity of demand across your entire catalog. Recommends surgical price adjustments that maximize gross merchandise value while strictly enforcing margin floors.',
      metrics: [
        { label: 'Avg Margin Uplift', value: '+18.6%' },
        { label: 'Demand Accuracy', value: '96.2%' },
        { label: 'Decision Latency', value: '<45ms' },
      ],
      features: [
        'Automated price elasticity computation per SKU',
        'Cost-plus and min/max margin hard guardrails',
        'Bulk and single-click recommendation approvals',
        'Full historical audit trail of every price change',
      ],
    },
    {
      id: 'competitors',
      title: 'Competitor Intelligence',
      icon: Target,
      badge: 'Real-time Feeds',
      headline: 'Autonomous tracking of competitor price movements & catalog matches',
      description:
        'Map your SKUs against competitor offerings across marketplaces and direct stores. Receive automated alerts whenever competitors undercut prices or run promotional campaigns.',
      metrics: [
        { label: 'Monitored Benchmarks', value: '14,200+' },
        { label: 'Refresh Interval', value: 'Hourly' },
        { label: 'Match Confidence', value: '98.8%' },
      ],
      features: [
        'Automated product URL matching and normalization',
        'Historical competitor price distribution graphs',
        'Premium and discount market index positioning',
        'Out-of-stock competitor opportunity detection',
      ],
    },
    {
      id: 'revenue',
      title: 'Revenue Simulation',
      icon: BarChart3,
      badge: 'Predictive Analytics',
      headline: 'Stress-test pricing scenarios before pushing to your production store',
      description:
        'Model how promotional discounts, inflationary cost surges, or competitor price wars will impact your top-line revenue and bottom-line gross profits before making real-world changes.',
      metrics: [
        { label: 'Forecast Horizon', value: '90 Days' },
        { label: 'Scenario Models', value: 'Unlimited' },
        { label: 'Variance Bound', value: '±1.8%' },
      ],
      features: [
        'Multi-scenario side-by-side revenue comparisons',
        'Inventory velocity and stockout probability scoring',
        'Category-level profitability waterfall charts',
        'Executive board-ready PDF and CSV exports',
      ],
    },
    {
      id: 'ai',
      title: 'Gemini AI Pricing Copilot',
      icon: Bot,
      badge: 'Gemini 3.6 Flash',
      headline: 'Instant conversational intelligence on any SKU, category, or strategy',
      description:
        'Ask PricePilot AI natural language questions about your pricing performance. Powered by the high-speed Gemini model, it analyzes live catalog and competitor context to deliver actionable recommendations.',
      metrics: [
        { label: 'Model', value: 'Gemini 3.6' },
        { label: 'Context Window', value: '1M Tokens' },
        { label: 'Response Time', value: '~1.1s' },
      ],
      features: [
        'Natural language elasticity and margin diagnosis',
        'Direct strategy suggestions grounded in live catalog data',
        'Automated competitive gap summaries',
        'Zero prompt engineering required',
      ],
    },
    {
      id: 'workspace',
      title: 'Enterprise Multi-Tenancy',
      icon: Users,
      badge: 'Enterprise Security',
      headline: 'Secure data isolation for multi-brand and global commerce teams',
      description:
        'Manage multiple regional workspaces or brands from a single interface. Assign granular roles (Administrator, Pricing Manager, Revenue Analyst) with strict JWT-enforced API security.',
      metrics: [
        { label: 'Isolation', value: 'Tenant-Level' },
        { label: 'Auth Standard', value: 'JWT + RBAC' },
        { label: 'Audit Logging', value: 'Immutable' },
      ],
      features: [
        'Multi-tenant organization data segregation',
        'Granular role-based permissions and team invitations',
        'Standardized RESTful and OpenAPI 3.0 contracts',
        'Single Sign-On and enterprise credentials ready',
      ],
    },
  ];

  const faqs = [
    {
      question: 'How does PricePilot AI determine the optimal recommended price?',
      answer:
        'PricePilot AI combines three core quantitative inputs: (1) empirical price elasticity of demand calculated from historical sales and order velocity, (2) real-time competitor benchmark prices and market positioning spreads, and (3) your hard business constraints, including cost of goods sold (COGS), minimum margin floors, and inventory holding costs. Our optimization algorithm balances volume and margin to identify the revenue-maximizing price point.',
    },
    {
      question: 'Can PricePilot AI integrate with existing ERP, PIM, or commerce systems?',
      answer:
        'Yes. PricePilot AI exposes a comprehensive, standardized OpenAPI 3.0 REST API with 38 validated endpoints covering products, categories, inventory, competitor observations, recommendations, and sales analytics. You can seamlessly connect Shopify, Magento, BigCommerce, SAP, NetSuite, or custom internal systems.',
    },
    {
      question: 'Does the system enforce minimum profit margin guardrails?',
      answer:
        'Absolutely. Every product in PricePilot AI supports min_price, max_price, and cost_price thresholds. The pricing engine is mathematically constrained to never recommend or apply a price below your specified margin floor, ensuring you never sell at an unintended loss regardless of aggressive competitor discounting.',
    },
    {
      question: 'How does the Gemini AI copilot assist pricing analysts?',
      answer:
        'The conversational AI assistant is powered directly by Google Gemini. It has secure, server-side access to your live catalog state, recent competitor price adjustments, and sales trends. Pricing analysts can ask questions like "Which electronics SKUs have high margin leakage?" or "How should we respond to competitor X lowering price on SKU-402?" to receive synthesized strategic counsel in seconds.',
    },
    {
      question: 'Can I test the platform with sample credentials before going live?',
      answer:
        'Yes! The platform comes pre-configured with active demonstration organizations, products, and realistic competitor benchmarks. You can sign in using test credentials (or register a new organization) to immediately explore the live dashboard, trigger predictions, test recommendations, and interact with the AI assistant.',
    },
    {
      question: 'Where can I inspect the backend API specification and documentation?',
      answer:
        'You can view the full OpenAPI 3.0 JSON specification directly at /openapi.json and explore the interactive Swagger documentation at /docs to review all 38 enterprise endpoints, request payloads, and response schemas.',
    },
  ];

  const currentModule = modules.find((m) => m.id === activeModuleTab) || modules[0];
  const CurrentIcon = currentModule.icon;

  return (
    <div className="pp-root min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased selection:bg-blue-100 selection:text-blue-900">
      <style>{ANIMATION_CSS}</style>

      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[3px] z-[60] pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-[width] duration-100"
          style={{ width: `${scrollPct}%` }}
        />
      </div>

      {/* 1. STICKY NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 group-hover:rotate-6 group-hover:scale-105 transition-all duration-300">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                  PricePilot<span className="text-blue-600 font-bold ml-0.5">AI</span>
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200/60">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden md:block">
                Dynamic Pricing & Revenue Intelligence
              </p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="pp-link hover:text-blue-600 transition-colors">
                {l.label}
              </a>
            ))}
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="pp-btn flex items-center gap-1 text-slate-500 text-xs font-semibold px-2.5 py-1.5 bg-slate-100 rounded-md hover:bg-slate-200 hover:text-slate-800"
            >
              <FileCode className="w-3.5 h-3.5" />
              API Docs
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="pp-btn pp-shine pp-glow inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="pp-arrow w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-block pp-link px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="pp-btn pp-shine pp-glow inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                >
                  <span>Launch App</span>
                  <ArrowRight className="pp-arrow w-4 h-4" />
                </Link>
              </>
            )}
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="pp-btn lg:hidden p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="pp-slide-down lg:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              API Docs
            </a>
          </nav>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 border-b border-slate-200/60">
        {/* Ambient blobs */}
        <div aria-hidden className="pp-grid-bg absolute inset-0" />
        <div aria-hidden className="pp-blob absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-300/35 blur-3xl" />
        <div aria-hidden className="pp-blob pp-blob-2 absolute top-10 left-1/2 w-80 h-80 rounded-full bg-purple-300/25 blur-3xl" />
        <div aria-hidden className="pp-blob pp-blob-2 absolute top-40 -right-24 w-[28rem] h-[28rem] rounded-full bg-indigo-300/25 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="pp-fade-in inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Next-Generation Pricing Architecture</span>
            </div>

            <h1
              className="pp-fade-in text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6"
              style={{ animationDelay: '100ms' }}
            >
              Autonomous Dynamic Pricing &{' '}
              <span className="pp-gradient-move bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Revenue Intelligence
              </span>
            </h1>

            <p
              className="pp-fade-in text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8 font-normal"
              style={{ animationDelay: '220ms' }}
            >
              PricePilot AI optimizes pricing in real time using competitor intelligence, inventory velocity, and predictive demand elasticity to maximize revenue and protect margins.
            </p>

            <div
              className="pp-fade-in flex flex-col sm:flex-row items-center justify-center gap-4"
              style={{ animationDelay: '340ms' }}
            >
              <Link
                to={ctaTarget}
                className="pp-btn pp-shine pp-pulse w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700"
              >
                <span>Launch PricePilot AI</span>
                <ArrowRight className="pp-arrow w-5 h-5" />
              </Link>
              <a
                href="#simulator"
                className="pp-btn pp-ghost w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-700 font-semibold text-base border border-slate-300 hover:text-blue-700 shadow-xs"
              >
                <Sliders className="pp-icon-spin w-4 h-4 text-blue-600" />
                <span>Test Interactive Simulator</span>
              </a>
            </div>

            <div
              className="pp-fade-in mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 font-medium"
              style={{ animationDelay: '460ms' }}
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Enterprise RBAC & Multi-Tenant
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-600" />
                &lt;50ms Prediction Engine
              </span>
              <span className="flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-indigo-600" />
                Gemini 3.6 Copilot
              </span>
            </div>
          </div>

          {/* Dashboard Mockup Card */}
          <Reveal className="max-w-4xl mx-auto" delay={150}>
            <div
              onMouseMove={tiltMove}
              onMouseLeave={tiltLeave}
              className="pp-tilt rounded-2xl bg-white/90 backdrop-blur border border-white ring-1 ring-slate-200/70 shadow-[0_30px_80px_-20px_rgba(37,99,235,0.35)] p-6 sm:p-8"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                    <span>Live Predictive Pricing Workbench</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    UltraTech Active Noise-Cancelling Pro (SKU-8921)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Category: Premium Audio • Cost: ₹2,499 • Current Price: ₹4,999
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-lg border border-emerald-200 text-xs font-bold">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Optimal Uplift Available</span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 hover:-translate-y-1 transition-transform">
                  <span className="text-xs font-medium text-slate-500 block mb-1">Current Price</span>
                  <span className="text-2xl font-extrabold text-slate-800">₹4,999</span>
                  <span className="text-[11px] text-slate-500 block mt-1">Catalog Base</span>
                </div>
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 hover:-translate-y-1 transition-transform">
                  <span className="text-xs font-semibold text-blue-700 block mb-1">AI Recommended</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-blue-900">₹5,499</span>
                    <span className="text-xs font-bold text-emerald-600">+10.0%</span>
                  </div>
                  <span className="text-[11px] text-blue-600 block mt-1">Elasticity Model</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 hover:-translate-y-1 transition-transform">
                  <span className="text-xs font-medium text-slate-500 block mb-1">Demand Impact</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-slate-900">+14.2%</span>
                    <span className="text-xs font-semibold text-emerald-600">Vol</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">Velocity Adjusted</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 hover:-translate-y-1 transition-transform">
                  <span className="text-xs font-semibold text-emerald-800 block mb-1">Net Margin Gain</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-emerald-900">+3.8%</span>
                    <span className="text-xs font-bold text-emerald-700">Pts</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 block mt-1">Margin: 54.5%</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs">
                <div className="flex items-center justify-between text-slate-600 mb-2 font-medium">
                  <span>Competitor Market Spread</span>
                  <span>Our Target: <strong className="text-blue-700">₹5,499</strong> (Mid-Premium Tier)</span>
                </div>
                <div className="relative h-3 rounded-full bg-slate-200 overflow-hidden">
                  <div className="absolute left-[20%] right-[30%] top-0 bottom-0 bg-blue-200 rounded-full" />
                  <div
                    className="pp-marker absolute w-3 h-3 bg-blue-600 rounded-full ring-2 ring-white -translate-x-1.5"
                    style={{ left: markerReady ? '54%' : '0%' }}
                    title="PricePilot Recommendation: ₹5,499"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                  <span>Low: Amazon (₹5,199)</span>
                  <span>Avg Market: ₹5,599</span>
                  <span>High: Reliance Digital (₹5,999)</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. METRICS BANNER */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-8">
            Empowering Modern Pricing Teams, Revenue Leaders & Omnichannel Retailers
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { node: <CountUp to={99.4} decimals={1} suffix="%" />, color: 'text-slate-900', label: 'Model Prediction Accuracy', sub: 'Validated against real POS data' },
              { node: <CountUp to={18.6} decimals={1} prefix="+" suffix="%" />, color: 'text-emerald-600', label: 'Average Margin Uplift', sub: 'First 90 days of deployment' },
              { node: <CountUp to={1.2} decimals={1} suffix="M+" />, color: 'text-blue-600', label: 'Automated Price Adjustments', sub: 'Executed across 45,000+ SKUs' },
              { node: <CountUp to={50} prefix="<" suffix="ms" />, color: 'text-indigo-600', label: 'Prediction Latency', sub: 'Real-time microservice gateway' },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 90}>
                <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${s.color}`}>{s.node}</div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">{s.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{s.sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations marquee */}
      <section className="py-10 bg-white border-b border-slate-200 overflow-hidden">
        <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">
          Plugs into the tools your team already uses
        </p>
        <div
          className="relative"
          style={{
            WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
            maskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
          }}
        >
          <div className="pp-marquee">
            {[...INTEGRATIONS, ...INTEGRATIONS].map((name, i) => (
              <span
                key={i}
                className="mx-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-600 whitespace-nowrap hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURES */}
      <section id="features" className="pp-dots py-20 sm:py-28 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-3xl mx-auto mb-16">
            <span className="pp-eyebrow">Architected for Precision</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Enterprise Capabilities Built for Maximum Revenue
            </h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              Eliminate manual spreadsheet pricing. PricePilot AI integrates real-time competitive intelligence, demand forecasting, and conversational AI into a unified operational platform.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={(i % 3) * 100}>
                  <div className="pp-card h-full rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs">
                    <div className={`pp-card-icon w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.tone}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{f.text}</p>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {f.points.map((p) => (
                        <li key={p} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. WORKFLOW */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-3xl mx-auto mb-16">
            <span className="pp-eyebrow">Operational Flow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How PricePilot AI Drives Margin Acceleration
            </h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              A continuous four-stage feedback loop that synchronizes your cost structures with dynamic market reality.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 120}>
                <div className="pp-card h-full relative p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className={`pp-card-icon w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center mb-4 text-base shadow-xs ${s.color}`}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. SIMULATOR */}
      <section id="simulator" className="relative overflow-hidden py-20 sm:py-28 bg-gradient-to-b from-[#F8FAFC] via-blue-50/70 to-[#F8FAFC]">
        <div aria-hidden className="pp-blob absolute top-20 -left-20 w-80 h-80 rounded-full bg-blue-300/25 blur-3xl" />
        <div aria-hidden className="pp-blob pp-blob-2 absolute bottom-10 -right-20 w-96 h-96 rounded-full bg-indigo-300/25 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-3xl mx-auto mb-14">
            <span className="pp-eyebrow">Hands-On Simulation</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Test the AI Pricing Engine Live</h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              Adjust price benchmarks, competitor dynamics, and inventory velocity below to see how our predictive model calculates revenue impact in real time.
            </p>
          </Reveal>

          <Reveal className="max-w-5xl mx-auto">
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl p-6 sm:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="base-price-slider" className="text-sm font-bold text-slate-800">Your Base Product Price</label>
                      <span key={basePrice} className="pp-pop text-base font-extrabold text-blue-600">₹{basePrice.toLocaleString('en-IN')}</span>
                    </div>
                    <input
                      id="base-price-slider"
                      type="range"
                      min="500"
                      max="15000"
                      step="100"
                      value={basePrice}
                      onChange={(e) => setBasePrice(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>₹500</span><span>₹7,500</span><span>₹15,000</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="competitor-price-slider" className="text-sm font-bold text-slate-800">Competitor Market Benchmark Price</label>
                      <span key={competitorPrice} className="pp-pop text-base font-extrabold text-slate-800">₹{competitorPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <input
                      id="competitor-price-slider"
                      type="range"
                      min="500"
                      max="15000"
                      step="100"
                      value={competitorPrice}
                      onChange={(e) => setCompetitorPrice(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>₹500 (Deep Discount)</span><span>₹7,500 (Market Parity)</span><span>₹15,000 (Premium)</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-800 block mb-2">Current Inventory Velocity State</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'low', label: 'Low Stock (High Scarcity)' },
                        { id: 'optimal', label: 'Optimal Buffer' },
                        { id: 'excess', label: 'Excess / Overstock' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setInventoryLevel(item.id)}
                          className={`pp-btn px-3 py-2 text-xs font-semibold rounded-lg border text-center ${
                            inventoryLevel === item.id
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-800 block mb-2">Category Price Elasticity</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'inelastic', label: 'Low Elasticity (B2B / Niche)' },
                        { id: 'medium', label: 'Balanced (Standard)' },
                        { id: 'high', label: 'High (Commodity / FMCG)' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setElasticity(item.id)}
                          className={`pp-btn px-3 py-2 text-xs font-semibold rounded-lg border text-center ${
                            elasticity === item.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white p-6 sm:p-7 shadow-2xl shadow-blue-900/30 ring-1 ring-white/10">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-700/80 mb-5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-300">AI Elasticity Output</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                      Optimal
                    </span>
                  </div>

                  <div className="mb-6">
                    <span className="text-xs text-slate-400 block mb-1">Recommended Execution Price</span>
                    <div className="flex items-baseline gap-3">
                      <span key={simulationResult.recommendedPrice} className="pp-pop text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                        ₹{Math.round(simulationResult.recommendedPrice).toLocaleString('en-IN')}
                      </span>
                      <span className={`text-sm font-bold ${simulationResult.priceChangePct >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {simulationResult.priceChangePct >= 0 ? '+' : ''}
                        {simulationResult.priceChangePct}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3.5 mb-6 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-300 text-xs">Demand Response</span>
                      <span key={simulationResult.demandChangePct} className={`pp-pop font-bold ${simulationResult.demandChangePct >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {simulationResult.demandChangePct >= 0 ? '+' : ''}
                        {simulationResult.demandChangePct}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-300 text-xs">Projected Revenue Impact</span>
                      <span key={simulationResult.revenueImpactPct} className={`pp-pop font-bold ${simulationResult.revenueImpactPct >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {simulationResult.revenueImpactPct >= 0 ? '+' : ''}
                        {simulationResult.revenueImpactPct}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-300 text-xs">Estimated Gross Margin</span>
                      <span key={simulationResult.marginPct} className="pp-pop font-bold text-emerald-400">{simulationResult.marginPct}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-300 text-xs">Projected Annual Uplift</span>
                      <span key={simulationResult.annualUplift} className="pp-pop font-extrabold text-white text-base">
                        +₹{simulationResult.annualUplift.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={ctaTarget}
                    className="pp-btn pp-shine w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-sm hover:shadow-blue-500/40 hover:shadow-lg"
                  >
                    <span>Apply This Model in Workspace</span>
                    <ArrowRight className="pp-arrow w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7. MODULES */}
      <section id="modules" className="py-20 sm:py-28 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-3xl mx-auto mb-14">
            <span className="pp-eyebrow">Full Platform Suite</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Deeply Integrated Enterprise Modules</h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              Explore the individual engines that power PricePilot AI’s revenue optimization platform.
            </p>
          </Reveal>

          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
            {modules.map((m) => {
              const Icon = m.icon;
              const isActive = activeModuleTab === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveModuleTab(m.id)}
                  className={`pp-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <Icon className="pp-icon-spin w-4 h-4" />
                  <span>{m.title}</span>
                </button>
              );
            })}
          </div>

          {/* key forces the fade-in animation to replay on tab change */}
          <div key={currentModule.id} className="pp-fade-in max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-white to-blue-50/70 border border-slate-200/90 p-8 sm:p-12 shadow-xl shadow-blue-900/5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-bold mb-4">
                  <CurrentIcon className="w-3.5 h-3.5" />
                  <span>{currentModule.badge}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">{currentModule.headline}</h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 font-normal">{currentModule.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {currentModule.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to={ctaTarget}
                  className="pp-btn pp-shine pp-glow inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700"
                >
                  <span>Explore {currentModule.title}</span>
                  <ArrowRight className="pp-arrow w-4 h-4" />
                </Link>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Key Performance Metrics</h4>
                  <div className="space-y-4">
                    {currentModule.metrics.map((met) => (
                      <div key={met.label} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                        <span className="text-xs text-slate-600 font-medium">{met.label}</span>
                        <span className="text-lg font-bold text-slate-900">{met.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900">
                  <p className="font-semibold mb-1">Architecture Note:</p>
                  <p className="text-blue-800 leading-relaxed">
                    Backed by verified OpenAPI endpoints with multi-tenant data isolation and strict JWT role authentication.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. SECURITY */}
      <section className="py-20 sm:py-28 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-3xl mx-auto mb-16">
            <span className="pp-eyebrow">Enterprise Trust</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">High-Availability & Enterprise-Grade Security</h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              Designed from day one to adhere to rigorous SOC2, RBAC, and data privacy expectations for enterprise commerce.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SECURITY.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.title} delay={i * 100}>
                  <div className="pp-card h-full p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <div className={`pp-card-icon w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${s.tone}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{s.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. TESTIMONIALS (placeholder content — swap for real customer quotes) */}
      <section className="py-20 sm:py-28 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-3xl mx-auto mb-16">
            <span className="pp-eyebrow">Customer Outcomes</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Validated by Commercial Leaders</h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              Read how high-growth retail brands and global distributors scaled margin with PricePilot AI.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 120}>
                <div className="pp-card h-full p-7 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1 text-amber-500">{'★'.repeat(5)}</div>
                      <Quote className="w-8 h-8 text-blue-200" />
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed mb-6">“{t.quote}”</p>
                  </div>
                  <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white text-sm font-bold flex items-center justify-center shadow-md shadow-indigo-500/30">
                      {t.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FAQ */}
      <section id="faq" className="py-20 sm:py-28 bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <span className="pp-eyebrow">Got Questions?</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              Everything you need to know about integrating and operating PricePilot AI.
            </p>
          </Reveal>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <Reveal key={faq.question} delay={idx * 60}>
                  <div
                    className={`rounded-2xl bg-white border overflow-hidden shadow-xs transition-all duration-300 ${
                      isOpen ? 'border-blue-300 shadow-md' : 'border-slate-200 hover:border-blue-200'
                    }`}
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                      className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <span className="text-base font-bold text-slate-900">{faq.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                          isOpen ? 'rotate-180 text-blue-600' : 'text-slate-500'
                        }`}
                      />
                    </button>
                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-5 pb-6 sm:px-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. FINAL CTA */}
      <section className="pp-gradient-move relative overflow-hidden py-20 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white text-center">
        <div aria-hidden className="pp-grid-light absolute inset-0" />
        <div aria-hidden className="pp-blob absolute -top-20 left-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="pp-blob pp-blob-2 absolute -bottom-24 right-10 w-80 h-80 rounded-full bg-indigo-300/20 blur-3xl" />
        <Reveal>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6">
              Ready to Accelerate Your Revenue Intelligence?
            </h2>
            <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
              Start optimizing pricing with PricePilot AI today. Instant access to real-time elasticity models, competitor tracking, and the Gemini pricing copilot.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={ctaTarget}
                className="pp-btn pp-shine w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-blue-700 font-bold text-base hover:bg-blue-50 shadow-lg shadow-blue-900/20 hover:shadow-xl"
              >
                <span>Get Started Now</span>
                <ArrowRight className="pp-arrow w-5 h-5" />
              </Link>
              <a
                href="/docs"
                target="_blank"
                rel="noreferrer"
                className="pp-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-800/60 hover:bg-blue-800 text-white font-semibold text-base border border-blue-400/40"
              >
                <FileCode className="pp-icon-spin w-4 h-4" />
                <span>Inspect OpenAPI Spec</span>
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 12. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-base text-white tracking-tight">
                  PricePilot<span className="text-blue-500">AI</span>
                </span>
              </div>
              <p className="text-slate-400 max-w-sm text-xs leading-relaxed mb-4">
                Autonomous Dynamic Pricing & Revenue Intelligence Platform for enterprise commerce. Maximize margins and accelerate merchandise value with predictive demand elasticity.
              </p>
              <p className="text-slate-500 text-[11px]">Pre-configured with enterprise FastAPI and Gemini 3.6 Flash integrations.</p>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Platform</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="pp-link hover:text-white transition-colors">Pricing Engine</a></li>
                <li><a href="#simulator" className="pp-link hover:text-white transition-colors">Elasticity Simulator</a></li>
                <li><a href="#modules" className="pp-link hover:text-white transition-colors">Competitor Matrix</a></li>
                <li><a href="#modules" className="pp-link hover:text-white transition-colors">Demand Forecast</a></li>
                <li><a href="#modules" className="pp-link hover:text-white transition-colors">Gemini Copilot</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Developers</h4>
              <ul className="space-y-2">
                <li><a href="/openapi.json" target="_blank" rel="noreferrer" className="pp-link hover:text-white transition-colors">OpenAPI 3.0 Spec</a></li>
                <li><a href="/docs" target="_blank" rel="noreferrer" className="pp-link hover:text-white transition-colors">Swagger API Docs</a></li>
                <li><a href="/health" target="_blank" rel="noreferrer" className="pp-link hover:text-white transition-colors">System Health Check</a></li>
                <li><Link to="/login" className="pp-link hover:text-white transition-colors">Workspace Access</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Security</h4>
              <ul className="space-y-2">
                <li><span className="text-slate-500">Multi-Tenant Isolation</span></li>
                <li><span className="text-slate-500">Stateless JWT RBAC</span></li>
                <li><span className="text-slate-500">Margin Guardrail Lock</span></li>
                <li><span className="text-slate-500">SOC2 Type II Aligned</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <div className="flex flex-wrap items-center gap-x-1">
              <span>© 2026 PricePilot AI. All rights reserved. Enterprise Dynamic Pricing Platform. Crafted with ❤️ by</span>
              <a
                href="https://www.linkedin.com/in/aditya-raj-pandey-7663192b7/?isSelfProfile=true"
                target="_blank"
                rel="noreferrer"
                className="pp-link hover:text-white transition-colors"
              >
                Aditya Raj Pandey
              </a>
              <span>.</span>
              <a
                href="https://github.com/Aditya-2215"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="ml-2 inline-block transition-transform duration-300 hover:-translate-y-1 hover:rotate-6"
              >
                <img
                  src="https://www.svgrepo.com/show/394174/github.svg"
                  alt="GitHub"
                  className="inline-block h-5 w-5 invert transition-opacity hover:opacity-70"
                />
              </a>
              <a
                href="https://aditya-raj-pandey-portfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Portfolio"
                className="ml-2 inline-block transition-transform duration-300 hover:-translate-y-1 hover:-rotate-6"
              >
                <img
                  src="https://www.svgrepo.com/show/447463/portfolio.svg"
                  alt="Portfolio"
                  className="inline-block h-5 w-5 invert transition-opacity hover:opacity-70"
                />
              </a>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/login" className="pp-link hover:text-white transition-colors">Sign In</Link>
              <a href="/docs" target="_blank" rel="noreferrer" className="pp-link hover:text-white transition-colors">API Contract</a>
              <span className="text-slate-600">v1.0.0-enterprise</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to top */}
      <button
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`pp-btn pp-shine fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all duration-300 ${
          showTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}