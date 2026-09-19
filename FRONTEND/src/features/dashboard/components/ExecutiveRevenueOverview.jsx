import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ArrowRight } from 'lucide-react';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import RevenueTrendChart from '../../pricing-analytics/components/RevenueTrendChart';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function ExecutiveRevenueOverview({
  revenueChartData = [],
  totalRevenue = null,
  currency = 'INR',
  isLoading = false,
}) {
  const navigate = useNavigate();

  return (
    <Card
      title="Revenue Overview"
      subtitle="Realized sales revenue timeline derived from sales ingestion analytics"
      action={
        <div className="flex items-center gap-2">
          {totalRevenue !== null && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              <DollarSign className="w-3.5 h-3.5" />
              {formatCurrency(totalRevenue, currency)}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/revenue')}
            rightIcon={ArrowRight}
            className="text-xs text-[#2563EB]"
          >
            Detailed Analytics
          </Button>
        </div>
      }
    >
      <div className="pt-2">
        <RevenueTrendChart
          data={revenueChartData}
          currency={currency}
          isLoading={isLoading}
        />
      </div>
    </Card>
  );
}
