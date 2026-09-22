import React, { useState } from 'react';
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
import { RefreshCw, PlusCircle, Link2, Download } from 'lucide-react';
import ReportConfigModal from '../../reports/components/ReportConfigModal';
import { useToast } from '../../../hooks/useToast';

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

  return (
    <div className="space-y-6">
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

      {/* Loading State */}
      {isLoading && comparisons.length === 0 ? (
        <div className="py-24 text-center">
          <LoadingSpinner size="lg" text="Aggregating market intelligence data..." />
        </div>
      ) : error ? (
        <ErrorState
          title="Error Loading Market Intelligence"
          message={error}
          onRetry={refresh}
        />
      ) : (
        <div className="space-y-6">
          {/* Summary Metric Strip */}
          <MarketOverview summary={summary} />

          {/* Catalog Index & Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MarketPriceIndex comparisons={comparisons} />
            <MarketPosition summary={summary} />
          </div>

          {/* Gap & Opportunities Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PriceGapCard comparisons={comparisons} />
            <OpportunityList
              opportunities={opportunities}
              onRecordPrice={handleOpenPriceForm}
            />
          </div>

          {/* Market Comparison Chart */}
          <MarketTrendChart comparisons={comparisons} />

          {/* Full Competitive Price Analysis Table */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#0F172A]">
              Competitive Product Price Index
            </h3>
            <CompetitivePriceTable
              comparisons={comparisons}
              onRecordPrice={handleOpenPriceForm}
              onMatchProduct={handleOpenMatch}
            />
          </div>
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
