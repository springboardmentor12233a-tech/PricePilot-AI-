import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldAlert, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Badge from '../../../components/Badge';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function ExecutiveRecommendationCenter({
  recommendations = [],
  currency = 'INR',
  isLoading = false,
  error = null,
}) {
  const navigate = useNavigate();

  const statusBadges = {
    PENDING: { label: 'Pending Review', variant: 'warning', icon: Clock },
    APPLIED: { label: 'Applied', variant: 'success', icon: CheckCircle2 },
    DISMISSED: { label: 'Dismissed', variant: 'neutral', icon: XCircle },
  };

  return (
    <Card
      title="Pricing Recommendations"
      subtitle="Algorithmic pricing proposals awaiting human executive review"
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/recommendations')}
          rightIcon={ArrowRight}
          className="text-xs text-[#2563EB]"
        >
          View All Recommendations
        </Button>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Responsible Pricing Governance Banner */}
        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs text-[#475569]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span className="font-medium">
              Review model recommendations before applying pricing changes.
            </span>
          </div>
          <span className="text-[11px] text-[#94A3B8] hidden sm:inline">Human in the loop</span>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="p-6 text-center text-xs text-[#64748B] animate-pulse">
            Loading recommendation data...
          </div>
        )}

        {/* Recommendations list */}
        {!isLoading && recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.slice(0, 4).map((rec) => {
              const statusKey = (rec.status || 'PENDING').toUpperCase();
              const badgeCfg = statusBadges[statusKey] || statusBadges.PENDING;
              const StatusIcon = badgeCfg.icon;

              const currentPrice = rec.current_price ?? rec.price ?? null;
              const recommendedPrice = rec.recommended_price ?? rec.new_price ?? null;

              return (
                <div
                  key={rec.id || rec.recommendation_id || Math.random()}
                  className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] bg-white shadow-2xs flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-[#0F172A] truncate">
                        {rec.product_name || `Product #${rec.product_id || '—'}`}
                      </p>
                      <Badge variant={badgeCfg.variant} className="text-[10px] shrink-0 inline-flex items-center gap-1">
                        <StatusIcon className="w-2.5 h-2.5" />
                        {badgeCfg.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-[#F8FAFC] rounded-lg text-xs">
                      <div>
                        <span className="text-[10px] text-[#64748B] block">Current</span>
                        <span className="font-mono font-medium text-[#0F172A]">
                          {currentPrice !== null ? formatCurrency(currentPrice, currency) : 'Not available'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#2563EB] font-semibold block">Recommended</span>
                        <span className="font-mono font-bold text-[#2563EB]">
                          {recommendedPrice !== null ? formatCurrency(recommendedPrice, currency) : 'Not available'}
                        </span>
                      </div>
                    </div>

                    {rec.expected_impact && (
                      <p className="text-[11px] text-[#64748B] mt-2 italic">
                        {rec.expected_impact}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] flex items-center justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/recommendations')}
                      className="text-xs h-8"
                    >
                      Review
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !isLoading && (
          <div className="p-6 text-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
            <p className="text-xs font-semibold text-[#0F172A]">
              No recommendations currently pending review.
            </p>
            <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
              Select any product in the Pricing Recommendations module to evaluate elasticity and generate optimization proposals.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/recommendations')}
              className="mt-3 text-xs"
            >
              Generate Recommendation
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
