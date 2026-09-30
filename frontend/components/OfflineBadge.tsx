'use client';

import React from 'react';
import { Sparkles, Cpu } from 'lucide-react';

interface OfflineBadgeProps {
  isLiveGemini?: boolean;
  sourceModel?: string;
  source?: string;
}

export function OfflineBadge({ isLiveGemini, sourceModel, source }: OfflineBadgeProps) {
  const isLive = Boolean(source === 'LIVE' || (isLiveGemini && source !== 'OFFLINE_FALLBACK'));
  const statusText = isLive ? 'LIVE' : 'OFFLINE_FALLBACK';
  const modelText = sourceModel || 'gemini-3.8-flash';

  if (isLive) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          color: '#e0e7ff',
        }}
      >
        <Sparkles size={16} color="#818cf8" />
        <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>
          Source: {statusText} | Model: {modelText}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 14px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        color: 'var(--pastel-amber-text)',
      }}
    >
      <Cpu size={16} color="var(--pastel-amber-text)" />
      <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>
        Source: {statusText} | Model: {modelText}
      </span>
    </div>
  );
}
