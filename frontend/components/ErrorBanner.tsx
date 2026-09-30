'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="alert-banner alert-banner-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AlertCircle size={20} color="var(--accent-rose)" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 600, color: 'var(--pastel-rose-text)' }}>Request Failed</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--pastel-rose-text)' }}>{message}</div>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
        >
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div
      className="skeleton"
      style={{
        width: '100%',
        height: `${height}px`,
        margin: '12px 0',
      }}
    />
  );
}
