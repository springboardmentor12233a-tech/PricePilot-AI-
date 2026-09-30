'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { HealthResponse, AIAlertItem } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import {
  Search,
  Bell,
  ChevronRight,
  Shield,
  Briefcase,
  User as UserIcon,
  LogOut,
  Settings,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, role, logout } = useAuth();

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState<AIAlertItem[]>([]);

  const checkBackendHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
      setIsOnline(data.status === 'healthy' && !data._isMock && data._dataSource === 'LIVE_API');
    } catch {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000);

    if (role && role !== 'ADMIN') {
      api.getAlerts({ limit: 5 }).then((data) => {
        setUnreadAlerts((data || []).filter((a) => !a.isRead));
      }).catch(() => {});
    }

    return () => clearInterval(interval);
  }, [role]);

  // If on landing, login or register, hide top navbar
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim();
    router.push(`/products/${encodeURIComponent(query)}`);
    setSearchQuery('');
  };

  const getPageTitle = () => {
    if (pathname === '/dashboard' || pathname === '/') {
      if (role === 'ADMIN') return 'Executive & Platform Overview';
      if (role === 'BUSINESS_ANALYST') return 'Business Intelligence Dashboard';
      return 'My Business Overview';
    }
    if (pathname.startsWith('/products/')) return 'Product Performance Dossier';
    if (pathname === '/products') return 'Product Performance & Catalog';
    if (pathname === '/pricing') return 'Price Prediction Engine';
    if (pathname === '/demand') return 'Multi-Horizon Demand Forecast';
    if (pathname === '/revenue') return 'Revenue Optimization & Elasticity';
    if (pathname === '/competitor') return 'Market & Channel Benchmark';
    if (pathname === '/insights') return 'AI Business Insights & Advisory';
    if (pathname === '/reports') return 'Business Intelligence Reports';
    if (pathname === '/alerts') return 'Alerts Center & Risk Radar';
    if (pathname === '/analytics') return 'Analytics & Data Explorer';
    if (pathname === '/users') return 'User Management & Access Control';
    if (pathname === '/settings') return 'Settings & Workspace Profile';
    return 'PricePilot AI Platform';
  };

  return (
    <header
      style={{
        height: 'var(--navbar-height)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left: Breadcrumbs & Dynamic Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="breadcrumb-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/dashboard" className="breadcrumb-link" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
            PricePilot AI
          </Link>
          <ChevronRight size={14} color="var(--text-muted)" />
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.925rem' }}>
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Middle: Global SKU Search */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          position: 'relative',
          maxWidth: '360px',
          width: '100%',
          margin: '0 16px',
        }}
      >
        <Search
          size={16}
          color="var(--text-muted)"
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Quick search SKU (e.g. 293375605257)..."
          className="form-input"
          style={{
            width: '100%',
            paddingLeft: '36px',
            paddingRight: '12px',
            paddingTop: '7px',
            paddingBottom: '7px',
            fontSize: '0.825rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}
        />
      </form>

      {/* Right side: Health badge, notifications, user pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* API Connection Indicator */}
        <div
          title={isOnline ? 'FastAPI Backend Online (LIVE API)' : 'Running in Standalone Fallback Mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: isOnline ? 'var(--pastel-mint)' : 'var(--pastel-amber)',
            border: `1px solid ${isOnline ? 'var(--pastel-mint-border)' : 'var(--pastel-amber-border)'}`,
            cursor: 'default',
          }}
        >
          <span className={`pulse-dot ${isOnline ? 'online' : 'offline'}`} />
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: isOnline ? 'var(--pastel-mint-text)' : 'var(--pastel-amber-text)' }}>
            {isOnline ? 'LIVE API' : 'OFFLINE'}
          </span>
        </div>

        {/* Notifications Dropdown Toggle */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              position: 'relative',
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-xs)',
            }}
            aria-label="Notifications"
          >
            <Bell size={17} color="var(--text-secondary)" />
            {unreadAlerts.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-rose)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #FFFFFF',
                }}
              >
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {/* Notifications Flyout */}
          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '46px',
                right: 0,
                width: '340px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 60,
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '12px',
                }}
              >
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Platform Notifications
                </div>
                <button
                  onClick={() => setUnreadAlerts([])}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Mark all read
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                {unreadAlerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                    No unread notifications
                  </div>
                ) : (
                  unreadAlerts.map((alt) => (
                    <div
                      key={alt.id}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {alt.title}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {alt.timestamp}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {alt.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div style={{ paddingTop: '10px', marginTop: '10px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <Link
                  href="/alerts"
                  onClick={() => setShowNotifications(false)}
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--accent-primary)',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  View All Alerts in Radar →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Role Badge & Settings Link */}
        <Link
          href="/settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            textDecoration: 'none',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background:
                role === 'ADMIN'
                  ? 'var(--pastel-lavender)'
                  : role === 'BUSINESS_ANALYST'
                  ? 'var(--pastel-blue)'
                  : '#F1F5F9',
              border: `1px solid ${
                role === 'ADMIN'
                  ? 'var(--pastel-lavender-border)'
                  : role === 'BUSINESS_ANALYST'
                  ? 'var(--pastel-blue-border)'
                  : 'var(--border-subtle)'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
            }}
          >
            {role === 'ADMIN' ? '👑' : role === 'BUSINESS_ANALYST' ? '📊' : '👤'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {currentUser?.name || (role === 'ADMIN' ? 'Admin' : role === 'BUSINESS_ANALYST' ? 'Business Analyst' : 'User')}
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color:
                  role === 'ADMIN'
                    ? 'var(--pastel-lavender-text)'
                    : role === 'BUSINESS_ANALYST'
                    ? 'var(--pastel-blue-text)'
                    : 'var(--text-muted)',
              }}
            >
              {role === 'ADMIN' ? 'ADMIN' : role === 'BUSINESS_ANALYST' ? 'ANALYST' : 'USER'}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
