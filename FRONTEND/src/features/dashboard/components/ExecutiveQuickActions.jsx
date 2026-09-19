import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Boxes,
  Users2,
  LineChart,
  Calculator,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import Card from '../../../components/Card';

export default function ExecutiveQuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Add Product',
      description: 'Register new SKU in catalog',
      path: '/products',
      icon: PlusCircle,
      accent: 'text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]',
    },
    {
      title: 'Manage Inventory',
      description: 'Audit warehouse stock and safety thresholds',
      path: '/inventory',
      icon: Boxes,
      accent: 'text-[#0D9488] bg-[#F0FDFA] border-[#99F6E4]',
    },
    {
      title: 'Analyze Competitors',
      description: 'Track price variances and scrape feeds',
      path: '/competitors',
      icon: Users2,
      accent: 'text-[#7C3AED] bg-[#F5F3FF] border-[#DDD6FE]',
    },
    {
      title: 'Predict Demand',
      description: 'Run XGBoost elasticity point estimates',
      path: '/forecast',
      icon: LineChart,
      accent: 'text-[#EA580C] bg-[#FFF7ED] border-[#FED7AA]',
    },
    {
      title: 'Optimize Revenue',
      description: 'Simulate margin and elasticity curves',
      path: '/revenue-simulation',
      icon: Calculator,
      accent: 'text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]',
    },
    {
      title: 'Pricing Analytics',
      description: 'Review realized historical revenue metrics',
      path: '/pricing-analytics',
      icon: BarChart3,
      accent: 'text-[#4F46E5] bg-[#EEF2FF] border-[#C7D2FE]',
    },
  ];

  return (
    <Card
      title="Quick Actions"
      subtitle="Direct navigation to primary intelligence and optimization modules"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.path}
              type="button"
              onClick={() => navigate(action.path)}
              className="p-3.5 rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] transition-all duration-150 text-left flex items-start gap-3 group cursor-pointer"
            >
              <div
                className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${action.accent}`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                    {action.title}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug line-clamp-1">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
