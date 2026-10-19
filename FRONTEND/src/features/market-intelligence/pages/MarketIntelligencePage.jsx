import React, { useState, useEffect, useRef } from 'react';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ErrorState from '../../../components/ErrorState';
import MarketOverview from '../components/MarketOverview';
import MarketPriceIndex from '../components/MarketPriceIndex';
import MarketTrendChart from '../components/MarketTrendChart';
import MarketPosition from '../components/MarketPosition';
import PriceGapCard from '../components/PriceGapCard';
import OpportunityList from '../components/OpportunityList';
import CompetitivePriceTable from '../components/CompetitivePriceTable';
import CompetitorPriceForm from '../../competitors/components/CompetitorPriceForm';
import CompetitorProductMatch from '../../competitors/components/CompetitorProductMatch';
import { useMarketIntelligence } from '../hooks/useMarketIntelligence';
import { useCompetitorMutations } from '../../competitors/hooks/useCompetitorMutations';
import {
  RefreshCw,
  PlusCircle,
  Link2,
  Download,
  Radar,
  Gauge,
  Target,
  LineChart,
  Table,
  Package,
  Store,
  Lightbulb,
  GitCompareArrows,
} from 'lucide-react';
import ReportConfigModal from '../../reports/components/ReportConfigModal';
import { useToast } from '../../../hooks/useToast';

/* -------------------------------------------------------------------------- */
/*  Scoped animation styles ("mi-" prefix)                                     */
/* -------------------------------------------------------------------------- */
const MARKET_CSS = `
.mi-page { position: relative; isolation: isolate; }

.mi-ambient {
  position: absolute; inset: -24px -16px auto -16px; height: 520px; z-index: -1; pointer-events: none;
  background:
    radial-gradient(ellipse 45% 55% at 10% 0%, rgba(147,197,253,.36), transparent 70%),
    radial-gradient(ellipse 40% 50% at 92% 8%, rgba(94,234,212,.24), transparent 70%),
    radial-gradient(ellipse 30% 40% at 55% 0%, rgba(196,181,253,.22), transparent 70%);
  -webkit-mask-image: linear-gradient(#000 40%, transparent);
  mask-image: linear-gradient(#000 40%, transparent);
  animation: mi-ambient 14s ease-in-out infinite alternate;
}
@keyframes mi-ambient { from { opacity: .75; transform: translateY(0); } to { opacity: 1; transform: translateY(14px); } }

/* Reveal */
.mi-reveal { opacity: 0; transform: translateY(22px) scale(.992); transition: opacity .65s ease, transform .65s cubic-bezier(.2,.8,.2,1); }
.mi-reveal.is-visible { opacity: 1; transform: none; }

/* Hover lift that follows each panel's own shape */
.mi-lift { transition: transform .3s cubic-bezier(.2,.8,.2,1), filter .3s ease; }
.mi-lift:hover { transform: translateY(-4px); filter: drop-shadow(0 18px 28px rgba(37,99,235,.16)); }

/* Section headings */
.mi-section { display: flex; align-items: center; gap: .75rem; }
.mi-section-icon {
  width: 2rem; height: 2rem; border-radius: .6rem;
  display: flex; align-items: center; justify-content: center; color: #fff;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  box-shadow: 0 8px 16px -8px rgba(14,165,233,.75);
}
.mi-section-title { font-size: .72rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #475569; }
.mi-section-line { flex: 1; height: 1px; background: linear-gradient(90deg, #cbd5e1, transparent); transform-origin: left; animation: mi-line 1s ease both; }
@keyframes mi-line { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* Pulse strip */
.mi-pulse {
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, #0f172a 0%, #172554 55%, #1e1b4b 100%);
  box-shadow: 0 24px 50px -24px rgba(30,64,175,.55);
}
.mi-pulse::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(148,163,184,.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148,163,184,.08) 1px, transparent 1px);
  background-size: 36px 36px;
  -webkit-mask-image: radial-gradient(ellipse 80% 100% at 50% 0%, #000 30%, transparent 100%);
  mask-image: radial-gradient(ellipse 80% 100% at 50% 0%, #000 30%, transparent 100%);
}
.mi-pulse-orb { position: absolute; border-radius: 9999px; filter: blur(48px); pointer-events: none; animation: mi-orb 16s ease-in-out infinite; }
@keyframes mi-orb { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-20px) scale(1.12); } }
.mi-pulse-item { transition: transform .25s cubic-bezier(.2,.8,.2,1), background-color .25s ease, border-color .25s ease; }
.mi-pulse-item:hover { transform: translateY(-3px); background: rgba(255,255,255,.1); border-color: rgba(147,197,253,.5); }
.mi-live { position: relative; }
.mi-live::after { content: ''; position: absolute; inset: 0; border-radius: 9999px; background: inherit; animation: mi-ping 1.8s cubic-bezier(0,0,.2,1) infinite; }
@keyframes mi-ping { 75%,100% { transform: scale(2.6); opacity: 0; } }

/* Loading */
.mi-skel { position: relative; overflow: hidden; background: #EEF2F7; }
.mi-skel::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent);
  transform: translateX(-100%); animation: mi-shimmer 1.4s infinite;
}
@keyframes mi-shimmer { to { transform: translateX(100%); } }
.mi-fade { animation: mi-pop .45s ease both; }

.mi-pop { animation: mi-pop .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes mi-pop { from { opacity: 0; transform: translateY(14px) scale(.985); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .mi-ambient, .mi-section-line, .mi-pulse-orb, .mi-live::after, .mi-skel::after, .mi-pop, .mi-fade { animation: none !important; }
  .mi-reveal { opacity: 1; transform: none; transition: none; }
  .mi-lift, .mi-pulse-item { transition: none; }
  .mi-lift:hover, .mi-pulse-item:hover { transform: none; }
}
`;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
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
      className={`mi-reveal ${visible ? 'is-visible' : ''} ${className}`}
    >
      {lift ? <div className="mi-lift h-full">{children}</div> : children}
    </div>
  );
}

