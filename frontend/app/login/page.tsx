"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [role, setRole] = useState("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter username and password.");
      return;
    }

    localStorage.setItem(
      "pricepilot_user",
      JSON.stringify({
        username,
        role,
      })
    );

    router.push("/overview");
  };

  return (
    <main className="min-h-screen bg-[#020617] flex items-center justify-center px-6">

      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            PricePilot <span className="text-blue-500">AI</span>
          </h1>

          <p className="text-slate-400 mt-2">
            Revenue Intelligence Platform
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-2xl">

          <h2 className="text-2xl font-semibold text-white">
            Welcome back
          </h2>

          <p className="text-slate-400 text-sm mt-1 mb-7">
            Sign in to access your PricePilot dashboard
          </p>

          {/* Role */}
          <label className="block text-sm text-slate-300 mb-2">
            Access Role
          </label>

          <div className="grid grid-cols-3 gap-2 mb-5">

            {["admin", "analyst", "guest"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRole(item)}
                className={`py-2.5 rounded-lg border text-sm capitalize transition ${
                  role === item
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                }`}
              >
                {item}
              </button>
            ))}

          </div>

          <form onSubmit={handleLogin}>

            <label className="block text-sm text-slate-300 mb-2">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 mb-5"
            />

            <label className="block text-sm text-slate-300 mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 mb-5"
            />

            {error && (
              <p className="text-red-400 text-sm mb-4">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition"
            >
              Sign In
            </button>

          </form>

          <div className="mt-6 pt-5 border-t border-slate-800">

            <p className="text-xs text-slate-500 text-center">
              Demo access
            </p>

            <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-slate-400 text-center">
              <div>
                <p className="text-blue-400">Admin</p>
                <p>Full Access</p>
              </div>

              <div>
                <p className="text-emerald-400">Analyst</p>
                <p>Analytics</p>
              </div>

              <div>
                <p className="text-purple-400">Guest</p>
                <p>View Only</p>
              </div>
            </div>

          </div>

        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          PricePilot AI • Revenue Intelligence
        </p>

      </div>

    </main>
  );
}