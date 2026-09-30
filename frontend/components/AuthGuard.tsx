'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { AiChatAssistant } from '@/components/chat/AiChatAssistant';
import { Zap, Activity, Lock, ArrowLeft, LogOut } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, role, logout } = useAuth();

  const isLandingPage = pathname === '/';
  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (isLoading) return;

    // 1. Landing page (/) and auth pages (/login, /register) are public and never auto-redirect
    if (isLandingPage || isAuthPage) return;

    // 2. Unauthenticated users: redirect protected routes to /login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // 3. Role-based enforcement for Admin on protected business routes
    if (role === 'ADMIN' && pathname !== '/users' && pathname !== '/settings') {
      router.replace('/users');
    }
  }, [isAuthenticated, isLoading, isLandingPage, isAuthPage, pathname, role, router]);

  // Splash loading state during AuthContext initialization
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(124, 58, 237, 0.25)',
          }}
        >
          <Zap size={26} color="#ffffff" />
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          PricePilot <span style={{ color: 'var(--accent-purple)' }}>AI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Activity size={15} className="animate-spin" color="var(--accent-primary)" />
          Initializing Intelligence Platform...
        </div>
      </div>
    );
  }

  // Public Landing page and Auth pages render directly without app chrome
  if (isLandingPage || isAuthPage) {
    return <>{children}</>;
  }

  // Unauthenticated visitors accessing protected routes
  if (!isAuthenticated) {
    return null;
  }

  // Role-Based Route Permission Checks
  const isAdminOnlyRoute = pathname.startsWith('/users');
  const isAnalystOrAdminRoute =
    pathname.startsWith('/revenue') ||
    pathname.startsWith('/competitor') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/analytics');

  const isAdminBusinessRoute = role === 'ADMIN' && !isAdminOnlyRoute && !pathname.startsWith('/settings');
  const isAccessRestricted =
    isAdminBusinessRoute ||
    (isAdminOnlyRoute && role !== 'ADMIN') ||
    (isAnalystOrAdminRoute && role === 'USER');

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-wrapper">
          {isAccessRestricted ? (
            <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center' }}>
              <div
                className="card"
                style={{
                  padding: '44px 32px',
                  borderColor: 'var(--pastel-rose-border)',
                  backgroundColor: '#ffffff',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--pastel-rose)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '18px',
                  }}
                >
                  <Lock size={26} color="var(--accent-rose)" />
                </div>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 700 }}>
                  Access Restricted
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                  You do not have permission to view this section with your <strong>{role ? role.replace('_', ' ') : 'USER'}</strong> account permissions.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <Link href={role === 'ADMIN' ? '/users' : '/dashboard'} className="btn btn-primary">
                    <ArrowLeft size={16} /> Return to Dashboard
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      router.replace('/login');
                    }}
                    className="btn btn-secondary"
                  >
                    <LogOut size={16} /> Sign in as different user
                  </button>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
      <AiChatAssistant />
    </div>
  );
}
