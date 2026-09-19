import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import ProductStatusBadge from './ProductStatusBadge';
import ProductForm from './ProductForm';
import DeleteProductDialog from './DeleteProductDialog';
import VariantForm from './VariantForm';
import VariantTable from './VariantTable';
import InventorySummary from '../../inventory/components/InventorySummary';
import { formatCurrency } from '../../../utils/formatCurrency';
import { useProductMutations } from '../hooks/useProductMutations';
import { useCompetitorPrices } from '../../competitors/hooks/useCompetitorPrices';
import { useCompetitors } from '../../competitors/hooks/useCompetitors';
import { useCompetitorMutations } from '../../competitors/hooks/useCompetitorMutations';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import PriceComparisonCard from '../../competitors/components/PriceComparisonCard';
import CompetitorPriceTable from '../../competitors/components/CompetitorPriceTable';
import PriceHistoryChart from '../../competitors/components/PriceHistoryChart';
import CompetitorPriceForm from '../../competitors/components/CompetitorPriceForm';
import CompetitorProductMatch from '../../competitors/components/CompetitorProductMatch';
import { useToast } from '../../../hooks/useToast';
import {
  Package,
  Edit3,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  LineChart,
  Eye,
  ArrowRight,
  PlusCircle,
  Link2,
} from 'lucide-react';

