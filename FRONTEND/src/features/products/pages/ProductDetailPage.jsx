import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductDetails from '../components/ProductDetails';
import ProductDetailsSkeleton from '../components/ProductDetailsSkeleton';
import Button from '../../../components/Button';
import { useProduct } from '../hooks/useProduct';
import { useCategories } from '../../categories/hooks/useCategories';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { selectedOrganizationId } = useOrganization();

  const {
    product,
    isLoading,
    error,
    refresh,
  } = useProduct(productId);

  const {
    categories,
  } = useCategories(selectedOrganizationId);

  // Look up category name if product has category_id
  const categoryName = product?.category_id
    ? categories.find((c) => String(c.id) === String(product.category_id))?.name ||
      product.category?.name ||
      '—'
    : product?.category?.name || '—';

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb Back Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Products</span>
        </button>
      </div>

      {isLoading ? (
        <ProductDetailsSkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-8 text-center max-w-lg mx-auto mt-12">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#DC2626] flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-[#0F172A]">Unable to load this product</h3>
          <p className="text-xs text-[#64748B] mt-1 mb-6 leading-relaxed">
            {error || 'The requested product could not be found or an error occurred while connecting to the backend.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="md"
              leftIcon={ArrowLeft}
              onClick={() => navigate('/products')}
            >
              Back to Products
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={RefreshCw}
              onClick={refresh}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : product ? (
        <ProductDetails
          product={product}
          categoryName={categoryName}
          onRefresh={refresh}
        />
      ) : (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-12 text-center">
          <p className="text-sm font-semibold text-[#0F172A]">Product not found</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => navigate('/products')}
          >
            Back to Products
          </Button>
        </div>
      )}
    </div>
  );
}
