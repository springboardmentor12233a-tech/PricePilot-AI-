import React, { useEffect, useRef, useState } from 'react';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { useExecutiveDashboard } from '../hooks/useExecutiveDashboard';
import ExecutiveHeader from '../components/ExecutiveHeader';
import ExecutiveKpiGrid from '../components/ExecutiveKpiGrid';
import ExecutiveRevenueOverview from '../components/ExecutiveRevenueOverview';
import ExecutiveDemandOverview from '../components/ExecutiveDemandOverview';
import ExecutivePricingOverview from '../components/ExecutivePricingOverview';
import ExecutiveCompetitorOverview from '../components/ExecutiveCompetitorOverview';
import ExecutiveRecommendationCenter from '../components/ExecutiveRecommendationCenter';
import ExecutiveProductAttention from '../components/ExecutiveProductAttention';
import ExecutiveQuickActions from '../components/ExecutiveQuickActions';
import ErrorState from '../../../components/ErrorState';
import EmptyState from '../../../components/EmptyState';
import { Building2, LineChart, Tags, BellRing, Rocket } from 'lucide-react';
import Button from '../../../components/Button';
import { useNavigate } from 'react-router-dom';

/* -------------------------------------------------------------------------- */
/*  Scoped animation styles ("dp-" prefix)                                     */
/* -------------------------------------------------------------------------- */
const DASH_CSS = `
.dp-page { position: relative; isolation: isolate; }

/* Ambient background glows behind the whole dashboard */
.dp-ambient {
  position: absolute; inset: -24px -16px auto -16px; height: 560px; z-index: -1; pointer-events: none;
  background:
    radial-gradient(ellipse 45% 55% at 12% 0%, rgba(147,197,253,.38), transparent 70%),
    radial-gradient(ellipse 40% 50% at 88% 8%, rgba(196,181,253,.32), transparent 70%);
  -webkit-mask-image: linear-gradient(#000 40%, transparent);
  mask-image: linear-gradient(#000 40%, transparent);
  animation: dp-ambient 14s ease-in-out infinite alternate;
}
@keyframes dp-ambient { from { opacity: .75; transform: translateY(0); } to { opacity: 1; transform: translateY(14px); } }

/* Scroll / mount reveal */
.dp-reveal {
  opacity: 0;
  transform: translateY(22px) scale(.992);
  transition: opacity .65s ease, transform .65s cubic-bezier(.2,.8,.2,1);
}
.dp-reveal.is-visible { opacity: 1; transform: none; }

/* Hover lift that follows each panel's own rounded shape */
.dp-lift { transition: transform .3s cubic-bezier(.2,.8,.2,1), filter .3s ease; }
.dp-lift:hover { transform: translateY(-4px); filter: drop-shadow(0 18px 28px rgba(37,99,235,.16)); }

/* Section headings */
.dp-section { display: flex; align-items: center; gap: .75rem; margin-bottom: -.25rem; }
.dp-section-icon {
  width: 2rem; height: 2rem; border-radius: .6rem;
  display: flex; align-items: center; justify-content: center; color: #fff;
  background: linear-gradient(135deg, #2563eb, #6366f1);
  box-shadow: 0 8px 16px -8px rgba(79,70,229,.7);
}
.dp-section-title { font-size: .72rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #475569; }
.dp-section-line { flex: 1; height: 1px; background: linear-gradient(90deg, #cbd5e1, transparent); transform-origin: left; animation: dp-line 1s ease both; }
@keyframes dp-line { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* Empty state entrance */
.dp-pop { animation: dp-pop .6s cubic-bezier(.2,.8,.2,1) both; }
@keyframes dp-pop { from { opacity: 0; transform: translateY(16px) scale(.96); } to { opacity: 1; transform: none; } }
.dp-empty-glow {
  position: relative;
}
.dp-empty-glow::before {
  content: ''; position: absolute; left: 50%; top: 40%; width: 360px; height: 360px;
  transform: translate(-50%, -50%); z-index: -1; pointer-events: none;
  background: radial-gradient(circle, rgba(147,197,253,.45), transparent 65%);
  animation: dp-ambient 6s ease-in-out infinite alternate;
}

@media (prefers-reduced-motion: reduce) {
  .dp-ambient, .dp-section-line, .dp-pop, .dp-empty-glow::before { animation: none !important; }
  .dp-reveal { opacity: 1; transform: none; transition: none; }
  .dp-lift { transition: none; }
  .dp-lift:hover { transform: none; }
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
      className={`dp-reveal ${visible ? 'is-visible' : ''} ${className}`}
    >
      {lift ? <div className="dp-lift h-full">{children}</div> : children}
    </div>
  );
}

function SectionHeading({ icon: Icon, children }) {
  return (
    <Reveal>
      <div className="dp-section">
        <span className="dp-section-icon">
          <Icon className="w-4 h-4" />
        </span>
        <span className="dp-section-title">{children}</span>
        <span className="dp-section-line" />
      </div>
    </Reveal>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { selectedOrganizationId, selectedOrganization, isLoading: isOrgLoading } = useOrganization();

  const {
    products,
    competitors,
    summaryMetrics,
    revenueChartData,
    currency,
    recommendations,
    productsRequiringAttention,
    competitorCoverage,
    latestDemandPrediction,
    isRecommendationsLoading,
    recommendationsError,
    lastUpdated,
    refreshDashboard,
    isRefreshing,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
  } = useExecutiveDashboard(selectedOrganizationId);

  // No active organization state
  if (!isOrgLoading && !selectedOrganizationId) {
    return (
      <div className="py-12 dp-empty-glow dp-pop">
        <style>{DASH_CSS}</style>
        <EmptyState
          icon={Building2}
          title="No Organization Selected"
          description="Select or register an organization to view pricing analytics, demand forecasts, and competitor intelligence."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/organization')}
            >
              Select Organization
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="dp-page space-y-6 pb-12">
      <style>{DASH_CSS}</style>
      <div aria-hidden className="dp-ambient" />

      {/* Executive Header */}
      <Reveal>
        <ExecutiveHeader
          lastUpdated={lastUpdated}
          onRefresh={refreshDashboard}
          isRefreshing={isRefreshing}
        />
      </Reveal>

      {/* Analytics Error Notification if API failed */}
      {analyticsError && (
        <Reveal>
          <ErrorState
            title="Unable to load complete analytics"
            message={analyticsError}
            onRetry={refreshDashboard}
          />
        </Reveal>
      )}

      {/* Executive KPI Grid */}
      <Reveal delay={80}>
        <ExecutiveKpiGrid
          summaryMetrics={summaryMetrics}
          products={products}
          competitorCoverage={competitorCoverage}
          recommendations={recommendations}
          latestDemandPrediction={latestDemandPrediction}
          currency={currency}
        />
      </Reveal>

      {/* Primary Analytics Row: Revenue & Demand */}
      <SectionHeading icon={LineChart}>Revenue &amp; Demand</SectionHeading>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Reveal lift className="lg:col-span-7">
          <ExecutiveRevenueOverview
            revenueChartData={revenueChartData}
            totalRevenue={summaryMetrics?.totalRevenue}
            currency={currency}
            isLoading={isAnalyticsLoading}
          />
        </Reveal>
        <Reveal lift delay={120} className="lg:col-span-5">
          <ExecutiveDemandOverview
            latestDemandPrediction={latestDemandPrediction}
            isLoading={isAnalyticsLoading}
          />
        </Reveal>
      </div>

      {/* Secondary Analytics Row: Pricing Performance & Competitor Position */}
      <SectionHeading icon={Tags}>Pricing &amp; Competitors</SectionHeading>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Reveal lift className="lg:col-span-6">
          <ExecutivePricingOverview
            summaryMetrics={summaryMetrics}
            products={products}
            currency={currency}
          />
        </Reveal>
        <Reveal lift delay={120} className="lg:col-span-6">
          <ExecutiveCompetitorOverview
            products={products}
            competitors={competitors}
            currency={currency}
            isLoading={isAnalyticsLoading}
          />
        </Reveal>
      </div>

      {/* Operational Attention & Governance: Recommendations & Attention */}
      <SectionHeading icon={BellRing}>Recommendations &amp; Attention</SectionHeading>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Reveal lift className="lg:col-span-6">
          <ExecutiveRecommendationCenter
            recommendations={recommendations}
            currency={currency}
            isLoading={isRecommendationsLoading}
            error={recommendationsError}
          />
        </Reveal>
        <Reveal lift delay={120} className="lg:col-span-6">
          <ExecutiveProductAttention
            items={productsRequiringAttention}
            isLoading={isAnalyticsLoading}
          />
        </Reveal>
      </div>

      {/* Quick Actions */}
      <SectionHeading icon={Rocket}>Quick Actions</SectionHeading>
      <Reveal>
        <ExecutiveQuickActions />
      </Reveal>
    </div>
  );
}