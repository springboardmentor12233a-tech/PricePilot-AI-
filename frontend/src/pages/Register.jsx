import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "VIEWER" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/login");
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen px-4 text-slate-100">
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 font-display text-lg font-bold shadow-lg shadow-blue-500/30">P</div>
            <span className="font-display text-xl font-semibold tracking-tight">PricePilot AI</span>
          </div>
          <form onSubmit={submit} className="card space-y-4 p-6">
            <h1 className="text-lg font-semibold text-slate-50">Create account</h1>
            {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-sm text-rose-200">{error}</div>}
            <div>
              <label className="mb-1 block text-xs text-slate-400">Full name</label>
              <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Password (min 8 chars)</label>
              <input className="input" type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="VIEWER">Viewer</option>
                <option value="BUSINESS_ANALYST">Business Analyst</option>
                <option value="BUSINESS_MANAGER">Business Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button className="btn-primary w-full" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
            <p className="text-center text-xs text-slate-400">
              Already have an account? <Link to="/login" className="text-accent underline-offset-2 hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
