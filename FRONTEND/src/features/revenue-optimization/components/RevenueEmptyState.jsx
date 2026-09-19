import React from 'react';
import { PackageSearch, AlertCircle, Sparkles, History, Calculator, HelpCircle } from 'lucide-react';
import Button from '../../../components/Button';

export default function RevenueEmptyState({
  type = 'no-product',
  title,
  description,
  actionText,
  onAction,
}) {
  const configs = {
    'no-product': {
      icon: PackageSearch,
      title: title || 'Select a product to begin revenue optimization.',
      description: description || 'Choose a product from your organization catalog above to inspect pricing context, simulate what-if candidate price scenarios, and evaluate revenue and profit yields.',
    },
    'no-cost': {
      icon: AlertCircle,
      title: title || 'Cost price is unavailable.',
      description: description || 'Revenue can be evaluated, but gross profit cannot be calculated without a valid unit cost price.',
    },
    'no-prediction': {
      icon: Calculator,
      title: title || 'Generate a demand prediction before evaluating the scenario.',
      description: description || 'Run the machine learning demand inference model to forecast units sold and project expected revenue.',
    },
    'no-recommendation': {
      icon: Sparkles,
      title: title || 'No pricing recommendation has been generated yet.',
      description: description || 'Request an AI recommendation from the server-side pricing optimization engine.',
    },
    'no-history': {
      icon: History,
      title: title || 'No pricing history is available for this product.',
      description: description || 'Historical pricing records and past applied adjustments will be tracked automatically.',
    },
  };

  const config = configs[type] || configs['no-product'];
  const Icon = config.icon;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-[#0F172A] max-w-md mx-auto">
        {config.title}
      </h3>
      <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1.5 leading-relaxed">
        {config.description}
      </p>

      {actionText && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
