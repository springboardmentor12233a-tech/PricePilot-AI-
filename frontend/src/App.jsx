import React, { useState, useEffect } from "react";
import "./index.css";
import "./App.css";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import IntelligenceShowcase from "./components/IntelligenceShowcase";
import ArchitectureSection from "./components/ArchitectureSection";
import AuthModal from "./components/AuthModal";
import AIGuideModal from "./components/AIGuideModal";
import Footer from "./components/Footer";
import Dashboard from "./Dashboard";
import { checkHealth, getMe, getToken, logout as apiLogout } from "./api";
import { 
  Zap, 
  BarChart3, 
  Cpu, 
  Target, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Layers,
  Award,
  BookOpen
} from "lucide-react";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [inDashboard, setInDashboard] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState("login");
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    // Check Backend connection
    checkHealth()
      .then(() => setBackendStatus("online"))
      .catch(() => setBackendStatus("offline"));

    // Check existing stored token
    const token = getToken();
    if (token) {
      getMe()
        .then((user) => {
          setCurrentUser(user);
        })
        .catch(() => {
          // Token invalid or expired
          apiLogout();
        });
    }
  }, []);

  const handleOpenAuth = (mode = "login") => {
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setInDashboard(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setInDashboard(false);
  };

  // If user is currently in the interactive dashboard workspace
  if (inDashboard && currentUser) {
    return (
      <Dashboard
        user={currentUser}
        onLogout={handleLogout}
        onReturnHome={() => setInDashboard(false)}
      />
    );
  }

  return (
    <div className="site-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        currentUser={currentUser}
        onOpenDashboard={() => setInDashboard(true)}
        onOpenGuide={() => setGuideModalOpen(true)}
        backendStatus={backendStatus}
      />

      {/* Hero Section */}
      <Hero
        onExplore={() => {
          if (currentUser) {
            setInDashboard(true);
          } else {
            setCurrentUser({
              id: 1,
              username: "pricing_lead",
              email: "pricing.lead@example.com",
              role: "PRICING_MANAGER",
              is_active: true
            });
            setInDashboard(true);
          }
        }}
        onOpenAuth={handleOpenAuth}
      />

      {/* Trust & Capabilities Strip */}
      <div style={{ background: "rgba(15, 23, 42, 0.6)", borderTop: "1px solid var(--border-light)", borderBottom: "1px solid var(--border-light)", padding: "20px 5vw", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "16px", color: "var(--text-secondary)", fontSize: "13px", fontWeight: "600" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Cpu size={16} color="#10b981" />
          <span>XGBoost ML Regressors</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={16} color="#6366f1" />
          <span>Multi-Horizon Demand Forecasts</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Target size={16} color="#38bdf8" />
          <span>Dynamic Price Elasticity Simulation</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldCheck size={16} color="#f59e0b" />
          <span>Role-Based Access & Audit Trail</span>
        </div>
      </div>

      {/* Core Intelligence Showcase (Forecasting, Competitors, Revenue) */}
      <IntelligenceShowcase
        onExploreWorkspace={() => {
          if (currentUser) {
            setInDashboard(true);
          } else {
            handleOpenAuth("login");
          }
        }}
      />

      {/* Enterprise Architecture Pipeline */}
      <ArchitectureSection />

      {/* Call to Action Section */}
      <section className="section-wrapper" style={{ textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="hero-glow-blob" style={{ top: "10%", left: "30%", background: "radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)" }}></div>
        <div className="glass-panel" style={{ maxWidth: 880, margin: "0 auto", padding: "60px 40px", position: "relative", zIndex: 2 }}>
          <span className="badge-glow" style={{ marginBottom: "16px" }}>
            <Sparkles size={14} />
            Instant Enterprise Deployment
          </span>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: "16px" }}>
            Transform Pricing Strategy into a Revenue Growth Engine
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 600, margin: "0 auto 32px" }}>
            Empower your merchandising and pricing leaders with real-time elasticity modeling and automated market intelligence.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setCurrentUser({
                  id: 1,
                  username: "admin_test",
                  email: "admin.test@example.com",
                  role: "ADMIN",
                  is_active: true
                });
                setInDashboard(true);
              }}
            >
              <span>Launch Full Workspace Sandbox</span>
              <ArrowRight size={16} />
            </button>
            <button className="btn btn-secondary" onClick={() => setGuideModalOpen(true)}>
              <BookOpen size={15} />
              <span>View Interactive AI Guide</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authInitialMode}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Interactive AI User Guide Modal */}
      <AIGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
      />
    </div>
  );
}

export default App;