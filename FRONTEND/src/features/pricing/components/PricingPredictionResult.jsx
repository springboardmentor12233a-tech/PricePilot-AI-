import React from 'react';
import { Sparkles, ArrowRight, Info } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import Button from '../../../components/Button';
import PriceScenarioTable from './PriceScenarioTable';

export default function PricingPredictionResult({
  prediction,
  product,
  onGenerateRecommendation,
  isGeneratingRecommendation = false,
  className = '',
}) {
  if (!prediction) return null;

  const currency = product?.currency || 'INR';
  const price = prediction.predictedPrice;
  const currentPrice = prediction.currentPrice ?? product?.base_price ?? null;
  const competitorAvgPrice = prediction.competitorAvgPrice;
  const hasRecommendedPrice = Number.isFinite(Number(price)) && Number(price) > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Banner with Action */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
            <h3 className="text-sm font-semibold text-[#0F172A]">
              Pricing Analysis Completed
            </h3>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Backend pricing rules recommend{' '}
            <strong className="text-[#0F172A]">{hasRecommendedPrice ? formatCurrency(price, currency) : 'an unavailable price'}.</strong>
          </p>
        </div>

        {onGenerateRecommendation && (
          <Button
            variant="primary"
            size="sm"
            onClick={onGenerateRecommendation}
            loading={isGeneratingRecommendation}
            disabled={!hasRecommendedPrice || isGeneratingRecommendation}
            leftIcon={Sparkles}
            rightIcon={ArrowRight}
            className="font-medium shadow-xs"
          >
            Generate Recommendation
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Current Price</span>
          <div className="mt-3 text-2xl font-bold text-[#0F172A]">
            {currentPrice !== null ? formatCurrency(currentPrice, currency) : 'Unavailable'}
          </div>
        </div>
        <div className="bg-white border border-[#BFDBFE] rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Recommended Price</span>
          <div className="mt-3 text-2xl font-bold text-[#0F172A]">
            {hasRecommendedPrice ? formatCurrency(price, currency) : 'Unavailable'}
          </div>
          {prediction.priceChangePercentage !== null && (
            <p className="mt-1 text-xs text-[#64748B]">{prediction.priceChangePercentage.toFixed(2)}% change from current price</p>
          )}
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Observed Competitor Average</span>
          <div className="mt-3 text-2xl font-bold text-[#0F172A]">
            {competitorAvgPrice !== null ? formatCurrency(competitorAvgPrice, currency) : 'Unavailable'}
          </div>
        </div>
      </div>

      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex gap-2 text-xs text-[#64748B]">
        <Info className="w-4 h-4 shrink-0 text-[#64748B]" />
        <span>Demand forecasts, causal elasticity, revenue estimates, profit estimates, and model confidence are unavailable from this pricing endpoint.</span>
      </div>

      {/* Explanatory Factors & Elasticity (ONLY if returned by backend) */}
      {(prediction.reason || prediction.elasticity !== null) && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#64748B]">
          {prediction.elasticity !== null && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0F172A]">Price Elasticity of Demand:</span>
              <span className="px-2 py-0.5 rounded-md bg-[#F1F5F9] font-mono text-[#334155]">
                {prediction.elasticity.toFixed(2)}
              </span>
            </div>
          )}
          {prediction.reason && (
            <p className="text-xs text-[#475569] italic flex-1 max-w-xl">
              "{prediction.reason}"
            </p>
          )}
        </div>
      )}

      {/* Candidate Scenarios Table if returned by backend */}
      {prediction.scenarios && prediction.scenarios.length > 0 && (
        <PriceScenarioTable
          scenarios={prediction.scenarios}
          currentPrice={product?.base_price}
          currency={currency}
        />
      )}
    </div>
  );
}

