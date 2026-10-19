import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, SlidersHorizontal, TrendingUp, Cpu, Brain, Sparkles } from 'lucide-react';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { useDemandForecast } from '../hooks/useDemandForecast';
import { useToast } from '../../../hooks/useToast';

import ForecastHeader from '../components/ForecastHeader';
import ProductSelector from '../components/ProductSelector';
import ForecastHorizonSelector from '../components/ForecastHorizonSelector';
import ForecastControls from '../components/ForecastControls';
import DemandSummaryCard from '../components/DemandSummaryCard';
import DemandTrendCard from '../components/DemandTrendCard';
import ForecastConfidenceCard from '../components/ForecastConfidenceCard';
import ForecastContextCard from '../components/ForecastContextCard';
import ForecastChart from '../components/ForecastChart';
import HistoricalDemandTable from '../components/HistoricalDemandTable';
import ForecastEmptyState from '../components/ForecastEmptyState';
import ForecastSkeleton from '../components/ForecastSkeleton';
import ModelInfoCard from '../components/ModelInfoCard';

/* -------------------------------------------------------------------------- */
/*  Scoped animation styles ("fp-" prefix)                                     */
/* -------------------------------------------------------------------------- */
const FORECAST_CSS = `
.fp-page { position: relative; isolation: isolate; }

/* Ambient glow behind the workspace */
.fp-ambient {
  position: absolute; inset: -24px -16px auto -16px; height: 520px; z-index: -1; pointer-events: none;
  background:
    radial-gradient(ellipse 45% 55% at 10% 0%, rgba(147,197,253,.38), transparent 70%),
    radial-gradient(ellipse 40% 50% at 90% 6%, rgba(167,139,250,.3), transparent 70%);
  -webkit-mask-image: linear-gradient(#000 40%, transparent);
  mask-image: linear-gradient(#000 40%, transparent);
  animation: fp-ambient 14s ease-in-out infinite alternate;
}
@keyframes fp-ambient { from { opacity: .75; transform: translateY(0); } to { opacity: 1; transform: translateY(14px); } }

/* Reveal on scroll / mount */
.fp-reveal {
  opacity: 0;
  transform: translateY(22px) scale(.992);
  transition: opacity .65s ease, transform .65s cubic-bezier(.2,.8,.2,1);
}
.fp-reveal.is-visible { opacity: 1; transform: none; }

/* Hover lift that follows each panel's own shape */
.fp-lift { transition: transform .3s cubic-bezier(.2,.8,.2,1), filter .3s ease; }
.fp-lift:hover { transform: translateY(-4px); filter: drop-shadow(0 18px 28px rgba(79,70,229,.16)); }

/* Section headings */
.fp-section { display: flex; align-items: center; gap: .75rem; }
.fp-section-icon {
  width: 2rem; height: 2rem; border-radius: .6rem;
  display: flex; align-items: center; justify-content: center; color: #fff;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  box-shadow: 0 8px 16px -8px rgba(99,102,241,.75);
}
.fp-section-title { font-size: .72rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #475569; }
.fp-section-line { flex: 1; height: 1px; background: linear-gradient(90deg, #cbd5e1, transparent); transform-origin: left; animation: fp-line 1s ease both; }
@keyframes fp-line { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* Model explanation card */
.fp-explain {
  position: relative; overflow: hidden;
  background: linear-gradient(160deg, #ffffff 0%, #f5f3ff 100%);
  border: 1px solid #e2e8f0;
  transition: box-shadow .3s ease, border-color .3s ease;
}
.fp-explain::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: linear-gradient(180deg, #3b82f6, #8b5cf6);
}
.fp-explain:hover { border-color: #c4b5fd; box-shadow: 0 16px 36px -18px rgba(124,58,237,.35); }
.fp-gauge {
  position: relative; height: .5rem; border-radius: 9999px;
  background: linear-gradient(90deg, #34d399 0%, #fbbf24 55%, #fb7185 100%);
}
.fp-gauge-tick { position: absolute; top: -3px; bottom: -3px; width: 2px; background: rgba(15,23,42,.35); border-radius: 2px; }
.fp-gauge-marker {
  position: absolute; top: 50%; width: .95rem; height: .95rem; border-radius: 9999px;
  background: #fff; border: 3px solid #4f46e5; box-shadow: 0 4px 10px -2px rgba(79,70,229,.6);
  transform: translate(-50%, -50%);
  transition: left 1.2s cubic-bezier(.2,.8,.2,1);
}
.fp-quote-mark { position: absolute; right: 14px; top: 8px; font-size: 3.5rem; line-height: 1; font-weight: 800; color: rgba(139,92,246,.14); pointer-events: none; }

/* Result fade-in when a forecast is generated */
.fp-pop { animation: fp-pop .6s cubic-bezier(.2,.8,.2,1) both; }
@keyframes fp-pop { from { opacity: 0; transform: translateY(16px) scale(.985); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .fp-ambient, .fp-section-line, .fp-pop { animation: none !important; }
  .fp-reveal { opacity: 1; transform: none; transition: none; }
  .fp-lift, .fp-gauge-marker { transition: none; }
  .fp-lift:hover { transform: none; }
}
`;

