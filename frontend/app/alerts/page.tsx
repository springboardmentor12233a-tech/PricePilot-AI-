'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AIAlertItem } from '@/lib/types';
import { useToast } from '@/lib/ToastContext';
import { ErrorBanner, LoadingSkeleton } from '@/components/ErrorBanner';
import {
  Bell,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Tag,
  TrendingUp,
  DollarSign,
  Compass,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';

export default function AlertsPage() {
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState<AIAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (err: any) {
      const msg = err?.message || 'Failed to load enterprise alert radar stream.';
      setError(msg);
      showToast('Error', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const toggleReadStatus = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: !a.isRead } : a))
    );
  };

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    showToast('Alerts Updated', 'All notifications marked as read.', 'success');
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'UNREAD' && !a.isRead) ||
      (statusFilter === 'READ' && a.isRead);

    return matchesSearch && matchesCategory && matchesSeverity && matchesStatus;
  });

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">
              <Bell size={28} color="var(--accent-rose)" />
              Enterprise Alerts Center & Risk Radar
            </h1>
            <p className="page-subtitle">
              Real-time heuristic radar tracking demand surges, pricing disparities, elasticity opportunities, and model confidence anomalies.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {error || !alerts ? (
              <span className="badge badge-amber">OFFLINE / FALLBACK</span>
            ) : (
              <span className="badge badge-emerald">LIVE API (FastAPI)</span>
            )}
            <span className="badge badge-rose">{unreadCount} Unread Alerts</span>
            <button onClick={markAllAsRead} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
              <Check size={14} /> Mark All Read
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="control-bar">
        <div className="form-group" style={{ flex: '1 1 240px' }}>
          <label className="form-label">Search Alerts</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword or product..."
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

        <div className="form-group" style={{ width: '160px' }}>
          <label className="form-label">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-select"
            style={{ width: '100%' }}
          >
            <option value="ALL">All Categories</option>
            <option value="Demand">Demand Alerts</option>
            <option value="Pricing">Pricing Alerts</option>
            <option value="Revenue">Revenue Alerts</option>
            <option value="Market">Market Alerts</option>
            <option value="AI">AI Confidence</option>
          </select>
        </div>

        <div className="form-group" style={{ width: '140px' }}>
          <label className="form-label">Severity</label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="form-select"
            style={{ width: '100%' }}
          >
            <option value="ALL">All Severities</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>
        </div>

        <div className="form-group" style={{ width: '140px' }}>
          <label className="form-label">Read Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="form-select"
            style={{ width: '100%' }}
          >
            <option value="ALL">All Status</option>
            <option value="UNREAD">Unread Only</option>
            <option value="READ">Read Only</option>
          </select>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchAlerts} />}

      {/* Alerts Feed */}
      {loading ? (
        <LoadingSkeleton height={200} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredAlerts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No alerts found matching your selected filters.
            </div>
          ) : (
          filteredAlerts.map((alt) => {
            const isHigh = alt.severity === 'HIGH';
            const isMed = alt.severity === 'MEDIUM';

            const categoryIcon =
              alt.category === 'Demand' ? TrendingUp : alt.category === 'Pricing' ? Tag : alt.category === 'Revenue' ? DollarSign : alt.category === 'Market' ? Compass : Sparkles;

            const CategoryIcon = categoryIcon;

            return (
              <div
                key={alt.id}
                className="card"
                style={{
                  borderLeft: `4px solid ${isHigh ? '#fb7185' : isMed ? '#f59e0b' : '#38bdf8'}`,
                  backgroundColor: alt.isRead ? 'var(--bg-secondary)' : 'rgba(30, 41, 59, 0.7)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '18px 22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <CategoryIcon size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {alt.title}
                      </span>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        • {alt.productName} (SKU #{alt.productId})
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge badge-${isHigh ? 'rose' : isMed ? 'amber' : 'cyan'}`}>
                      {alt.severity}
                    </span>
                    <span className="badge badge-gray">{alt.category}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alt.timestamp}</span>
                    <button
                      onClick={() => toggleReadStatus(alt.id)}
                      title={alt.isRead ? 'Mark as unread' : 'Mark as read'}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: alt.isRead ? 'var(--text-muted)' : 'var(--accent-primary)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      {alt.isRead ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {alt.message}
                </p>

                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>Root Explanation:</strong> {alt.explanation}
                </p>

                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ fontSize: '0.825rem', color: '#c7d2fe' }}>
                    <strong>Recommended Strategic Action:</strong> {alt.recommendedAction}
                  </div>

                  <Link
                    href={`/products/${alt.productId}`}
                    className="btn btn-primary"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    Open SKU Deep Dive <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
      )}
    </div>
  );
}

