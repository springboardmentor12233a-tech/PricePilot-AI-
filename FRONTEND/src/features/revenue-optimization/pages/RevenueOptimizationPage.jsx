import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import RevenueEmptyState from '../components/RevenueEmptyState';

export default function RevenueOptimizationPage() {
  const { selectedOrganization, selectedOrganizationId: storedOrgId } = useOrganization();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const organizationId = selectedOrganization?.id || storedOrgId;
  const initialProductId = searchParams.get('productId') || searchParams.get('product_id') || null;
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());

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

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <RevenueOptimizationHeader
        onRefresh={handleRefresh}
        isLoading={isProductLoading || isInventoryLoading || isCompetitorsLoading}
        lastUpdated={lastUpdated}
      />

      {/* Product Selector Panel */}
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

      {/* No Product Empty State */}
      {!selectedProductId ? (
        <RevenueEmptyState
          type="no-product"
          title="Select a product to begin revenue optimization."
          description="Choose a product from your organization catalog above to inspect pricing context, simulate what-if candidate price scenarios, and evaluate revenue and profit yields."
        />
      ) : (
        <>
          {/* Current Pricing Context Card */}
          <PricingContextCard
            product={product}
            inventory={inventory}
            competitorData={competitorData}
            baselinePrediction={baselinePrediction}
            isBaselinePredicting={isBaselinePredicting}
            onRunBaselinePrediction={runBaselinePrediction}
            isLoading={isProductLoading}
          />

          {/* Revenue & Profit Summary Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <RevenueSummaryCard
              currentBaseline={currentBaseline}
              scenarios={scenarios}
              currency={product?.currency || 'INR'}
            />
            <ProfitSummaryCard
              currentBaseline={currentBaseline}
              scenarios={scenarios}
              product={product}
              currency={product?.currency || 'INR'}
            />
          </div>

          {/* Candidate Scenario Builder */}
          <ScenarioBuilder
            onAddScenario={handleAddScenario}
            product={product}
            inventory={inventory}
            competitorData={competitorData}
            onRunAll={handleRunAllScenarios}
            pendingCount={pendingScenariosCount}
            isEvaluating={isAnyScenarioLoading}
          />

          {/* Scenario Comparison Ledger */}
          <ScenarioComparison
            currentBaseline={currentBaseline}
            scenarios={scenarios}
            product={product}
            onRunScenario={handleRunSingleScenario}
            onRemoveScenario={removeScenario}
            isEvaluating={isAnyScenarioLoading}
          />

          {/* Visual Impact Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <RevenueChart
              currentBaseline={currentBaseline}
              scenarios={scenarios}
              currency={product?.currency || 'INR'}
            />
            <ProfitChart
              currentBaseline={currentBaseline}
              scenarios={scenarios}
              product={product}
              currency={product?.currency || 'INR'}
            />
          </div>

          {/* Intelligence & History Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: AI Pricing Recommendation Card */}
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

            {/* Right: Competitor Benchmark & Pricing Constraints & History */}
            <div className="space-y-5">
              <CompetitorContextCard
                product={product}
                competitorData={competitorData}
                isLoading={isCompetitorsLoading}
              />

              <PricingConstraints />

              <PricingHistoryCard
                history={pricingHistory}
                product={product}
                isLoading={isHistoryLoading}
                error={historyError}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