function SectionHeading({ icon: Icon, children }) {
  return (
    <Reveal>
      <div className="mi-section">
        <span className="mi-section-icon">
          <Icon className="w-4 h-4" />
        </span>
        <span className="mi-section-title">{children}</span>
        <span className="mi-section-line" />
      </div>
    </Reveal>
  );
}

function CountUp({ value, duration = 900 }) {
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
  return <>{Math.round(display).toLocaleString()}</>;
}

const LOADING_MESSAGES = [
  'Aggregating market intelligence data...',
  'Comparing competitor price observations...',
  'Calculating your market position...',
];

function MarketLoading() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % LOADING_MESSAGES.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mi-fade space-y-8">
      <div className="py-10 text-center">
        <LoadingSpinner size="lg" text={LOADING_MESSAGES[idx]} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="mi-skel h-24 rounded-2xl" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="mi-skel h-64 rounded-2xl" />
        <div className="mi-skel h-64 rounded-2xl" />
      </div>
    </div>
  );
}

const countOf = (value) => (Array.isArray(value) ? value.length : 0);

export default function MarketIntelligencePage() {
  const toast = useToast();
  const {
    products,
    competitors,
    comparisons,
    opportunities,
    summary,
    isLoading,
    error,
    refresh,
  } = useMarketIntelligence();

  const {
    recordCompetitorPrice,
    matchProduct,
    isMutating,
  } = useCompetitorMutations();

  // Modals state
  const [isPriceFormOpen, setIsPriceFormOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isMatchOpen, setIsMatchOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleOpenPriceForm = (productId = '') => {
    setSelectedProductId(productId ? String(productId) : '');
    setIsPriceFormOpen(true);
  };

  const handleOpenMatch = (productId = '') => {
    setSelectedProductId(productId ? String(productId) : '');
    setIsMatchOpen(true);
  };

  const handlePriceSubmit = async (payload) => {
    await recordCompetitorPrice(payload);
    refresh();
  };

  const handleMatchSubmit = async (payload) => {
    await matchProduct(payload);
  };

  // Real counts only, taken straight from the loaded data
  const pulseItems = [
    { label: 'Products Tracked', value: countOf(products), icon: Package, tint: 'text-sky-300' },
    { label: 'Competitors', value: countOf(competitors), icon: Store, tint: 'text-violet-300' },
    { label: 'Price Comparisons', value: countOf(comparisons), icon: GitCompareArrows, tint: 'text-emerald-300' },
    { label: 'Opportunities', value: countOf(opportunities), icon: Lightbulb, tint: 'text-amber-300' },
  ];

  return (
    <div className="mi-page space-y-6">
      <style>{MARKET_CSS}</style>
      <div aria-hidden className="mi-ambient" />

      <Reveal>
        <PageHeader
          title="Market Intelligence"
          description="Analyze competitor pricing dynamics, catalog price index, and market positioning."
          actions={
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="md"
                leftIcon={RefreshCw}
                onClick={refresh}
                disabled={isLoading}
                className={isLoading ? 'animate-spin' : ''}
                title="Refresh intelligence dataset"
              >
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              <Button
                variant="outline"
                size="md"
                leftIcon={Link2}
                onClick={() => handleOpenMatch()}
              >
                Match Product
              </Button>

              <Button
                variant="outline"
                size="md"
                leftIcon={Download}
                onClick={() => setIsReportModalOpen(true)}
              >
                Export Report
              </Button>

              <Button
                variant="primary"
                size="md"
                leftIcon={PlusCircle}
                onClick={() => handleOpenPriceForm()}
              >
                Record Price
              </Button>
            </div>
          }
        />
      </Reveal>

      {/* Loading State */}
      {isLoading && comparisons.length === 0 ? (
        <MarketLoading />
      ) : error ? (
        <div className="mi-pop">
          <ErrorState
            title="Error Loading Market Intelligence"
            message={error}
            onRetry={refresh}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Market pulse strip (live counts from the loaded dataset) */}
          <Reveal>
            <div className="mi-pulse rounded-2xl p-5 sm:p-6 text-white">
              <span aria-hidden className="mi-pulse-orb -top-10 -left-10 w-56 h-56 bg-blue-500/30" />
              <span aria-hidden className="mi-pulse-orb right-0 -bottom-16 w-64 h-64 bg-violet-500/25" style={{ animationDelay: '-7s' }} />
              <div className="relative">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-200 mb-4">
                  <span className="mi-live w-2 h-2 rounded-full bg-emerald-400" />
                  Market Pulse
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {pulseItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="mi-pulse-item rounded-xl bg-white/5 border border-white/10 backdrop-blur p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-slate-300">{item.label}</span>
                          <Icon className={`w-4 h-4 ${item.tint}`} />
                        </div>
                        <span className="block text-2xl sm:text-3xl font-extrabold font-mono mt-1.5 tracking-tight">
                          <CountUp value={item.value} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Summary Metric Strip */}
          <SectionHeading icon={Radar}>Market Overview</SectionHeading>
          <Reveal lift>
            <MarketOverview summary={summary} />
          </Reveal>

          {/* Catalog Index & Distribution */}
          <SectionHeading icon={Gauge}>Price Index &amp; Position</SectionHeading>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Reveal lift>
              <MarketPriceIndex comparisons={comparisons} />
            </Reveal>
            <Reveal lift delay={120}>
              <MarketPosition summary={summary} />
            </Reveal>
          </div>

          {/* Gap & Opportunities Strip */}
          <SectionHeading icon={Target}>Gaps &amp; Opportunities</SectionHeading>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Reveal lift>
              <PriceGapCard comparisons={comparisons} />
            </Reveal>
            <Reveal lift delay={120}>
              <OpportunityList
                opportunities={opportunities}
                onRecordPrice={handleOpenPriceForm}
              />
            </Reveal>
          </div>

          {/* Market Comparison Chart */}
          <SectionHeading icon={LineChart}>Market Comparison</SectionHeading>
          <Reveal lift>
            <MarketTrendChart comparisons={comparisons} />
          </Reveal>

          {/* Full Competitive Price Analysis Table */}
          <SectionHeading icon={Table}>Competitive Product Price Index</SectionHeading>
          <Reveal>
            <CompetitivePriceTable
              comparisons={comparisons}
              onRecordPrice={handleOpenPriceForm}
              onMatchProduct={handleOpenMatch}
            />
          </Reveal>
        </div>
      )}

      {/* Record Competitor Price Observation Modal */}
      <CompetitorPriceForm
        isOpen={isPriceFormOpen}
        onClose={() => setIsPriceFormOpen(false)}
        onSubmit={handlePriceSubmit}
        products={products}
        competitors={competitors}
        initialProductId={selectedProductId}
        isLoading={isMutating}
      />

      {/* Match Product Modal */}
      <CompetitorProductMatch
        isOpen={isMatchOpen}
        onClose={() => setIsMatchOpen(false)}
        onSubmit={handleMatchSubmit}
        products={products}
        competitors={competitors}
        initialProductId={selectedProductId}
        isLoading={isMutating}
      />

      {/* Intelligence Report Modal */}
      <ReportConfigModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportContext={{
          organizationName: 'PricePilot Enterprise',
          products,
          competitors,
          comparisons,
          summaryMetrics: {
            pricingOpportunitiesCount: opportunities?.length || 0,
          },
        }}
      />
    </div>
  );
}