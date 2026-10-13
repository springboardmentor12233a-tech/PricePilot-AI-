import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen px-4 text-slate-100">
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 font-display text-lg font-bold shadow-lg shadow-blue-500/30">P</div>
            <span className="font-display text-xl font-semibold tracking-tight">PricePilot AI</span>
          </div>
          <form onSubmit={submit} className="card space-y-4 p-6">
            <h1 className="text-lg font-semibold text-slate-50">Sign in</h1>
            {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-sm text-rose-200">{error}</div>}
            <div>
              <label className="mb-1 block text-xs text-slate-400">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="btn-primary w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
            <p className="text-center text-xs text-slate-400">
              No account? <Link to="/register" className="text-accent underline-offset-2 hover:underline">Register</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
