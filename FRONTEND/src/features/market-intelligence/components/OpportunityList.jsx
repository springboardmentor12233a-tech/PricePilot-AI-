import React from 'react';
import Card from '../../../components/Card';
import Badge from '../../../components/Badge';
import Button from '../../../components/Button';
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OpportunityList({
  opportunities = [],
  onRecordPrice,
}) {
  const navigate = useNavigate();

  return (
    <Card
      title="Pricing Attention & Opportunities"
      subtitle="Factual catalog variance flags derived from observed competitor price points"
      headerAction={
        opportunities.length > 0 ? (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-100">
            {opportunities.length} Items
          </span>
        ) : null
      }
    >
      {opportunities.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#64748B]">
          <AlertCircle className="w-6 h-6 text-[#94A3B8] mx-auto mb-2" />
          <p className="font-semibold text-[#0F172A]">No immediate pricing flags identified</p>
          <p className="mt-0.5 text-[11px]">
            All tracked products are currently aligned within normal market variance tolerances.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#F1F5F9] -mx-4 -my-2">
          {opportunities.slice(0, 6).map((opp) => (
            <div
              key={opp.id}
              className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC]/80 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={opp.badgeVariant || 'neutral'} size="sm" dot>
                    {opp.badgeLabel}
                  </Badge>
                  <span className="text-xs font-semibold text-[#0F172A]">
                    {opp.productName}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {opp.message}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {opp.type === 'untracked' && onRecordPrice ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRecordPrice(opp.productId)}
                  >
                    Record Price
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    rightIcon={ArrowRight}
                    onClick={() => navigate(`/products/${opp.productId}`)}
                  >
                    {opp.actionLabel || 'Review pricing'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
