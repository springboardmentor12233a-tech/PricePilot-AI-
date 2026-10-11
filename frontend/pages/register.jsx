import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Gauge, ArrowRight, ShieldCheck } from "lucide-react";
import { api } from "../lib/api";

// CONFIRMED from app/models/models.py's UserRole enum.
const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "pricing_manager", label: "Pricing Manager" },
  { value: "analyst", label: "Analyst" },
];

export default function Register() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(ROLES[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // 1. Register the user (your backend doesn't auto-login on register,
      //    it just creates the account -- per auth.py, /register returns
      //    the user, not a token).
      await api.register({ email, password, full_name: fullName, role });

      // 2. Immediately log in with the same credentials so the person
      //    doesn't have to re-enter anything, matching the register -> login
      //    flow your backend supports.
      const res = await api.login(email, password);
      window.localStorage.setItem("pricepilot_token", res?.access_token ?? "demo-token");
      router.push("/");
    } catch (err) {
      if (err?.status === 400) {
        setError("That email is already registered. Try signing in instead.");
      } else if (err?.status) {
        setError(`Registration failed (${err.status}). Check the browser network tab for details.`);
      } else {
        setError("Couldn't reach the backend. Is it running on NEXT_PUBLIC_API_BASE_URL?");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-md bg-panel border border-border rounded-xl2 shadow-card p-8">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Gauge size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-ink">
            PricePilot <span className="text-primary">AI</span>
          </span>
        </div>

        <h1 className="text-xl font-bold text-ink tracking-tight">Create your account</h1>
        <p className="text-sm text-muted mt-1.5">
          Registers via your backend, then signs you straight in.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-ink">Full name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ananya Rao"
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-border bg-canvas outline-none focus:border-primary text-sm"
            />
          </div>
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
          <div>
            <label className="text-sm font-medium text-ink">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-border bg-canvas outline-none focus:border-primary text-sm"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        <p className="text-sm text-muted mt-5 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>

        <div className="mt-6 flex items-center gap-2 text-xs text-muted justify-center">
          <ShieldCheck size={14} />
          Role-based access · JWT session
        </div>
      </div>
    </div>
  );
}