export default function ProductDetails({
  product,
  categoryName = '—',
  onRefresh,
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const { updateProduct, deleteProduct, createVariant, isMutating } = useProductMutations();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

  // Competitor Intelligence Integration
  const { selectedOrganizationId } = useOrganization();
  const { competitors } = useCompetitors(selectedOrganizationId);
  const { prices: competitorPrices, refresh: refreshPrices } = useCompetitorPrices(product?.id);
  const { recordCompetitorPrice, matchProduct, isMutating: isCompetitorMutating } = useCompetitorMutations();

  const [isPriceFormOpen, setIsPriceFormOpen] = useState(false);
  const [isMatchOpen, setIsMatchOpen] = useState(false);

  if (!product) return null;

  const handleUpdate = async (payload) => {
    try {
      await updateProduct(product.id, payload);
      toast.success('Product updated successfully.');
      setIsEditOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message || 'Unable to update product.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(product.id);
      toast.success('Product deleted successfully.');
      setIsDeleteOpen(false);
      navigate('/products', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Unable to delete product.');
    }
  };

  const handleCreateVariant = async (payload) => {
    try {
      await createVariant(product.id, payload);
      toast.success('Variant created successfully.');
      setIsVariantModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.message || 'Unable to create variant.');
    }
  };

  // Calculate gross margin if cost and base price exist
  const hasMarginData =
    product.cost_price !== undefined &&
    product.cost_price !== null &&
    product.base_price !== undefined &&
    product.base_price !== null &&
    Number(product.base_price) > 0;

  const marginPercentage = hasMarginData
    ? (((Number(product.base_price) - Number(product.cost_price)) / Number(product.base_price)) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Header & Core Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name || 'Product'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Package className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#0F172A]">
                {product.name || 'Unnamed Product'}
              </h1>
              <ProductStatusBadge isActive={product.is_active} />
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#64748B]">
              <span className="font-mono">SKU: {product.sku || '—'}</span>
              <span>•</span>
              <span>Category: <span className="text-[#0F172A] font-medium">{categoryName}</span></span>
              {product.brand && (
                <>
                  <span>•</span>
                  <span>Brand: <span className="text-[#0F172A] font-medium">{product.brand}</span></span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <Button
            variant="primary"
            size="md"
            leftIcon={Sparkles}
            onClick={() => navigate(`/pricing?productId=${product.id}`)}
          >
            Pricing Intelligence
          </Button>
          <Button
            variant="outline"
            size="md"
            leftIcon={Edit3}
            onClick={() => setIsEditOpen(true)}
          >
            Edit Product
          </Button>
          <Button
            variant="danger"
            size="md"
            leftIcon={Trash2}
            onClick={() => setIsDeleteOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Grid: Details & Pricing Left / Inventory & Intelligence Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <Card title="General Specifications" subtitle="Catalog metadata & categorization">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#64748B] block mb-1">Product Name</span>
                <p className="font-semibold text-sm text-[#0F172A]">{product.name || '—'}</p>
              </div>

              <div>
                <span className="text-[#64748B] block mb-1">SKU</span>
                <p className="font-mono font-semibold text-sm text-[#0F172A]">{product.sku || '—'}</p>
              </div>

              <div>
                <span className="text-[#64748B] block mb-1">Brand</span>
                <p className="font-medium text-[#0F172A]">{product.brand || '—'}</p>
              </div>

              <div>
                <span className="text-[#64748B] block mb-1">Category</span>
                <p className="font-medium text-[#0F172A]">{categoryName}</p>
              </div>
            </div>

            {product.description && (
              <div className="mt-4 pt-4 border-t border-[#F1F5F9] text-xs">
                <span className="text-[#64748B] block mb-1">Description</span>
                <p className="text-[#334155] leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#94A3B8]">
              <span className="font-mono">Product ID: {product.id}</span>
              {product.created_at && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Added {new Date(product.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </Card>

          {/* Pricing Card */}
          <Card title="Pricing & Economics" subtitle="Base costs, retail price, and estimated gross margin">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60">
                <span className="text-xs text-[#64748B] block">Base Selling Price</span>
                <span className="text-lg font-bold font-mono text-[#0F172A] mt-1 block">
                  {formatCurrency(product.base_price, product.currency)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60">
                <span className="text-xs text-[#64748B] block">Cost Price</span>
                <span className="text-lg font-bold font-mono text-[#64748B] mt-1 block">
                  {formatCurrency(product.cost_price, product.currency)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/60">
                <span className="text-xs text-[#64748B] block">Calculated Margin</span>
                <span className={`text-lg font-bold font-mono mt-1 block ${
                  marginPercentage !== null && Number(marginPercentage) >= 0
                    ? 'text-emerald-600'
                    : 'text-[#64748B]'
                }`}>
                  {marginPercentage !== null ? `${marginPercentage}%` : '—'}
                </span>
              </div>
            </div>
          </Card>

          {/* Variants Section */}
          <Card>
            <VariantTable
              variants={product.variants || []}
              onAddVariant={() => setIsVariantModalOpen(true)}
            />
          </Card>

          {/* Competitor Price Intelligence Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Competitor Price Intelligence
                </h3>
                <p className="text-xs text-[#64748B]">
                  Observed marketplace pricing and competitive positioning for this product.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Link2}
                  onClick={() => setIsMatchOpen(true)}
                >
                  Match Competitor
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={PlusCircle}
                  onClick={() => setIsPriceFormOpen(true)}
                >
                  Record Observation
                </Button>
              </div>
            </div>

            <PriceComparisonCard
              productName={product.name}
              ourPrice={product.base_price}
              competitorPrices={competitorPrices}
              currency={product.currency}
            />

            <Card
              title="Competitor Price Points"
              subtitle="All observed competitor prices recorded for this product"
            >
              <CompetitorPriceTable
                prices={competitorPrices}
                ourPrice={product.base_price}
                competitors={competitors}
              />
            </Card>

            <Card
              title="Price Movement Trend"
              subtitle="Historical price trajectory comparing our price against competitor observations"
            >
              <PriceHistoryChart
                observations={competitorPrices}
                ourPrice={product.base_price}
                currency={product.currency}
              />
            </Card>
          </div>
        </div>

        {/* Right Column: Inventory & Next-Step Module Navigation */}
        <div className="space-y-6">
          {/* Inventory Health Summary */}
          <InventorySummary
            productId={product.id}
            productName={product.name}
          />

          {/* Future Module Integration Links */}
          <Card
            title="PricePilot AI Modules"
            subtitle="Connect intelligence layers to this product"
          >
            <div className="space-y-2.5 text-xs">
              <button
                type="button"
                onClick={() => navigate('/competitors')}
                className="w-full p-3 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB]/40 hover:bg-blue-50/40 transition-all flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#0F172A] group-hover:text-[#2563EB] block">
                      Competitor Intelligence
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Monitor market scraper price matches
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/pricing')}
                className="w-full p-3 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB]/40 hover:bg-blue-50/40 transition-all flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#0F172A] group-hover:text-indigo-600 block">
                      Pricing Intelligence
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      AI elastic recommendations & rules
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/forecast')}
                className="w-full p-3 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB]/40 hover:bg-blue-50/40 transition-all flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#0F172A] group-hover:text-violet-600 block">
                      Demand Forecast
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Predict sales velocity & stockout risk
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/revenue')}
                className="w-full p-3 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB]/40 hover:bg-blue-50/40 transition-all flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <LineChart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#0F172A] group-hover:text-emerald-600 block">
                      Revenue Analytics
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Historical turnover & margin realization
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Product Modal */}
      <ProductForm
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        initialData={product}
        isLoading={isMutating}
      />

      {/* Delete Product Confirmation Dialog */}
      <DeleteProductDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        productName={product.name || 'this product'}
        isLoading={isMutating}
      />

      {/* Variant Creation Modal */}
      <VariantForm
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        onSubmit={handleCreateVariant}
        productId={product.id}
        isLoading={isMutating}
      />

      {/* Record Competitor Price Observation Modal */}
      <CompetitorPriceForm
        isOpen={isPriceFormOpen}
        onClose={() => setIsPriceFormOpen(false)}
        onSubmit={async (payload) => {
          await recordCompetitorPrice(payload);
          refreshPrices();
        }}
        products={[product]}
        competitors={competitors}
        initialProductId={String(product.id)}
        isLoading={isCompetitorMutating}
      />

      {/* Match Competitor Product Modal */}
      <CompetitorProductMatch
        isOpen={isMatchOpen}
        onClose={() => setIsMatchOpen(false)}
        onSubmit={async (payload) => {
          await matchProduct(payload);
          refreshPrices();
        }}
        products={[product]}
        competitors={competitors}
        initialProductId={String(product.id)}
        isLoading={isCompetitorMutating}
      />
    </div>
  );
}
