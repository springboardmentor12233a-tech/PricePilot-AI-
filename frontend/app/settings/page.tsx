'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Briefcase,
  User as UserIcon,
  Bell,
  Lock,
  Server,
  LogOut,
  Save,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const { currentUser, role, logout } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(currentUser?.name || 'User');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [department, setDepartment] = useState(currentUser?.department || 'Store Merchandising');

  const [notifications, setNotifications] = useState({
    demandSpikes: true,
    channelDisparity: true,
    confidenceDrops: false,
    dailyDigest: true,
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Profile Saved', 'User organization settings updated successfully.', 'success');
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Preferences Saved', 'Notification thresholds and alert filters saved.', 'success');
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          <SettingsIcon size={28} color="var(--accent-primary)" />
          Enterprise Platform Settings & Profile
        </h1>
        <p className="page-subtitle">
          Configure active user credentials, role permissions, alert subscription thresholds, and API connection preferences.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: User Profile & Role Info */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <User size={18} color="var(--accent-primary)" />
              Account & Profile Information
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Role:</span>
              {role === 'ADMIN' && (
                <span className="badge badge-purple">
                  <Shield size={12} /> Administrator
                </span>
              )}
              {role === 'BUSINESS_ANALYST' && (
                <span className="badge badge-cyan">
                  <Briefcase size={12} /> Business Analyst
                </span>
              )}
              {role === 'USER' && (
                <span className="badge badge-gray">
                  <UserIcon size={12} /> Standard User
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Corporate Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="form-input"
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department / Unit</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">
                <Save size={15} /> Save Profile Details
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Notification & Alert Preferences */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Bell size={18} color="var(--accent-amber)" />
              Notification & Radar Alert Rules
            </div>
          </div>

          <form onSubmit={handleSaveNotifications} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Demand Velocity Surges
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Trigger alert when 7-day velocity exceeds moving average by +20%.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.demandSpikes}
                  onChange={(e) => setNotifications({ ...notifications, demandSpikes: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Channel Disparity Warnings
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Notify when physical store prices diverge by &gt;5% from online digital benchmarks.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.channelDisparity}
                  onChange={(e) => setNotifications({ ...notifications, channelDisparity: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Low Model Confidence Radar
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Flag SKUs whose demand forecasting confidence drops below 80%.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.confidenceDrops}
                  onChange={(e) => setNotifications({ ...notifications, confidenceDrops: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button type="submit" className="btn btn-secondary">
                <Save size={15} /> Save Alert Rules
              </button>
            </div>
          </form>
        </div>

        {/* Section 3: Architecture & Security Credentials */}
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Server size={18} color="var(--accent-cyan)" />
                Backend Intelligence Connector
              </div>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              PricePilot communicates with the high-performance FastAPI orchestration service on port <code>:8000</code>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>API Target:</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>http://localhost:8000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>ML Prediction Engine:</span>
                <span style={{ color: 'var(--pastel-mint-text)', fontWeight: 600 }}>XGBoost + LightGBM Regressor</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-surface)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>LLM Explanation Layer:</span>
                <span style={{ color: 'var(--pastel-lavender-text)', fontWeight: 600 }}>Gemini-1.5-Pro Enterprise</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Lock size={18} color="var(--accent-rose)" />
                Security & Session Management
              </div>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Authentication is structured for zero-friction transition to production MongoDB + JWT token rotation.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => showToast('JWT Tokens Refreshed', 'Session cryptographic signature renewed.', 'success')}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start' }}
              >
                <Lock size={15} /> Refresh Security Session
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
                className="btn btn-danger"
                style={{ justifyContent: 'flex-start' }}
              >
                <LogOut size={15} /> Terminate All Active Sessions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
