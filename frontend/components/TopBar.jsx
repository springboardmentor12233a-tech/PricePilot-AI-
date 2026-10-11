import { useEffect, useState } from "react";
import { Pill } from "./ui";
import { BASE_URL } from "../lib/api";
import { Bell, LogOut } from "lucide-react";
import { useRouter } from "next/router";

export default function TopBar({ title, subtitle }) {
  const [backendUp, setBackendUp] = useState(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE_URL}/health`)
      .then((r) => !cancelled && setBackendUp(r.ok))
      .catch(() => !cancelled && setBackendUp(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function logout() {
    window.localStorage.removeItem("pricepilot_token");
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-border bg-panel/70 backdrop-blur sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-bold text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {backendUp === null ? (
          <Pill tone="neutral">Checking backend…</Pill>
        ) : backendUp ? (
          <Pill tone="ok">API connected</Pill>
        ) : (
          <Pill tone="gold">Demo data (API offline)</Pill>
        )}
        <button className="w-9 h-9 rounded-lg border border-border bg-panel flex items-center justify-center text-muted hover:text-ink hover:bg-canvas transition-colors">
          <Bell size={16} />
        </button>
        <button
          onClick={logout}
          className="w-9 h-9 rounded-lg border border-border bg-panel flex items-center justify-center text-muted hover:text-danger hover:bg-danger-light transition-colors"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
