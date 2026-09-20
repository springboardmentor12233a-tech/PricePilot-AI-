import React from 'react';
import { Sparkles, TrendingUp, Cpu, BarChart2, ShieldCheck } from 'lucide-react';
import SuggestedPrompt from './SuggestedPrompt';

const DEFAULT_PROMPTS = [
  {
    category: 'Performance',
    text: "Explain today's pricing performance and margin variance.",
  },
  {
    category: 'Elasticity',
    text: 'Why did predicted demand change for high-volume products?',
  },
  {
    category: 'Competition',
    text: "Analyze our competitive price index against primary rivals.",
  },
  {
    category: 'Optimization',
    text: 'Explain the current pricing recommendations and constraint rules.',
  },
];

export default function EmptyChatState({ onSelectPrompt, contextPage = 'dashboard' }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center">
      {/* Icon Badge */}
      <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center mb-3 shadow-2xs">
        <Sparkles className="w-6 h-6" />
      </div>

      <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
        How can I help with your pricing?
      </h3>
      <p className="text-xs text-[#64748B] mt-1 max-w-xs leading-relaxed">
        Ask about demand elasticity, competitor benchmarks, revenue simulations, or pricing rules.
      </p>

      {/* Suggested Prompts Grid */}
      <div className="w-full mt-5 space-y-2 text-left">
        <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider px-1">
          Suggested Questions
        </p>
        {DEFAULT_PROMPTS.map((item, idx) => (
          <SuggestedPrompt
            key={idx}
            category={item.category}
            text={item.text}
            onClick={onSelectPrompt}
          />
        ))}
      </div>
    </div>
  );
}
