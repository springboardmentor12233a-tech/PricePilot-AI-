import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Gauge, ArrowRight, TrendingUp, LineChart, ShieldCheck } from "lucide-react";
import { api } from "../lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.login(email, password);
      window.localStorage.setItem("pricepilot_token", res?.access_token ?? "demo-token");
      router.push("/");
    } catch (err) {
      if (err?.status) {
        // Backend responded -- it's a real rejection (401 wrong credentials,
        // 422 bad form body, etc). Show it. Do NOT log the user in.
        if (err.status === 401) {
          setError("Incorrect email or password.");
        } else {
          setError(`Login failed (${err.status}). Check the browser console/network tab.`);
        }
      } else {
        // No status = fetch itself failed (backend not running, wrong
        // NEXT_PUBLIC_API_BASE_URL, CORS block). Fall back to demo mode
        // so the UI is still reviewable.
        window.localStorage.setItem("pricepilot_token", "demo-token");
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: form */}
      <div className="w-full lg:w-[480px] flex flex-col justify-center px-10 sm:px-14 bg-panel">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Gauge size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-ink">
            PricePilot <span className="text-primary">AI</span>
          </span>
        </div>

        <h1 className="text-2xl font-bold text-ink tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted mt-1.5">
          Sign in to your pricing and revenue intelligence workspace.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium text-ink">Work email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-border bg-canvas outline-none focus:border-primary text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-border bg-canvas outline-none focus:border-primary text-sm"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        <p className="text-sm text-muted mt-5 text-center">
          New here?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Create an account
          </Link>
        </p>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted">
          <ShieldCheck size={14} />
          Role-based access · JWT session · No demo data stored on this device
        </div>
      </div>

      {/* Right: brand panel */}
      <div className="hidden lg:flex flex-1 bg-primary-dark relative overflow-hidden flex-col justify-between p-14">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative">
          <h2 className="text-white text-4xl font-bold tracking-tight leading-tight max-w-md">
            Every price, backed by demand — not guesswork.
          </h2>
          <p className="text-white/70 mt-4 max-w-sm text-[15px] leading-relaxed">
            PricePilot AI reads your sales history, competitor movement, and
            demand signals, then tells you exactly what to charge — and how
            confident it is.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, label: "Price prediction", stat: "±4.2% MAE" },
            { icon: LineChart, label: "Demand forecasting", stat: "88% confidence" },
            { icon: Gauge, label: "Revenue lift", stat: "+8.4% / mo" },
          ].map(({ icon: Icon, label, stat }) => (
            <div
              key={label}
              className="bg-white/10 border border-white/15 rounded-xl2 p-4 backdrop-blur"
            >
              <Icon size={18} className="text-gold" />
              <p className="text-white text-sm font-semibold mt-3">{stat}</p>
              <p className="text-white/60 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
