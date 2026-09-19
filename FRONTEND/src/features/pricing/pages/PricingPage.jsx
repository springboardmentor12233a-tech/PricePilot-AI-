import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../../components/Button';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { useProduct } from '../../products/hooks/useProduct';
import { useInventory } from '../../inventory/hooks/useInventory';
import { useCompetitorPrices } from '../../competitors/hooks/useCompetitorPrices';
import { calculateMarketAverage, getLatestObservation } from '../../competitors/utils/priceAnalysis';

import { usePricingPrediction } from '../hooks/usePricingPrediction';
import { usePricingRecommendations } from '../hooks/usePricingRecommendations';
import { usePricingHistory } from '../hooks/usePricingHistory';
import { usePricingMutations } from '../hooks/usePricingMutations';

import PricingHeader from '../components/PricingHeader';
import ProductPricingSelector from '../components/ProductPricingSelector';
import PricingOverview from '../components/PricingOverview';
import PricingContext from '../components/PricingContext';
import PricingPredictionForm from '../components/PricingPredictionForm';
import PricingPredictionResult from '../components/PricingPredictionResult';
import PriceScenarioTable from '../components/PriceScenarioTable';
import RecommendationCard from '../components/RecommendationCard';
import RecommendationDetails from '../components/RecommendationDetails';
import ApplyRecommendationDialog from '../components/ApplyRecommendationDialog';
import PricingHistoryTable from '../components/PricingHistoryTable';
import PricingHistoryChart from '../components/PricingHistoryChart';
import PricingInsight from '../components/PricingInsight';
import PricingEmptyState from '../components/PricingEmptyState';
import PricingSkeleton from '../components/PricingSkeleton';

import { useToast } from '../../../hooks/useToast';
import { Sparkles, RefreshCw, Cpu, Layers } from 'lucide-react';

