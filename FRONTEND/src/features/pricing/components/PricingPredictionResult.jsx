import React from 'react';
import { Sparkles, IndianRupee, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import Button from '../../../components/Button';
import PredictedDemandCard from './PredictedDemandCard';
import PredictionConfidenceCard from './PredictionConfidenceCard';
import PredictionTrendCard from './PredictionTrendCard';
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
  const price = prediction.predictedPrice !== null ? prediction.predictedPrice : product?.base_price;
  const cost = product?.cost_price;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Banner with Action */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
            <h3 className="text-sm font-semibold text-[#0F172A]">
              Prediction Output Received
            </h3>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Model forecast generated for price point{' '}
            <strong className="text-[#0F172A]">{formatCurrency(price, currency)}</strong>.
          </p>
        </div>

        {onGenerateRecommendation && (
          <Button
            variant="primary"
            size="sm"
            onClick={onGenerateRecommendation}
            loading={isGeneratingRecommendation}
            leftIcon={Sparkles}
            rightIcon={ArrowRight}
            className="font-medium shadow-xs"
          >
            Generate Recommendation
          </Button>
        )}
      </div>

      {/* Grid of Specialized Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PredictedDemandCard
          predictedDemand={prediction.predictedDemand}
          price={price}
          costPrice={cost}
          currency={currency}
        />

        <PredictionConfidenceCard confidence={prediction.confidence} />

        <PredictionTrendCard trend={prediction.trend} />
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

