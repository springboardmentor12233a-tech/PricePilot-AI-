'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  PricingResponse,
  DemandResponse,
  RevenueResponse,
  CompetitorResponse,
  InsightResponse,
  ProductPerformanceItem,
} from '@/lib/types';
import { MetricCard } from '@/components/MetricCard';
import { ErrorBanner, LoadingSkeleton } from '@/components/ErrorBanner';
import {
  Package,
  ChevronLeft,
  Tag,
  TrendingUp,
  DollarSign,
  Compass,
  Sparkles,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function ProductDeepDivePage() {
  const params = useParams();
  const sku = (params?.sku as string) || '293375605257';
  const [storeId, setStoreId] = useState(1);

  const [pricing, setPricing] = useState<PricingResponse | null>(null);
  const [demand, setDemand] = useState<DemandResponse | null>(null);
  const [revenue, setRevenue] = useState<RevenueResponse | null>(null);
  const [market, setMarket] = useState<CompetitorResponse | null>(null);
  const [insights, setInsights] = useState<InsightResponse | null>(null);
  const [productMeta, setProductMeta] = useState<ProductPerformanceItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProductDossier = async (targetSku = sku, targetStore = storeId) => {
    setLoading(true);
    setError(null);
    try {
      const [pricingData, demandData, revenueData, marketData, insightsData, productInfo] = await Promise.all([
        api.getPricingRecommendation({ item_id: targetSku, store_id: targetStore }),
        api.getDemandForecast({ item_id: targetSku, store_id: targetStore, horizon: 14 }),
        api.getRevenueOptimization({ item_id: targetSku, store_id: targetStore }),
        api.getMarketAnalysis({ item_id: targetSku, store_id: targetStore }),
        api.getBusinessInsights({ item_id: targetSku, store_id: targetStore }),
        api.getProductBySku(targetSku, targetStore),
      ]);

      setPricing(pricingData);
      setDemand(demandData);
      setRevenue(revenueData);
      setMarket(marketData);
      setInsights(insightsData);
      setProductMeta(productInfo);

    } catch (err: any) {
      setError(err.message || 'Failed to load complete product intelligence dossier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductDossier(sku, storeId);
  }, [sku, storeId]);

  const formatCurrency = (val?: number) =>
    val !== undefined ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';

  const formatNumber = (val?: number) => (val !== undefined ? val.toLocaleString('en-US') : '0');

  // Combined timeline chart data
  const historicalPriceData = pricing?.historical_prices || [
    { date: 'Aug 05', price: 240.0, sales: 42 },
    { date: 'Aug 12', price: 242.5, sales: 45 },
    { date: 'Aug 19', price: 245.0, sales: 46 },
    { date: 'Aug 26', price: 248.0, sales: 48 },
    { date: 'Sep 02', price: 249.99, sales: 51 },
    { date: 'Sep 08', price: 249.99, sales: 53 },
  ];

  // Demand forecast chart data
  const demandForecastChartData = [
    ...(demand?.historical_series?.map((h) => ({ date: h.date.slice(5), historical: h.quantity })) || []),
    ...(demand?.daily_forecasts?.map((f) => ({
      date: f.date.slice(5),
      forecast: f.predicted_quantity,
      confidence: f.confidence,
    })) || []),
  ];

  // Revenue elasticity curve
  const elasticityChartData = revenue?.candidates_summary.map((c) => ({
    price: c.candidate_price,
    expectedRevenue: c.expected_daily_revenue,
    predictedDemand: c.predicted_daily_demand,
    isOptimal: c.is_revenue_optimal,
  })) || [];

  return (
    <div>
      {/* Back navigation & Header */}
      <div style={{ marginBottom: '16px' }}>
        <Link
          href="/products"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--accent-primary)',
            fontSize: '0.85rem',
            textDecoration: 'none',
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          <ChevronLeft size={16} /> Back to Catalog
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">
              <Package size={28} color="var(--accent-primary)" />
              {productMeta?.name || `Product Dossier #${sku}`}
            </h1>
            <p className="page-subtitle">
              SKU: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{sku}</strong> | Category: {productMeta?.category || 'Retail Consumer Unit'} | Store Location: {storeId}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="badge badge-indigo">Store {storeId}</span>
            <span className="badge badge-emerald">Active SKU</span>
            {pricing?._dataSource === 'MOCK_FALLBACK' || error || !pricing ? (
              <span className="badge badge-amber">DEMO / MOCK DATA</span>
            ) : (
              <span className="badge badge-emerald">LIVE API (FastAPI)</span>
            )}
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => loadProductDossier(sku, storeId)} />}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <LoadingSkeleton height={120} />
          <LoadingSkeleton height={280} />
          <LoadingSkeleton height={280} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top 4 Deep Dive KPI Cards */}
          <div className="grid-4">
            <MetricCard
              label="Current Reference Price"
              value={formatCurrency(pricing?.reference_price)}
              subtitle={`Predicted Clearing: ${formatCurrency(pricing?.predicted_clearing_price)}`}
              icon={Tag}
              accentColor="#6366f1"
            />
            <MetricCard
              label="Recommended Target Price"
              value={formatCurrency(pricing?.recommended_price)}
              subtitle={`Delta: +${pricing?.price_change_pct}% from ref`}
              icon={DollarSign}
              accentColor="#10b981"
              badge={{ text: 'Revenue Optimal', variant: 'emerald' }}
            />
            <MetricCard
              label="Forecast Demand (14-Day)"
              value={`${demand?.aggregate_forecast} units`}
              subtitle={`Avg. ${demand?.forecast_avg_7d} units/day`}
              icon={TrendingUp}
              accentColor="#06b6d4"
              badge={{ text: `${demand?.trend_classification}`, variant: 'cyan' }}
            />
            <MetricCard
              label="Model Confidence Score"
              value={`${demand?.confidence_score}%`}
              subtitle="Autoregressive Stability"
              icon={ShieldCheck}
              accentColor="#f59e0b"
              badge={{ text: `${demand?.confidence_grade} Confidence`, variant: 'amber' }}
            />
          </div>

          {/* Row 1: Historical Price & Demand Volume Trends */}
          <div className="grid-2">
            {/* Historical Price Trend */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Tag size={18} color="var(--accent-primary)" />
                    Observed Price & Sales Trajectory
                  </div>
                  <div className="card-desc">Historical timeline leading to current clearing level</div>
                </div>
              </div>

              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalPriceData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="price" stroke="#818cf8" domain={['auto', 'auto']} tickFormatter={(v) => `$${v}`} />
                    <YAxis yAxisId="sales" orientation="right" stroke="#06b6d4" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }} />
                    <Legend />
                    <Line yAxisId="price" type="monotone" dataKey="price" name="Shelf Price ($)" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line yAxisId="sales" type="monotone" dataKey="sales" name="Daily Units Sold" stroke="#06b6d4" strokeWidth={2} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Demand Forecast Chart */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <TrendingUp size={18} color="var(--accent-cyan)" />
                    14-Day Demand Forecast Horizon
                  </div>
                  <div className="card-desc">Historical sales vs projected daily demand run-rate</div>
                </div>
              </div>

              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={demandForecastChartData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }} />
                    <Legend />
                    <Area type="monotone" dataKey="historical" name="Historical Units" stroke="#38bdf8" fill="#38bdf820" strokeWidth={2} />
                    <Area type="monotone" dataKey="forecast" name="Forecast Units" stroke="#10b981" fill="#10b98120" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2: Revenue Optimization Elasticity Curve & Pricing Scenarios */}
          <div className="grid-2">
            {/* Revenue Elasticity Curve */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <DollarSign size={18} color="var(--accent-emerald)" />
                    Modeled Gross Revenue Elasticity
                  </div>
                  <div className="card-desc">Simulated daily revenue across candidate price grid</div>
                </div>
                <span className="badge badge-emerald">Optimal Vertex: {formatCurrency(revenue?.optimal_revenue_price)}</span>
              </div>

              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={elasticityChartData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="price" stroke="#64748b" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                    <YAxis stroke="#10b981" tickFormatter={(v) => `$${v}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="expectedRevenue" name="Expected Daily Revenue ($)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid rgba(51,65,85,0.4)', paddingTop: '8px' }}>
                Note: Modeled on gross revenue elasticity. Profit optimization requires product cost/COGS data.
              </div>
            </div>

            {/* Market & Benchmark Positioning Card */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Compass size={18} color="var(--accent-amber)" />
                    Market & Channel Parity Benchmark
                  </div>
                  <div className="card-desc">Internal digital channel vs physical store comparison</div>
                </div>
                <span className="badge badge-amber">{market?.market_position.market_position}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Online Digital Benchmark:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(market?.internal_digital_channel.online_price || undefined)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Channel Price Parity Index:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {market?.internal_digital_channel.channel_price_index}% (Aligned)
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cross-Store Price Range:</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {formatCurrency(market?.cross_store_dispersion.store_min_price)} - {formatCurrency(market?.cross_store_dispersion.store_max_price)}
                  </span>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#c7d2fe', marginBottom: '4px' }}>
                    Opportunity Signal: {market?.pricing_opportunity.opportunity_signal}
                  </div>
                  <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
                    {market?.pricing_opportunity.review_suggested_action}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: AI Insights & Recommendation Checklist */}
          {insights && (
            <div className="card" style={{ border: '1px solid rgba(99, 102, 241, 0.35)' }}>
              <div className="card-header">
                <div className="card-title">
                  <Sparkles size={18} color="var(--accent-primary)" />
                  AI Merchandising Recommendations for SKU #{sku}
                </div>
                <span className="badge badge-indigo">{insights.source_model}</span>
              </div>

              <p style={{ fontSize: '0.925rem', color: '#e2e8f0', lineHeight: 1.6, marginBottom: '16px' }}>
                {insights.executive_summary}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {insights.actionable_recommendations.map((action, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
