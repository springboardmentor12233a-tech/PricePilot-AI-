"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../lib/api";

const datasets = [
  { name: "Retail Pricing & Demand", rows: "172,800" },
  { name: "Dynamic Pricing", rows: "1,000" },
  { name: "Online Retail II", rows: "1,007,913" },
  { name: "Walmart Sales", rows: "6,435" },
  { name: "Amazon Products", rows: "1,393,564" },
  { name: "Amazon UK Products", rows: "2,222,724" },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(username, password);
      localStorage.setItem("access_token", data.access_token);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_0.9fr]">
      {/* LEFT: Brand / Data Panel */}
      <div className="brand-panel hidden lg:flex flex-col relative">
        <div className="relative z-10 p-14 pb-0">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg logo-mark flex items-center justify-center font-bold text-[#052018]">
              P
            </div>
            <span className="text-lg font-semibold tracking-tight">PricePilot AI</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-14 max-w-xl">
          <h2 className="text-[2.75rem] font-bold leading-[1.08] mb-5 tracking-tight">
            Price with precision.
            <br />
            <span className="gradient-heading">Grow with intelligence.</span>
          </h2>
          <p className="muted-text text-[15px] leading-relaxed mb-10 max-w-md">
            Demand signals, competitor pricing, and revenue analytics —
            unified into one dynamic pricing intelligence engine.
          </p>

          <div className="terminal-card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="mono text-[11px] muted-text-2 uppercase tracking-widest">
                dataset_registry.log
              </span>
              <span className="status-dot" />
            </div>
            <div className="space-y-2.5">
              {datasets.map((d) => (
                <div key={d.name} className="flex items-center gap-2.5 text-sm">
                  <span className="row-icon shrink-0" />
                  <span className="muted-text flex-1">{d.name}</span>
                  <span className="mono accent-text font-medium">{d.rows}</span>
                </div>
              ))}
            </div>
            <div className="divider-fade my-4" />
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Total records</span>
              <span className="mono violet-text font-bold">4,804,436</span>
            </div>
          </div>
        </div>

        <div className="status-strip relative z-10 px-14 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="status-dot" />
            <span className="mono text-xs muted-text-2 tracking-wide">
              pipeline: active
            </span>
          </div>
          <span className="mono text-xs muted-text-2">
            © 2026 · Infosys Springboard
          </span>
        </div>
      </div>

      {/* RIGHT: Login Form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg logo-mark flex items-center justify-center font-bold text-[#052018] text-sm">
                P
              </div>
              <span className="text-lg font-semibold tracking-tight">PricePilot AI</span>
            </div>
          </div>

          <div className="glass-card p-8">
            <h1 className="text-xl font-semibold mb-1">Welcome back</h1>
            <p className="muted-text text-sm mb-7">Sign in to your workspace</p>

            {error && (
              <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium muted-text mb-2 uppercase tracking-wide">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none"
                  placeholder="sobhitgiri"
                />
              </div>

              <div>
                <label className="block text-xs font-medium muted-text mb-2 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="accent-btn w-full py-2.5 rounded-lg font-semibold text-sm mt-2 disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>

          <p className="text-center muted-text-2 text-xs mt-6 tracking-wide">
            PRICING MANAGER · ANALYST · SALES · EXECUTIVE
          </p>
        </div>
      </div>
    </div>
  );
}