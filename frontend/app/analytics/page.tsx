'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { EDAAnalyticsData } from '@/lib/types';
import { ErrorBanner, LoadingSkeleton } from '@/components/ErrorBanner';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Tag,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState<EDAAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAnalyticsEDA();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load exploratory data analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const priceDistributionData = data?.price_distribution || [];
  const categoryPerformanceData = data?.category_performance || [];
  const storePerformanceData = data?.store_performance || [];
  const priceVsDemandScatter = data?.price_vs_demand_scatter || [];
  const correlationMatrix = data?.correlation_matrix || [];

  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">
              <BarChart3 size={28} color="var(--accent-primary)" />
              Analytics & Exploratory Data Intelligence
            </h1>
            <p className="page-subtitle">
              Interactive multi-dimensional distributions, price-demand correlations, category performance, and cross-store benchmarks.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {error || !data ? (
              <span className="badge badge-amber">OFFLINE / FALLBACK</span>
            ) : (
              <span className="badge badge-emerald">LIVE API (FastAPI)</span>
            )}
            <span className="badge badge-indigo">
              {(data?.total_records || 12773).toLocaleString()} Evaluated Records
            </span>
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchAnalytics} />}

      {loading ? (
        <LoadingSkeleton height={300} />
      ) : (
        <>

      {/* Row 1: Category Performance & Store Comparisons */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Category Performance */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Layers size={18} color="var(--accent-primary)" />
                Revenue & Units by Product Department
              </div>
              <div className="card-desc">Gross revenue contribution across merchandised categories</div>
            </div>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryPerformanceData} margin={{ left: 10, right: 10, top: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }} />
                <Bar dataKey="revenue" name="Realized Revenue ($)" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Store Performance */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <BarChart3 size={18} color="var(--accent-cyan)" />
                Cross-Store Revenue Breakdown
              </div>
              <div className="card-desc">Revenue distribution across retail store network</div>
            </div>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storePerformanceData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#64748b" tickFormatter={(v) => `$${v / 1000}k`} />
                <YAxis dataKey="store" type="category" stroke="#94a3b8" width={140} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }} />
                <Bar dataKey="revenue" name="Store Revenue ($)" fill="#06b6d4" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Price vs Demand Curve & Price Distribution */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Price vs Demand Relationship */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <TrendingUp size={18} color="var(--accent-emerald)" />
                Price vs Demand Scatter Relationship
              </div>
              <div className="card-desc">Empirical price elasticity distribution across sample SKUs</div>
            </div>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="price" name="Price ($)" unit="$" stroke="#64748b" tickFormatter={(v) => `$${v}`} />
                <YAxis dataKey="demand" name="Daily Demand (Units)" stroke="#64748b" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val} ${name === 'Price ($)' ? '$' : 'units'}`,
                    item.payload.name,
                  ]}
                />
                <Scatter name="SKUs" data={priceVsDemandScatter} fill="#10b981" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Price Tier Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Tag size={18} color="var(--accent-amber)" />
                Catalog Price Tier Distribution
              </div>
              <div className="card-desc">SKU density across retail price brackets</div>
            </div>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceDistributionData} margin={{ left: 10, right: 10, top: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '8px' }} />
                <Bar dataKey="count" name="SKU Count" radius={[6, 6, 0, 0]}>
                  {priceDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Statistical Correlation Heatmap Matrix */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Sparkles size={18} color="var(--accent-purple)" />
            Statistical Correlation Heatmap Matrix
          </div>
          <span className="badge badge-purple">Pearson r Correlation Vectors</span>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Feature Metric</th>
                <th style={{ textAlign: 'center' }}>vs Daily Demand (Units)</th>
                <th style={{ textAlign: 'center' }}>vs Gross Revenue ($)</th>
                <th style={{ textAlign: 'center' }}>vs Promotional Activity</th>
              </tr>
            </thead>
            <tbody>
              {correlationMatrix.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.feature}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        backgroundColor: row.vsDemand < 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: row.vsDemand < 0 ? '#fb7185' : '#34d399',
                      }}
                    >
                      {row.vsDemand > 0 ? '+' : ''}{row.vsDemand.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        backgroundColor: row.vsRevenue < 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: row.vsRevenue < 0 ? '#fb7185' : '#34d399',
                      }}
                    >
                      {row.vsRevenue > 0 ? '+' : ''}{row.vsRevenue.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        color: '#a5b4fc',
                      }}
                    >
                      {row.vsPromo > 0 ? '+' : ''}{row.vsPromo.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
