import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import RecommendationCard from '../components/RecommendationCard';
import RecommendationDetails from '../components/RecommendationDetails';
import ApplyRecommendationDialog from '../components/ApplyRecommendationDialog';
import PricingHistoryTable from '../components/PricingHistoryTable';
import PricingHistoryChart from '../components/PricingHistoryChart';
import PricingInsight from '../components/PricingInsight';
import PricingEmptyState from '../components/PricingEmptyState';
import PricingSkeleton from '../components/PricingSkeleton';

import { useToast } from '../../../hooks/useToast';
import { Sparkles } from 'lucide-react';

export default function PricingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    selectedOrganization,
    isLoading: isOrganizationLoading,
    error: organizationError,
    refreshOrganizations,
  } = useOrganization();
  const toast = useToast();

  const urlProductId = searchParams.get('productId');
  const [selectedProductId, setSelectedProductId] = useState(urlProductId || null);
  const [selectionOrganizationId, setSelectionOrganizationId] = useState(null);
  const previousOrganizationIdRef = useRef(null);
  const analysisLockRef = useRef(false);
  const [lastPredictionPayload, setLastPredictionPayload] = useState(null);

  // Modals state
  const [reviewModalRec, setReviewModalRec] = useState(null);
  const [applyDialogRec, setApplyDialogRec] = useState(null);

  // Sync selectedProductId with URL
  useEffect(() => {
    if (urlProductId && urlProductId !== selectedProductId) {
      setSelectedProductId(urlProductId);
    }
  }, [urlProductId]);

  // Do not fetch against an unverified ID loaded from storage while organizations are loading.
  const activeProductId = selectedOrganization
    && String(selectionOrganizationId) === String(selectedOrganization.id)
    ? selectedProductId
    : null;

  // Load Product Details
  const {
    product,
    isLoading: isProductLoading,
    error: productError,
    refresh: refreshProduct,
  } = useProduct(activeProductId);

  // Load Inventory for selected product
  const {
    inventory,
    isLoading: isInventoryLoading,
    error: inventoryError,
    refresh: refreshInventory,
  } = useInventory(activeProductId);

  // Load Competitor Prices for selected product
  const {
    prices: competitorPrices,
    isLoading: isCompetitorPricesLoading,
    error: competitorPricesError,
    refresh: refreshCompetitorPrices,
  } = useCompetitorPrices(activeProductId);

  // Pricing Decision Support Hooks
  const {
    prediction,
    isLoading: isPredicting,
    error: predictionError,
    predict,
    reset: resetPrediction,
  } = usePricingPrediction(activeProductId);

  const {
    recommendation,
    isLoading: isGeneratingRec,
    error: recommendationError,
    generateRecommendation,
    setRecommendation,
    reset: resetRecommendations,
  } = usePricingRecommendations();

  const {
    history,
    isLoading: isHistoryLoading,
    error: historyError,
    refresh: refreshHistory,
  } = usePricingHistory(activeProductId);

  const {
    applyRecommendation: executeApply,
    isMutating: isApplying,
  } = usePricingMutations();

  // Clear product-specific state only after a real organization switch. This preserves valid
  // productId deep links during the provider's initial asynchronous organization load.
  useEffect(() => {
    if (!selectedOrganization?.id) return;
    const nextOrganizationId = String(selectedOrganization.id);
    if (previousOrganizationIdRef.current === null) {
      previousOrganizationIdRef.current = nextOrganizationId;
      setSelectionOrganizationId(nextOrganizationId);
      return;
    }
    if (previousOrganizationIdRef.current === nextOrganizationId) return;

    previousOrganizationIdRef.current = nextOrganizationId;
    setSelectionOrganizationId(nextOrganizationId);
    setSelectedProductId(null);
    setSearchParams({}, { replace: true });
    setLastPredictionPayload(null);
    setReviewModalRec(null);
    setApplyDialogRec(null);
    resetPrediction();
    resetRecommendations();
  }, [selectedOrganization?.id, setSearchParams, resetPrediction, resetRecommendations]);

  // Aggregate competitor benchmark
  const competitorData = useMemo(() => {
    if (!competitorPrices || competitorPrices.length === 0) return null;
    const currency = (product?.currency || 'INR').toUpperCase();
    const compatiblePrices = competitorPrices.filter((item) => (
      item?.availability !== false
      && Number.isFinite(Number(item?.price))
      && Number(item.price) > 0
      && (!item.currency || String(item.currency).toUpperCase() === currency)
    ));
    if (compatiblePrices.length === 0) return null;
    const latestObs = getLatestObservation(compatiblePrices);
    const avg = calculateMarketAverage(compatiblePrices);
    return {
      latestPrice: latestObs ? Number(latestObs.price) : null,
      marketAverage: avg,
      observations: compatiblePrices,
      count: compatiblePrices.length,
    };
  }, [competitorPrices, product?.currency]);

  // Handle product selection from selector
  const handleSelectProduct = useCallback((prod) => {
    if (!prod) {
      setSelectedProductId(null);
      setSearchParams({}, { replace: true });
      setLastPredictionPayload(null);
      setReviewModalRec(null);
      setApplyDialogRec(null);
      resetPrediction();
      resetRecommendations();
      return;
    }
    setSelectedProductId(String(prod.id));
    setSearchParams({ productId: String(prod.id) });
    setLastPredictionPayload(null);
    setReviewModalRec(null);
    setApplyDialogRec(null);
    resetPrediction();
    resetRecommendations();
  }, [setSearchParams, resetPrediction, resetRecommendations]);

  // Run prediction
  const handleRunPrediction = async (payload) => {
    if (!payload?.product_id || String(payload.product_id) !== String(selectedProductId) || analysisLockRef.current) return;
    analysisLockRef.current = true;
    setLastPredictionPayload(payload);
    try {
      const result = await predict(payload);
      if (result) toast.success('Pricing analysis completed.');
    } catch (err) {
      toast.error(err?.message || 'Failed to analyze this product’s pricing.');
    } finally {
      analysisLockRef.current = false;
    }
  };

  // Generate Recommendation
  const handleGenerateRecommendation = async () => {
    if (!product || String(product.id) !== String(selectedProductId) || !prediction?.predictedPrice || isGeneratingRec) return;
    try {
      const payload = {
        product_id: product.id,
        current_price: prediction.currentPrice ?? Number(product.base_price),
        recommended_price: prediction.predictedPrice,
        recommendation_reason: prediction.reason || null,
      };
      if (prediction.competitorAvgPrice !== null) payload.competitor_avg_price = prediction.competitorAvgPrice;
      if (prediction.demandFactor) payload.demand_factor = prediction.demandFactor;

      const saved = await generateRecommendation(payload);
      if (saved) toast.success('Pricing recommendation saved for review.');
    } catch (err) {
      toast.error(err?.message || 'Failed to save the pricing recommendation.');
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

  const isContextLoading = isOrganizationLoading || isProductLoading || isInventoryLoading || isCompetitorPricesLoading;
  const currentProduct = product && String(product.id) === String(selectedProductId) ? product : null;
  const pricingInventory = inventory ? {
    ...inventory,
    current_stock: inventory.available_quantity ?? inventory.quantity_on_hand ?? null,
    min_stock_level: inventory.reorder_level ?? null,
    reorder_point: inventory.reorder_level ?? null,
  } : null;

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PricingHeader
        selectedProduct={currentProduct}
        isLoading={isContextLoading || isPredicting}
        onRefresh={() => {
          refreshProduct();
          refreshHistory();
          refreshInventory();
          refreshCompetitorPrices();
          toast.info('Refreshed product, inventory, competitor, and pricing history data.');
        }}
      />

      {/* Product Selection Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs">
        <ProductPricingSelector
          organizationId={selectedOrganization?.id || null}
          organizationLoading={isOrganizationLoading}
          organizationError={organizationError}
          onRetryOrganization={refreshOrganizations}
          selectedProductId={selectedProductId}
          onSelectProduct={handleSelectProduct}
        />
      </div>

      {!selectedProductId ? (
        /* Empty State: Prompt user to choose product */
        <PricingEmptyState
          type="no_product"
          title="Select a Product to Begin Pricing Analysis"
          description="Choose a product from the active organization catalog to compare recorded competitor prices and run the backend pricing rules."
        />
      ) : !selectedOrganization && !isOrganizationLoading ? (
        <PricingEmptyState
          type="no_product"
          title="Select an Organization to Continue"
          description="Pricing Intelligence only loads products from the verified active organization."
        />
      ) : productError && !isProductLoading ? (
        <div role="alert" className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#991B1B]">Unable to load this product</h3>
            <p className="mt-1 text-xs text-[#7F1D1D]">{productError}</p>
          </div>
          <Button variant="outline" size="sm" onClick={refreshProduct}>Retry</Button>
        </div>
      ) : isContextLoading || !currentProduct ? (
        /* Initial Product Loading Skeleton */
        <PricingSkeleton variant="full" />
      ) : (
        /* Active Workspace for Selected Product */
        <div className="space-y-6">
          {inventoryError && (
            <div role="status" className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3 text-xs text-[#92400E]">
              Inventory data is unavailable: {inventoryError}. The backend will omit its inventory adjustment.
            </div>
          )}
          {competitorPricesError && (
            <div role="status" className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3 text-xs text-[#92400E]">
              Competitor observations could not be loaded: {competitorPricesError}. No benchmark is included in this analysis.
            </div>
          )}

          {/* Real-time KPI Overview Strip (5 pillars) */}
          <PricingOverview
            product={currentProduct}
            inventory={pricingInventory}
            competitorData={competitorData}
          />

          {/* Context Baseline Card */}
          <PricingContext
            product={currentProduct}
            inventory={pricingInventory}
            competitorData={competitorData}
          />

          {/* Main Grid: Prediction Formulation & Recommendation Outcomes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Prediction Form & Model Output */}
            <div className="lg:col-span-2 space-y-6">
              <PricingPredictionForm
                product={currentProduct}
                competitorData={competitorData}
                inventory={pricingInventory}
                onSubmit={handleRunPrediction}
                onReset={resetPrediction}
                isLoading={isPredicting}
              />

              {predictionError && (
                <div role="alert" className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#991B1B]">Pricing analysis failed</p>
                    <p className="mt-1 text-xs text-[#7F1D1D]">{predictionError}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!lastPredictionPayload || isPredicting}
                    onClick={() => handleRunPrediction(lastPredictionPayload)}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {prediction && (
                <>
                  <PricingPredictionResult
                    prediction={prediction}
                    product={currentProduct}
                    onGenerateRecommendation={handleGenerateRecommendation}
                    isGeneratingRecommendation={isGeneratingRec}
                  />

                </>
              )}

              {/* Pricing Trajectory Chart */}
              <PricingHistoryChart
                history={history}
                currency={currentProduct?.currency || 'INR'}
              />

              {/* Pricing History Table */}
              <PricingHistoryTable
                history={history}
                currency={currentProduct?.currency || 'INR'}
                isLoading={isHistoryLoading}
              />
              {historyError && (
                <div role="status" className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-[#92400E]">
                  <span>Pricing history could not be loaded: {historyError}</span>
                  <Button variant="outline" size="sm" onClick={refreshHistory}>Retry</Button>
                </div>
              )}
            </div>

            {/* Right Column: AI Recommendations & Decision Notes */}
            <div className="space-y-6">
              {recommendation ? (
                <RecommendationCard
                  recommendation={recommendation}
                  product={currentProduct}
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
                    Run the analysis first, then save its backend recommendation for review.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={isGeneratingRec}
                    disabled={!prediction || isGeneratingRec}
                    onClick={handleGenerateRecommendation}
                    leftIcon={Sparkles}
                    className="w-full justify-center"
                  >
                    {isGeneratingRec ? 'Saving...' : prediction ? 'Generate Recommendation' : 'Run Analysis First'}
                  </Button>
                </div>
              )}
              {recommendationError && (
                <div role="alert" className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3 text-xs text-[#991B1B]">
                  Recommendation could not be saved: {recommendationError}
                </div>
              )}

              {/* Decision Support Insights */}
              <PricingInsight
                product={currentProduct}
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
        product={currentProduct}
        onProceedToApply={(rec) => setApplyDialogRec(rec)}
      />

      {/* Apply Confirmation Dialog */}
      <ApplyRecommendationDialog
        isOpen={Boolean(applyDialogRec)}
        onClose={() => setApplyDialogRec(null)}
        onConfirm={handleConfirmApply}
        recommendation={applyDialogRec}
        product={currentProduct}
        isApplying={isApplying}
      />
    </div>
  );
}
