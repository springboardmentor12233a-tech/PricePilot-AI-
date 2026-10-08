"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme, THEMES } from "@/lib/theme-context";
import { api } from "@/lib/api";
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  KeyRound,
  CheckCircle2,
  LineChart,
  Eye,
  HelpCircle,
  ChevronDown,
  Check,
} from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot / Reset password state
  const [authMode, setAuthMode] = useState<"login" | "forgot" | "reset">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenFromUrl = searchParams.get("reset_token");
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
      setAuthMode("reset");
    }
  }, [searchParams]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const data = await api.auth.login(email, password);
      login(data.access_token, data.user);
      router.push("/");
    } catch (err: any) {
      console.error("Login failed:", err);
      const msg = err.response?.data?.detail || "Authentication failed. Invalid email or password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError("Please enter your registered email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.forgotPassword(forgotEmail);
      setSuccessMsg("Reset token generated! Server console has printed the simulated link.");
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Could not process password reset request.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) {
      setError("Please provide the reset token and your new password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.auth.resetPassword(resetToken, newPassword);
      setResetSuccess(true);
      setSuccessMsg("Password successfully updated. You may now sign in.");
      setTimeout(() => {
        setAuthMode("login");
        setEmail(forgotEmail || "analyst@pricepilot.ai");
        setPassword("");
        setResetSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid or expired reset token.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setAuthMode("login");
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-amber-500 shadow-xl shadow-teal-500/20 mb-4">
            <Sparkles className="w-8 h-8 text-navy-950" />
          </div>
          <h1 className="font-serif font-black text-3xl tracking-tight">
            PricePilot<span className="text-teal-400">AI</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic Pricing Optimization & Revenue Intelligence
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900 border border-teal-500/30 text-[11px] text-teal-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Dataset 1 OLS Validated (beta = -71.673, R² = 0.328)
          </div>
        </div>

        {/* Main Form Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl">
          {authMode === "login" && (
            <>
              <h2 className="text-lg font-serif font-bold mb-1">Enterprise Sign In</h2>
              <p className="text-xs text-slate-400 mb-6">Enter your credentials to access the pricing suite</p>

              {error && (
                <div className="p-3 mb-5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 mb-5 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-start gap-2.5 text-xs text-teal-300">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Corporate Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="analyst@pricepilot.ai"
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/70 rounded-xl pl-9 pr-4 py-2.5 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("forgot");
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-teal-400 hover:text-teal-300 hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/70 rounded-xl pl-9 pr-4 py-2.5 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-navy-950 font-bold text-xs shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying Session...
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center text-xs">
                  <span className="text-slate-400">Don't have an account? </span>
                  <Link
                    href="/signup"
                    className="text-teal-400 hover:text-teal-300 font-semibold hover:underline"
                  >
                    Create an account
                  </Link>
                </div>
              </form>
            </>
          )}

          {authMode === "forgot" && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-5 h-5 text-teal-400" />
                <h2 className="text-lg font-serif font-bold">Reset Password</h2>
              </div>
              <p className="text-xs text-slate-400 mb-5">
                Enter your email address to generate a simulated reset link.
              </p>

              {error && (
                <div className="p-3 mb-5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 mb-5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300">
                  <p className="font-semibold mb-1">{successMsg}</p>
                  {resetToken && (
                    <div className="mt-2 pt-2 border-t border-teal-500/20">
                      <p className="text-[11px] text-slate-400 mb-1">Generated Reset Token:</p>
                      <p className="font-mono text-[10px] bg-slate-900 p-1.5 rounded break-all select-all">
                        {resetToken}
                      </p>
                      <button
                        type="button"
                        onClick={() => setAuthMode("reset")}
                        className="mt-2.5 text-xs text-teal-400 hover:underline font-semibold"
                      >
                        Proceed to set new password &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Registered Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="analyst@pricepilot.ai"
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/70 rounded-xl pl-9 pr-4 py-2.5 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="w-1/2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium text-xs transition-colors"
                  >
                    Back to Sign In
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-1/2 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all"
                  >
                    {loading ? "Generating..." : "Generate Token"}
                  </button>
                </div>
              </form>
            </>
          )}

          {authMode === "reset" && (
            <>
              <h2 className="text-lg font-serif font-bold mb-1">Set New Password</h2>
              <p className="text-xs text-slate-400 mb-5">
                Enter your reset token and your desired new password.
              </p>

              {error && (
                <div className="p-3 mb-5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 mb-5 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-start gap-2.5 text-xs text-teal-300">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Reset Token</label>
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Enter or paste token..."
                    required
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/70 rounded-xl px-3 py-2 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password (min 6 chars)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/70 rounded-xl px-3 py-2 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500/70 rounded-xl px-3 py-2 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30 transition-all font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="w-1/2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || resetSuccess}
                    className="w-1/2 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all"
                  >
                    {loading ? "Updating..." : "Save Password"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Quick Demo Credentials Strip */}
          {authMode === "login" && (
            <div className="mt-6 pt-5 border-t border-slate-800">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2.5 text-center">
                Quick Role-Based Access Demo
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo("admin@pricepilot.ai", "Admin@123")}
                  className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-center transition-colors group"
                >
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-300 mb-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    Admin
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Full CRUD & Governance</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo("analyst@pricepilot.ai", "Analyst@123")}
                  className="p-2.5 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-center transition-colors group"
                >
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-teal-300 mb-0.5">
                    <LineChart className="w-3.5 h-3.5 text-teal-400" />
                    Business Analyst
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Pricing & Forecasts</div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          PricePilot AI &bull; Springboard Capstone &bull; Built with FastAPI & Next.js
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-navy-950 flex items-center justify-center text-teal-400 font-mono text-xs">
          Loading authentication...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
