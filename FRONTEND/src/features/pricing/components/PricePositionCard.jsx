import React from 'react';
import { Target } from 'lucide-react';
import Badge from '../../../components/Badge';
import { determineMarketPosition } from '../../competitors/utils/priceAnalysis';

export default function PricePositionCard({
  product,
  competitorData,
  className = '',
}) {
  const ourPrice = product?.base_price !== undefined && product?.base_price !== null
    ? Number(product.base_price)
    : null;

  const marketAvg = competitorData?.marketAverage || competitorData?.latestPrice || null;
  const position = determineMarketPosition(ourPrice, marketAvg);

  const getBadgeVariant = (variant) => {
    switch (variant) {
      case 'warning':
        return 'warning';
      case 'info':
        return 'primary';
      case 'neutral':
      default:
        return 'default';
    }
  };

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          Market Position
        </span>
        <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
          <Target className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Badge variant={getBadgeVariant(position.variant)} dot size="md">
          {position.label}
        </Badge>
      </div>

      <p className="text-xs text-[#64748B] leading-relaxed pt-2 border-t border-[#F1F5F9]">
        {position.description}
      </p>
    </div>
  );
}
