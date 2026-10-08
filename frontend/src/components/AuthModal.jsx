import React, { useState } from "react";
import { X, Lock, User, Mail, Shield, CheckCircle2, Sparkles } from "lucide-react";
import { login, register, getMe } from "../api";

function AuthModal({ isOpen, initialMode = "login", onClose, onLoginSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(username, password);
        const user = await getMe();
        onLoginSuccess(user);
        onClose();
      } else {
        await register({ username, email, password });
        setSuccessMsg("Account created successfully! Signing in...");
        await login(username, password);
        const user = await getMe();
        setTimeout(() => {
          onLoginSuccess(user);
          onClose();
        }, 800);
      }
    } catch (err) {
      // If the backend is not running or credentials invalid, provide clear feedback
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (personaRole) => {
    setError("");
    if (personaRole === "ADMIN") {
      setUsername("admin_test");
      setPassword("AdminTest123");
    } else if (personaRole === "PRICING_MANAGER") {
      setUsername("pricing_lead");
      setPassword("PriceLead123");
    } else {
      setUsername("analyst_demo");
      setPassword("Analyst123");
    }
  };

  // Instant demo bypass if offline or quick evaluation needed
  const handleInstantDemoBypass = (personaRole) => {
    const mockUser = {
      id: 99,
      username: personaRole === "ADMIN" ? "admin_test" : personaRole === "PRICING_MANAGER" ? "pricing_lead" : "analyst_demo",
      email: `${personaRole.toLowerCase()}@pricepilot.ai`,
      role: personaRole,
      is_active: true
    };
    onLoginSuccess(mockUser);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: 24, fontWeight: 800 }}>
            {mode === "login" ? "Sign In to Workspace" : "Create Business Account"}
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Access real-time dynamic pricing & demand intelligence
          </p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Sign In
          </button>
          <button 
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => { setMode("register"); setError(""); }}
          >
            Register
          </button>
        </div>

        {/* Demo Quick Persona Selector */}
        <div className="demo-credentials-box">
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-emerald)", display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={13} />
            Quick Demo Persona Login (Click to fill)
          </div>
          <div className="demo-chips">
            <button type="button" className="demo-chip" onClick={() => handleDemoLogin("ADMIN")}>
              Admin (Full Access)
            </button>
            <button type="button" className="demo-chip" onClick={() => handleDemoLogin("PRICING_MANAGER")}>
              Pricing Manager
            </button>
            <button type="button" className="demo-chip" onClick={() => handleDemoLogin("ANALYST")}>
              Analyst
            </button>
          </div>
        </div>

        {error && (
          <div className="auth-alert-error">
            {error}
            <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-primary)" }}>
              Tip: You can also <span style={{ textDecoration: 'underline', cursor: 'pointer', color: '#38bdf8' }} onClick={() => handleInstantDemoBypass('ADMIN')}>click here to enter in Sandbox Mode</span>.
            </div>
          </div>
        )}

        {successMsg && (
          <div style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399", padding: "10px", borderRadius: "8px", fontSize: 13, marginBottom: 14 }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin_test"
              required
            />
          </div>

          {mode === "register" && (
            <div className="form-group">
              <label className="form-label">Business Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "10px" }}
            disabled={loading}
          >
            {loading ? "Authenticating..." : mode === "login" ? "Sign In to Workspace" : "Register & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
