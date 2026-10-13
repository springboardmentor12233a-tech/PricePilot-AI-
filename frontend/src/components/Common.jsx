export function KPICard({ label, value, sub, accent = "accent" }) {
  const accentMap = {
    accent: "text-blue-400",
    accent2: "text-violet-300",
    cyan: "text-cyan-300",
    success: "text-emerald-300",
    warning: "text-amber-300",
    danger: "text-rose-300",
  };

  return (
    <div className="card p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className={`mt-2 text-2xl font-display font-semibold ${accentMap[accent] || "text-blue-300"}`}>{value}</div>
      {sub && <div className="mt-2 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export function ChartCard({ title, children, action }) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      {label}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong." }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
      {message}
    </div>
  );
}

export function EmptyState({ message = "No data available yet." }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/5 py-10 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}

export function ConfidenceBadge({ label, score }) {
  const colors = {
    "High Confidence": "bg-emerald-500/10 text-emerald-300 border border-emerald-400/20",
    "Medium Confidence": "bg-amber-500/10 text-amber-300 border border-amber-400/20",
    "Low Confidence": "bg-rose-500/10 text-rose-300 border border-rose-400/20",
  };
  return (
    <span className={`badge ${colors[label] || "bg-slate-500/10 text-slate-200 border border-white/10"}`}>
      {label} ({score}%)
    </span>
  );
}

export function SeverityBadge({ severity }) {
  const colors = {
    INFO: "bg-sky-500/10 text-sky-300 border border-sky-400/20",
    WARNING: "bg-amber-500/10 text-amber-300 border border-amber-400/20",
    CRITICAL: "bg-rose-500/10 text-rose-300 border border-rose-400/20",
  };
  return <span className={`badge ${colors[severity] || "bg-slate-500/10 text-slate-200 border border-white/10"}`}>{severity}</span>;
}

export function PriorityBadge({ priority }) {
  const colors = {
    LOW: "bg-slate-500/10 text-slate-200 border border-white/10",
    MEDIUM: "bg-amber-500/10 text-amber-300 border border-amber-400/20",
    HIGH: "bg-rose-500/10 text-rose-300 border border-rose-400/20",
  };
  return <span className={`badge ${colors[priority] || "bg-slate-500/10 text-slate-200 border border-white/10"}`}>{priority}</span>;
}

export function DataTable({ columns, rows, keyField }) {
  if (!rows || rows.length === 0) return <EmptyState />;
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
      <table className="w-full text-sm text-slate-200">
        <thead>
          <tr className="border-b border-white/10 text-left text-slate-400">
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2 font-medium">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[keyField]} className="border-b border-white/5 transition hover:bg-white/5">
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2">{c.render ? c.render(r) : r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
