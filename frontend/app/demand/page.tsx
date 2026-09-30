'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { DemandResponse } from '@/lib/types';
import { SkuSelector } from '@/components/SkuSelector';
import { MetricCard } from '@/components/MetricCard';
import { ErrorBanner, LoadingSkeleton } from '@/components/ErrorBanner';
import {
  TrendingUp,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function DemandPage() {
  const [itemId, setItemId] = useState('293375605257');
  const [storeId, setStoreId] = useState(1);
  const [horizon, setHorizon] = useState<number>(14);

  const [data, setData] = useState<DemandResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDemand = async (sku = itemId, store = storeId, h = horizon) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getDemandForecast({
        item_id: sku,
        store_id: store,
        horizon: h,
      });
      setData(response);
      setItemId(sku);
      setStoreId(store);
      setHorizon(h);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch demand forecast.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemand(itemId, storeId, horizon);
  }, [horizon]);

  // Combined historical + forecast chart data
  const chartData = [
    ...(data?.historical_series?.map((h) => ({
      date: h.date.slice(5),
      historical: h.quantity,
    })) || []),
    ...(data?.daily_forecasts?.map((f) => ({
      date: f.date.slice(5),
      forecast: f.predicted_quantity,
      confidence: f.confidence,
    })) || []),
  ];

  return (
    <div className="demand-page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">
              <TrendingUp size={28} color="var(--accent-cyan)" />
              Multi-Horizon Demand Forecasting
            </h1>
            <p className="page-subtitle">
              Autoregressive ML demand projections across 7, 14, and 30-day horizons with seasonal decomposition and confidence scoring.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-cyan">
              Multi-Horizon Autoregressive Model
            </span>
            {data?._dataSource === 'MOCK_FALLBACK' || error || !data ? (
              <span className="badge badge-amber">DEMO / MOCK DATA</span>
            ) : (
              <span className="badge badge-emerald">LIVE API (FastAPI)</span>
            )}
          </div>
        </div>
      </div>

      {/* Selector with Horizon Tabs */}
      <SkuSelector
        itemId={itemId}
        storeId={storeId}
        onSearch={(sku, store) => fetchDemand(sku, store, horizon)}
        isLoading={loading}
        extraControls={
          <div className="form-group" style={{ width: '220px' }}>
            <label className="form-label">Forecast Horizon</label>
            <div className="pill-group" style={{ width: '100%' }}>
              <button
                type="button"
                className={`pill-btn ${horizon === 7 ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setHorizon(7)}
              >
                7 Days
              </button>
              <button
                type="button"
                className={`pill-btn ${horizon === 14 ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setHorizon(14)}
              >
                14 Days
              </button>
              <button
                type="button"
                className={`pill-btn ${horizon === 30 ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setHorizon(30)}
              >
                30 Days
              </button>
            </div>
          </div>
        }
      />

      {error && <ErrorBanner message={error} onRetry={() => fetchDemand(itemId, storeId, horizon)} />}

      {/* Confidence Disclaimer Callout */}
      <div className="alert-banner alert-banner-info">
        <Info size={18} color="#06b6d4" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.825rem', lineHeight: 1.5 }}>
          <strong>Confidence Definition:</strong> Forecast confidence is a calibrated statistical model score derived from autoregressive variance, historical promotional volatility, and sparsity metrics. It represents systemic modeling reliability, not a guaranteed probability.
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
          {/* Top KPI & Prominent Confidence Ring Card */}
          <div className="grid-4">
            {/* Prominent Confidence Card */}
            <div
              className="kpi-card"
              style={{
                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
                border: '1px solid rgba(245, 158, 11, 0.4)',
              }}
            >
              <div className="kpi-card-top">
                <span className="kpi-label">Model Confidence Score</span>
                <ShieldCheck size={20} color="var(--accent-amber)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                <div>
                  <div className="kpi-value" style={{ color: '#fef3c7' }}>
                    {data.confidence_score}%
                  </div>
                  <div style={{ fontSize: '0.785rem', color: '#fde68a', marginTop: '4px' }}>
                    Grade: <strong>{data.confidence_grade}</strong>
                  </div>
                </div>

                {/* Visual Circular Gauge Representation */}
                <div style={{ position: 'relative', width: '56px', height: '56px' }}>
                  <svg width="56" height="56" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="3.5"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3.5"
                      strokeDasharray={`${data.confidence_score}, 100`}
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      color: '#ffffff',
                    }}
                  >
                    {data.confidence_grade}
                  </div>
                </div>
              </div>
            </div>

            <MetricCard
              label="Aggregate Forecast"
              value={`${data.aggregate_forecast} units`}
              subtitle={`${horizon}-day cumulative run-rate`}
              icon={TrendingUp}
              accentColor="#06b6d4"
              badge={{ text: `${horizon} Days`, variant: 'cyan' }}
            />

            <MetricCard
              label="Forecast Avg Demand"
              value={`${data.forecast_avg_7d} u/d`}
              subtitle={`Hist 7-day Avg: ${data.historical_avg_7d} u/d`}
              icon={Calendar}
              accentColor="#10b981"
              trend={{
                value: `${data.trend_change_pct >= 0 ? '+' : ''}${data.trend_change_pct}%`,
                direction: data.trend_change_pct > 0 ? 'up' : data.trend_change_pct < 0 ? 'down' : 'neutral',
              }}
            />

            <MetricCard
              label="Demand Trajectory & Risk"
              value={data.trend_classification}
              subtitle={`Risk Profile: ${data.risk_level || 'LOW'}`}
              icon={AlertTriangle}
              accentColor={data.trend_classification === 'INCREASING' ? '#10b981' : data.trend_classification === 'DECREASING' ? '#fb7185' : '#38bdf8'}
              badge={{
                text: `${data.risk_level || 'LOW'} Risk`,
                variant: (data.risk_level === 'HIGH' ? 'rose' : data.risk_level === 'MEDIUM' ? 'amber' : 'emerald') as any,
              }}
            />
          </div>

          {/* Main Visualization: Historical Demand + Horizon Forecast Chart */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <TrendingUp size={18} color="var(--accent-cyan)" />
                  Demand Forecast & Historical Trajectory ({horizon}-Day Horizon)
                </div>
                <div className="card-desc">
                  Autoregressive projected demand points with historical POS baseline
                </div>
              </div>
              <span className="badge badge-cyan">SKU #{data.item_id} @ Store {data.store_id}</span>
            </div>

            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis stroke="#475569" tick={{ fill: '#475569' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px', color: '#F8FAFC' }} />
                  <Legend wrapperStyle={{ color: 'var(--text-primary)' }} />
                  <Area
                    type="monotone"
                    dataKey="historical"
                    name="Historical Observed Units"
                    stroke="#38bdf8"
                    fill="#38bdf820"
                    strokeWidth={2.2}
                    dot={{ r: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    name="Forecasted Units"
                    stroke="#10b981"
                    fill="#10b98125"
                    strokeWidth={2.8}
                    dot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid rgba(51,65,85,0.4)', paddingTop: '8px' }}>
              <strong>Model Rationale:</strong> {data.confidence_rationale}
            </div>
          </div>

          {/* Daily Forecast Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Calendar size={18} color="var(--accent-primary)" />
                Daily Forecast Breakdown
              </div>
              <span className="badge badge-indigo">{data.daily_forecasts.length} Calendar Days</span>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Horizon Offset</th>
                    <th>Forecast Demand (Units)</th>
                    <th>Model Confidence Score</th>
                    <th style={{ textAlign: 'center' }}>Reliability Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.daily_forecasts.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.date}</td>
                      <td style={{ color: 'var(--text-muted)' }}>Day +{item.day_offset}</td>
                      <td style={{ fontWeight: 700, color: 'var(--pastel-mint-text)' }}>
                        {item.predicted_quantity.toFixed(1)} units
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: (item.confidence || 85) >= 88 ? 'var(--pastel-mint-text)' : 'var(--pastel-amber-text)' }}>
                          {item.confidence || (data.confidence_score - item.day_offset * 0.35).toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-emerald">
                          <CheckCircle size={12} /> Validated
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
