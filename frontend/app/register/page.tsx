'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { UserRole } from '@/lib/types';
import {
  Zap,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Building,
  Eye,
  EyeOff,
  AlertCircle,
  Briefcase,
  ArrowLeft,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser } = useAuth();
  const { showToast } = useToast();

  const [role, setRole] = useState<UserRole>('USER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Store Merchandising');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 4) {
      setError('Password must contain at least 4 characters.');
      return;
    }

    setLoading(true);
    try {
      const user = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        department: department.trim(),
        role,
      });
      showToast('Account Created!', `Welcome to PricePilot AI, ${user.name} (${user.role.replace('_', ' ')}).`, 'success');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. A user with this email may already exist.');
    } finally {
      setLoading(false);
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
          top: '6%',
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
          bottom: '6%',
          right: '18%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(241, 237, 255, 0.7) 0%, rgba(245, 247, 251, 0) 70%)',
          filter: 'blur(75px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Single-Column Card */}
      <div
        style={{
          maxWidth: '500px',
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
            padding: '30px 32px 22px',
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
          <div style={{ fontSize: '0.825rem', color: '#64748B', fontWeight: 500 }}>
            Create your dynamic pricing workspace account
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>
          {/* Role Selection Tabs */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#172033', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Select Account Role:
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              {/* Standard User Option */}
              <button
                type="button"
                onClick={() => setRole('USER')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: role === 'USER' ? '2px solid #10B981' : '1px solid #E2E8F0',
                  backgroundColor: role === 'USER' ? '#ECFDF5' : '#FFFFFF',
                  color: role === 'USER' ? '#065F46' : '#64748B',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.88rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>👤</span>
                  <span>Standard User</span>
                </div>
                <div style={{ fontSize: '0.725rem', color: role === 'USER' ? '#047857' : '#94A3B8' }}>
                  Product lookup, pricing alerts & AI insights
                </div>
              </button>

              {/* Business Analyst Option */}
              <button
                type="button"
                onClick={() => setRole('BUSINESS_ANALYST')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: role === 'BUSINESS_ANALYST' ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                  backgroundColor: role === 'BUSINESS_ANALYST' ? '#EFF6FF' : '#FFFFFF',
                  color: role === 'BUSINESS_ANALYST' ? '#1E40AF' : '#64748B',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.88rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>📊</span>
                  <span>Business Analyst</span>
                </div>
                <div style={{ fontSize: '0.725rem', color: role === 'BUSINESS_ANALYST' ? '#1D4ED8' : '#94A3B8' }}>
                  Revenue scenarios, demand curves & BI reports
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                fontSize: '0.825rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} color="#DC2626" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Full Name */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#172033', marginBottom: '5px', display: 'block' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    color: '#172033',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                  }}
                  required
                />
                <UserIcon
                  size={16}
                  color="#64748B"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            {/* Corporate Email */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#172033', marginBottom: '5px', display: 'block' }}>
                Corporate Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@enterprise.com"
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    color: '#172033',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                  }}
                  required
                />
                <Mail
                  size={16}
                  color="#64748B"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            {/* Department */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#172033', marginBottom: '5px', display: 'block' }}>
                Department / Unit
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Store Merchandising"
                  className="form-input"
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    color: '#172033',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                  }}
                />
                <Building
                  size={16}
                  color="#64748B"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            {/* Password & Confirm */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#172033', marginBottom: '5px', display: 'block' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 32px',
                      fontSize: '0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      color: '#172033',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                    }}
                    required
                  />
                  <Lock
                    size={14}
                    color="#64748B"
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#172033', marginBottom: '5px', display: 'block' }}>
                  Confirm
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 32px',
                      fontSize: '0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      color: '#172033',
                      backgroundColor: '#FFFFFF',
                      outline: 'none',
                    }}
                    required
                  />
                  <Lock
                    size={14}
                    color="#64748B"
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showPassword ? 'Hide' : 'Show'} Password</span>
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '0.885rem',
                fontWeight: 600,
                marginTop: '4px',
                justifyContent: 'center',
                backgroundColor: '#4F46E5',
                borderColor: '#4F46E5',
              }}
            >
              {loading ? 'Creating Account...' : `Register as ${role === 'BUSINESS_ANALYST' ? 'Business Analyst' : 'Standard User'}`}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.825rem', color: '#64748B' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
          </div>

          <div style={{ marginTop: '14px', textAlign: 'center' }}>
            <Link href="/" style={{ fontSize: '0.8rem', color: '#64748B', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ArrowLeft size={13} /> Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
