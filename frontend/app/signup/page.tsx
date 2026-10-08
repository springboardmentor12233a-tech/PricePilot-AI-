"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme, THEMES } from "@/lib/theme-context";
import { api } from "@/lib/api";
import {
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Check,
} from "lucide-react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Touched state for progressive inline feedback
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const { login } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const router = useRouter();

  const currentThemeObj = themes.find((t) => t.id === theme) || themes[0];

  // Inline validations
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameError =
    touched.name && (!name.trim() ? "Full name is required." : null);
  const emailError =
    touched.email &&
    (!email.trim()
      ? "Email address is required."
      : !emailRegex.test(email.trim())
      ? "Please enter a valid email address."
      : null);
  const passwordError =
    touched.password &&
    (!password
      ? "Password is required."
      : password.length < 8
      ? "Password must be at least 8 characters long."
      : null);
  const confirmPasswordError =
    touched.confirmPassword &&
    (!confirmPassword
      ? "Please confirm your password."
      : confirmPassword !== password
      ? "Passwords do not match."
      : null);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    setServerError(null);

    // Validate all fields
    if (!name.trim()) return;
    if (!email.trim() || !emailRegex.test(email.trim())) return;
    if (!password || password.length < 8) return;
    if (password !== confirmPassword) return;

    setLoading(true);
    try {
      const data = await api.auth.signup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      // Sign the user in through existing auth context
      login(data.access_token, data.user);
      router.push("/");
    } catch (err: any) {
      console.error("Signup failed:", err);
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setServerError(detail);
      } else if (Array.isArray(detail)) {
        setServerError(detail.map((d: any) => d.msg).join(", "));
      } else {
        setServerError(
          err.response?.status === 409
            ? "An account with this email already exists."
            : "Registration failed. Please check your details and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-200"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Ambient background glows */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: "var(--accent)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-15"
        style={{ backgroundColor: "var(--warning)" }}
      />

      {/* Top Bar with 6-Theme Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <div className="relative">
          <button
            type="button"
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all shadow-sm"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
            title="Theme Palette"
          >
            <span
              className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
              style={{ backgroundColor: currentThemeObj.dotColor }}
            />
            <span className="font-medium text-[11px]">{currentThemeObj.name}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {themeDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-2xl glass-panel border shadow-2xl py-2 z-50 animate-fadeIn"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <div
                className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold border-b mb-1"
                style={{
                  color: "var(--text-muted)",
                  borderColor: "var(--border-light)",
                }}
              >
                Themes (6 Options)
              </div>
              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setThemeDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors text-left"
                  style={{
                    backgroundColor:
                      theme === t.id ? "rgba(20, 184, 166, 0.15)" : "transparent",
                    color: theme === t.id ? "var(--accent)" : "var(--text)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-white/30 shrink-0"
                      style={{ backgroundColor: t.dotColor }}
                    />
                    <span>{t.name}</span>
                  </div>
                  {theme === t.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-md relative z-10 my-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/login" className="inline-block group">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-xl mb-3 transition-transform group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, #f59e0b 100%)",
                color: "#070c18",
              }}
            >
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-3xl tracking-tight">
              PricePilot<span style={{ color: "var(--accent)" }}>AI</span>
            </h1>
          </Link>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            Dynamic Pricing Optimization & Revenue Intelligence
          </p>
          <div
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-[11px] font-mono"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--accent)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--accent)" }}
            />
            Self-Service Business Analyst Registration
          </div>
        </div>

        {/* Signup Card */}
        <div
          className="glass-card rounded-2xl p-6 sm:p-8 border shadow-2xl transition-colors duration-200"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <div className="mb-5">
            <h2 className="text-lg font-serif font-bold mb-1">Create Your Account</h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Join the PricePilot workspace as a Business Analyst
            </p>
          </div>

          {/* Server Error Message */}
          {serverError && (
            <div
              className="p-3 mb-5 rounded-xl border flex items-start gap-2.5 text-xs animate-shake"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                borderColor: "rgba(239, 68, 68, 0.35)",
                color: "#fca5a5",
              }}
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="font-medium">{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text)" }}
              >
                Full Name
              </label>
              <div className="relative">
                <UserIcon
                  className="w-4 h-4 absolute left-3 top-3 pointer-events-none"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => handleBlur("name")}
                  placeholder="Marcus Vance"
                  required
                  className="w-full rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none transition-all"
                  style={{
                    backgroundColor: "var(--surface-card)",
                    border: `1px solid ${nameError ? "var(--danger)" : "var(--border)"}`,
                    color: "var(--text)",
                  }}
                />
              </div>
              {nameError && (
                <p className="mt-1 text-[11px] font-medium text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {nameError}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text)" }}
              >
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 absolute left-3 top-3 pointer-events-none"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder="analyst@enterprise.com"
                  required
                  className="w-full rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono focus:outline-none transition-all"
                  style={{
                    backgroundColor: "var(--surface-card)",
                    border: `1px solid ${emailError ? "var(--danger)" : "var(--border)"}`,
                    color: "var(--text)",
                  }}
                />
              </div>
              {emailError && (
                <p className="mt-1 text-[11px] font-medium text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text)" }}
              >
                Password <span className="text-[10px] opacity-70">(min 8 characters)</span>
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 absolute left-3 top-3 pointer-events-none"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono focus:outline-none transition-all"
                  style={{
                    backgroundColor: "var(--surface-card)",
                    border: `1px solid ${passwordError ? "var(--danger)" : "var(--border)"}`,
                    color: "var(--text)",
                  }}
                />
              </div>
              {passwordError && (
                <p className="mt-1 text-[11px] font-medium text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {passwordError}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text)" }}
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 absolute left-3 top-3 pointer-events-none"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur("confirmPassword")}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono focus:outline-none transition-all"
                  style={{
                    backgroundColor: "var(--surface-card)",
                    border: `1px solid ${confirmPasswordError ? "var(--danger)" : "var(--border)"}`,
                    color: "var(--text)",
                  }}
                />
              </div>
              {confirmPasswordError && (
                <p className="mt-1 text-[11px] font-medium text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {confirmPasswordError}
                </p>
              )}
            </div>

            {/* Role Notice */}
            <div
              className="p-3 rounded-xl border text-[11px] leading-relaxed"
              style={{
                backgroundColor: "var(--surface-card)",
                borderColor: "var(--border-light)",
                color: "var(--text-muted)",
              }}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5" style={{ color: "var(--accent)" }}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Assigned Role: Business Analyst</span>
              </div>
              You will have access to price optimization, demand forecasts, and BI reports. Admin features require administrative elevation.
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs shadow-lg disabled:opacity-50 transition-all cursor-pointer"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--accent-text)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <span>Create Account & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link back to login */}
          <div
            className="mt-6 pt-5 border-t text-center text-xs"
            style={{ borderColor: "var(--border-light)" }}
          >
            <span style={{ color: "var(--text-muted)" }}>Already have an account? </span>
            <Link
              href="/login"
              className="font-semibold transition-colors hover:underline"
              style={{ color: "var(--accent)" }}
            >
              Sign in here &rarr;
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <p
          className="text-center text-[11px] mt-6"
          style={{ color: "var(--text-muted)" }}
        >
          PricePilot AI &bull; Springboard Capstone &bull; Built with FastAPI & Next.js
        </p>
      </div>
    </div>
  );
}
