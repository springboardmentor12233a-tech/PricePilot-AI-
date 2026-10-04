"use client";

import React from "react";
import { Info } from "lucide-react";

interface ChartCaptionProps {
  text: string;
  className?: string;
  metricHighlight?: string;
}

export default function ChartCaption({ text, className = "", metricHighlight }: ChartCaptionProps) {
  return (
    <div
      className={`flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 text-xs text-slate-300 leading-relaxed shadow-sm transition-all duration-200 hover:border-slate-700/80 ${className}`}
    >
      <div className="p-1 rounded-lg bg-teal-500/10 text-teal-400 shrink-0 mt-0.5 border border-teal-500/20">
        <Info className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1">
        <span>{text}</span>
        {metricHighlight && (
          <span className="font-mono text-teal-300 font-semibold ml-1.5 px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 text-[11px]">
            {metricHighlight}
          </span>
        )}
      </div>
    </div>
  );
}
