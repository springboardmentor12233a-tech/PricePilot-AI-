'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { CompetitorResponse } from '@/lib/types';
import { SkuSelector } from '@/components/SkuSelector';
import { MetricCard } from '@/components/MetricCard';
import { ErrorBanner, LoadingSkeleton } from '@/components/ErrorBanner';
import {
  Compass,
  Store,
  Globe,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';

export default function CompetitorPage() {
  const [itemId, setItemId] = useState('293375605257');
  const [storeId, setStoreId] = useState(1);

  const [data, setData] = useState<CompetitorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarket = async (sku = itemId, store = storeId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getMarketAnalysis({
        item_id: sku,
        store_id: store,
      });
      setData(response);
      setItemId(sku);
      setStoreId(store);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch market benchmark analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarket(itemId, storeId);
  }, []);

  const formatCurrency = (val?: number | null) =>
    val !== undefined && val !== null ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">
              <Compass size={28} color="var(--accent-amber)" />
              Market & Internal Channel Benchmark Analysis
            </h1>
            <p className="page-subtitle">
              Empirical price alignment across physical store locations, online digital channel benchmarks, and category peer distributions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-amber">
              Verified Internal Benchmarks Only
            </span>
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
        onSearch={(sku, store) => fetchMarket(sku, store)}
        isLoading={loading}
      />

      {error && <ErrorBanner message={error} onRetry={() => fetchMarket(itemId, storeId)} />}

      {/* Internal Benchmark Scope Notice */}
      <div className="alert-banner alert-banner-info">
        <Info size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.825rem', lineHeight: 1.5 }}>
          <strong>Data Integrity & Benchmark Scope:</strong> PricePilot uses strictly verified internal omnichannel data (physical stores vs regional online store listings) and intra-category statistical distributions. External competitor data is not fabricated or estimated without real-time API feeds.
        </div>
      </div>

      {loading ? (
        <div>
          <div className="grid-4" style={{ marginBottom: '20px' }}>
            <LoadingSkeleton height={130} />
            <LoadingSkeleton height={130} />
            <LoadingSkeleton height={130} />
            <LoadingSkeleton height={130} />
          </div>
          <LoadingSkeleton height={300} />
        </div>
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top 4 KPI Cards */}
          <div className="grid-4">
            <MetricCard
              label="Store Observed Price"
              value={formatCurrency(data.store_price)}
              subtitle={`Location: Store ${data.store_id}`}
              icon={Store}
              accentColor="#6366f1"
              tooltip="Current price collected from store point-of-sale"
            />

            <MetricCard
              label="Online Channel Benchmark"
              value={formatCurrency(data.internal_digital_channel.online_price)}
              subtitle={`Parity Status: ${data.internal_digital_channel.channel_alignment_status}`}
              icon={Globe}
              accentColor="#06b6d4"
              badge={{
                text: `${data.internal_digital_channel.channel_price_index}% Index`,
                variant: 'cyan',
              }}
            />

            <MetricCard
              label="Category Peer Median"
              value={formatCurrency(data.category_peer_benchmark.peer_median_price)}
              subtitle={`Rank: ${data.category_peer_benchmark.peer_percentile_rank.toFixed(0)}th percentile`}
              icon={Layers}
              accentColor="#8b5cf6"
              badge={{
                text: `${data.category_peer_benchmark.peer_count} Peer SKUs`,
                variant: 'purple',
              }}
            />

            <MetricCard
              label="Market Position Tier"
              value={data.market_position.market_position.replace(/_/g, ' ')}
              subtitle="Peer Group Alignment"
              icon={Compass}
              accentColor="#10b981"
              badge={{
                text: data.market_position.market_position.includes('BELOW') ? 'Below Benchmark' : data.market_position.market_position.includes('ABOVE') ? 'Above Benchmark' : 'Near Parity',
                variant: data.market_position.market_position.includes('BELOW') ? 'cyan' : data.market_position.market_position.includes('ABOVE') ? 'amber' : 'emerald',
              }}
            />
          </div>

          {/* 2-Column Section: Channel Comparison & Store Dispersion */}
          <div className="grid-2">
            {/* Section A: Channel Price Comparison */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Globe size={18} color="var(--accent-cyan)" />
                    A. Channel Price Parity Comparison
                  </div>
                  <div className="card-desc">Store physical shelf vs Online e-commerce channel</div>
                </div>
                <span className="badge badge-cyan">{data.internal_digital_channel.channel_alignment_status}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Physical Store Price:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(data.store_price)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Online Store Benchmark Price:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {formatCurrency(data.internal_digital_channel.online_price)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Channel Price Difference:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: (data.internal_digital_channel.channel_price_diff || 0) === 0 ? '#34d399' : '#fbbf24' }}>
                    {data.internal_digital_channel.channel_price_diff !== null && data.internal_digital_channel.channel_price_diff > 0 ? '+' : ''}
                    {formatCurrency(data.internal_digital_channel.channel_price_diff)} ({data.internal_digital_channel.channel_price_diff_pct}%)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Omnichannel Price Index:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {data.internal_digital_channel.channel_price_index}% (100 = Exact Parity)
                  </span>
                </div>
              </div>
            </div>

            {/* Section B: Store Price Dispersion */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Store size={18} color="var(--accent-primary)" />
                    B. Cross-Store Price Dispersion
                  </div>
                  <div className="card-desc">Variation across all {data.cross_store_dispersion.store_count} retail store locations</div>
                </div>
                <span className="badge badge-indigo">{data.cross_store_dispersion.store_price_dispersion_pct}% Dispersion</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Store Min Price</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--pastel-mint-text)', marginTop: '2px' }}>
                      {formatCurrency(data.cross_store_dispersion.store_min_price)}
                    </div>
                  </div>

                  <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Store Max Price</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--pastel-rose-text)', marginTop: '2px' }}>
                      {formatCurrency(data.cross_store_dispersion.store_max_price)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cross-Store Median:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(data.cross_store_dispersion.store_median_price)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Price Range Spread:</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {formatCurrency(data.cross_store_dispersion.store_price_range)} ({data.cross_store_dispersion.store_price_dispersion_pct}% spread)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Section: Category Peer Benchmark & Opportunity Signal */}
          <div className="grid-2">
            {/* Section C: Category Peer Benchmark */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Layers size={18} color="var(--accent-purple)" />
                    C. Category Peer Distribution Benchmark
                  </div>
                  <div className="card-desc">Product positioning within {data.category_peer_benchmark.peer_group_level}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Peer Group Peer Count:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {data.category_peer_benchmark.peer_count} Catalog Items
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Peer Price Band (Min - Max):</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {formatCurrency(data.category_peer_benchmark.peer_min_price)} — {formatCurrency(data.category_peer_benchmark.peer_max_price)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Peer Group Median Difference:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: data.category_peer_benchmark.peer_median_diff_pct >= 0 ? '#34d399' : '#38bdf8' }}>
                    {data.category_peer_benchmark.peer_median_diff >= 0 ? '+' : ''}{formatCurrency(data.category_peer_benchmark.peer_median_diff)} ({data.category_peer_benchmark.peer_median_diff_pct}%)
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                  {data.market_position.position_rationale}
                </p>
              </div>
            </div>

            {/* Section D: Opportunity Signals Review */}
            <div className="card" style={{ borderColor: 'rgba(245, 158, 11, 0.35)' }}>
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Sparkles size={18} color="var(--accent-amber)" />
                    D. Analytical Opportunity Signal
                  </div>
                  <div className="card-desc">Automated merchandising & pricing review triggers</div>
                </div>
                <span className="badge badge-amber">{data.pricing_opportunity.signal_priority} Priority</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--pastel-amber-text)', marginBottom: '4px' }}>
                    Trigger: {data.pricing_opportunity.opportunity_signal.replace(/_/g, ' ')}
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--pastel-amber-text)', lineHeight: 1.5 }}>
                    {data.pricing_opportunity.opportunity_rationale}
                  </p>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Suggested Merchandising Action
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {data.pricing_opportunity.review_suggested_action}
                  </p>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  * Analytical signals represent statistical heuristic flags and do not constitute guaranteed business outcomes.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
