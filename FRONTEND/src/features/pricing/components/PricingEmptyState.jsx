import React from 'react';
import { Package, TrendingUp, Sparkles, History, Users, ArrowRight } from 'lucide-react';
import Button from '../../../components/Button';

/**
 * PricingEmptyState Component
 * Contextual enterprise empty states for Pricing Intelligence views.
 */
export default function PricingEmptyState({
  type = 'no_product',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) {
  const configs = {
    no_product: {
      icon: Package,
      defaultTitle: 'No Product Selected',
      defaultDesc: 'Select a product from your catalog above to evaluate pricing signals and run demand predictions.',
    },
    no_prediction: {
      icon: TrendingUp,
      defaultTitle: 'No Demand Prediction Run',
      defaultDesc: 'Adjust pricing parameters and run a prediction to evaluate expected demand volume and revenue impact.',
    },
    no_recommendation: {
      icon: Sparkles,
      defaultTitle: 'No Recommendation Generated',
      defaultDesc: 'Click "Generate Recommendation" to compute a data-driven optimal price proposal from backend algorithms.',
    },
    no_history: {
      icon: History,
      defaultTitle: 'No Pricing History Available',
      defaultDesc: 'No recorded price change logs or historical recommendation events were found for this product.',
    },
    no_competitors: {
      icon: Users,
      defaultTitle: 'No Competitor Benchmark Available',
      defaultDesc: 'No competitor price observations have been logged yet for this product in Market Intelligence.',
    },
  };

  const config = configs[type] || configs.no_product;
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;
  const displayDesc = description || config.defaultDesc;

  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center shadow-xs ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-base font-semibold text-[#0F172A] mb-1.5">{displayTitle}</h3>
      <p className="text-xs text-[#64748B] max-w-md leading-relaxed mb-5">{displayDesc}</p>

      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          rightIcon={ArrowRight}
          className="text-xs font-medium"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
