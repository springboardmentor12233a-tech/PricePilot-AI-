'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { UserRole } from '@/lib/types';
import {
  LayoutDashboard,
  Package,
  Tag,
  TrendingUp,
  DollarSign,
  Compass,
  Sparkles,
  Zap,
  FileText,
  Bell,
  Users,
  Settings,
  BarChart3,
  LogOut,
  Shield,
  Briefcase,
  User as UserIcon,
  Menu,
  X,
  AlertTriangle,
  Repeat,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles?: UserRole[];
  badge?: string;
}

interface NavGroup {
  groupTitle: string;
  roles?: UserRole[];
  items: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, role, logout } = useAuth();
  const { showToast } = useToast();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // If on login, register or public landing page, do not render sidebar
  if (pathname === '/login' || pathname === '/register' || pathname === '/') {
    return null;
  }

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    showToast('Signed Out', 'You have been signed out of PricePilot AI.', 'info');
    router.replace('/login');
  };

  // Build role-specific navigation groups
  const getNavGroups = (): NavGroup[] => {
    if (role === 'USER') {
      return [
        {
          groupTitle: 'OVERVIEW',
          items: [
            { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { name: 'Product KPIs', path: '/products', icon: Package },
          ],
        },
        {
          groupTitle: 'PRICING & DEMAND',
          items: [
            { name: 'Price Prediction', path: '/pricing', icon: Tag },
            { name: 'Demand Forecast', path: '/demand', icon: TrendingUp },
          ],
        },
        {
          groupTitle: 'INTELLIGENCE',
          items: [
            { name: 'AI Insights', path: '/insights', icon: Sparkles },
            { name: 'Alerts', path: '/alerts', icon: Bell, badge: '3 New' },
          ],
        },
        {
          groupTitle: 'SYSTEM',
          items: [
            { name: 'Settings', path: '/settings', icon: Settings },
          ],
        },
      ];
    }

    if (role === 'BUSINESS_ANALYST') {
      return [
        {
          groupTitle: 'OVERVIEW',
          items: [
            { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { name: 'Product KPIs', path: '/products', icon: Package },
          ],
        },
        {
          groupTitle: 'PRICING & REVENUE',
          items: [
            { name: 'Price Prediction', path: '/pricing', icon: Tag },
            { name: 'Demand Forecast', path: '/demand', icon: TrendingUp },
            { name: 'Revenue Optimization', path: '/revenue', icon: DollarSign },
          ],
        },
        {
          groupTitle: 'MARKET INTELLIGENCE',
          items: [
            { name: 'Market Analysis', path: '/competitor', icon: Compass },
            { name: 'AI Insights', path: '/insights', icon: Sparkles },
            { name: 'Alerts', path: '/alerts', icon: Bell, badge: '3 New' },
          ],
        },
        {
          groupTitle: 'REPORTING',
          items: [
            { name: 'BI Reports', path: '/reports', icon: FileText },
            { name: 'Analytics', path: '/analytics', icon: BarChart3 },
          ],
        },
        {
          groupTitle: 'SYSTEM',
          items: [
            { name: 'Settings', path: '/settings', icon: Settings },
          ],
        },
      ];
    }

    // ADMIN: governance-only workspace
    return [
      {
        groupTitle: 'ADMINISTRATION',
        items: [
          { name: 'User Management', path: '/users', icon: Users, badge: 'Admin' },
          { name: 'Settings', path: '/settings', icon: Settings },
        ],
      },
    ];
  };

  const navGroups = getNavGroups();

  return (
    <>
      {/* Mobile Hamburger toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed',
          top: '14px',
          left: '16px',
          zIndex: 60,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          padding: '8px',
          display: 'none',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
        }}
        className="mobile-nav-toggle"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(3px)',
            zIndex: 45,
          }}
        />
      )}

      <aside
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          boxShadow: 'var(--shadow-sm)',
          transform: mobileOpen ? 'translateX(0)' : undefined,
          transition: 'transform 0.25s ease',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background:
                role === 'ADMIN'
                  ? 'linear-gradient(135deg, #7C3AED, #6366F1)'
                  : role === 'BUSINESS_ANALYST'
                  ? 'linear-gradient(135deg, #0284C7, #06B6D4)'
                  : 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)',
              flexShrink: 0,
            }}
          >
            <Zap size={20} color="#ffffff" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                color: 'var(--text-primary)',
              }}
            >
              PricePilot{' '}
              <span
                style={{
                  color:
                    role === 'ADMIN'
                      ? 'var(--accent-purple)'
                      : role === 'BUSINESS_ANALYST'
                      ? 'var(--accent-blue)'
                      : 'var(--accent-mint)',
                }}
              >
                AI
              </span>
            </div>
            <div
              style={{
                fontSize: '0.675rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {role === 'ADMIN'
                ? 'Admin Workspace'
                : role === 'BUSINESS_ANALYST'
                ? 'BI & Pricing Workspace'
                : 'Standard Workspace'}
            </div>
          </div>
        </div>

        {/* Grouped Navigation Links */}
        <nav
          style={{
            padding: '14px 12px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
          }}
        >
          {navGroups.map((group) => {
            return (
              <div key={group.groupTitle} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                    padding: '4px 10px 2px',
                  }}
                >
                  {group.groupTitle}
                </div>

                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;

                  // Active pastel background & text depending on user role
                  let activeBg = 'var(--pastel-lavender)';
                  let activeBorder = 'var(--pastel-lavender-border)';
                  let activeColor = 'var(--pastel-lavender-text)';
                  let activeIconColor = 'var(--accent-purple)';

                  if (role === 'BUSINESS_ANALYST') {
                    activeBg = 'var(--pastel-blue)';
                    activeBorder = 'var(--pastel-blue-border)';
                    activeColor = 'var(--pastel-blue-text)';
                    activeIconColor = 'var(--accent-blue)';
                  } else if (role === 'USER') {
                    activeBg = 'var(--pastel-mint)';
                    activeBorder = 'var(--pastel-mint-border)';
                    activeColor = 'var(--pastel-mint-text)';
                    activeIconColor = 'var(--accent-mint)';
                  }

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMobileOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                        color: isActive ? activeColor : 'var(--text-secondary)',
                        backgroundColor: isActive ? activeBg : 'transparent',
                        border: isActive ? `1px solid ${activeBorder}` : '1px solid transparent',
                        fontWeight: isActive ? 600 : 500,
                        transition: 'all 0.15s ease',
                      }}
                      className="nav-link-item"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <Icon
                          size={17}
                          color={isActive ? activeIconColor : 'var(--text-muted)'}
                          strokeWidth={isActive ? 2.2 : 1.7}
                        />
                        <span
                          style={{
                            fontSize: '0.84rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.name}
                        </span>
                      </div>

                      {item.badge && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '1px 7px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor:
                              item.badge === 'Admin'
                                ? 'var(--pastel-lavender)'
                                : 'var(--pastel-rose)',
                            color:
                              item.badge === 'Admin'
                                ? 'var(--pastel-lavender-text)'
                                : 'var(--pastel-rose-text)',
                            border: `1px solid ${
                              item.badge === 'Admin'
                                ? 'var(--pastel-lavender-border)'
                                : 'var(--pastel-rose-border)'
                            }`,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Profile Footer & Local Logout */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background:
                    role === 'ADMIN'
                      ? 'linear-gradient(135deg, #7C3AED, #6366F1)'
                      : role === 'BUSINESS_ANALYST'
                      ? 'linear-gradient(135deg, #0284C7, #06B6D4)'
                      : 'linear-gradient(135deg, #10B981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  boxShadow: 'var(--shadow-sm)',
                  flexShrink: 0,
                }}
              >
                {role === 'ADMIN' ? '👑' : role === 'BUSINESS_ANALYST' ? '📊' : '👤'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentUser?.name || (role === 'ADMIN' ? 'Admin User' : role === 'BUSINESS_ANALYST' ? 'Business Analyst' : 'User')}
                </div>
                <div>
                  {role === 'ADMIN' ? (
                    <span className="badge badge-purple" style={{ padding: '1px 6px', fontSize: '0.625rem' }}>
                      <Shield size={9} /> ADMIN
                    </span>
                  ) : role === 'BUSINESS_ANALYST' ? (
                    <span className="badge badge-blue" style={{ padding: '1px 6px', fontSize: '0.625rem' }}>
                      <Briefcase size={9} /> ANALYST
                    </span>
                  ) : (
                    <span className="badge badge-mint" style={{ padding: '1px 6px', fontSize: '0.625rem' }}>
                      <UserIcon size={9} /> USER
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign Out of Platform"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = 'var(--accent-rose)';
                e.currentTarget.style.backgroundColor = 'var(--pastel-rose)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Dialog Modal */}
      {showLogoutConfirm && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '380px' }}>
            <div style={{ padding: '28px 24px', textAlign: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--pastel-rose)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <AlertTriangle size={24} color="var(--accent-rose)" />
              </div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 700 }}>
                Sign out of PricePilot AI?
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '22px', lineHeight: 1.5 }}>
                This will end your authenticated session and return you to the login screen.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="btn btn-secondary"
                  style={{ padding: '9px 18px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="btn btn-danger"
                  style={{ padding: '9px 18px', fontSize: '0.85rem' }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .nav-link-item:hover:not([style*="background-color: var(--pastel"]) {
          background-color: var(--bg-hover) !important;
          color: var(--text-primary) !important;
        }
        @media (max-width: 768px) {
          .mobile-nav-toggle {
            display: flex !important;
          }
          aside {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </>
  );
}
