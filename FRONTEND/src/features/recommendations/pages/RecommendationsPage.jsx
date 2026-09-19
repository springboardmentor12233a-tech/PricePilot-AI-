import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import Button from '../../../components/Button';
import EmptyState from '../../../components/EmptyState';
import { CardSkeleton } from '../../../components/Skeleton';
import { Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { useOrganization } from '../../organizations/hooks/useOrganization';
import { useProducts } from '../../products/hooks/useProducts';
import { usePricingRecommendations } from '../../pricing/hooks/usePricingRecommendations';
import { usePricingMutations } from '../../pricing/hooks/usePricingMutations';
import ProductSelector from '../../pricing/components/ProductSelector';
import RecommendationCard from '../../pricing/components/RecommendationCard';
import RecommendationDetails from '../../pricing/components/RecommendationDetails';
import ApplyRecommendationDialog from '../../pricing/components/ApplyRecommendationDialog';
import { useToast } from '../../../hooks/useToast';

export default function RecommendationsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { selectedOrganizationId } = useOrganization();
  const { products, isLoading: isProductsLoading } = useProducts(selectedOrganizationId);

  const [selectedProductId, setSelectedProductId] = useState(null);
  const [reviewModalRec, setReviewModalRec] = useState(null);
  const [applyDialogRec, setApplyDialogRec] = useState(null);

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

  // Reset if organization changes
  useEffect(() => {
    setSelectedProductId(null);
    reset();
  }, [selectedOrganizationId, reset]);

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
      setApplyDialogRec(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to apply recommendation.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Recommendations"
        description="Actionable AI pricing decisions derived from margin goals, competitor shifts, and inventory velocity."
        actions={
          selectedProductId && (
            <Button
              variant="outline"
              size="md"
              leftIcon={RefreshCw}
              disabled={isGenerating}
              onClick={handleGenerate}
            >
              Generate Recommendation
            </Button>
          )
        }
      />

      {/* Product Selection Bar */}
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
        <EmptyState
          icon={Sparkles}
          title="Select a Product to View Recommendations"
          description="Choose a product from your organization catalog above to generate and evaluate pricing recommendations."
        />
      ) : isGenerating ? (
        <CardSkeleton count={2} />
      ) : recommendation ? (
        <div className="max-w-2xl">
          <RecommendationCard
            recommendation={recommendation}
            product={selectedProduct}
            onReview={(rec) => setReviewModalRec(rec)}
          />

          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/pricing?productId=${selectedProduct.id}`)}
              rightIcon={ArrowRight}
            >
              Open Elasticity Simulator in Pricing
            </Button>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No Pending Recommendations"
          description="When PricePilot AI detects price-adjustment opportunities to increase margin or capture demand, they will be listed here for approval."
          actionText="Generate Recommendation"
          onAction={handleGenerate}
          actionIcon={Sparkles}
        />
      )}

      {/* Details Modal */}
      <RecommendationDetails
        isOpen={Boolean(reviewModalRec)}
        onClose={() => setReviewModalRec(null)}
        recommendation={reviewModalRec}
        product={selectedProduct}
        onProceedToApply={(rec) => setApplyDialogRec(rec)}
      />

      {/* Apply Dialog */}
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