/* Reveals its children as they scroll into view, with an optional stagger delay */
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
      className={`fp-reveal ${visible ? 'is-visible' : ''} ${className}`}
    >
      {lift ? <div className="fp-lift h-full">{children}</div> : children}
    </div>
  );
}

function SectionHeading({ icon: Icon, children }) {
  return (
    <Reveal>
      <div className="fp-section">
        <span className="fp-section-icon">
          <Icon className="w-4 h-4" />
        </span>
        <span className="fp-section-title">{children}</span>
        <span className="fp-section-line" />
      </div>
    </Reveal>
  );
}

/* Explanation panel: elasticity gauge + model reasoning */
function ModelExplanationCard({ elasticity, reason }) {
  const hasElasticity = typeof elasticity === 'number' && Number.isFinite(elasticity);
  const magnitude = hasElasticity ? Math.abs(elasticity) : 0;

  // Gauge spans |elasticity| 0 → 3, with a tick at 1.0 (unit elasticity)
  const [markerPct, setMarkerPct] = useState(0);
  useEffect(() => {
    const target = Math.min(magnitude / 3, 1) * 100;
    const t = setTimeout(() => setMarkerPct(target), 250);
    return () => clearTimeout(t);
  }, [magnitude]);

  let label = 'Unit elastic';
  let chip = 'bg-amber-50 text-amber-700 border-amber-200';
  if (hasElasticity && magnitude < 1) {
    label = 'Inelastic';
    chip = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (hasElasticity && magnitude > 1) {
    label = 'Elastic';
    chip = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <div className="fp-explain rounded-2xl p-5 pl-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/30">
          <Brain className="w-4 h-4" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
          Model Explanation Factors
        </span>
      </div>

      {hasElasticity && (
        <div>
          <div className="flex items-center justify-between text-xs mb-2.5">
            <span className="text-[#64748B]">Price Elasticity Index</span>
            <span className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${chip}`}>{label}</span>
              <span className="font-mono font-bold text-base text-[#0F172A]">{elasticity.toFixed(2)}</span>
            </span>
          </div>
          <div className="fp-gauge">
            <span className="fp-gauge-tick" style={{ left: '33.3%' }} title="Unit elasticity (1.0)" />
            <span className="fp-gauge-marker" style={{ left: `${markerPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-[#94A3B8] mt-1.5 font-medium">
            <span>0 · Inelastic</span>
            <span>1.0</span>
            <span>3+ · Highly elastic</span>
          </div>
        </div>
      )}

      {reason && (
        <div className="relative rounded-xl bg-white/70 border border-[#EDE9FE] p-3.5">
          <span aria-hidden className="fp-quote-mark">“</span>
          <p className="text-xs text-[#475569] italic leading-relaxed relative">“{reason}”</p>
        </div>
      )}
    </div>
  );
}

/**
 * ForecastPage Component
 * Demand Forecasting & Demand Intelligence Workspace.
 * Integrates server-side XGBoost inference, real historical sales analysis,
 * and transparent elasticity scenario controls.
 */
export default function ForecastPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentOrganizationId } = useOrganization();
  const toast = useToast();

  const queryProductId = searchParams.get('productId') || searchParams.get('product_id') || '';
  const [selectedProductId, setSelectedProductId] = useState(queryProductId);

  // Sync state if URL changes
  useEffect(() => {
    if (queryProductId && queryProductId !== selectedProductId) {
      setSelectedProductId(queryProductId);
    }
  }, [queryProductId, selectedProductId]);

  const handleSelectProduct = useCallback((id) => {
    setSelectedProductId(id);
    setSearchParams(id ? { productId: id } : {});
  }, [setSearchParams]);

  // Forecasting Hook
  const {
    product,
    inventory,
    competitorData,
    isContextLoading,
    productError,
    forecast,
    isLoading: isForecastLoading,
    error: forecastError,
    status: forecastStatus,
    selectedHorizon,
    setSelectedHorizon,
    generateForecast,
    resetForecast,
    historicalSales,
    isHistoryLoading,
    historyError,
    refreshAll,
  } = useDemandForecast(selectedProductId, currentOrganizationId);

  const handleGenerateForecast = async (overrides) => {
    try {
      await generateForecast(overrides);
      toast.success('Demand prediction generated from model.');
    } catch (err) {
      toast.error(err?.message || 'Unable to generate demand prediction.');
    }
  };

  const handleRefresh = () => {
    refreshAll();
    toast.info('Refreshed product signals and sales history.');
  };

  return (
    <div className="fp-page space-y-6">
      <style>{FORECAST_CSS}</style>
      <div aria-hidden className="fp-ambient" />

      {/* Page Header with Model Status */}
      <Reveal>
        <ForecastHeader
          selectedProduct={product}
          isLoading={isContextLoading || isForecastLoading}
          onRefresh={handleRefresh}
        />
      </Reveal>

      {/* Product Selection Panel */}
      <Reveal delay={80}>
        <ProductSelector
          organizationId={currentOrganizationId}
          selectedProductId={selectedProductId}
          onSelectProduct={handleSelectProduct}
          disabled={isForecastLoading}
        />
      </Reveal>

      {/* Main Workspace Body */}
      {!selectedProductId ? (
        <Reveal delay={140}>
          <ForecastEmptyState
            type="no_product"
            title="Select a Product to Begin Demand Forecasting"
            description="Choose a product from your organization catalog above to configure scenario factors, evaluate price elasticity, and view server-side model forecasts."
          />
        </Reveal>
      ) : isContextLoading && !product ? (
        <ForecastSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Baseline Product Signals */}
          <SectionHeading icon={Package}>Product Signals</SectionHeading>
          <Reveal lift>
            <ForecastContextCard
              product={product}
              inventory={inventory}
              competitorData={competitorData}
            />
          </Reveal>

          {/* Scenario setup */}
          <SectionHeading icon={SlidersHorizontal}>Scenario Setup</SectionHeading>

          {/* Horizon Selector */}
          <Reveal>
            <ForecastHorizonSelector
              selectedHorizon={selectedHorizon}
              onSelectHorizon={setSelectedHorizon}
              disabled={isForecastLoading}
            />
          </Reveal>

          {/* Scenario & Prediction Inputs */}
          <Reveal delay={80}>
            <ForecastControls
              product={product}
              inventory={inventory}
              competitorData={competitorData}
              selectedHorizon={selectedHorizon}
              isLoading={isForecastLoading}
              status={forecastStatus}
              onGenerateForecast={handleGenerateForecast}
              onReset={resetForecast}
            />
          </Reveal>

          <SectionHeading icon={forecast ? TrendingUp : Sparkles}>
            {forecast ? 'Forecast Results' : 'Demand Intelligence'}
          </SectionHeading>

          {/* Active Forecast Results */}
          {forecast ? (
            // key replays the entrance animation each time a new forecast appears
            <div key={`forecast-${selectedHorizon}`} className="fp-pop space-y-6">
              {/* Primary Metric Strip */}
              <Reveal lift>
                <DemandSummaryCard
                  forecast={forecast}
                  product={product}
                  selectedHorizon={selectedHorizon}
                />
              </Reveal>

              {/* 2-Column Analytics Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left (2 cols): Visual Chart & Historical Sales Ledger */}
                <div className="lg:col-span-2 space-y-6">
                  <Reveal lift>
                    <ForecastChart
                      historicalSales={historicalSales}
                      forecast={forecast}
                      product={product}
                    />
                  </Reveal>

                  <Reveal lift delay={80}>
                    <HistoricalDemandTable
                      sales={historicalSales}
                      currency={product?.currency || 'INR'}
                      isLoading={isHistoryLoading}
                    />
                  </Reveal>
                </div>

                {/* Right (1 col): Trend & Confidence Intelligence */}
                <div className="space-y-6">
                  <Reveal lift delay={60}>
                    <DemandTrendCard
                      trend={forecast.trend}
                      forecastPoints={forecast.forecastPoints}
                    />
                  </Reveal>

                  <Reveal lift delay={140}>
                    <ForecastConfidenceCard
                      confidence={forecast.confidence}
                    />
                  </Reveal>

                  {/* Explanatory Factors / Elasticity if provided */}
                  {(forecast.elasticity !== null || forecast.reason) && (
                    <Reveal delay={220}>
                      <ModelExplanationCard
                        elasticity={forecast.elasticity}
                        reason={forecast.reason}
                      />
                    </Reveal>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <Reveal>
                <ForecastEmptyState
                  type="no_forecast"
                  title="Generate a Forecast to View Demand Intelligence"
                  description="Adjust scenario price and promotional assumptions above, then click 'Generate Forecast' to run the server-side XGBoost regression model."
                />
              </Reveal>

              {/* Still display historical transactions if any exist */}
              <Reveal lift delay={80}>
                <HistoricalDemandTable
                  sales={historicalSales}
                  currency={product?.currency || 'INR'}
                  isLoading={isHistoryLoading}
                />
              </Reveal>
            </div>
          )}

          {/* Model Architecture Technical Info Section */}
          <SectionHeading icon={Cpu}>Model Architecture</SectionHeading>
          <Reveal>
            <ModelInfoCard />
          </Reveal>
        </div>
      )}
    </div>
  );
}