'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import {
  Zap,
  TrendingUp,
  DollarSign,
  Tag,
  Compass,
  Sparkles,
  ArrowRight,
  Shield,
  Briefcase,
  User as UserIcon,
  CheckCircle2,
  BarChart3,
  Layers,
  ChevronRight,
  Menu,
  X,
  Activity,
  Award,
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #EEF2FF 0%, #F5F3FF 40%, #F1F3F8 100%)', color: 'var(--text-primary)', overflowX: 'hidden', position: 'relative' }}>
      {/* Subtle Blurred Gradient Ambient Shapes */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          left: '-40px',
          width: '580px',
          height: '580px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232, 224, 255, 0.75) 0%, rgba(238, 242, 255, 0) 70%)',
          filter: 'blur(90px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '120px',
          right: '-40px',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220, 232, 255, 0.75) 0%, rgba(245, 243, 255, 0) 70%)',
          filter: 'blur(90px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '55%',
          left: '10%',
          width: '540px',
          height: '540px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(223, 244, 234, 0.6) 0%, rgba(241, 243, 248, 0) 70%)',
          filter: 'blur(100px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* 1. Header / Navigation Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)',
          transition: 'all 0.2s ease',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6D4AFF, #5B3CE6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(109, 74, 255, 0.24)',
              }}
            >
              <Zap size={22} color="#FFFFFF" />
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              PricePilot <span style={{ color: 'var(--accent-primary)' }}>AI</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="desktop-nav">
            <a
              href="#home"
              style={{
                fontSize: '0.92rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Home
            </a>
            <a
              href="#about"
              style={{
                fontSize: '0.92rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              About
            </a>
            <a
              href="#roles"
              style={{
                fontSize: '0.92rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Roles
            </a>
            <Link
              href="/login"
              style={{
                fontSize: '0.92rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
            >
              Login
            </Link>
          </nav>

          {/* Right Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="desktop-nav">
            <Link
              href="/login"
              className="btn btn-secondary"
              style={{ padding: '8px 18px', fontSize: '0.875rem' }}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.875rem' }}
            >
              Sign Up <ArrowRight size={15} />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '6px',
            }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: '16px 24px 24px',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
            className="mobile-dropdown"
          >
            <a
              href="#home"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}
            >
              Home
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}
            >
              About
            </a>
            <a
              href="#roles"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}
            >
              Roles
            </a>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-primary)', textDecoration: 'none' }}
            >
              Login
            </Link>
            <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/login" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Sign In
              </Link>
              <Link href="/register" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Sign Up <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section
        id="home"
        style={{
          padding: '80px 24px 70px',
          maxWidth: '1240px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Soft pastel decorative gradient blobs */}
        <div
          style={{
            position: 'absolute',
            top: '0%',
            left: '20%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(237, 231, 246, 0.8) 0%, rgba(250, 250, 252, 0) 70%)',
            filter: 'blur(50px)',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '20%',
            right: '15%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(227, 242, 253, 0.75) 0%, rgba(250, 250, 252, 0) 70%)',
            filter: 'blur(50px)',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '840px', margin: '0 auto' }}>
          {/* Tagline Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--pastel-lavender)',
              border: '1px solid var(--pastel-lavender-border)',
              color: 'var(--pastel-lavender-text)',
              fontSize: '0.825rem',
              fontWeight: 700,
              marginBottom: '24px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <Sparkles size={14} color="var(--accent-purple)" />
            AI-Powered Dynamic Pricing & Revenue Intelligence
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(2.3rem, 5vw, 3.6rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.035em',
              color: 'var(--text-primary)',
              marginBottom: '20px',
            }}
          >
            Make smarter pricing decisions with <span style={{ color: 'var(--accent-purple)' }}>predictive AI</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '36px',
              maxWidth: '720px',
              margin: '0 auto 36px',
            }}
          >
            Make smarter pricing decisions with AI-powered price prediction, demand forecasting, revenue optimization and market intelligence.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Link
              href="/login"
              className="btn btn-primary"
              style={{
                padding: '12px 28px',
                fontSize: '1rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              Get Started <ArrowRight size={18} />
            </Link>

            <a
              href="#about"
              className="btn btn-secondary"
              style={{
                padding: '12px 26px',
                fontSize: '1rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              Learn More
            </a>
          </div>

          {/* Trust Highlights */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              marginTop: '40px',
              flexWrap: 'wrap',
              fontSize: '0.825rem',
              color: 'var(--text-muted)',
              fontWeight: 500,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <span>LightGBM & Random Forest Models</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <span>Gemini LLM Business Advisory</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <span>3-Tier Enterprise RBAC</span>
            </div>
          </div>
        </div>

        {/* Visual Dashboard Card Showcase */}
        <div style={{ marginTop: '56px', position: 'relative', zIndex: 1 }}>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-lg)',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Bar inside showcase */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F43F5E' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '6px' }}>
                  PricePilot AI — Active Intelligence Workspace
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge badge-emerald">
                  <Activity size={12} /> ML Models Live
                </span>
                <span className="badge badge-purple">
                  <Sparkles size={12} /> Gemini Insights
                </span>
              </div>
            </div>

            {/* Showcase Grid */}
            <div className="grid-3" style={{ gap: '16px' }}>
              {/* Card 1: Pricing */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--pastel-lavender)',
                  border: '1px solid var(--pastel-lavender-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--pastel-lavender-text)', textTransform: 'uppercase' }}>
                    Price Recommendation
                  </span>
                  <Tag size={16} color="var(--accent-purple)" />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  $28.50 <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>+14.0%</span>
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--pastel-lavender-text)' }}>
                  Clearing recommendation based on demand elasticity & market dispersion.
                </div>
              </div>

              {/* Card 2: Demand */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--pastel-blue)',
                  border: '1px solid var(--pastel-blue-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--pastel-blue-text)', textTransform: 'uppercase' }}>
                    14-Day Demand Velocity
                  </span>
                  <TrendingUp size={16} color="var(--accent-cyan)" />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  1,420 Units <span style={{ fontSize: '0.85rem', color: 'var(--accent-sky)', fontWeight: 700 }}>94.8% Conf</span>
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--pastel-blue-text)' }}>
                  Multi-horizon forecast with historical lag & promotional alignment.
                </div>
              </div>

              {/* Card 3: Revenue */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--pastel-mint)',
                  border: '1px solid var(--pastel-mint-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--pastel-mint-text)', textTransform: 'uppercase' }}>
                    Projected Revenue Lift
                  </span>
                  <DollarSign size={16} color="var(--accent-emerald)" />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  +$184,200 <span style={{ fontSize: '0.85rem', color: 'var(--pastel-mint-text)', fontWeight: 700 }}>Optimal Point</span>
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--pastel-mint-text)' }}>
                  Elasticity frontier maximization balancing sales volume & margin.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. About & Core Capabilities Section */}
      <section
        id="about"
        style={{
          padding: '80px 24px',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 56px' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--accent-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Enterprise Capabilities
            </span>
            <h2
              style={{
                fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                marginTop: '8px',
                marginBottom: '16px',
              }}
            >
              How PricePilot AI Powers Retail Decisions
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              The platform combines machine learning, business intelligence and AI-generated insights to support high-confidence pricing decisions across multi-channel retail catalogs.
            </p>
          </div>

          {/* 5 Feature Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* 1. Price Prediction */}
            <div
              className="card"
              style={{
                padding: '28px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--pastel-lavender)',
                  border: '1px solid var(--pastel-lavender-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <Tag size={22} color="var(--accent-purple)" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                Price Prediction Engine
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Machine learning model evaluating candidate pricing grids, predicting clearing prices, and calculating alignment scores against promotional history and catalog metadata.
              </p>
            </div>

            {/* 2. Demand Forecasting */}
            <div
              className="card"
              style={{
                padding: '28px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--pastel-blue)',
                  border: '1px solid var(--pastel-blue-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <TrendingUp size={22} color="var(--accent-sky)" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                Demand Forecasting
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Multi-horizon time-series forecasting (7, 14, 30 days) predicting unit velocity, trend shifts, and inventory risk grades using gradient-boosted decision trees.
              </p>
            </div>

            {/* 3. Revenue Optimization */}
            <div
              className="card"
              style={{
                padding: '28px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--pastel-mint)',
                  border: '1px solid var(--pastel-mint-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <DollarSign size={22} color="var(--accent-emerald)" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                Revenue Optimization
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Price elasticity exploration identifying the revenue-maximizing price point, balancing volume demand against gross margin yield.
              </p>
            </div>

            {/* 4. Market Analysis */}
            <div
              className="card"
              style={{
                padding: '28px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--pastel-peach)',
                  border: '1px solid var(--pastel-peach-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <Compass size={22} color="var(--pastel-peach-accent)" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                Market & Channel Analysis
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Contemporaneous cross-store dispersion benchmarks and digital-channel price comparisons to detect arbitrage opportunities and channel price disparities.
              </p>
            </div>

            {/* 5. AI Business Insights */}
            <div
              className="card"
              style={{
                padding: '28px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--pastel-rose)',
                  border: '1px solid var(--pastel-rose-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <Sparkles size={22} color="var(--accent-rose)" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                AI Business Insights & Advisory
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Gemini LLM-generated executive narratives, actionable risk radars, and markdown business intelligence reports synthesized directly from live SKU metrics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Role-Based Access Tiers Section */}
      <section
        id="roles"
        style={{
          padding: '80px 24px',
          maxWidth: '1240px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 56px' }}>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--accent-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Role-Based Access Control
          </span>
          <h2
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              marginTop: '8px',
              marginBottom: '16px',
            }}
          >
            Tailored Workspaces for Every Team Member
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            PricePilot AI enforces strict 3-tier authorization to provide secure, role-appropriate tools.
          </p>
        </div>

        <div className="grid-3" style={{ gap: '24px' }}>
          {/* Admin Tier */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--pastel-lavender-border)',
              padding: '30px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 700,
                }}
              >
                👑
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Administrator</h3>
                <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '1px 8px' }}>Full Management</span>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              Full platform governance, live user directory CRUD, permission grants, and full analytics.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: 'auto', marginBottom: '20px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} color="var(--accent-purple)" /> User Management & Activation
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} color="var(--accent-purple)" /> Price Prediction & Optimization
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} color="var(--accent-purple)" /> Market & Channel Benchmarking
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} color="var(--accent-purple)" /> Executive BI Reporting
              </li>
            </ul>
          </div>

          {/* Business Analyst Tier */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--pastel-blue-border)',
              padding: '30px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #06B6D4, #0284C7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 700,
                }}
              >
                📊
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Business Analyst</h3>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '1px 8px' }}>Pricing & BI</span>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              Deep dive pricing analytics, elasticity curve exploration, demand forecasts, and BI reports.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} color="var(--accent-cyan)" /> Price Elasticity Analysis
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} color="var(--accent-cyan)" /> Multi-Horizon Demand Forecasting
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} color="var(--accent-cyan)" /> Competitor & Channel Benchmark
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} color="var(--accent-cyan)" /> Automated BI Dossiers
              </li>
            </ul>
          </div>

          {/* Standard User Tier */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
              padding: '30px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 700,
                }}
              >
                👤
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Standard User</h3>
                <span className="badge badge-mint" style={{ fontSize: '0.65rem', padding: '1px 8px' }}>Operational</span>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              Day-to-day product lookup, recommended price reviews, demand checks, and AI insights.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} color="var(--accent-mint)" /> Executive Dashboard Overview
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} color="var(--accent-mint)" /> Product Catalog & Performance
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} color="var(--accent-mint)" /> Price Clearing Recommendations
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} color="var(--accent-mint)" /> AI Insights & Risk Alerts
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Clean Footer Section */}
      <footer
        style={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid var(--border-subtle)',
          padding: '36px 24px 28px',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={18} color="#FFFFFF" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              PricePilot <span style={{ color: 'var(--accent-purple)' }}>AI</span>
            </span>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Enterprise Dynamic Pricing & Revenue Intelligence Platform
          </div>
        </div>

        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            paddingTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>© {new Date().getFullYear()} PricePilot AI. All rights reserved.</div>
          <div>FastAPI · LightGBM · Random Forest · MongoDB · Next.js</div>
        </div>
      </footer>

      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn {
            display: none !important;
          }
          .mobile-dropdown {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
