import React from 'react';
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
import { Building2 } from 'lucide-react';
import Button from '../../../components/Button';
import { useNavigate } from 'react-router-dom';

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
      <div className="py-12">
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
    <div className="space-y-6 pb-12">
      {/* Executive Header */}
      <ExecutiveHeader
        lastUpdated={lastUpdated}
        onRefresh={refreshDashboard}
        isRefreshing={isRefreshing}
      />

      {/* Analytics Error Notification if API failed */}
      {analyticsError && (
        <ErrorState
          title="Unable to load complete analytics"
          message={analyticsError}
          onRetry={refreshDashboard}
        />
      )}

      {/* Executive KPI Grid */}
      <ExecutiveKpiGrid
        summaryMetrics={summaryMetrics}
        products={products}
        competitorCoverage={competitorCoverage}
        recommendations={recommendations}
        latestDemandPrediction={latestDemandPrediction}
        currency={currency}
      />

      {/* Primary Analytics Row: Revenue & Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <ExecutiveRevenueOverview
            revenueChartData={revenueChartData}
            totalRevenue={summaryMetrics?.totalRevenue}
            currency={currency}
            isLoading={isAnalyticsLoading}
          />
        </div>
        <div className="lg:col-span-5">
          <ExecutiveDemandOverview
            latestDemandPrediction={latestDemandPrediction}
            isLoading={isAnalyticsLoading}
          />
        </div>
      </div>

      {/* Secondary Analytics Row: Pricing Performance & Competitor Position */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <ExecutivePricingOverview
            summaryMetrics={summaryMetrics}
            products={products}
            currency={currency}
          />
        </div>
        <div className="lg:col-span-6">
          <ExecutiveCompetitorOverview
            products={products}
            competitors={competitors}
            currency={currency}
            isLoading={isAnalyticsLoading}
          />
        </div>
      </div>

      {/* Operational Attention & Governance: Recommendations & Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <ExecutiveRecommendationCenter
            recommendations={recommendations}
            currency={currency}
            isLoading={isRecommendationsLoading}
            error={recommendationsError}
          />
        </div>
        <div className="lg:col-span-6">
          <ExecutiveProductAttention
            items={productsRequiringAttention}
            isLoading={isAnalyticsLoading}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <ExecutiveQuickActions />
    </div>
  );
}
