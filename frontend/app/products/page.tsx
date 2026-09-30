'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ProductPerformanceItem } from '@/lib/types';
import { MetricCard } from '@/components/MetricCard';
import { ErrorBanner, LoadingSkeleton } from '@/components/ErrorBanner';
import {
  Package,
  Search,
  Filter,
  ArrowUpDown,
  Tag,
  DollarSign,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductPerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [storeFilter, setStoreFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [trendFilter, setTrendFilter] = useState('ALL');

  // Sorting
  const [sortField, setSortField] = useState<keyof ProductPerformanceItem>('revenueOpportunity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const fetchCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProductCatalog();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load product catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Formatters
  const formatCurrency = (val: number) =>
    `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatNumber = (val: number) => val.toLocaleString('en-US');

  // Filter logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || p.category.includes(categoryFilter);
    const matchesStore = storeFilter === 'ALL' || String(p.storeId) === storeFilter;
    const matchesPriority = priorityFilter === 'ALL' || p.priority === priorityFilter;
    const matchesTrend = trendFilter === 'ALL' || p.demandTrend === trendFilter;

    return matchesSearch && matchesCategory && matchesStore && matchesPriority && matchesTrend;
  });

  // Sort logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string') {
      return sortOrder === 'asc'
        ? (valA as string).localeCompare(valB as string)
        : (valB as string).localeCompare(valA as string);
    }

    return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedProducts.length / pageSize) || 1;
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: keyof ProductPerformanceItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Aggregated Top Metrics across current filtered catalog
  const avgRefPrice = products.length ? products.reduce((acc, p) => acc + p.currentPrice, 0) / products.length : 0;
  const avgRecPrice = products.length ? products.reduce((acc, p) => acc + p.recommendedPrice, 0) / products.length : 0;
  const totalUnits = products.reduce((acc, p) => acc + p.unitsSold, 0);
  const totalRev = products.reduce((acc, p) => acc + p.revenue, 0);
  const avgDemand = products.length ? products.reduce((acc, p) => acc + p.avgDemand, 0) / products.length : 0;
  const forecastDemand = products.length ? products.reduce((acc, p) => acc + p.forecastDemand, 0) / products.length : 0;
  const avgConfidence = products.length ? products.reduce((acc, p) => acc + p.forecastConfidence, 0) / products.length : 0;
  const totalOpportunity = products.reduce((acc, p) => acc + p.revenueOpportunity, 0);
  const increasingCount = products.filter((p) => p.demandTrend === 'INCREASING').length;
  const increasingPct = products.length ? Math.round((increasingCount / products.length) * 100) : 0;
  const headroomPct = avgRefPrice > 0 ? (((avgRecPrice - avgRefPrice) / avgRefPrice) * 100).toFixed(1) : '0.0';

  const availableCategories = React.useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">
              <Package size={28} color="var(--accent-primary)" />
              Product Performance & Merchandising Catalog
            </h1>
            <p className="page-subtitle">
              Comprehensive SKU-level performance diagnostics, ML price recommendations, and multi-horizon demand indicators.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="badge badge-indigo">
              {filteredProducts.length} SKUs Evaluated
            </span>
            {error || (!loading && products.length === 0) ? (
              <span className="badge badge-amber">OFFLINE / FALLBACK</span>
            ) : (
              <span className="badge badge-emerald">LIVE API (FastAPI)</span>
            )}
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchCatalog} />}

      {/* 9 KPI Summary Cards */}
      <div className="grid-kpi" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <MetricCard
          label="Current Price (Avg)"
          value={formatCurrency(avgRefPrice)}
          icon={Tag}
          accentColor="#6366f1"
          tooltip="Average observed shelf price across active catalog"
        />
        <MetricCard
          label="Recommended Price"
          value={formatCurrency(avgRecPrice)}
          icon={Tag}
          accentColor="#10b981"
          badge={{ text: `${Number(headroomPct) >= 0 ? '+' : ''}${headroomPct}% Headroom`, variant: 'emerald' }}
          tooltip="ML clearance price optimized for gross revenue"
        />
        <MetricCard
          label="Total Units Sold"
          value={formatNumber(totalUnits)}
          icon={TrendingUp}
          accentColor="#06b6d4"
          tooltip="Total realized volume sold in observation window"
        />
        <MetricCard
          label="Total Realized Revenue"
          value={formatCurrency(totalRev)}
          icon={DollarSign}
          accentColor="#10b981"
          tooltip="Modeled gross realized revenue"
        />
        <MetricCard
          label="Avg Daily Demand"
          value={`${avgDemand.toFixed(1)} u/d`}
          icon={TrendingUp}
          accentColor="#38bdf8"
          tooltip="Average daily run-rate across evaluated SKUs"
        />
        <MetricCard
          label="Forecast Avg Demand"
          value={`${forecastDemand.toFixed(1)} u/d`}
          icon={Sparkles}
          accentColor="#818cf8"
          tooltip="Autoregressive projected demand run-rate"
        />
        <MetricCard
          label="Forecast Confidence"
          value={`${avgConfidence.toFixed(1)}%`}
          icon={ShieldCheck}
          accentColor="#f59e0b"
          badge={{ text: 'System Confidence', variant: 'amber' }}
          tooltip="Model confidence score across evaluated catalog"
        />
        <MetricCard
          label="Demand Trend"
          value={`${increasingPct}% Growth`}
          icon={TrendingUp}
          accentColor="#06b6d4"
          badge={{ text: `${increasingCount} SKUs Expanding`, variant: 'cyan' }}
          tooltip="Distribution of positive demand momentum"
        />
        <MetricCard
          label="Revenue Opportunity"
          value={formatCurrency(totalOpportunity)}
          icon={DollarSign}
          accentColor="#10b981"
          tooltip="Estimated gross revenue headroom across catalog"
        />
      </div>

      {/* Filter Control Bar */}
      <div className="control-bar">
        <div className="form-group" style={{ flex: '1 1 220px' }}>
          <label className="form-label">Search Product / SKU</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by SKU or product name..."
              className="form-input"
              style={{ width: '100%', paddingLeft: '36px' }}
            />
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>

        <div className="form-group" style={{ width: '220px' }}>
          <label className="form-label">Category Filter</label>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="form-select"
            style={{ width: '100%' }}
          >
            <option value="ALL">All Categories ({availableCategories.length})</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>


        <div className="form-group" style={{ width: '130px' }}>
          <label className="form-label">Store Location</label>
          <select
            value={storeFilter}
            onChange={(e) => {
              setStoreFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="form-select"
            style={{ width: '100%' }}
          >
            <option value="ALL">All Stores</option>
            <option value="1">Store 1</option>
            <option value="2">Store 2</option>
            <option value="3">Store 3</option>
            <option value="4">Store 4</option>
          </select>
        </div>

        <div className="form-group" style={{ width: '130px' }}>
          <label className="form-label">Action Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="form-select"
            style={{ width: '100%' }}
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="form-group" style={{ width: '140px' }}>
          <label className="form-label">Demand Trend</label>
          <select
            value={trendFilter}
            onChange={(e) => {
              setTrendFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="form-select"
            style={{ width: '100%' }}
          >
            <option value="ALL">All Trends</option>
            <option value="INCREASING">Increasing</option>
            <option value="STABLE">Stable</option>
            <option value="DECREASING">Decreasing</option>
          </select>
        </div>
      </div>

      {/* Product Performance Table */}
      {loading ? (
        <LoadingSkeleton height={380} />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th onClick={() => handleSort('sku')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    SKU <ArrowUpDown size={13} />
                  </div>
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Product Name <ArrowUpDown size={13} />
                  </div>
                </th>
                <th>Category</th>
                <th>Store</th>
                <th onClick={() => handleSort('currentPrice')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    Current Price <ArrowUpDown size={13} />
                  </div>
                </th>
                <th onClick={() => handleSort('recommendedPrice')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    Recommended <ArrowUpDown size={13} />
                  </div>
                </th>
                <th onClick={() => handleSort('unitsSold')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    Units <ArrowUpDown size={13} />
                  </div>
                </th>
                <th onClick={() => handleSort('revenue')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    Revenue <ArrowUpDown size={13} />
                  </div>
                </th>
                <th>Demand Trend</th>
                <th onClick={() => handleSort('forecastConfidence')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    Confidence <ArrowUpDown size={13} />
                  </div>
                </th>
                <th onClick={() => handleSort('revenueOpportunity')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    Revenue Opportunity <ArrowUpDown size={13} />
                  </div>
                </th>
                <th style={{ textAlign: 'center' }}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No products matched your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isHigh = p.priority === 'HIGH';
                  const isMed = p.priority === 'MEDIUM';

                  return (
                    <tr
                      key={p.sku}
                      className="clickable"
                      onClick={() => router.push(`/products/${p.sku}`)}
                      title="Click to view full SKU Performance Dossier"
                    >
                      <td>
                        <span style={{ fontFamily: 'monospace', color: 'var(--pastel-lavender-text)', fontWeight: 600 }}>
                          {p.sku}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{p.category}</td>
                      <td>
                        <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>
                          Store {p.storeId}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatCurrency(p.currentPrice)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--pastel-mint-text)' }}>
                        {formatCurrency(p.recommendedPrice)}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {formatNumber(p.unitsSold)}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {formatCurrency(p.revenue)}
                      </td>
                      <td>
                        {p.demandTrend === 'INCREASING' && (
                          <span className="badge badge-emerald" style={{ fontSize: '0.725rem' }}>
                            <ArrowUpRight size={12} /> Increasing
                          </span>
                        )}
                        {p.demandTrend === 'STABLE' && (
                          <span className="badge badge-cyan" style={{ fontSize: '0.725rem' }}>
                            <Minus size={12} /> Stable
                          </span>
                        )}
                        {p.demandTrend === 'DECREASING' && (
                          <span className="badge badge-amber" style={{ fontSize: '0.725rem' }}>
                            <ArrowDownRight size={12} /> Decreasing
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontWeight: 600, color: p.forecastConfidence >= 88 ? 'var(--pastel-mint-text)' : 'var(--pastel-amber-text)' }}>
                          {p.forecastConfidence}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        +{formatCurrency(p.revenueOpportunity)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`badge badge-${isHigh ? 'rose' : isMed ? 'amber' : 'gray'}`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {p.priority}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '16px',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
        }}
      >
        <div>
          Showing {(currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, sortedProducts.length)} of {sortedProducts.length} Products
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            Previous
          </button>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
