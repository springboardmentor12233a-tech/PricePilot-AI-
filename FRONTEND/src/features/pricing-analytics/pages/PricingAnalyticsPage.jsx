import React from 'react';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { usePricingAnalytics } from '../hooks/usePricingAnalytics';
import PricingAnalyticsHeader from '../components/PricingAnalyticsHeader';
import AnalyticsFilters from '../components/AnalyticsFilters';
import AnalyticsSummaryCards from '../components/AnalyticsSummaryCards';
import RevenuePerformanceCard from '../components/RevenuePerformanceCard';
import PricingPerformanceCard from '../components/PricingPerformanceCard';
import MarginPerformanceCard from '../components/MarginPerformanceCard';
import ProductPricingTable from '../components/ProductPricingTable';
import PricingHistoryTable from '../components/PricingHistoryTable';
import PricingInsights from '../components/PricingInsights';
import AnalyticsEmptyState from '../components/AnalyticsEmptyState';
import { CardSkeleton, TableSkeleton } from '../../../components/Skeleton';
import Button from '../../../components/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function PricingAnalyticsPage() {
  const { selectedOrganizationId } = useOrganization();

  const {
    products,
    filteredProducts,
    categories,
    competitors,
    selectedProductId,
    setSelectedProductId,
    selectedProduct,
    pricingHistory,
    rawPricingHistory,
    competitorPrices,
    isLoading,
    isHistoryLoading,
    error,
    historyError,
    lastUpdated,
    refresh,
    selectedCategory,
    setSelectedCategory,
    dateRange,
    setDateRange,
    selectedCompetitorId,
    setSelectedCompetitorId,
    pricingStatus,
    setPricingStatus,
    summaryMetrics,
    revenueChartData,
    priceHistoryChartData,
    demandVsPriceData,
    competitorPositionData,
    discountAnalysisData,
    recommendationStats,
    insights,
  } = usePricingAnalytics(selectedOrganizationId);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setDateRange('all');
    setSelectedCompetitorId('all');
    setPricingStatus('all');
  };

  if (!selectedOrganizationId) {
    return (
      <div className="py-12">
        <AnalyticsEmptyState
          type="info"
          title="Select an organization"
          description="Choose an organization from the top-bar selector to view pricing analytics and performance metrics."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PricingAnalyticsHeader
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        isLoading={isLoading}
        filteredProducts={filteredProducts}
        categories={categories}
        summaryMetrics={summaryMetrics}
        selectedProduct={selectedProduct}
      />

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-[#991B1B]">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            onClick={refresh}
            className="border-[#FCA5A5] text-[#991B1B] hover:bg-[#FEE2E2]"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 2. Scope & Filters */}
      <AnalyticsFilters
        products={products}
        categories={categories}
        competitors={competitors}
        selectedProductId={selectedProductId}
        onSelectProduct={setSelectedProductId}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        dateRange={dateRange}
        onChangeDateRange={setDateRange}
        selectedCompetitorId={selectedCompetitorId}
        onSelectCompetitor={setSelectedCompetitorId}
        pricingStatus={pricingStatus}
        onChangePricingStatus={setPricingStatus}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Summary Metric Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <AnalyticsSummaryCards
          summaryMetrics={summaryMetrics}
          selectedProduct={selectedProduct}
        />
      )}

      {/* 4. Primary Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Performance Timeline */}
        <RevenuePerformanceCard
          revenueChartData={revenueChartData}
          currency={summaryMetrics.currency}
          isLoading={isLoading}
          totalRevenue={summaryMetrics.totalRevenue}
        />

        {/* Pricing Intelligence (Price history, competitor position, demand, discount) */}
        <PricingPerformanceCard
          priceHistoryChartData={priceHistoryChartData}
          demandVsPriceData={demandVsPriceData}
          competitorPositionData={competitorPositionData}
          discountAnalysisData={discountAnalysisData}
          currency={summaryMetrics.currency}
          isLoading={isLoading || isHistoryLoading}
          selectedProduct={selectedProduct}
        />
      </div>

      {/* 5. Profitability & Descriptive Observations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profitability & Contribution Margin */}
        <MarginPerformanceCard
          selectedProduct={selectedProduct}
          totalRevenue={summaryMetrics.totalRevenue}
          totalGrossProfit={summaryMetrics.totalGrossProfit}
          averageGrossMargin={summaryMetrics.averageGrossMargin}
          currency={summaryMetrics.currency}
        />

        {/* Transparent Descriptive Insights */}
        <PricingInsights
          insights={insights}
          recommendationStats={recommendationStats}
        />
      </div>

      {/* 6. Product-Level Pricing Performance Table */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : (
        <ProductPricingTable
          products={filteredProducts}
          categories={categories}
          selectedProductId={selectedProductId}
          onSelectProduct={setSelectedProductId}
          currency={summaryMetrics.currency}
        />
      )}

      {/* 7. Detailed Pricing Revision Audit Log */}
      <PricingHistoryTable
        history={pricingHistory}
        currency={summaryMetrics.currency}
        isLoading={isHistoryLoading}
        error={historyError}
        productName={selectedProduct?.name || 'Selected Item'}
      />
    </div>
  );
}
