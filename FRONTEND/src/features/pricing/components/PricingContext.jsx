import React from 'react';
import { Layers, Package, Tag, Layers3, TrendingUp, IndianRupee } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';
import Badge from '../../../components/Badge';
import { determineMarketPosition } from '../../competitors/utils/priceAnalysis';

/**
 * PricingContext Component
 * Combines real data from: Product API, Inventory API, Competitor API.
 * Displays only fields actually available. Uses "—" for unavailable values.
 * Strictly no invented values.
 */
export default function PricingContext({
  product,
  inventory,
  competitorData,
  discount,
  promotion,
  className = '',
}) {
  if (!product) return null;

  const currency = product.currency || 'INR';
  const currentPrice = product.base_price !== undefined && product.base_price !== null
    ? Number(product.base_price)
    : null;
  const costPrice = product.cost_price !== undefined && product.cost_price !== null
    ? Number(product.cost_price)
    : null;

  const latestComp = competitorData?.latestPrice !== undefined && competitorData?.latestPrice !== null
    ? Number(competitorData.latestPrice)
    : null;
  const marketAvg = competitorData?.marketAverage !== undefined && competitorData?.marketAverage !== null
    ? Number(competitorData.marketAverage)
    : null;

  const marketPos = determineMarketPosition(currentPrice, latestComp || marketAvg);

  const stock = inventory?.current_stock !== undefined && inventory?.current_stock !== null
    ? Number(inventory.current_stock)
    : null;

  const contextItems = [
    { label: 'Product', value: product.name || '—' },
    { label: 'SKU', value: product.sku || '—' },
    { label: 'Category', value: product.category?.name || product.category_id || '—' },
    { label: 'Brand', value: product.brand || '—' },
    {
      label: 'Current Price',
      value: currentPrice !== null ? formatCurrency(currentPrice, currency) : '—',
      highlight: true,
    },
    {
      label: 'Cost Price',
      value: costPrice !== null ? formatCurrency(costPrice, currency) : '—',
    },
    {
      label: 'Inventory',
      value: stock !== null ? `${stock.toLocaleString()} units` : '—',
    },
    {
      label: 'Active Discount',
      value: discount !== undefined && discount !== null && discount !== '' ? `${discount}%` : '—',
    },
    {
      label: 'Promotion',
      value: promotion !== undefined && promotion !== null ? (promotion ? 'Active' : 'None') : '—',
    },
    {
      label: 'Latest Competitor Price',
      value: latestComp !== null ? formatCurrency(latestComp, currency) : '—',
    },
    {
      label: 'Market Average',
      value: marketAvg !== null ? formatCurrency(marketAvg, currency) : '—',
    },
    {
      label: 'Market Position',
      value: marketPos ? marketPos.label : '—',
      badge: marketPos ? (
        <Badge
          variant={
            marketPos.variant === 'warning'
              ? 'warning'
              : marketPos.variant === 'info'
              ? 'primary'
              : 'default'
          }
          size="sm"
          dot
        >
          {marketPos.label}
        </Badge>
      ) : null,
    },
  ];

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#2563EB]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Pricing Context Baseline
          </h3>
        </div>
        <span className="text-[11px] text-[#94A3B8]">
          Real-time catalog, inventory & competitor signals
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
        {contextItems.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <span className="text-[11px] text-[#64748B] block">{item.label}</span>
            {item.badge ? (
              <div>{item.badge}</div>
            ) : (
              <div
                className={`font-medium truncate ${
                  item.highlight ? 'font-semibold text-[#0F172A] text-sm' : 'text-[#334155]'
                }`}
                title={typeof item.value === 'string' ? item.value : undefined}
              >
                {item.value}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
