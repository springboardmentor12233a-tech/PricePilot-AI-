import React from 'react';
import { Sliders, Play, Layers } from 'lucide-react';
import ScenarioInput from './ScenarioInput';
import Button from '../../../components/Button';

export default function ScenarioBuilder({
  onAddScenario,
  product,
  inventory,
  competitorData,
  onRunAll,
  pendingCount = 0,
  isEvaluating = false,
}) {
  if (!product) return null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">Candidate Scenario Builder</h2>
            <p className="text-[11px] text-[#64748B]">
              Configure test price points and run server-side demand inference
            </p>
          </div>
        </div>

        {pendingCount > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={onRunAll}
            loading={isEvaluating}
            leftIcon={Play}
          >
            Evaluate All Scenarios ({pendingCount})
          </Button>
        )}
      </div>

      <ScenarioInput
        onAddScenario={onAddScenario}
        defaultPrice=""
        defaultDiscount={product?.discount ? String(product.discount) : ''}
        defaultCompetitorPrice={competitorData?.latestPrice ? String(competitorData.latestPrice) : ''}
        defaultInventory={inventory?.current_stock !== undefined ? String(inventory.current_stock) : ''}
        currency={product?.currency || 'INR'}
      />
    </div>
  );
}
