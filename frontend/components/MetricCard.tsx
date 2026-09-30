'use client';

import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus, HelpCircle } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  accentColor?: string;
  badge?: {
    text: string;
    variant: 'emerald' | 'indigo' | 'cyan' | 'amber' | 'rose' | 'purple' | 'gray';
  };
  trend?: {
    value: string | number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  tooltip?: string;
}

export function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  accentColor = '#6366f1',
  badge,
  trend,
  tooltip,
}: MetricCardProps) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="kpi-label">{label}</span>
          {tooltip && (
            <span title={tooltip} style={{ cursor: 'help', color: 'var(--text-muted)' }}>
              <HelpCircle size={13} />
            </span>
          )}
        </div>
        <div
          className="kpi-icon-wrap"
          style={{
            backgroundColor: `${accentColor}18`,
            border: `1px solid ${accentColor}35`,
          }}
        >
          <Icon size={19} color={accentColor} />
        </div>
      </div>

      <div className="kpi-value">{value}</div>

      <div className="kpi-meta">
        {trend && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              fontWeight: 700,
              fontSize: '0.785rem',
              color: trend.direction === 'up' ? '#34d399' : trend.direction === 'down' ? '#fb7185' : '#94a3b8',
            }}
          >
            {trend.direction === 'up' && <ArrowUpRight size={14} />}
            {trend.direction === 'down' && <ArrowDownRight size={14} />}
            {trend.direction === 'neutral' && <Minus size={14} />}
            {trend.value}
          </span>
        )}

        {badge && <span className={`badge badge-${badge.variant}`}>{badge.text}</span>}

        {subtitle && (
          <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>{subtitle}</span>
        )}
      </div>
    </div>
  );
}
