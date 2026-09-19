import React from 'react';
import { Sparkles } from 'lucide-react';
import RecommendationCard from './RecommendationCard';
import EmptyState from '../../../components/EmptyState';

export default function RecommendationList({
  recommendations = [],
  product,
  onReview,
  onGenerate,
  isGenerating = false,
  className = '',
}) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center shadow-xs ${className}`}>
        <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-[#0F172A] mb-1">
          No Pricing Recommendations Yet
        </h4>
        <p className="text-xs text-[#64748B] max-w-sm mx-auto mb-4">
          Run a demand prediction simulation above, then generate an AI-recommended price point tailored to this product.
        </p>
        {onGenerate && (
          <button
            type="button"
            disabled={isGenerating || !product}
            onClick={onGenerate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-xl hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Recommendation'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {recommendations.map((rec) => (
        <RecommendationCard
          key={rec.id || `rec-${rec.productId}`}
          recommendation={rec}
          product={product}
          onReview={onReview}
        />
      ))}
    </div>
  );
}