export default function PricingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedOrganizationId } = useOrganization();
  const toast = useToast();

  const urlProductId = searchParams.get('productId');
  const [selectedProductId, setSelectedProductId] = useState(urlProductId || null);

  // Modals state
  const [reviewModalRec, setReviewModalRec] = useState(null);
  const [applyDialogRec, setApplyDialogRec] = useState(null);

  // Sync selectedProductId with URL
  useEffect(() => {
    if (urlProductId && urlProductId !== selectedProductId) {
      setSelectedProductId(urlProductId);
    }
  }, [urlProductId]);

  // When organization changes, clear product selection to maintain tenant isolation
  useEffect(() => {
    setSelectedProductId(null);
    setSearchParams({});
  }, [selectedOrganizationId, setSearchParams]);

  // Load Product Details
  const {
    product,
    isLoading: isProductLoading,
    error: productError,
    refresh: refreshProduct,
  } = useProduct(selectedProductId);

  // Load Inventory for selected product
  const {
    inventory,
    isLoading: isInventoryLoading,
  } = useInventory(selectedProductId);

  // Load Competitor Prices for selected product
  const {
    prices: competitorPrices,
    isLoading: isCompetitorPricesLoading,
  } = useCompetitorPrices(selectedProductId);

  // Pricing Decision Support Hooks
  const {
    prediction,
    isLoading: isPredicting,
    error: predictionError,
    predict,
    reset: resetPrediction,
  } = usePricingPrediction(selectedProductId);

  const {
    recommendation,
    recommendations,
    isLoading: isGeneratingRec,
    error: recommendationError,
    generateRecommendation,
    setRecommendation,
    reset: resetRecommendations,
  } = usePricingRecommendations();

  const {
    history,
    isLoading: isHistoryLoading,
    refresh: refreshHistory,
  } = usePricingHistory(selectedProductId);

  const {
    applyRecommendation: executeApply,
    isMutating: isApplying,
  } = usePricingMutations();

  // Aggregate competitor benchmark
  const competitorData = useMemo(() => {
    if (!competitorPrices || competitorPrices.length === 0) return null;
    const latestObs = getLatestObservation(competitorPrices);
    const avg = calculateMarketAverage(competitorPrices);
    return {
      latestPrice: latestObs ? Number(latestObs.price) : null,
      marketAverage: avg,
      observations: competitorPrices,
      count: competitorPrices.length,
    };
  }, [competitorPrices]);

  // Handle product selection from selector
  const handleSelectProduct = useCallback((prod) => {
    if (!prod) {
      setSelectedProductId(null);
      setSearchParams({});
      resetPrediction();
      resetRecommendations();
      return;
    }
    setSelectedProductId(prod.id);
    setSearchParams({ productId: prod.id });
    resetPrediction();
    resetRecommendations();
  }, [setSearchParams, resetPrediction, resetRecommendations]);

  // Run prediction
  const handleRunPrediction = async (payload) => {
    try {
      await predict(payload);
      toast.success('Pricing demand prediction generated.');
    } catch (err) {
      toast.error(err?.message || 'Failed to generate demand prediction.');
    }
  };

  // Generate Recommendation
  const handleGenerateRecommendation = async () => {
    if (!product) return;
    try {
      const payload = {
        product_id: product.id,
        current_price: Number(prediction?.predictedPrice || product.base_price || 0),
      };
      if (competitorData?.latestPrice || competitorData?.marketAverage) {
        payload.competitor_price = Number(competitorData.latestPrice || competitorData.marketAverage);
      }
      if (prediction?.predictedDemand) {
        payload.predicted_demand = Number(prediction.predictedDemand);
      }

      await generateRecommendation(payload);
      toast.success('AI Pricing Recommendation generated.');
    } catch (err) {
      toast.error(err?.message || 'Failed to generate recommendation.');
    }
  };

  // Confirm Apply Recommendation
  const handleConfirmApply = async () => {
    if (!applyDialogRec?.id) return;
    try {
      await executeApply(applyDialogRec.id);
      toast.success('Recommendation applied to catalog successfully.');
      // Refresh product to pull authoritative new price from backend
      await refreshProduct();
      // Refresh pricing history
      await refreshHistory();
      // Update local recommendation status
      if (recommendation && (recommendation.id === applyDialogRec.id)) {
        setRecommendation({ ...recommendation, status: 'APPLIED' });
      }
      setApplyDialogRec(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to apply recommendation.');
    }
  };

  const isContextLoading = isProductLoading || isInventoryLoading || isCompetitorPricesLoading;

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PricingHeader
        selectedProduct={product}
        isLoading={isContextLoading || isPredicting}
        onRefresh={() => {
          refreshProduct();
          refreshHistory();
          toast.info('Refreshed product signals and pricing history.');
        }}
      />

      {/* Product Selection Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs">
        <ProductPricingSelector
          organizationId={selectedOrganizationId}
          selectedProductId={selectedProductId}
          onSelectProduct={handleSelectProduct}
        />
      </div>

      {!selectedProductId ? (
        /* Empty State: Prompt user to choose product */
        <PricingEmptyState
          type="no_product"
          title="Select a Product to Begin Pricing Analysis"
          description="Choose a product from your organization catalog above to inspect competitive benchmarks, forecast demand elasticity, and review AI pricing recommendations."
        />
      ) : isContextLoading && !product ? (
        /* Initial Product Loading Skeleton */
        <PricingSkeleton variant="full" />
      ) : (
        /* Active Workspace for Selected Product */
        <div className="space-y-6">
          {/* Real-time KPI Overview Strip (5 pillars) */}
          <PricingOverview
            product={product}
            inventory={inventory}
            competitorData={competitorData}
          />

          {/* Context Baseline Card */}
          <PricingContext
            product={product}
            inventory={inventory}
            competitorData={competitorData}
          />

          {/* Main Grid: Prediction Formulation & Recommendation Outcomes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Prediction Form & Model Output */}
            <div className="lg:col-span-2 space-y-6">
              <PricingPredictionForm
                product={product}
                competitorData={competitorData}
                inventory={inventory}
                onSubmit={handleRunPrediction}
                onReset={resetPrediction}
                isLoading={isPredicting}
              />

              {prediction && (
                <>
                  <PricingPredictionResult
                    prediction={prediction}
                    product={product}
                    onGenerateRecommendation={handleGenerateRecommendation}
                    isGeneratingRecommendation={isGeneratingRec}
                  />

                  {prediction.scenarios && prediction.scenarios.length > 0 && (
                    <PriceScenarioTable
                      scenarios={prediction.scenarios}
                      product={product}
                      currency={product?.currency}
                    />
                  )}
                </>
              )}

              {/* Pricing Trajectory Chart */}
              <PricingHistoryChart
                history={history}
                currency={product?.currency || 'INR'}
              />

              {/* Pricing History Table */}
              <PricingHistoryTable
                history={history}
                currency={product?.currency || 'INR'}
                isLoading={isHistoryLoading}
              />
            </div>

            {/* Right Column: AI Recommendations & Decision Notes */}
            <div className="space-y-6">
              {recommendation ? (
                <RecommendationCard
                  recommendation={recommendation}
                  product={product}
                  onReview={(rec) => setReviewModalRec(rec)}
                />
              ) : (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 text-center shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#0F172A] mb-1">
                    No Active Recommendation
                  </h4>
                  <p className="text-xs text-[#64748B] leading-relaxed mb-4">
                    Run the pricing simulation on the left to evaluate demand curves, then generate an optimal pricing recommendation.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={isGeneratingRec}
                    onClick={handleGenerateRecommendation}
                    leftIcon={Sparkles}
                    className="w-full justify-center"
                  >
                    {isGeneratingRec ? 'Computing...' : 'Generate Recommendation'}
                  </Button>
                </div>
              )}

              {/* Decision Support Insights */}
              <PricingInsight
                product={product}
                competitorData={competitorData}
                prediction={prediction}
                recommendation={recommendation}
              />
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Details Modal */}
      <RecommendationDetails
        isOpen={Boolean(reviewModalRec)}
        onClose={() => setReviewModalRec(null)}
        recommendation={reviewModalRec}
        product={product}
        onProceedToApply={(rec) => setApplyDialogRec(rec)}
      />

      {/* Apply Confirmation Dialog */}
      <ApplyRecommendationDialog
        isOpen={Boolean(applyDialogRec)}
        onClose={() => setApplyDialogRec(null)}
        onConfirm={handleConfirmApply}
        recommendation={applyDialogRec}
        product={product}
        isApplying={isApplying}
      />
    </div>
  );
}
