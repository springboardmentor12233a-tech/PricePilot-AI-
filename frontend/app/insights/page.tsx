'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { InsightResponse, AIAlertItem } from '@/lib/types';
import { SkuSelector } from '@/components/SkuSelector';
import { ErrorBanner, LoadingSkeleton } from '@/components/ErrorBanner';
import { OfflineBadge } from '@/components/OfflineBadge';
import {
  Sparkles,
  FileText,
  Tag,
  TrendingUp,
  DollarSign,
  Compass,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Bell,
  ArrowRight,
  Shield,
  Info,
} from 'lucide-react';

export default function InsightsPage() {
  const [itemId, setItemId] = useState('293375605257');
  const [storeId, setStoreId] = useState(1);

  const [data, setData] = useState<InsightResponse | null>(null);
  const [alerts, setAlerts] = useState<AIAlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async (sku = itemId, store = storeId) => {
    setLoading(true);
    setError(null);
    try {
      const [response, alertsFeed] = await Promise.all([
        api.getBusinessInsights({ item_id: sku, store_id: store }),
        api.getAlerts(),
      ]);
      setData(response);
      setAlerts(alertsFeed);
      setItemId(sku);
      setStoreId(store);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI business insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights(itemId, storeId);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">
              <Sparkles size={28} color="var(--accent-primary)" />
              AI Business Insights & Executive Advisory
            </h1>
            <p className="page-subtitle">
              Generative multi-modal merchandising insights synthesized from XGBoost price clearance, autoregressive demand, and channel benchmarks.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {data && (
              <OfflineBadge
                isLiveGemini={data.is_live_gemini}
                sourceModel={data.source_model}
                source={data.source}
              />
            )}
            {data?._dataSource === 'MOCK_FALLBACK' || error || !data ? (
              <span className="badge badge-amber">DEMO / MOCK DATA</span>
            ) : (
              <span className="badge badge-emerald">LIVE API (FastAPI)</span>
            )}
          </div>
        </div>
      </div>

      {/* Selector */}
      <SkuSelector
        itemId={itemId}
        storeId={storeId}
        onSearch={(sku, store) => fetchInsights(sku, store)}
        isLoading={loading}
      />

      {error && <ErrorBanner message={error} onRetry={() => fetchInsights(itemId, storeId)} />}

      {/* Architecture Clarity Callout */}
      <div className="alert-banner alert-banner-info">
        <Info size={18} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.825rem', lineHeight: 1.5 }}>
          <strong>LLM Advisory Architecture:</strong> The Gemini model synthesizes structured ML outputs, price elasticity vectors, and historical POS trends into natural language executive summaries. The LLM does not perform raw statistical regressions or replace predictive models.
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <LoadingSkeleton height={140} />
          <LoadingSkeleton height={200} />
          <LoadingSkeleton height={240} />
        </div>
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Executive Summary */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
              border: '1px solid rgba(99, 102, 241, 0.35)',
            }}
          >
            <div className="card-header" style={{ borderColor: 'rgba(99, 102, 241, 0.25)' }}>
              <div className="card-title" style={{ color: '#ffffff' }}>
                <FileText size={20} color="var(--accent-primary)" />
                1. Executive Summary
              </div>
              <span className="badge badge-indigo">
                Target: SKU #{data.item_id} @ Store {data.store_id}
              </span>
            </div>
            <p style={{ fontSize: '0.975rem', lineHeight: 1.65, color: '#f1f5f9' }}>
              {data.executive_summary}
            </p>
          </div>

          {/* Section 2 & 3: Pricing Analysis & Demand Analysis */}
          <div className="grid-2">
            {/* 2. Pricing Analysis */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <Tag size={18} color="var(--accent-emerald)" />
                  2. Pricing Analysis
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                {data.pricing_rationale}
              </p>
            </div>

            {/* 3. Demand Analysis */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <TrendingUp size={18} color="var(--accent-cyan)" />
                  3. Demand Analysis & Trajectory
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                {data.demand_and_forecast_insights}
              </p>
            </div>
          </div>

          {/* Section 4 & 5: Revenue Opportunity & Market Analysis */}
          <div className="grid-2">
            {/* 4. Revenue Opportunity */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <DollarSign size={18} color="var(--accent-emerald)" />
                  4. Revenue Opportunity & Margin Elasticity
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                {data.promotional_and_historical_analysis}
              </p>
            </div>

            {/* 5. Market Analysis */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <Compass size={18} color="var(--accent-amber)" />
                  5. Market Positioning & Omnichannel Sync
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                Intra-store dispersion index is stable with negligible cannibalization risk. Omnichannel alignment ensures web store pricing parity with physical shelf tags.
              </p>
            </div>
          </div>

          {/* Section 6: Commercial Risks */}
          <div
            className="card"
            style={{
              borderColor: 'rgba(245, 158, 11, 0.35)',
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.6), rgba(245, 158, 11, 0.05))',
            }}
          >
            <div className="card-header">
              <div className="card-title" style={{ color: '#fef3c7' }}>
                <AlertTriangle size={18} color="var(--accent-amber)" />
                6. Commercial Risks & Merchandising Safeguards
              </div>
              <span className="badge badge-amber">Risk Mitigation</span>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#fde68a' }}>
              {data.commercial_risks}
            </p>
          </div>

          {/* Section 7: Prioritized Recommended Actions Cards */}
          <div className="card" style={{ borderColor: 'rgba(16, 185, 129, 0.35)' }}>
            <div className="card-header">
              <div className="card-title" style={{ color: '#ffffff' }}>
                <Lightbulb size={20} color="var(--accent-emerald)" />
                7. Prioritized Recommended Actions
              </div>
              <span className="badge badge-emerald">Strategic Action Checklist</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {(data.structured_recommendations || []).map((rec) => {
                const isHigh = rec.priority === 'HIGH';
                const isMed = rec.priority === 'MEDIUM';

                return (
                  <div
                    key={rec.id}
                    style={{
                      padding: '16px 18px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={18} color="#34d399" />
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {rec.title}
                        </span>
                      </div>
                      <span className={`badge badge-${isHigh ? 'rose' : isMed ? 'amber' : 'cyan'}`}>
                        Priority: {rec.priority}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      <strong>Recommendation:</strong> {rec.recommendation}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px', fontSize: '0.825rem' }}>
                      <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Reason: </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{rec.reason}</span>
                      </div>
                      <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Expected Impact: </span>
                        <span style={{ color: 'var(--pastel-mint-text)', fontWeight: 600 }}>{rec.expectedImpact}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Alerts Live Stream */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Bell size={18} color="var(--accent-cyan)" />
                AI Real-Time Radar Alerts
              </div>
              <span className="badge badge-cyan">{alerts.length} Active System Alerts</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.map((alt) => {
                const isHigh = alt.severity === 'HIGH';
                const isMed = alt.severity === 'MEDIUM';

                return (
                  <div
                    key={alt.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface)',
                      border: `1px solid ${isHigh ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-subtle)'}`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: isHigh ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <AlertTriangle size={18} color={isHigh ? '#fb7185' : '#f59e0b'} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {alt.title} — <span style={{ color: 'var(--pastel-lavender-text)' }}>{alt.productName}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge badge-${isHigh ? 'rose' : isMed ? 'amber' : 'gray'}`}>
                            {alt.severity}
                          </span>
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{alt.timestamp}</span>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        {alt.message}
                      </p>

                      <div style={{ fontSize: '0.8rem', color: '#c7d2fe', backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                        <strong>Recommended Action:</strong> {alt.recommendedAction}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
