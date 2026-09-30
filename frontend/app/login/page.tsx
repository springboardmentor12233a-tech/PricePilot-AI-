'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { UserRole } from '@/lib/types';
import {
  Zap,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Shield,
  BarChart3,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

interface ProfileOption {
  role: UserRole;
  title: string;
  roleLabel: string;
  icon: React.ReactNode;
  activeBg: string;
}

const PROFILE_OPTIONS: ProfileOption[] = [
  {
    role: 'ADMIN',
    title: 'Admin',
    roleLabel: 'Governance & Users',
    icon: <Shield size={20} color="#7C3AED" />,
    activeBg: '#F5F3FF',
  },
  {
    role: 'BUSINESS_ANALYST',
    title: 'Business Analyst',
    roleLabel: 'Pricing & Demand BI',
    icon: <BarChart3 size={20} color="#2563EB" />,
    activeBg: '#EFF6FF',
  },
  {
    role: 'USER',
    title: 'User',
    roleLabel: 'Standard Merchandiser',
    icon: <UserIcon size={20} color="#059669" />,
    activeBg: '#ECFDF5',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoLoadingRole, setDemoLoadingRole] = useState<UserRole | null>(null);

  // Purely visual selection - does NOT auto-fill or expose any credentials
  const handleSelectProfile = (role: UserRole) => {
    setError(null);
    setSelectedRole((prev) => (prev === role ? null : role));
  };

  // Direct 1-click Demo Account Authentication (for quick role showcase)
  const handleDirectDemoLogin = async (role: UserRole, demoEmail: string, demoPass: string) => {
    setError(null);
    setDemoLoadingRole(role);
    try {
      const user = await login(demoEmail, demoPass);
      showToast(
        'Demo Workspace Activated',
        `Logged in as ${user.name} (${user.role.replace('_', ' ')}).`,
        'success'
      );
      router.replace(user.role === 'ADMIN' ? '/users' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate demo account.');
      setDemoLoadingRole(null);
    }
  };

  // Submit credentials directly to FastAPI /api/auth/login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim()) {
      setError('Please enter both your corporate email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(trimmedEmail, password);
      showToast(
        'Login Successful',
        `Welcome, ${user.name} (${user.role.replace('_', ' ')}).`,
        'success'
      );
      router.replace(user.role === 'ADMIN' ? '/users' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F7FB',
        padding: '36px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient subtle blurs */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '18%',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(224, 231, 255, 0.7) 0%, rgba(245, 247, 251, 0) 70%)',
          filter: 'blur(75px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          right: '18%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(241, 237, 255, 0.7) 0%, rgba(245, 247, 251, 0) 70%)',
          filter: 'blur(75px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Login Card Container */}
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '28px 32px 20px',
            textAlign: 'center',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#FAFCFF',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4F46E5, #4338CA)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                }}
              >
                <Zap size={22} color="#FFFFFF" />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#172033' }}>
                PricePilot <span style={{ color: '#4F46E5' }}>AI</span>
              </div>
            </div>
          </Link>
          <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500 }}>
            Sign in to access your retail pricing intelligence workspace
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>
          {error && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                fontSize: '0.85rem',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} color="#DC2626" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. VISIBLE 3 PROFILE SELECTION CARDS (Visual Selection Only) */}
          <div style={{ marginBottom: '22px' }}>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#64748B',
                marginBottom: '10px',
              }}
            >
              Select Profile Role
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
              }}
            >
              {PROFILE_OPTIONS.map((profile) => {
                const isSelected = selectedRole === profile.role;
                return (
                  <button
                    key={profile.role}
                    type="button"
                    onClick={() => handleSelectProfile(profile.role)}
                    style={{
                      padding: '14px 10px',
                      borderRadius: '12px',
                      border: isSelected
                        ? `2px solid #4F46E5`
                        : `1px solid #E2E8F0`,
                      backgroundColor: isSelected ? profile.activeBg : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected
                        ? '0 4px 12px rgba(79, 70, 229, 0.15)'
                        : '0 1px 3px rgba(0,0,0,0.03)',
                      position: 'relative',
                    }}
                  >
                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                        }}
                      >
                        <CheckCircle2 size={14} color="#4F46E5" />
                      </div>
                    )}
                    <div style={{ marginBottom: '6px' }}>{profile.icon}</div>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: isSelected ? '#172033' : '#334155',
                        marginBottom: '2px',
                      }}
                    >
                      {profile.title}
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: '#64748B',
                        lineHeight: 1.2,
                      }}
                    >
                      {profile.roleLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '20px 0',
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Enter Credentials
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          </div>

          {/* 2. AUTHENTICATION LOGIN FORM (Empty inputs for manual entry) */}
          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: '#172033',
                  marginBottom: '6px',
                }}
              >
                Corporate Email
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#475569',
                  }}
                >
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@enterprise.com"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 38px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.9rem',
                    color: '#172033',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: '22px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <label
                  style={{
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    color: '#172033',
                  }}
                >
                  Password
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#475569',
                  }}
                >
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 38px 11px 38px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.9rem',
                    color: '#172033',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#475569',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: '10px',
                backgroundColor: '#4F46E5',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.925rem',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                transition: 'background-color 0.15s ease',
              }}
            >
              {isSubmitting ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer link to register */}
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.825rem', color: '#64748B' }}>
            New team member?{' '}
            <Link href="/register" style={{ color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>
              Create an account
            </Link>
          </div>

          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <Link
              href="/"
              style={{
                fontSize: '0.8rem',
                color: '#64748B',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ArrowLeft size={13} /> Back to Homepage
            </Link>
          </div>

          {/* Demo Accounts Quick Launch Section */}
          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                fontSize: '0.725rem',
                fontWeight: 700,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '10px',
                textAlign: 'center',
              }}
            >
              Demo Accounts
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => handleDirectDemoLogin('ADMIN', 'admin@pricepilot.demo', 'Admin@123')}
                disabled={isSubmitting || demoLoadingRole !== null}
                style={{
                  padding: '9px 6px',
                  borderRadius: '8px',
                  border: '1px solid #DDD6FE',
                  backgroundColor: '#F5F3FF',
                  color: '#6B21A8',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: isSubmitting || demoLoadingRole !== null ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                }}
              >
                {demoLoadingRole === 'ADMIN' ? 'Launching...' : 'Admin Demo'}
              </button>

              <button
                type="button"
                onClick={() => handleDirectDemoLogin('BUSINESS_ANALYST', 'analyst@pricepilot.demo', 'Analyst@123')}
                disabled={isSubmitting || demoLoadingRole !== null}
                style={{
                  padding: '9px 6px',
                  borderRadius: '8px',
                  border: '1px solid #BFDBFE',
                  backgroundColor: '#EFF6FF',
                  color: '#1E40AF',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: isSubmitting || demoLoadingRole !== null ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                }}
              >
                {demoLoadingRole === 'BUSINESS_ANALYST' ? 'Launching...' : 'Business Analyst Demo'}
              </button>

              <button
                type="button"
                onClick={() => handleDirectDemoLogin('USER', 'user@pricepilot.demo', 'User@123')}
                disabled={isSubmitting || demoLoadingRole !== null}
                style={{
                  padding: '9px 6px',
                  borderRadius: '8px',
                  border: '1px solid #A7F3D0',
                  backgroundColor: '#ECFDF5',
                  color: '#047857',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: isSubmitting || demoLoadingRole !== null ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                }}
              >
                {demoLoadingRole === 'USER' ? 'Launching...' : 'User Demo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
