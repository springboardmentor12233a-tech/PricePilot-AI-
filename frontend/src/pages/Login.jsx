import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* TOP BRANDING */}
      <div className="login-branding">

        <div className="login-logo">
          ✦
        </div>

        <h1>PricePilot AI</h1>

        <p>Revenue & Pricing Intelligence Platform</p>

      </div>


      {/* LOGIN CARD */}
      <div className="login-card">

        <div className="login-heading">
          <h2>Sign in to your account</h2>

          <p>
            Enter your credentials to access your personalized dashboard
          </p>
        </div>


        <form onSubmit={handleSubmit}>

          {/* EMAIL */}
          <div className="login-field">

            <label>Email Address</label>

            <div className="input-wrapper">

              <span className="input-icon">
                ✉
              </span>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.org"
                required
              />

            </div>

          </div>


          {/* PASSWORD */}
          <div className="login-field">

            <div className="password-label-row">

              <label>Password</label>

              <button
                type="button"
                className="forgot-password"
                onClick={() => {
                  setError("Password reset is not implemented yet.");
                }}
              >
                Forgot Password?
              </button>

            </div>

            <div className="input-wrapper">

              <span className="input-icon">
                ♙
              </span>

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? "◉" : "◌"}
              </button>

            </div>

          </div>


          {/* ERROR */}
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}


          {/* SIGN IN */}
          <button
            type="submit"
            className="signin-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In  →"}
          </button>

        </form>


        {/* CREATE ACCOUNT */}
        <div className="login-divider"></div>

        <div className="create-account">
          <span>Don't have an account?</span>

            <button
              type="button"
              onClick={() => navigate("/register")}
             >
             Create Account
            </button>
        </div>

      </div>
    </div>
  );
}

export default Login;