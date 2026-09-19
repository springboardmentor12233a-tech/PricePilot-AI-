import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users2, ArrowRight, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Badge from '../../../components/Badge';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function ExecutiveCompetitorOverview({
  products = [],
  competitors = [],
  currency = 'INR',
  isLoading = false,
}) {
  const navigate = useNavigate();

  // Filter products that have competitor price data
  const matchedProducts = products
    .filter((p) => p.competitor_price !== null && p.competitor_price !== undefined && Number(p.competitor_price) > 0)
    .slice(0, 5);

  return (
    <Card
      title="Competitive Position"
      subtitle="Catalog price benchmarks against observed competitors"
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/competitors')}
          rightIcon={ArrowRight}
          className="text-xs text-[#2563EB]"
        >
          Manage Competitors
        </Button>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Tracked Competitors Count Summary */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4 text-[#2563EB]" />
            <span className="font-semibold text-[#0F172A]">
              {competitors.length} Competitor{competitors.length === 1 ? '' : 's'} Monitored
            </span>
          </div>
          <span className="text-[#64748B]">
            {matchedProducts.length} matched product benchmarks
          </span>
        </div>

        {/* Compact list of matched products */}
        {matchedProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                  <th className="py-2 pr-3 font-semibold">Product</th>
                  <th className="py-2 px-3 font-semibold text-right">Our Price</th>
                  <th className="py-2 px-3 font-semibold text-right">Competitor Price</th>
                  <th className="py-2 pl-3 font-semibold text-right">Price Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {matchedProducts.map((item) => {
                  const ourPrice = Number(item.base_price || 0);
                  const compPrice = Number(item.competitor_price || 0);
                  const diff = ourPrice - compPrice;
                  const diffPercent = compPrice > 0 ? (diff / compPrice) * 100 : 0;
                  const isCheaper = diff < 0;

                  return (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-2.5 pr-3 font-medium text-[#0F172A] truncate max-w-[160px]">
                        {item.name}
                        {item.sku && <span className="block text-[10px] text-[#94A3B8] font-mono">{item.sku}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-[#0F172A]">
                        {formatCurrency(ourPrice, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#64748B]">
                        {formatCurrency(compPrice, currency)}
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium font-mono ${
                            isCheaper
                              ? 'text-[#16A34A] bg-[#F0FDF4]'
                              : diff > 0
                              ? 'text-[#DC2626] bg-[#FEF2F2]'
                              : 'text-[#64748B] bg-[#F1F5F9]'
                          }`}
                        >
                          {diff > 0 ? '+' : ''}
                          {diffPercent.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
            <p className="text-xs font-semibold text-[#0F172A]">No competitor benchmarks matched yet.</p>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              Link competitors and log competitor prices in the Competitors module to activate real-time variance comparisons.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/competitors')}
              className="mt-3 text-xs"
            >
              Add Competitor Prices
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
