import React from "react";
import { TrendingUp, ShieldCheck, Zap, LogIn, UserCheck, LayoutDashboard, BookOpen } from "lucide-react";

function Navbar({ onOpenAuth, currentUser, onOpenDashboard, onOpenGuide, backendStatus }) {
  return (
    <header className="main-navbar">
      <div className="navbar-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="brand-icon">
          <TrendingUp size={22} strokeWidth={2.5} />
        </div>
        <span className="brand-text">PricePilot AI</span>
        <span className="brand-badge">v2.0 ML</span>
      </div>

      <nav className="nav-links-container">
        <a href="#how-it-works" className="nav-link">Intelligence Engine</a>
        <a href="#forecasting" className="nav-link">Forecasting</a>
        <a href="#competitors" className="nav-link">Competitor Matrix</a>
        <a href="#architecture" className="nav-link">Architecture</a>
        <button 
          onClick={onOpenGuide}
          style={{ background: "transparent", border: "none", color: "var(--accent-emerald)", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
        >
          <BookOpen size={15} />
          AI Guide
        </button>
        <div className="nav-status-pill">
          <span className={`status-dot ${backendStatus === "online" ? "online" : ""}`}></span>
          <span>{backendStatus === "online" ? "API Live (FastAPI)" : "Local Mode"}</span>
        </div>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button className="btn btn-outline btn-sm" onClick={onOpenGuide} title="Open AI Step-by-Step Instructions">
          <BookOpen size={14} color="#10b981" />
          <span>How to Use</span>
        </button>

        {currentUser ? (
          <button className="btn btn-primary btn-sm" onClick={onOpenDashboard}>
            <LayoutDashboard size={16} />
            Workspace ({currentUser.username})
          </button>
        ) : (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => onOpenAuth('login')}>
              <LogIn size={15} />
              Sign In
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => onOpenAuth('register')}>
              <Zap size={15} />
              Get Started
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
