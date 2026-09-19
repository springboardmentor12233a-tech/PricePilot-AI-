import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
    <div className="space-y-6">
      {/* Page Header with Model Status */}
      <ForecastHeader
        selectedProduct={product}
        isLoading={isContextLoading || isForecastLoading}
        onRefresh={handleRefresh}
      />

      {/* Product Selection Panel */}
      <ProductSelector
        organizationId={currentOrganizationId}
        selectedProductId={selectedProductId}
        onSelectProduct={handleSelectProduct}
        disabled={isForecastLoading}
      />

      {/* Main Workspace Body */}
      {!selectedProductId ? (
        <ForecastEmptyState
          type="no_product"
          title="Select a Product to Begin Demand Forecasting"
          description="Choose a product from your organization catalog above to configure scenario factors, evaluate price elasticity, and view server-side model forecasts."
        />
      ) : isContextLoading && !product ? (
        <ForecastSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Baseline Product Signals */}
          <ForecastContextCard
            product={product}
            inventory={inventory}
            competitorData={competitorData}
          />

          {/* Horizon Selector */}
          <ForecastHorizonSelector
            selectedHorizon={selectedHorizon}
            onSelectHorizon={setSelectedHorizon}
            disabled={isForecastLoading}
          />

          {/* Scenario & Prediction Inputs */}
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

          {/* Active Forecast Results */}
          {forecast ? (
            <div className="space-y-6">
              {/* Primary Metric Strip */}
              <DemandSummaryCard
                forecast={forecast}
                product={product}
                selectedHorizon={selectedHorizon}
              />

              {/* 2-Column Analytics Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left (2 cols): Visual Chart & Historical Sales Ledger */}
                <div className="lg:col-span-2 space-y-6">
                  <ForecastChart
                    historicalSales={historicalSales}
                    forecast={forecast}
                    product={product}
                  />

                  <HistoricalDemandTable
                    sales={historicalSales}
                    currency={product?.currency || 'INR'}
                    isLoading={isHistoryLoading}
                  />
                </div>

                {/* Right (1 col): Trend & Confidence Intelligence */}
                <div className="space-y-6">
                  <DemandTrendCard
                    trend={forecast.trend}
                    forecastPoints={forecast.forecastPoints}
                  />

                  <ForecastConfidenceCard
                    confidence={forecast.confidence}
                  />

                  {/* Explanatory Factors / Elasticity if provided */}
                  {(forecast.elasticity !== null || forecast.reason) && (
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block">
                        Model Explanation Factors
                      </span>
                      {forecast.elasticity !== null && (
                        <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#F1F5F9]">
                          <span className="text-[#64748B]">Price Elasticity Index:</span>
                          <span className="font-mono font-bold text-[#0F172A]">
                            {forecast.elasticity.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {forecast.reason && (
                        <p className="text-xs text-[#475569] italic leading-relaxed pt-1">
                          "{forecast.reason}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <ForecastEmptyState
                type="no_forecast"
                title="Generate a Forecast to View Demand Intelligence"
                description="Adjust scenario price and promotional assumptions above, then click 'Generate Forecast' to run the server-side XGBoost regression model."
              />

              {/* Still display historical transactions if any exist */}
              <HistoricalDemandTable
                sales={historicalSales}
                currency={product?.currency || 'INR'}
                isLoading={isHistoryLoading}
              />
            </div>
          )}

          {/* Model Architecture Technical Info Section */}
          <ModelInfoCard />
        </div>
      )}
    </div>
  );
}
