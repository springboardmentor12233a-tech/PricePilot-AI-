import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Info, ArrowRight, Cpu, AlertCircle, CheckCircle2 } from 'lucide-react';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Badge from '../../../components/Badge';

export default function ExecutiveDemandOverview({
  latestDemandPrediction = null,
  isLoading = false,
}) {
  const navigate = useNavigate();

  return (
    <Card
      title="Demand Overview"
      subtitle="AI demand elasticity and XGBoost model telemetry"
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/forecast')}
          rightIcon={ArrowRight}
          className="text-xs text-[#2563EB]"
        >
          Explore Forecast
        </Button>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Model Evaluation Metric Badge */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#0F172A]">XGBoost Demand Model</p>
                <p className="text-[11px] text-[#64748B]">Model evaluation metric</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold font-mono text-[#0F172A]">Test R²: 0.8527</span>
              <span className="block text-[10px] text-[#64748B]">Validated test set</span>
            </div>
          </div>

          <p className="text-[11px] text-[#64748B] leading-relaxed">
            Evaluation metric represents historical offline model fit against validation splits. It does not represent real-time prediction confidence or an accuracy guarantee.
          </p>
        </div>

        {/* Prediction Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Latest Demand Prediction
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#0F172A]">
                {latestDemandPrediction !== null ? `${latestDemandPrediction} units` : 'Not available'}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Point estimate from POST /api/v1/pricing/predict
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Forecast Horizon Status
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-xs font-medium text-[#475569]">Point Prediction Only</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Multi-period forecasting is not currently available from the connected API.
            </p>
          </div>
        </div>

        {/* Data Availability Notice */}
        <div className="p-3 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1] flex items-start gap-2.5 text-[11px] text-[#475569]">
          <Info className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong>Analytical Notice:</strong> Point predictions model demand elasticity based on price, category, and inventory levels. Multi-period forecasts require temporal transaction streams.
          </span>
        </div>
      </div>
    </Card>
  );
}
