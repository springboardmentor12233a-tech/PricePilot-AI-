import React from 'react';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import { useNavigate } from 'react-router-dom';
import { PieChart, AlertCircle, ArrowUpRight } from 'lucide-react';
import formatCurrency from '../../../utils/formatCurrency';

export default function MarginPerformanceCard({
  selectedProduct = null,
  totalRevenue = null,
  totalGrossProfit = null,
  averageGrossMargin = null,
  currency = 'INR',
}) {
  const navigate = useNavigate();

  const hasCost = selectedProduct?.cost_price !== undefined && selectedProduct?.cost_price !== null;
  const costPrice = hasCost ? Number(selectedProduct.cost_price) : null;
  const basePrice = selectedProduct?.base_price ? Number(selectedProduct.base_price) : null;

  // Single-unit margin if base price and cost price are available
  const unitGrossProfit = basePrice !== null && costPrice !== null ? basePrice - costPrice : null;
  const unitMargin = unitGrossProfit !== null && basePrice > 0 ? (unitGrossProfit / basePrice) * 100 : null;

  return (
    <Card
      title="Profitability & Unit Margin"
      subtitle="Cost of goods sold attribution and contribution margin analysis"
      action={
        hasCost ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A] bg-[#DCFCE7] px-2.5 py-1 rounded-full">
            Cost Configured
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D97706] bg-[#FEF3C7] px-2.5 py-1 rounded-full">
            Missing Cost Price
          </span>
        )
      }
    >
      {!hasCost ? (
        <div className="py-6 px-4 bg-[#FFFBEB] rounded-xl border border-[#FDE68A] text-[#92400E]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-[#B45309]">Profitability metrics require product cost data.</h4>
              <p className="text-xs text-[#78350F] mt-1 leading-relaxed">
                Cost price is unavailable. Revenue can be evaluated, but gross profit and contribution margin cannot be calculated without cost of goods sold.
              </p>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(selectedProduct ? `/products/${selectedProduct.id}` : '/products')}
                  className="bg-white border-[#FCD34D] text-[#92400E] hover:bg-[#FEF3C7]"
                >
                  Configure Product Costs
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <span className="text-[11px] font-medium text-[#64748B]">Unit Cost Price</span>
              <div className="text-base font-bold text-[#0F172A] font-mono mt-1">
                {formatCurrency(costPrice, currency)}
              </div>
            </div>

            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <span className="text-[11px] font-medium text-[#64748B]">Unit Contribution Profit</span>
              <div className="text-base font-bold text-[#16A34A] font-mono mt-1">
                {unitGrossProfit !== null ? formatCurrency(unitGrossProfit, currency) : '—'}
              </div>
            </div>

            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <span className="text-[11px] font-medium text-[#64748B]">Unit Contribution Margin</span>
              <div className="text-base font-bold text-[#2563EB] font-mono mt-1">
                {unitMargin !== null ? `${unitMargin.toFixed(1)}%` : '—'}
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-xs text-[#166534] flex items-center justify-between">
            <span>
              Realized catalog margin baseline computed against {selectedProduct?.name || 'product'} catalog price of {formatCurrency(basePrice, currency)}.
            </span>
            <span className="font-semibold">{unitMargin !== null ? `${unitMargin.toFixed(1)}%` : ''}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
