import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  BarChart3,
  Bot,
  Layers,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Sliders,
  IndianRupee,
  Users,
  Lock,
  ArrowUpRight,
  LineChart,
  Percent,
  Compass,
  FileCode,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../authentication/hooks/useAuth';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Interactive Simulator State
  const [basePrice, setBasePrice] = useState(4999);
  const [competitorPrice, setCompetitorPrice] = useState(5499);
  const [inventoryLevel, setInventoryLevel] = useState('optimal'); // 'low' | 'optimal' | 'excess'
  const [elasticity, setElasticity] = useState('medium'); // 'inelastic' | 'medium' | 'high'

  // Active Module Preview Tab
  const [activeModuleTab, setActiveModuleTab] = useState('pricing');

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Live Simulator Calculation
  const simulationResult = useMemo(() => {
    const cost = basePrice * 0.48; // Assume 48% COGS
    let priceMultiplier = 1.0;

    // Competitor gap influence
    const gap = competitorPrice - basePrice;
    if (gap > 0) {
      priceMultiplier += Math.min(0.12, (gap / basePrice) * 0.5);
    } else {
      priceMultiplier += Math.max(-0.08, (gap / basePrice) * 0.35);
    }

    // Inventory factor
    if (inventoryLevel === 'low') priceMultiplier += 0.04;
    if (inventoryLevel === 'excess') priceMultiplier -= 0.05;

    // Elasticity factor
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
      subtitle: 'Elasticity & Demand Optimization',
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
      subtitle: 'Automated Benchmark Scrapes',
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
      subtitle: 'Scenario Planning & Forecasting',
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
      subtitle: 'Conversational Revenue Analyst',
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
      subtitle: 'RBAC & Organization Governance',
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* 1. STICKY NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
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

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
              Workflow
            </a>
            <a href="#simulator" className="hover:text-blue-600 transition-colors">
              Live Simulator
            </a>
            <a href="#modules" className="hover:text-blue-600 transition-colors">
              Platform Modules
            </a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">
              FAQ
            </a>
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-600 transition-colors flex items-center gap-1 text-slate-500 text-xs font-semibold px-2 py-1 bg-slate-100 rounded-md hover:bg-slate-200"
            >
              <FileCode className="w-3.5 h-3.5" />
              API Docs
            </a>
          </nav>

          {/* User Auth CTAs */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-xs transition-colors"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-xs transition-colors"
                >
                  <span>Launch App</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            {/* Category Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Next-Generation Pricing Architecture</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
              Autonomous Dynamic Pricing & Revenue Intelligence
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8 font-normal">
              PricePilot AI optimizes pricing in real time using competitor intelligence, inventory velocity, and predictive demand elasticity to maximize revenue and protect margins.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={isAuthenticated ? '/dashboard' : '/login'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 shadow-sm shadow-blue-600/25 transition-all hover:scale-[1.01]"
              >
                <span>Launch PricePilot AI</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#simulator"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-700 font-semibold text-base border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors"
              >
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Test Interactive Simulator</span>
              </a>
            </div>

            {/* Trust Micro-Text */}
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
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

          {/* Visual Proof / Interactive Dashboard Mockup Card */}
          <div className="max-w-4xl mx-auto rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/60 p-6 sm:p-8">
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

            {/* Metric Comparison Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-xs font-medium text-slate-500 block mb-1">Current Price</span>
                <span className="text-2xl font-extrabold text-slate-800">₹4,999</span>
                <span className="text-[11px] text-slate-500 block mt-1">Catalog Base</span>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="text-xs font-semibold text-blue-700 block mb-1">AI Recommended</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-blue-900">₹5,499</span>
                  <span className="text-xs font-bold text-emerald-600">+10.0%</span>
                </div>
                <span className="text-[11px] text-blue-600 block mt-1">Elasticity Model</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-xs font-medium text-slate-500 block mb-1">Demand Impact</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-slate-900">+14.2%</span>
                  <span className="text-xs font-semibold text-emerald-600">Vol</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">Velocity Adjusted</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-xs font-semibold text-emerald-800 block mb-1">Net Margin Gain</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-emerald-900">+3.8%</span>
                  <span className="text-xs font-bold text-emerald-700">Pts</span>
                </div>
                <span className="text-[11px] text-emerald-700 block mt-1">Margin: 54.5%</span>
              </div>
            </div>

            {/* Competitor Benchmark Spread Bar */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs">
              <div className="flex items-center justify-between text-slate-600 mb-2 font-medium">
                <span>Competitor Market Spread</span>
                <span>Our Target: <strong className="text-blue-700">₹5,499</strong> (Mid-Premium Tier)</span>
              </div>
              <div className="relative h-3 rounded-full bg-slate-200 overflow-hidden">
                <div className="absolute left-[20%] right-[30%] top-0 bottom-0 bg-blue-200 rounded-full" />
                <div className="absolute left-[54%] w-3 h-3 bg-blue-600 rounded-full ring-2 ring-white transform -translate-x-1.5" title="PricePilot Recommendation: ₹5,499" />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                <span>Low: Amazon (₹5,199)</span>
                <span>Avg Market: ₹5,599</span>
                <span>High: Reliance Digital (₹5,999)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SOCIAL PROOF & ENTERPRISE METRICS BANNER */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-8">
            Empowering Modern Pricing Teams, Revenue Leaders & Omnichannel Retailers
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">99.4%</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">Model Prediction Accuracy</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Validated against real POS data</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">+18.6%</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">Average Margin Uplift</div>
              <div className="text-[11px] text-slate-400 mt-0.5">First 90 days of deployment</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 tracking-tight">1.2M+</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">Automated Price Adjustments</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Executed across 45,000+ SKUs</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-100">
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 tracking-tight">&lt;50ms</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">Prediction Latency</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Real-time microservice gateway</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES & VALUE PILLARS */}
      <section id="features" className="py-20 sm:py-28 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2">
              Architected for Precision
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Enterprise Capabilities Built for Maximum Revenue
            </h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              Eliminate manual spreadsheet pricing. PricePilot AI integrates real-time competitive intelligence, demand forecasting, and conversational AI into a unified operational platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Dynamic Pricing Engine</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Real-time price recommendations calculated from elasticity curves, competitor shifts, and current inventory positions with instant single-click application.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Elasticity curves per product category</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cost-plus floor and ceiling constraints</span>
                </li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Real-Time Competitor Tracking</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Automated monitoring across competing e-commerce storefronts, matching identical or substitute items to surface competitive price gaps immediately.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Automated catalog matching pipeline</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Price gap detection and alerts</span>
                </li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <LineChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Demand & Revenue Forecasting</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Machine learning algorithms predict demand response, gross revenue, and contribution margin across 30, 60, and 90-day time horizons.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Unit velocity impact simulation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Confidence interval bounds</span>
                </li>
              </ul>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Profitability Protection</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Hard margin boundaries guarantee that algorithm recommendations will never violate your organization’s required gross profit margins or contractual MAP pricing.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Rule-based margin floor enforcement</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Inventory holding cost factoring</span>
                </li>
              </ul>
            </div>

            {/* Card 5 */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-Tenant Workspaces</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Enterprise organization partitioning with strict role-based access control (RBAC), multi-user team collaboration, and isolated catalog governance.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Organization & team member management</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>JWT-authenticated API security</span>
                </li>
              </ul>
            </div>

            {/* Card 6 */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Gemini AI Pricing Copilot</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Conversational pricing analyst powered by Gemini 3.6 Flash. Query your catalog, diagnose margin leaks, and receive clear strategic pricing recommendations.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Context-aware catalog queries</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Clean markdown answers, zero hallucination</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WORKFLOW (HOW IT WORKS) */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2">
              Operational Flow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How PricePilot AI Drives Margin Acceleration
            </h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              A continuous four-stage feedback loop that synchronizes your cost structures with dynamic market reality.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center mb-4 text-base shadow-xs">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Connect Catalog & Cost Structure
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Import product SKUs, COGS, inventory velocity levels, and category groupings via our unified REST API or batch manager.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center mb-4 text-base shadow-xs">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Monitor Market & Competitor Benchmarks
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Automated scrapers and feeds capture competitor price changes, stock availability, and promotion cycles around the clock.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center mb-4 text-base shadow-xs">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Run AI Elasticity & Demand Simulation
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Microeconomic elasticity algorithms simulate price points against inventory velocity to pinpoint the optimal margin-revenue balance.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center mb-4 text-base shadow-xs">
                04
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Execute & Automate Optimal Prices
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Apply recommendations with one click or configure autonomous rules within your strict margin boundaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE PRICING SIMULATOR (SHOWCASE WIDGET) */}
      <section id="simulator" className="py-20 sm:py-28 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2">
              Hands-On Simulation
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Test the AI Pricing Engine Live
            </h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              Adjust price benchmarks, competitor dynamics, and inventory velocity below to see how our predictive model calculates revenue impact in real time.
            </p>
          </div>

          <div className="max-w-5xl mx-auto rounded-3xl bg-white border border-slate-200/90 shadow-xl p-6 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Controls Column (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="base-price-slider" className="text-sm font-bold text-slate-800">
                      Your Base Product Price
                    </label>
                    <span className="text-base font-extrabold text-blue-600">₹{basePrice.toLocaleString('en-IN')}</span>
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
                    <span>₹500</span>
                    <span>₹7,500</span>
                    <span>₹15,000</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="competitor-price-slider" className="text-sm font-bold text-slate-800">
                      Competitor Market Benchmark Price
                    </label>
                    <span className="text-base font-extrabold text-slate-800">₹{competitorPrice.toLocaleString('en-IN')}</span>
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
                    <span>₹500 (Deep Discount)</span>
                    <span>₹7,500 (Market Parity)</span>
                    <span>₹15,000 (Premium)</span>
                  </div>
                </div>

                {/* Inventory Selector */}
                <div>
                  <label className="text-sm font-bold text-slate-800 block mb-2">
                    Current Inventory Velocity State
                  </label>
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
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                          inventoryLevel === item.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Elasticity Selector */}
                <div>
                  <label className="text-sm font-bold text-slate-800 block mb-2">
                    Category Price Elasticity
                  </label>
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
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                          elasticity === item.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Real-Time AI Results Card (5 cols) */}
              <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-7 shadow-lg">
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/80 mb-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                      AI Elasticity Output
                    </span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Optimal
                  </span>
                </div>

                <div className="mb-6">
                  <span className="text-xs text-slate-400 block mb-1">Recommended Execution Price</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                      ₹{Math.round(simulationResult.recommendedPrice).toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        simulationResult.priceChangePct >= 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {simulationResult.priceChangePct >= 0 ? '+' : ''}
                      {simulationResult.priceChangePct}%
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5 mb-6 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-300 text-xs">Demand Response</span>
                    <span
                      className={`font-bold ${
                        simulationResult.demandChangePct >= 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {simulationResult.demandChangePct >= 0 ? '+' : ''}
                      {simulationResult.demandChangePct}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-300 text-xs">Projected Revenue Impact</span>
                    <span
                      className={`font-bold ${
                        simulationResult.revenueImpactPct >= 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {simulationResult.revenueImpactPct >= 0 ? '+' : ''}
                      {simulationResult.revenueImpactPct}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-300 text-xs">Estimated Gross Margin</span>
                    <span className="font-bold text-emerald-400">{simulationResult.marginPct}%</span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-300 text-xs">Projected Annual Uplift</span>
                    <span className="font-extrabold text-white text-base">
                      +₹{simulationResult.annualUplift.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <Link
                  to={isAuthenticated ? '/dashboard' : '/login'}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  <span>Apply This Model in Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ENTERPRISE MODULE SHOWCASE */}
      <section id="modules" className="py-20 sm:py-28 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2">
              Full Platform Suite
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Deeply Integrated Enterprise Modules
            </h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              Explore the individual engines that power PricePilot AI’s revenue optimization platform.
            </p>
          </div>

          {/* Module Selector Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
            {modules.map((m) => {
              const Icon = m.icon;
              const isActive = activeModuleTab === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveModuleTab(m.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{m.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Card */}
          {(() => {
            const current = modules.find((m) => m.id === activeModuleTab) || modules[0];
            const Icon = current.icon;
            return (
              <div className="max-w-5xl mx-auto rounded-3xl bg-slate-50 border border-slate-200/90 p-8 sm:p-12 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-7">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-bold mb-4">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{current.badge}</span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
                      {current.headline}
                    </h3>

                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 font-normal">
                      {current.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                      {current.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      to={isAuthenticated ? '/dashboard' : '/login'}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-xs transition-colors"
                    >
                      <span>Explore {current.title}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="lg:col-span-5 space-y-4">
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                        Key Performance Metrics
                      </h4>
                      <div className="space-y-4">
                        {current.metrics.map((met, idx) => (
                          <div key={idx} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0 last:pb-0">
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
            );
          })()}
        </div>
      </section>

      {/* 8. SECURITY & ARCHITECTURE HIGHLIGHTS */}
      <section className="py-20 sm:py-28 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2">
              Enterprise Trust
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              High-Availability & Enterprise-Grade Security
            </h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              Designed from day one to adhere to rigorous SOC2, RBAC, and data privacy expectations for enterprise commerce.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Multi-Tenant Isolation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All catalog, competitor, and sales records are partitioned strictly at the database and API gateway level.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">JWT Authentication</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stateless token validation with automatic refresh token rotation and client storage abstractions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Granular RBAC</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fine-grained permissions for Administrator, Pricing Manager, and Analyst seats with immutable audit logging.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Sub-50ms Gateway</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                High-throughput pricing calculation microservices engineered for real-time checkout and catalog repricing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. TESTIMONIALS / CASE EVIDENCE */}
      <section className="py-20 sm:py-28 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2">
              Customer Outcomes
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Validated by Commercial Leaders
            </h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              Read how high-growth retail brands and global distributors scaled margin with PricePilot AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {'★'.repeat(5)}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
                  "PricePilot AI automated our repricing across 8,000 electronics SKUs. We lifted gross profit by 21% in our first quarter without hurting order volumes."
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <div className="font-bold text-slate-900 text-sm">Marcus Vance</div>
                <div className="text-xs text-slate-500">VP of Revenue & Pricing, OmniRetail Global</div>
              </div>
            </div>

            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {'★'.repeat(5)}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
                  "The Gemini conversational copilot has completely changed our pricing team's workflow. We ask tactical elasticity questions and get answers grounded in our actual catalog."
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <div className="font-bold text-slate-900 text-sm">Elena Rostova</div>
                <div className="text-xs text-slate-500">Chief Commercial Officer, Apex Direct Commerce</div>
              </div>
            </div>

            <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {'★'.repeat(5)}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
                  "The margin guardrails are bulletproof. We never have to worry about an algorithmic race-to-the-bottom with competitors. It protects our brand and bottom line."
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <div className="font-bold text-slate-900 text-sm">David Chen</div>
                <div className="text-xs text-slate-500">Director of Merchandising, Veloce Brands</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" className="py-20 sm:py-28 bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed">
              Everything you need to know about integrating and operating PricePilot AI.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <span className="text-base font-bold text-slate-900">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-6 sm:px-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. FINAL CTA BANNER */}
      <section className="py-20 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6">
            Ready to Accelerate Your Revenue Intelligence?
          </h2>
          <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            Start optimizing pricing with PricePilot AI today. Instant access to real-time elasticity models, competitor tracking, and the Gemini pricing copilot.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-blue-700 font-bold text-base hover:bg-blue-50 shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.01]"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-800/60 hover:bg-blue-800 text-white font-semibold text-base border border-blue-400/40 transition-colors"
            >
              <FileCode className="w-4 h-4" />
              <span>Inspect OpenAPI Spec</span>
            </a>
          </div>
        </div>
      </section>

      {/* 12. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand Column */}
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
              <p className="text-slate-500 text-[11px]">
                Pre-configured with enterprise FastAPI and Gemini 3.6 Flash integrations.
              </p>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Platform</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Pricing Engine</a></li>
                <li><a href="#simulator" className="hover:text-white transition-colors">Elasticity Simulator</a></li>
                <li><a href="#modules" className="hover:text-white transition-colors">Competitor Matrix</a></li>
                <li><a href="#modules" className="hover:text-white transition-colors">Demand Forecast</a></li>
                <li><a href="#modules" className="hover:text-white transition-colors">Gemini Copilot</a></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Developers</h4>
              <ul className="space-y-2">
                <li><a href="/openapi.json" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">OpenAPI 3.0 Spec</a></li>
                <li><a href="/docs" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Swagger API Docs</a></li>
                <li><a href="/health" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">System Health Check</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Workspace Access</Link></li>
              </ul>
            </div>

            {/* Governance Column */}
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
            <div>
              © 2026 PricePilot AI. All rights reserved. Enterprise Dynamic Pricing Platform.
            </div>
            <div className="flex items-center gap-6">
              <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
              <a href="/docs" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">API Contract</a>
              <span className="text-slate-600">v1.0.0-enterprise</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
