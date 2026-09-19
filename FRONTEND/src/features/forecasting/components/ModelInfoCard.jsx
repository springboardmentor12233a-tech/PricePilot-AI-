import React from 'react';
import { Cpu, Server, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

/**
 * ModelInfoCard Component
 * Displays technical facts about the server-side XGBoost demand prediction model.
 * Clarifies that model evaluation metrics (Test R²: 0.8527) are not per-prediction confidence scores.
 */
export default function ModelInfoCard({ className = '' }) {
  return (
    <div className={`bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 text-xs text-[#64748B] space-y-3 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#2563EB]" />
          <h4 className="font-semibold text-sm text-[#0F172A]">
            Demand Prediction Engine Architecture
          </h4>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0]">
          Server-Side XGBoost
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3">
          <span className="text-[10px] uppercase font-semibold text-[#94A3B8] block mb-1">
            Algorithm
          </span>
          <span className="text-xs font-semibold text-[#0F172A] block">
            XGBoost Regressor
          </span>
          <span className="text-[11px] text-[#64748B] mt-0.5 block">
            Extreme gradient boosted trees
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3">
          <span className="text-[10px] uppercase font-semibold text-[#94A3B8] block mb-1">
            Deployment Environment
          </span>
          <span className="text-xs font-semibold text-[#0F172A] block flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-[#2563EB]" />
            FastAPI Server-Side
          </span>
          <span className="text-[11px] text-[#64748B] mt-0.5 block">
            Zero client-side model execution
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3">
          <span className="text-[10px] uppercase font-semibold text-[#94A3B8] block mb-1">
            Offline Model Evaluation
          </span>
          <span className="text-xs font-semibold text-[#0F172A] block font-mono">
            Test R²: 0.8527
          </span>
          <span className="text-[11px] text-[#D97706] mt-0.5 block font-medium">
            Evaluation metric — not prediction confidence
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2 pt-1 text-[11px] text-[#64748B]">
        <Info className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
        <p>
          In accordance with enterprise ML security guidelines, feature preprocessing and inference are strictly confined to the backend. The browser communicates exclusively via authenticated JSON contracts.
        </p>
      </div>
    </div>
  );
}
