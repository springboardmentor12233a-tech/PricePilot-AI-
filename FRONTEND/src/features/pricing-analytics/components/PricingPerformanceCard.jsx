import React, { useState } from 'react';
import Card from '../../../components/Card';
import PriceHistoryChart from './PriceHistoryChart';
import DemandPricingChart from './DemandPricingChart';
import CompetitorPositionChart from './CompetitorPositionChart';
import DiscountAnalysisChart from './DiscountAnalysisChart';
import { LineChart, BarChart2, ScatterChart as ScatterIcon, Percent } from 'lucide-react';

export default function PricingPerformanceCard({
  priceHistoryChartData = [],
  demandVsPriceData = [],
  competitorPositionData = [],
  discountAnalysisData = [],
  currency = 'INR',
  isLoading = false,
  selectedProduct = null,
}) {
  const [activeTab, setActiveTab] = useState('history'); // 'history', 'competitor', 'demand', 'discount'

  const productName = selectedProduct?.name || 'Selected Item';

  return (
    <Card
      title="Pricing Intelligence & Behavior"
      subtitle={`Multi-dimensional pricing analysis for ${productName}`}
      action={
        <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Price History</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('competitor')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'competitor'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Competitor Position</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('demand')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'demand'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <ScatterIcon className="w-3.5 h-3.5" />
            <span>Price vs Volume</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discount')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'discount'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Discount Tiers</span>
          </button>
        </div>
      }
    >
      <div className="pt-2">
        {activeTab === 'history' && (
          <PriceHistoryChart
            data={priceHistoryChartData}
            currency={currency}
            isLoading={isLoading}
            productName={productName}
          />
        )}

        {activeTab === 'competitor' && (
          <CompetitorPositionChart
            data={competitorPositionData}
            currency={currency}
            isLoading={isLoading}
            productName={productName}
          />
        )}

        {activeTab === 'demand' && (
          <DemandPricingChart
            data={demandVsPriceData}
            currency={currency}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'discount' && (
          <DiscountAnalysisChart
            data={discountAnalysisData}
            currency={currency}
            isLoading={isLoading}
          />
        )}
      </div>
    </Card>
  );
}
