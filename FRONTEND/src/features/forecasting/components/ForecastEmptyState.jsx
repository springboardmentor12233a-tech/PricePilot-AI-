import React from 'react';
import { Package, LineChart, AlertCircle, Info, Sparkles } from 'lucide-react';
import Button from '../../../components/Button';

/**
 * ForecastEmptyState Component
 * Clean and professional empty states for forecasting modules.
 */
export default function ForecastEmptyState({
  type = 'no_product',
  title,
  description,
  actionText,
  onAction,
  className = '',
}) {
  const configs = {
    no_product: {
      icon: Package,
      defaultTitle: 'Select a Product to Begin Demand Forecasting',
      defaultDesc: 'Choose an active product from your catalog above to configure scenario factors, evaluate price elasticity, and generate server-side demand predictions.',
      iconBg: 'bg-[#EFF6FF]',
      iconColor: 'text-[#2563EB]',
      borderColor: 'border-[#BFDBFE]',
    },
    no_forecast: {
      icon: LineChart,
      defaultTitle: 'Generate a Forecast to View Demand Intelligence',
      defaultDesc: 'Adjust test price, discount assumptions, and promotional flags above, then click "Generate Forecast" to run the server-side XGBoost regression model.',
      iconBg: 'bg-[#F8FAFC]',
      iconColor: 'text-[#64748B]',
      borderColor: 'border-[#E2E8F0]',
    },
    multi_period_unavailable: {
      icon: Info,
      defaultTitle: 'Multi-Period Forecasting Not Currently Available',
      defaultDesc: 'The connected FastAPI model provides single-point demand elasticity inference. Multi-period sequence projections will appear once dedicated time-series endpoints are active.',
      iconBg: 'bg-[#FEF3C7]',
      iconColor: 'text-[#D97706]',
      borderColor: 'border-[#FDE68A]',
    },
  };

  const current = configs[type] || configs.no_product;
  const Icon = current.icon;

  return (
    <div
      className={`bg-white border-2 border-dashed border-[#E2E8F0] rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xs ${className}`}
    >
      <div
        className={`w-12 h-12 rounded-2xl ${current.iconBg} border ${current.borderColor} ${current.iconColor} flex items-center justify-center mx-auto mb-4`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight mb-2">
        {title || current.defaultTitle}
      </h3>
      <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-lg mx-auto mb-6">
        {description || current.defaultDesc}
      </p>

      {actionText && onAction && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAction}
          leftIcon={Sparkles}
          className="mx-auto"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}
