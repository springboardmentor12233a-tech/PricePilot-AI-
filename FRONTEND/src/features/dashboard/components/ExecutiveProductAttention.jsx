import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Package, CheckCircle2, ChevronRight } from 'lucide-react';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Badge from '../../../components/Badge';

export default function ExecutiveProductAttention({
  items = [],
  isLoading = false,
}) {
  const navigate = useNavigate();

  return (
    <Card
      title="Products Requiring Attention"
      subtitle="Catalog items identified with actionable inventory, cost, or competitor data gaps"
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/products')}
          rightIcon={ArrowRight}
          className="text-xs text-[#2563EB]"
        >
          View Full Catalog
        </Button>
      }
    >
      <div className="space-y-3 pt-1">
        {isLoading && (
          <div className="p-6 text-center text-xs text-[#64748B] animate-pulse">
            Auditing catalog health...
          </div>
        )}

        {!isLoading && items.length > 0 ? (
          <div className="divide-y divide-[#F1F5F9] border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
            {items.slice(0, 6).map(({ product, issues }) => (
              <div
                key={product.id}
                className="p-3.5 hover:bg-[#F8FAFC] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-[#0F172A] truncate">
                      {product.name}
                    </p>
                    {product.sku && (
                      <span className="text-[10px] text-[#94A3B8] font-mono shrink-0">
                        {product.sku}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {issues.map((issue, idx) => (
                      <Badge
                        key={idx}
                        variant={issue.severity === 'warning' ? 'warning' : 'neutral'}
                        className="text-[10px]"
                      >
                        {issue.label}
                      </Badge>
                    ))}
                    <span className="text-[11px] text-[#64748B] ml-1">
                      {issues[0]?.detail}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/products`)}
                    className="text-xs h-7 px-2 text-[#2563EB]"
                  >
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : !isLoading && (
          <div className="p-6 text-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="w-9 h-9 rounded-full bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-[#0F172A]">All catalog products healthy</p>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              No low-inventory, missing-cost, or unbenchmarked products detected in the active catalog.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
