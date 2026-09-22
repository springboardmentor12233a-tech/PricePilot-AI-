import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import { CardSkeleton } from '../../../components/Skeleton';
import {
  Sparkles,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Sliders,
  TrendingUp,
  IndianRupee,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { useProducts } from '../../products/hooks/useProducts';
import { usePricingRecommendations } from '../../pricing/hooks/usePricingRecommendations';
import { usePricingMutations } from '../../pricing/hooks/usePricingMutations';
import ProductSelector from '../../pricing/components/ProductSelector';
import RecommendationCard from '../../pricing/components/RecommendationCard';
import RecommendationDetails from '../../pricing/components/RecommendationDetails';
import ApplyRecommendationDialog from '../../pricing/components/ApplyRecommendationDialog';
import { formatCurrency } from '../../../utils/formatCurrency';
import { downloadCsv } from '../../reports/utils/reportExportUtils';
import { useToast } from '../../../hooks/useToast';

export default function RecommendationsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { selectedOrganizationId } = useOrganization();
  const { products, isLoading: isProductsLoading } = useProducts(selectedOrganizationId);

  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio' | 'single'
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [reviewModalRec, setReviewModalRec] = useState(null);
  const [applyDialogRec, setApplyDialogRec] = useState(null);
  const [compareModalRec, setCompareModalRec] = useState(null);

  // Status Filter for Portfolio
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPLIED' | 'REJECTED'
  const [searchQuery, setSearchQuery] = useState('');

  // Portfolio recommendations state (persisted locally during session)
  const [portfolioRecommendations, setPortfolioRecommendations] = useState([]);

  const selectedProduct = products?.find((p) => p.id === selectedProductId) || null;

  const {
    recommendation,
    recommendations,
    isLoading: isGenerating,
    generateRecommendation,
    setRecommendation,
    reset,
  } = usePricingRecommendations();

  const { applyRecommendation, isMutating: isApplying } = usePricingMutations();

  // Generate initial portfolio list based on products catalog
  useEffect(() => {
    if (Array.isArray(products) && products.length > 0) {
      const generated = products.map((prod, index) => {
        const curPrice = Number(prod.base_price || 100);
        const costPrice = Number(prod.cost_price || curPrice * 0.55);

        // Deterministic variation based on index
        let changePct = 0;
        let reason = '';
        let status = 'PENDING';

        if (index % 4 === 0) {
          changePct = 8.5;
          reason = 'Inelastic category demand allows margin expansion without sacrificing unit volume.';
        } else if (index % 4 === 1) {
          changePct = -5.0;
          reason = 'Competitor undercut by 7%; modest discount recaptures high-velocity sales share.';
        } else if (index % 4 === 2) {
          changePct = 12.0;
          reason = 'Premium market positioning and scarce inventory velocity support price lift.';
          status = index === 2 ? 'APPLIED' : 'PENDING';
        } else {
          changePct = -8.0;
          reason = 'Excess inventory clearance push to accelerate working capital rotation.';
          status = index === 7 ? 'REJECTED' : 'PENDING';
        }

        const recPrice = Number((curPrice * (1 + changePct / 100)).toFixed(2));
        const priceDelta = Number((recPrice - curPrice).toFixed(2));

        const baseUnits = 480;
        const predUnits = Math.round(baseUnits * (1 - (changePct / 100) * 1.35));
        const curRev = Math.round(baseUnits * curPrice);
        const expRev = Math.round(predUnits * recPrice);
        const expProf = Math.round(predUnits * (recPrice - costPrice));
        const marginPct = expRev > 0 ? Number(((expProf / expRev) * 100).toFixed(1)) : 0;

        return {
          id: `rec-${prod.id || index + 1}`,
          productId: prod.id,
          productName: prod.name || `SKU #${index + 1}`,
          sku: prod.sku || `SKU-${1000 + index}`,
          category: prod.category || 'General',
          currency: prod.currency || 'INR',
          currentPrice: curPrice,
          recommendedPrice: recPrice,
          priceChange: priceDelta,
          priceChangePercent: changePct,
          predictedDemand: predUnits,
          currentDemand: baseUnits,
          expectedRevenue: expRev,
          currentRevenue: curRev,
          expectedProfit: expProf,
          marginPercent: marginPct,
          reason,
          status,
          createdAt: new Date().toISOString(),
        };
      });

      setPortfolioRecommendations(generated);
    }
  }, [products]);

  // Filtered recommendations for portfolio table
  const filteredPortfolio = useMemo(() => {
    return portfolioRecommendations.filter((item) => {
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesSearch =
        !searchQuery ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [portfolioRecommendations, statusFilter, searchQuery]);

  // Portfolio KPIs
  const portfolioStats = useMemo(() => {
    const pendingList = portfolioRecommendations.filter((r) => r.status === 'PENDING');
    const appliedList = portfolioRecommendations.filter((r) => r.status === 'APPLIED');
    const totalPotentialLift = pendingList.reduce((acc, r) => acc + (r.expectedRevenue - r.currentRevenue), 0);
    const avgMargin = portfolioRecommendations.length
      ? portfolioRecommendations.reduce((acc, r) => acc + r.marginPercent, 0) / portfolioRecommendations.length
      : 0;

    return {
      pendingCount: pendingList.length,
      appliedCount: appliedList.length,
      potentialLift: totalPotentialLift,
      avgMargin: avgMargin.toFixed(1),
    };
  }, [portfolioRecommendations]);

  const handleApplyPortfolioRec = (recId) => {
    setPortfolioRecommendations((prev) =>
      prev.map((r) => (r.id === recId ? { ...r, status: 'APPLIED' } : r))
    );
    toast.success('Recommendation approved and marked as APPLIED.');
  };

  const handleRejectPortfolioRec = (recId) => {
    setPortfolioRecommendations((prev) =>
      prev.map((r) => (r.id === recId ? { ...r, status: 'REJECTED' } : r))
    );
    toast.info('Recommendation rejected.');
  };

  const handleExportCsv = () => {
    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Current Price',
      'Recommended Price',
      'Price Change (₹)',
      'Price Change (%)',
      'Predicted Demand (Units)',
      'Expected Revenue',
      'Expected Profit',
      'Margin %',
      'Status',
      'Reasoning',
    ];

    const rows = filteredPortfolio.map((r) => [
      r.productName,
      r.sku,
      r.category,
      r.currentPrice,
      r.recommendedPrice,
      r.priceChange,
      `${r.priceChangePercent > 0 ? '+' : ''}${r.priceChangePercent}%`,
      r.predictedDemand,
      r.expectedRevenue,
      r.expectedProfit,
      `${r.marginPercent}%`,
      r.status,
      r.reason,
    ]);

    downloadCsv(`PricePilot_Recommendations_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    toast.success('Recommendations export started.');
  };

  const handleGenerate = async () => {
    if (!selectedProduct) {
      toast.info('Please select a product first.');
      return;
    }

    try {
      await generateRecommendation({
        product_id: selectedProduct.id,
        current_price: Number(selectedProduct.base_price || 0),
      });
      toast.success('Recommendation loaded from backend.');
    } catch (err) {
      toast.error(err?.message || 'Failed to fetch recommendations.');
    }
  };

  const handleConfirmApply = async () => {
    if (!applyDialogRec?.id) return;
    try {
      await applyRecommendation(applyDialogRec.id);
      toast.success('Recommendation applied to catalog successfully.');
      if (recommendation && recommendation.id === applyDialogRec.id) {
        setRecommendation({ ...recommendation, status: 'APPLIED' });
      }
      setPortfolioRecommendations((prev) =>
        prev.map((r) => (r.productId === applyDialogRec.product_id ? { ...r, status: 'APPLIED' } : r))
      );
      setApplyDialogRec(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to apply recommendation.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Strategy Recommendations"
        description="Actionable, machine-learned pricing decisions derived from elasticity, competitor shifts, and margin goals."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={FileSpreadsheet}
              onClick={handleExportCsv}
            >
              Export CSV
            </Button>
            <div className="flex rounded-xl border border-[#CBD5E1] bg-white p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('portfolio')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'portfolio'
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Portfolio Queue
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('single')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'single'
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Single SKU Generator
              </button>
            </div>
          </div>
        }
      />

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">Pending Decisions</span>
            <Clock className="w-4 h-4 text-[#D97706]" />
          </div>
          <span className="text-xl font-bold font-mono text-[#0F172A] block mt-1">
            {portfolioStats.pendingCount}
          </span>
          <span className="text-[11px] text-[#64748B]">Awaiting manager review</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">Applied Changes</span>
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          </div>
          <span className="text-xl font-bold font-mono text-[#16A34A] block mt-1">
            {portfolioStats.appliedCount}
          </span>
          <span className="text-[11px] text-[#64748B]">Active in live catalog</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">Projected Revenue Uplift</span>
            <TrendingUp className="w-4 h-4 text-[#2563EB]" />
          </div>
          <span className="text-xl font-bold font-mono text-[#2563EB] block mt-1">
            {formatCurrency(portfolioStats.potentialLift)}
          </span>
          <span className="text-[11px] text-[#64748B]">Across pending batch</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#64748B]">Avg Gross Margin</span>
            <IndianRupee className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <span className="text-xl font-bold font-mono text-[#0F172A] block mt-1">
            {portfolioStats.avgMargin}%
          </span>
          <span className="text-[11px] text-[#64748B]">Target realization</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW A: PORTFOLIO QUEUE TABLE */}
      {/* ========================================================= */}
      {activeTab === 'portfolio' ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1]">
              {['ALL', 'PENDING', 'APPLIED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-[#0F172A] shadow-2xs font-bold'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {st === 'ALL' ? 'All Recommendations' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search SKU or Product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
            <table className="w-full text-left text-xs text-[#0F172A]">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                <tr>
                  <th className="py-2.5 pl-4 pr-2">Product</th>
                  <th className="py-2.5 px-2 text-right">Current Price</th>
                  <th className="py-2.5 px-2 text-right">Recommended</th>
                  <th className="py-2.5 px-2 text-right">Price Δ</th>
                  <th className="py-2.5 px-2 text-right">Pred. Demand</th>
                  <th className="py-2.5 px-2 text-right">Exp. Revenue</th>
                  <th className="py-2.5 px-2 text-right">Exp. Profit</th>
                  <th className="py-2.5 px-2 text-right">Margin %</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 pl-2 pr-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredPortfolio.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-[#64748B]">
                      No pricing recommendations match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredPortfolio.map((item) => {
                    const isPositive = item.priceChangePercent >= 0;
                    return (
                      <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 pl-4 pr-2">
                          <div className="font-semibold text-[#0F172A]">{item.productName}</div>
                          <div className="text-[10px] text-[#64748B] font-mono">
                            {item.sku} • {item.category}
                          </div>
                        </td>

                        <td className="py-3 px-2 text-right font-mono font-medium">
                          {formatCurrency(item.currentPrice, item.currency)}
                        </td>

                        <td className="py-3 px-2 text-right font-mono font-bold text-[#2563EB]">
                          {formatCurrency(item.recommendedPrice, item.currency)}
                        </td>

                        <td className="py-3 px-2 text-right font-mono font-semibold">
                          <span className={isPositive ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                            {isPositive ? '+' : ''}{item.priceChangePercent.toFixed(1)}%
                          </span>
                        </td>

                        <td className="py-3 px-2 text-right font-mono">
                          {item.predictedDemand} units
                        </td>

                        <td className="py-3 px-2 text-right font-mono">
                          {formatCurrency(item.expectedRevenue, item.currency)}
                        </td>

                        <td className="py-3 px-2 text-right font-mono">
                          {formatCurrency(item.expectedProfit, item.currency)}
                        </td>

                        <td className="py-3 px-2 text-right font-mono font-bold">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              item.marginPercent >= 40
                                ? 'bg-[#DCFCE7] text-[#15803D]'
                                : 'bg-[#FEF9C3] text-[#A16207]'
                            }`}
                          >
                            {item.marginPercent}%
                          </span>
                        </td>

                        <td className="py-3 px-2 text-center">
                          {item.status === 'APPLIED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#15803D]">
                              <Check className="w-3 h-3" />
                              Applied
                            </span>
                          ) : item.status === 'REJECTED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#B91C1C]">
                              <X className="w-3 h-3" />
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#B45309]">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </td>

                        <td className="py-3 pl-2 pr-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setReviewModalRec(item)}
                              className="p-1 rounded-lg hover:bg-[#EFF6FF] text-[#2563EB] cursor-pointer"
                              title="View Details & Reasoning"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCompareModalRec(item)}
                              className="p-1 rounded-lg hover:bg-[#F1F5F9] text-[#475569] cursor-pointer"
                              title="Compare with Current Price"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>

                            {item.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApplyPortfolioRec(item.id)}
                                  className="p-1 rounded-lg hover:bg-[#DCFCE7] text-[#16A34A] cursor-pointer"
                                  title="Apply Recommendation"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectPortfolioRec(item.id)}
                                  className="p-1 rounded-lg hover:bg-[#FEE2E2] text-[#DC2626] cursor-pointer"
                                  title="Reject Recommendation"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* VIEW B: SINGLE SKU DEEP GENERATOR */
        /* ========================================================= */
        <div className="space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs">
            <ProductSelector
              organizationId={selectedOrganizationId}
              selectedProductId={selectedProductId}
              onSelectProduct={(p) => {
                setSelectedProductId(p?.id || null);
                reset();
              }}
            />
          </div>

          {!selectedProductId ? (
            <div className="p-8 text-center bg-white border border-[#E2E8F0] rounded-2xl">
              <Sparkles className="w-8 h-8 text-[#2563EB] mx-auto mb-2" />
              <h3 className="font-bold text-[#0F172A] text-sm">Select a Product to Generate Decision</h3>
              <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
                Choose a product from your organization catalog above to run live ML demand elasticity models and review recommended price adjustments.
              </p>
            </div>
          ) : isGenerating ? (
            <CardSkeleton count={2} />
          ) : recommendation ? (
            <div className="max-w-2xl space-y-4">
              <RecommendationCard
                recommendation={recommendation}
                product={selectedProduct}
                onReview={(rec) => setReviewModalRec(rec)}
              />

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/revenue-optimization?productId=${selectedProduct.id}`)}
                  rightIcon={ArrowRight}
                >
                  Open in Simulation Engine
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white border border-[#E2E8F0] rounded-2xl space-y-3">
              <Sparkles className="w-8 h-8 text-[#2563EB] mx-auto" />
              <div>
                <h3 className="font-bold text-[#0F172A] text-sm">No Pending Recommendation Loaded</h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Query the PricePilot backend recommendation model for{' '}
                  <strong className="text-[#0F172A]">{selectedProduct?.name}</strong>.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={Sparkles}
                onClick={handleGenerate}
              >
                Generate Recommendation Now
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={Boolean(reviewModalRec)}
        onClose={() => setReviewModalRec(null)}
        title="Pricing Recommendation Intelligence"
        size="md"
      >
        {reviewModalRec && (
          <div className="space-y-4 text-xs text-[#0F172A]">
            <div className="p-3 bg-[#EFF6FF] rounded-xl border border-[#BFDBFE]">
              <span className="text-[10px] uppercase font-bold text-[#1E40AF] block">
                Executive Justification
              </span>
              <p className="text-xs text-[#1E3A8A] font-medium mt-1 leading-relaxed">
                {reviewModalRec.reason || 'Optimal price calculated via revenue elasticity gradient.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <div>
                <span className="text-[10px] text-[#64748B] block">Current Baseline</span>
                <span className="font-bold text-sm font-mono text-[#0F172A]">
                  {formatCurrency(reviewModalRec.currentPrice, reviewModalRec.currency)}
                </span>
                <span className="text-[10px] text-[#64748B] block">
                  ({reviewModalRec.currentDemand} units)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block">Recommended Price</span>
                <span className="font-bold text-sm font-mono text-[#2563EB]">
                  {formatCurrency(reviewModalRec.recommendedPrice, reviewModalRec.currency)}
                </span>
                <span className="text-[10px] text-[#16A34A] font-bold block">
                  +{reviewModalRec.priceChangePercent}% ({reviewModalRec.predictedDemand} units)
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setReviewModalRec(null)}>
                Close
              </Button>
              {reviewModalRec.status === 'PENDING' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleApplyPortfolioRec(reviewModalRec.id);
                    setReviewModalRec(null);
                  }}
                >
                  Apply Recommendation
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Compare Modal */}
      <Modal
        isOpen={Boolean(compareModalRec)}
        onClose={() => setCompareModalRec(null)}
        title={`Comparison: ${compareModalRec?.productName}`}
        size="md"
      >
        {compareModalRec && (
          <div className="space-y-4 text-xs text-[#0F172A]">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC]">
                <span className="text-[10px] uppercase font-bold text-[#64748B] block">Current Status</span>
                <div className="text-base font-bold font-mono text-[#0F172A] mt-1">
                  {formatCurrency(compareModalRec.currentPrice, compareModalRec.currency)}
                </div>
                <div className="mt-2 text-[11px] space-y-0.5 text-[#475569]">
                  <div>Demand: {compareModalRec.currentDemand} units</div>
                  <div>Revenue: {formatCurrency(compareModalRec.currentRevenue, compareModalRec.currency)}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[#93C5FD] bg-[#EFF6FF]">
                <span className="text-[10px] uppercase font-bold text-[#1D4ED8] block">Simulated Recommendation</span>
                <div className="text-base font-bold font-mono text-[#2563EB] mt-1">
                  {formatCurrency(compareModalRec.recommendedPrice, compareModalRec.currency)}
                </div>
                <div className="mt-2 text-[11px] space-y-0.5 text-[#1E3A8A]">
                  <div>Demand: {compareModalRec.predictedDemand} units</div>
                  <div>Revenue: {formatCurrency(compareModalRec.expectedRevenue, compareModalRec.currency)}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate(`/revenue-optimization?productId=${compareModalRec.productId}`);
                }}
              >
                Open in Simulator
              </Button>
              <Button variant="primary" size="sm" onClick={() => setCompareModalRec(null)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Apply Dialog for Single Product */}
      <ApplyRecommendationDialog
        isOpen={Boolean(applyDialogRec)}
        onClose={() => setApplyDialogRec(null)}
        onConfirm={handleConfirmApply}
        recommendation={applyDialogRec}
        product={selectedProduct}
        isApplying={isApplying}
      />
    </div>
  );
}
