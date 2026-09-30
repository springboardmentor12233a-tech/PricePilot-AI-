'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { DashboardSummaryResponse } from '@/lib/types';
import { MetricCard } from '@/components/MetricCard';
import { ErrorBanner, LoadingSkeleton } from '@/components/ErrorBanner';
import {
  DollarSign,
  TrendingUp,
  Tag,
  Sparkles,
  BarChart3,
  Layers,
  ArrowRight,
  ShieldCheck,
  Compass,
  Calendar,
  Filter,
  Package,
  Users,
  Shield,
  Briefcase,
  User as UserIcon,
  UserPlus,
  Bell,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Lock,
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
  Cell,
  PieChart,
  Pie,
  CartesianGrid,
} from 'recharts';

export default function DashboardPage() {
  const { role, usersList } = useAuth();
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStore, setSelectedStore] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [dateRange, setDateRange] = useState('LAST_30_DAYS');

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await api.getDashboardSummary();
      setData(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard summary metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Formatters
  const formatCurrency = (val?: number) =>
    val !== undefined ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';

  const formatNumber = (val?: number) => (val !== undefined ? val.toLocaleString('en-US') : '0');

  // Real chart datasets from FastAPI
  const revenueTrendData = data?.revenue_trend || [];
  const salesTrendData = data?.sales_trend || [];
  const priceComparisonData = data?.price_comparison_trend || [];
  const demandForecastData = data?.demand_forecast_trend || [];
  const categoryPerformanceData = data?.category_performance || [];

  // User Distribution for Admin
  const adminCount = usersList.filter((u) => u.role === 'ADMIN').length;
  const analystCount = usersList.filter((u) => u.role === 'BUSINESS_ANALYST').length;
  const standardUserCount = usersList.filter((u) => u.role === 'USER').length;
  const activeUsersCount = usersList.filter((u) => u.status === 'ACTIVE').length;

  const userRoleDistributionData = [
    { name: 'Administrators', count: adminCount, color: '#8b5cf6' },
    { name: 'Business Analysts', count: analystCount, color: '#06b6d4' },
    { name: 'Standard Users', count: standardUserCount, color: '#64748b' },
  ];

  // Donut data for Demand Trend distribution
  const demandDistributionData = data
    ? [
        { name: 'Increasing Demand', value: data.demand_kpis.demand_increasing_pct, color: '#10b981' },
        { name: 'Stable Demand', value: data.demand_kpis.demand_stable_pct, color: '#06b6d4' },
        { name: 'Decreasing Demand', value: data.demand_kpis.demand_decreasing_pct, color: '#f59e0b' },
      ]
    : [];

  // Revenue Opportunity Comparison data (Current vs Optimized)
  const revenueOpportunityBarData = data
    ? [
        { name: 'Reference Realized', revenue: data.revenue_kpis.total_realized_revenue, color: '#6366f1' },
        {
          name: 'Optimized Potential',
          revenue: data.revenue_kpis.optimized_revenue_potential || data.revenue_kpis.total_realized_revenue * 1.0784,
          color: '#10b981',
        },
      ]
    : [];

  return (
    <div>
      {/* Header — Role Specific Title and Actions */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">
              {role === 'ADMIN' && (
                <>
                  <Shield size={28} color="var(--accent-purple)" />
                  Executive & Platform Overview
                </>
              )}
              {role === 'BUSINESS_ANALYST' && (
                <>
                  <BarChart3 size={28} color="var(--accent-cyan)" />
                  Business Intelligence Dashboard
                </>
              )}
              {role === 'USER' && (
                <>
                  <Sparkles size={28} color="var(--accent-primary)" />
                  My Business Overview
                </>
              )}
            </h1>
            <p className="page-subtitle">
              {role === 'ADMIN' &&
                `Enterprise system status, user access directory, and cross-channel revenue performance (${formatNumber(data?.unique_items_count || 9333)} SKUs, ${data?.unique_stores_count || 4} Stores).`}
              {role === 'BUSINESS_ANALYST' &&
                `Real-time pricing elasticity, multi-horizon demand forecasting, and revenue lift intelligence across active catalog.`}
              {role === 'USER' &&
                `High-level view of retail sales trends, demand forecast projections, and prioritized AI product insights.`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {data?._dataSource === 'MOCK_FALLBACK' || error || !data ? (
              <span className="badge badge-amber">OFFLINE / FALLBACK</span>
            ) : (
              <span className="badge badge-emerald">LIVE API (FastAPI)</span>
            )}
            <Link href="/products" className="btn btn-secondary">
              <Package size={16} /> View Products
            </Link>
            {role === 'ADMIN' && (
              <Link href="/users" className="btn btn-primary" style={{ backgroundColor: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}>
                <Users size={16} /> User Management
              </Link>
            )}
            {role === 'BUSINESS_ANALYST' && (
              <Link href="/pricing" className="btn btn-primary">
                <Tag size={16} /> Run SKU Pricing
              </Link>
            )}
            {role === 'USER' && (
              <Link href="/insights" className="btn btn-primary">
                <Sparkles size={16} /> View Insights
              </Link>
            )}
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchSummary} />}

      {/* Global Filter Bar (Present on Admin and Analyst, simpler on User) */}
      <div className="control-bar">
        <div className="form-group" style={{ width: '180px' }}>
          <label className="form-label">Date Range Horizon</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="form-select"
            style={{ width: '100%' }}
          >
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="LAST_30_DAYS">Last 30 Days (Active)</option>
            <option value="QUARTER_TO_DATE">Quarter to Date</option>
          </select>
        </div>

        <div className="form-group" style={{ width: '160px' }}>
          <label className="form-label">Store Location</label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="form-select"
            style={{ width: '100%' }}
          >
            <option value="ALL">All Stores (1 - 4)</option>
            <option value="1">Store 1 (Flagship)</option>
            <option value="2">Store 2 (Suburban)</option>
            <option value="3">Store 3 (Regional)</option>
            <option value="4">Store 4 (Outlet)</option>
          </select>
        </div>

        {role !== 'USER' && (
          <div className="form-group" style={{ width: '200px' }}>
            <label className="form-label">Department / Category</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="form-select"
              style={{ width: '100%' }}
            >
              <option value="ALL">All Departments</option>
              <option value="Home">Home & Living</option>
              <option value="Electronics">Consumer Electronics</option>
              <option value="Audio">Audio & Acoustics</option>
            </select>
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '4px' }}>
          {role === 'ADMIN' && <span className="badge badge-purple">Admin Mode Active</span>}
          {role === 'BUSINESS_ANALYST' && <span className="badge badge-cyan">Analyst Workspace</span>}
          {role === 'USER' && <span className="badge badge-gray">Standard Access</span>}
          {data?._dataSource === 'MOCK_FALLBACK' || error || !data ? (
            <span className="badge badge-amber">OFFLINE / FALLBACK</span>
          ) : (
            <span className="badge badge-emerald">LIVE API (FastAPI)</span>
          )}
        </div>
      </div>

      {loading ? (
        <div>
          <div className="grid-kpi">
            <LoadingSkeleton height={130} />
            <LoadingSkeleton height={130} />
            <LoadingSkeleton height={130} />
            <LoadingSkeleton height={130} />
          </div>
          <div className="grid-2" style={{ marginTop: '20px' }}>
            <LoadingSkeleton height={280} />
            <LoadingSkeleton height={280} />
          </div>
        </div>
      ) : data ? (
        <>
          {/* ========================================================================= */}
          {/* 1. ADMIN DASHBOARD VIEW                                                   */}
          {/* ========================================================================= */}
          {role === 'ADMIN' && (
            <>
              {/* Admin 6 KPI Cards including Active Users */}
              <div className="grid-kpi" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <MetricCard
                  label="1. Total Revenue"
                  value={formatCurrency(data.revenue_kpis.total_realized_revenue)}
                  subtitle={`Avg. ${formatCurrency(data.revenue_kpis.avg_daily_revenue)} / day`}
                  icon={DollarSign}
                  accentColor="#10b981"
                  badge={{ text: '+12.4% MoM', variant: 'emerald' }}
                />

                <MetricCard
                  label="2. Total Units Sold"
                  value={formatNumber(data.demand_kpis.total_units_sold)}
                  subtitle={`Avg. ${data.demand_kpis.avg_daily_units.toFixed(0)} units / day`}
                  icon={TrendingUp}
                  accentColor="#06b6d4"
                  badge={{ text: `${data.demand_kpis.demand_increasing_pct}% Growth`, variant: 'cyan' }}
                />

                <MetricCard
                  label="3. Average Price"
                  value={formatCurrency(data.pricing_kpis.avg_reference_price)}
                  subtitle="Store POS Baseline"
                  icon={Tag}
                  accentColor="#6366f1"
                  badge={{ text: 'Observed POS', variant: 'indigo' }}
                />

                <MetricCard
                  label="4. Revenue Opportunity"
                  value={`+${data.revenue_kpis.estimated_revenue_lift_potential_pct}%`}
                  subtitle={`+$267.5k Potential Lift`}
                  icon={Sparkles}
                  accentColor="#8b5cf6"
                  badge={{ text: 'Actionable Lift', variant: 'purple' }}
                />

                <MetricCard
                  label="5. Forecast Confidence"
                  value={`${data.pricing_kpis.avg_forecast_confidence || 87.6}%`}
                  subtitle="Model Stability Index"
                  icon={ShieldCheck}
                  accentColor="#f59e0b"
                  badge={{ text: 'High Stability', variant: 'amber' }}
                />

                <MetricCard
                  label="6. Active Platform Users"
                  value={`${activeUsersCount} Users`}
                  subtitle={`${adminCount} Admins · ${analystCount} Analysts`}
                  icon={Users}
                  accentColor="#a855f7"
                  badge={{ text: `${usersList.length} Total Registered`, variant: 'purple' }}
                />
              </div>

              {/* Admin Row: Administration Overview & Quick Admin */}
              <div className="grid-2" style={{ marginBottom: '24px' }}>
                {/* Card 1: Administration Overview */}
                <div className="card" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                  <div className="card-header">
                    <div>
                      <div className="card-title">
                        <Users size={18} color="var(--accent-purple)" />
                        Administration & Role Allocation Overview
                      </div>
                      <div className="card-desc">Active platform users categorized by role hierarchy</div>
                    </div>
                    <span className="badge badge-purple">{activeUsersCount} Active Accounts</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Active Users</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{activeUsersCount}</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Administrators</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7C3AED', marginTop: '2px' }}>{adminCount}</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Business Analysts</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284C7', marginTop: '2px' }}>{analystCount}</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Standard Users</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#334155', marginTop: '2px' }}>{standardUserCount}</div>
                    </div>
                  </div>

                  <div style={{ height: '140px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={userRoleDistributionData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                        <XAxis type="number" stroke="#64748B" />
                        <YAxis dataKey="name" type="category" stroke="#475569" width={120} tick={{ fontSize: 11, fill: '#334155' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {userRoleDistributionData.map((entry, index) => (
                            <Cell key={`role-bar-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Card 2: Quick Administration Actions */}
                <div className="card" style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                  <div className="card-header">
                    <div>
                      <div className="card-title">
                        <Shield size={18} color="var(--accent-primary)" />
                        Quick Administration & System Controls
                      </div>
                      <div className="card-desc" style={{ color: '#475569' }}>Privileged admin shortcuts for role management and monitoring</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Link
                      href="/users"
                      className="btn btn-primary"
                      style={{
                        padding: '12px 16px',
                        justifyContent: 'space-between',
                        backgroundColor: '#F5F3FF',
                        borderColor: '#DDD6FE',
                        color: '#4338CA',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={18} color="#7C3AED" />
                        <span style={{ fontWeight: 600 }}>Manage All Platform Users & Roles</span>
                      </div>
                      <ArrowRight size={16} />
                    </Link>

                    <Link
                      href="/users"
                      className="btn btn-secondary"
                      style={{ padding: '12px 16px', justifyContent: 'space-between' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <UserPlus size={18} color="#059669" />
                        <span style={{ color: '#172033', fontWeight: 600 }}>+ Add New User to Directory</span>
                      </div>
                      <ArrowRight size={16} />
                    </Link>

                    <Link
                      href="/alerts"
                      className="btn btn-secondary"
                      style={{ padding: '12px 16px', justifyContent: 'space-between' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Bell size={18} color="#D97706" />
                        <span style={{ color: '#172033', fontWeight: 600 }}>View Security & Merchandising Alerts (3 New)</span>
                      </div>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Admin Charts: Revenue & Demand Trend */}
              <div className="grid-2" style={{ marginBottom: '24px' }}>
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <DollarSign size={18} color="var(--accent-emerald)" />
                      Revenue Trend vs Target
                    </div>
                  </div>
                  <div style={{ height: '220px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="date" stroke="#64748B" />
                        <YAxis stroke="#64748B" tickFormatter={(v) => `$${v / 1000}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }} />
                        <Line type="monotone" dataKey="revenue" name="Realized Revenue" stroke="#10B981" strokeWidth={2.2} />
                        <Line type="monotone" dataKey="target" name="Target" stroke="#94A3B8" strokeDasharray="4 4" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <TrendingUp size={18} color="var(--accent-cyan)" />
                      Demand Trend (Base vs Promo)
                    </div>
                  </div>
                  <div style={{ height: '220px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="date" stroke="#64748B" />
                        <YAxis stroke="#64748B" />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }} />
                        <Area type="monotone" dataKey="units" name="Total Units" stroke="#0284C7" fill="#0284C720" />
                        <Area type="monotone" dataKey="promoUnits" name="Promo Units" stroke="#7C3AED" fill="#7C3AED20" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Admin Charts: Price Performance & Revenue Opportunity */}
              <div className="grid-2" style={{ marginBottom: '24px' }}>
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <Tag size={18} color="var(--accent-primary)" />
                      Price Performance vs Recommended
                    </div>
                  </div>
                  <div style={{ height: '220px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={priceComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="date" stroke="#64748B" />
                        <YAxis stroke="#64748B" tickFormatter={(v) => `$${v}`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }} />
                        <Line type="monotone" dataKey="referencePrice" name="Ref Price" stroke="#94A3B8" />
                        <Line type="monotone" dataKey="recommendedPrice" name="Recommended" stroke="#4F46E5" strokeWidth={2.2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <Sparkles size={18} color="var(--accent-purple)" />
                      Revenue Lift Opportunity
                    </div>
                    <span className="badge badge-emerald">+$267,546 Potential</span>
                  </div>
                  <div style={{ height: '220px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueOpportunityBarData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis type="number" stroke="#64748B" tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                        <YAxis dataKey="name" type="category" stroke="#475569" width={130} tick={{ fontSize: 12, fill: '#334155' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }} />
                        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                          {revenueOpportunityBarData.map((entry, index) => (
                            <Cell key={`bar-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* 2. BUSINESS ANALYST DASHBOARD VIEW                                        */}
          {/* ========================================================================= */}
          {role === 'BUSINESS_ANALYST' && (
            <>
              {/* Analyst 6 KPI Cards */}
              <div className="grid-kpi" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <MetricCard
                  label="1. Total Revenue"
                  value={formatCurrency(data.revenue_kpis.total_realized_revenue)}
                  subtitle={`Avg. ${formatCurrency(data.revenue_kpis.avg_daily_revenue)} / day`}
                  icon={DollarSign}
                  accentColor="#10b981"
                  badge={{ text: '+12.4% MoM', variant: 'emerald' }}
                />

                <MetricCard
                  label="2. Units Sold"
                  value={formatNumber(data.demand_kpis.total_units_sold)}
                  subtitle={`Avg. ${data.demand_kpis.avg_daily_units.toFixed(0)} units / day`}
                  icon={TrendingUp}
                  accentColor="#06b6d4"
                  badge={{ text: `${data.demand_kpis.demand_increasing_pct}% Growth SKUs`, variant: 'cyan' }}
                />

                <MetricCard
                  label="3. Average Price"
                  value={formatCurrency(data.pricing_kpis.avg_reference_price)}
                  subtitle="Observed Store POS Reference"
                  icon={Tag}
                  accentColor="#6366f1"
                  badge={{ text: 'Observed Baseline', variant: 'indigo' }}
                />

                <MetricCard
                  label="4. Recommended Price"
                  value={formatCurrency(data.pricing_kpis.avg_recommended_price)}
                  subtitle={`Delta: +${data.pricing_kpis.avg_price_change_pct}% from ref`}
                  icon={Tag}
                  accentColor="#10b981"
                  badge={{ text: 'Revenue Optimal', variant: 'emerald' }}
                />

                <MetricCard
                  label="5. Forecast Confidence"
                  value={`${data.pricing_kpis.avg_forecast_confidence || 87.6}%`}
                  subtitle="Autoregressive Model Metric"
                  icon={ShieldCheck}
                  accentColor="#f59e0b"
                  badge={{ text: 'High Stability', variant: 'amber' }}
                />

                <MetricCard
                  label="6. Revenue Opportunity"
                  value={`+${data.revenue_kpis.estimated_revenue_lift_potential_pct}%`}
                  subtitle={`Est. +${formatCurrency((data.revenue_kpis.optimized_revenue_potential || 3680126) - data.revenue_kpis.total_realized_revenue)} Lift`}
                  icon={Sparkles}
                  accentColor="#8b5cf6"
                  badge={{ text: 'Actionable Lift', variant: 'purple' }}
                />
              </div>

              {/* Priority Business Insights Section for Business Analyst */}
              <div className="card" style={{ borderColor: 'rgba(6, 182, 212, 0.35)', marginBottom: '24px' }}>
                <div className="card-header">
                  <div className="card-title">
                    <Lightbulb size={20} color="var(--accent-cyan)" />
                    Priority Business Insights & Analyst Directives
                  </div>
                  <span className="badge badge-cyan">Pricing & Demand Signals</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Tag size={16} color="#059669" />
                      <strong style={{ fontSize: '0.85rem', color: '#172033' }}>Pricing Opportunities</strong>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                      842 SKUs in Consumer Electronics are priced below optimal clearance thresholds with room for +3.8% lift.
                    </p>
                  </div>

                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <AlertTriangle size={16} color="#D97706" />
                      <strong style={{ fontSize: '0.85rem', color: '#172033' }}>Demand Risks</strong>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                      24.8% of seasonal items exhibit velocity decay over 7 days. Recommend promotional markdowns.
                    </p>
                  </div>

                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <DollarSign size={16} color="#7C3AED" />
                      <strong style={{ fontSize: '0.85rem', color: '#172033' }}>Revenue Headroom</strong>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                      Store 1 (Flagship) holds $142.6k in uncaptured elasticity gains through targeted weekend repricing.
                    </p>
                  </div>

                  <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Sparkles size={16} color="#0284C7" />
                      <strong style={{ fontSize: '0.85rem', color: '#172033' }}>AI Recommendations</strong>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                      Simulate 14-day demand curves under +5% elasticity bounds in the Price Prediction simulator.
                    </p>
                  </div>
                </div>
              </div>

              {/* Analyst Charts: 6 Deep Dive Visualizations */}
              <div className="grid-2" style={{ marginBottom: '24px' }}>
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <DollarSign size={18} color="var(--accent-emerald)" />
                      Revenue Trend vs Target
                    </div>
                  </div>
                  <div style={{ height: '220px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="date" stroke="#64748B" />
                        <YAxis stroke="#64748B" tickFormatter={(v) => `$${v / 1000}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }} />
                        <Line type="monotone" dataKey="revenue" name="Realized Revenue" stroke="#10B981" strokeWidth={2.2} />
                        <Line type="monotone" dataKey="target" name="Target" stroke="#94A3B8" strokeDasharray="4 4" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <TrendingUp size={18} color="var(--accent-cyan)" />
                      Demand Forecast (Historical vs Horizon)
                    </div>
                  </div>
                  <div style={{ height: '220px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={demandForecastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="date" stroke="#64748B" />
                        <YAxis stroke="#64748B" />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }} />
                        <Area type="monotone" dataKey="historical" name="Historical Units" stroke="#0284C7" fill="#0284C720" />
                        <Area type="monotone" dataKey="forecast" name="Forecast Units" stroke="#7C3AED" fill="#7C3AED25" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom: '24px' }}>
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <Tag size={18} color="var(--accent-primary)" />
                      Price vs Recommended Price
                    </div>
                  </div>
                  <div style={{ height: '220px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={priceComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="date" stroke="#64748B" />
                        <YAxis stroke="#64748B" tickFormatter={(v) => `$${v}`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }} />
                        <Line type="monotone" dataKey="referencePrice" name="Ref Price" stroke="#94A3B8" />
                        <Line type="monotone" dataKey="recommendedPrice" name="Recommended" stroke="#4F46E5" strokeWidth={2.2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <Layers size={18} color="var(--accent-cyan)" />
                      Category Performance Breakdown
                    </div>
                  </div>
                  <div style={{ height: '220px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="category" stroke="#64748B" />
                        <YAxis stroke="#64748B" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }} />
                        <Bar dataKey="sales" name="Sales ($)" fill="#0284C7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom: '24px' }}>
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <Compass size={18} color="var(--accent-cyan)" />
                      Demand Trend Momentum Distribution
                    </div>
                  </div>
                  <div style={{ height: '200px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={demandDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                          {demandDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }} formatter={(v) => [`${v}%`, 'Share']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
                    {demandDistributionData.map((item) => (
                      <div key={item.name} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: item.color }}>{item.value}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <DollarSign size={18} color="var(--accent-emerald)" />
                      Revenue Opportunity Optimization
                    </div>
                    <span className="badge badge-emerald">+7.84% Total Lift</span>
                  </div>
                  <div style={{ height: '200px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueOpportunityBarData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis type="number" stroke="#64748B" tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                        <YAxis dataKey="name" type="category" stroke="#475569" width={130} tick={{ fontSize: 12, fill: '#334155' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }} />
                        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                          {revenueOpportunityBarData.map((entry, index) => (
                            <Cell key={`bar-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #E2E8F0', fontSize: '0.825rem' }}>
                    <span style={{ color: '#475569' }}>Incremental Opportunity: <strong style={{ color: '#059669' }}>+$267,546.30</strong></span>
                    <Link href="/revenue" style={{ color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>Explore Elasticity →</Link>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* 3. USER DASHBOARD VIEW (Simpler, Clean, Product & Insights Oriented)      */}
          {/* ========================================================================= */}
          {role === 'USER' && (
            <>
              {/* User 4 Key Metrics */}
              <div className="grid-kpi" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <MetricCard
                  label="1. Total Sales"
                  value={formatCurrency(data.revenue_kpis.total_realized_revenue)}
                  subtitle="Gross revenue volume"
                  icon={DollarSign}
                  accentColor="#10b981"
                  badge={{ text: '+12.4% vs Prev', variant: 'emerald' }}
                />

                <MetricCard
                  label="2. Units Sold"
                  value={formatNumber(data.demand_kpis.total_units_sold)}
                  subtitle="Total products purchased"
                  icon={TrendingUp}
                  accentColor="#06b6d4"
                  badge={{ text: 'Active Growth', variant: 'cyan' }}
                />

                <MetricCard
                  label="3. Average Price"
                  value={formatCurrency(data.pricing_kpis.avg_reference_price)}
                  subtitle="Standard store price"
                  icon={Tag}
                  accentColor="#6366f1"
                  badge={{ text: 'Standard Price', variant: 'indigo' }}
                />

                <MetricCard
                  label="4. Forecast Confidence"
                  value={`${data.pricing_kpis.avg_forecast_confidence || 87.6}%`}
                  subtitle="Model prediction accuracy"
                  icon={ShieldCheck}
                  accentColor="#f59e0b"
                  badge={{ text: 'Stable Forecast', variant: 'amber' }}
                />
              </div>

              {/* User 3 Core Charts */}
              <div className="grid-2" style={{ marginBottom: '24px' }}>
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <DollarSign size={18} color="var(--accent-emerald)" />
                      Sales Volume Trend
                    </div>
                    <div className="card-desc" style={{ color: '#475569' }}>Daily sales performance trajectory</div>
                  </div>
                  <div style={{ height: '240px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="date" stroke="#64748B" />
                        <YAxis stroke="#64748B" tickFormatter={(v) => `$${v / 1000}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }} />
                        <Line type="monotone" dataKey="revenue" name="Sales ($)" stroke="#10B981" strokeWidth={2.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <TrendingUp size={18} color="var(--accent-cyan)" />
                      Demand Forecast Projections
                    </div>
                    <div className="card-desc" style={{ color: '#475569' }}>Estimated future product demand</div>
                  </div>
                  <div style={{ height: '240px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={demandForecastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="date" stroke="#64748B" />
                        <YAxis stroke="#64748B" />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }} />
                        <Area type="monotone" dataKey="forecast" name="Forecast Units" stroke="#0284C7" fill="#0284C720" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* User: Product Performance & Recent Insights */}
              <div className="grid-2" style={{ marginBottom: '24px' }}>
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <Package size={18} color="var(--accent-primary)" />
                      Product Performance by Category
                    </div>
                    <div className="card-desc" style={{ color: '#475569' }}>Sales performance across primary retail lines</div>
                  </div>
                  <div style={{ height: '220px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="category" stroke="#64748B" />
                        <YAxis stroke="#64748B" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }} />
                        <Bar dataKey="sales" name="Sales ($)" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <Sparkles size={18} color="var(--accent-purple)" />
                      Recent Insights & AI Recommendations
                    </div>
                    <Link href="/insights" style={{ fontSize: '0.78rem', color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>
                      View Full Dossier →
                    </Link>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <CheckCircle2 size={15} color="#059669" />
                        <strong style={{ fontSize: '0.85rem', color: '#172033' }}>High Demand Momentum</strong>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                        Consumer Electronics SKUs are experiencing +14.2% demand increases across all regional stores.
                      </p>
                    </div>

                    <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <Tag size={15} color="#4F46E5" />
                        <strong style={{ fontSize: '0.85rem', color: '#172033' }}>Price Stability Advisory</strong>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                        Reference prices in Home & Living align closely with optimal demand bounds.
                      </p>
                    </div>

                    <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#F8FAFC', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <Bell size={15} color="#D97706" />
                        <strong style={{ fontSize: '0.85rem', color: '#172033' }}>Seasonal Inventory Watch</strong>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                        Prepare for upcoming quarter-end volume transitions in Store 2.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
