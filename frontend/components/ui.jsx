import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-panel border border-border rounded-xl2 shadow-card p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function Pill({ tone = "neutral", children }) {
  const tones = {
    neutral: "bg-canvas text-muted border-border",
    primary: "bg-primary-light text-primary-dark border-primary-light",
    gold: "bg-gold-light text-gold border-gold-light",
    ok: "bg-ok-light text-ok border-ok-light",
    danger: "bg-danger-light text-danger border-danger-light",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function TrendPill({ trend }) {
  if (trend === "Increasing")
    return (
      <Pill tone="ok">
        <ArrowUpRight size={13} /> Increasing
      </Pill>
    );
  if (trend === "Decreasing")
    return (
      <Pill tone="danger">
        <ArrowDownRight size={13} /> Decreasing
      </Pill>
    );
  return (
    <Pill tone="neutral">
      <Minus size={13} /> Stable
    </Pill>
  );
}

export function ConfidenceMeter({ value }) {
  const tone = value >= 80 ? "#2E9361" : value >= 60 ? "#C8922B" : "#C3453B";
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-canvas overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: tone }}
        />
      </div>
      <span className="text-xs font-semibold mono" style={{ color: tone }}>
        {value}%
      </span>
    </div>
  );
}

export function KpiCard({ label, value, delta, prefix = "", suffix = "" }) {
  const positive = delta >= 0;
  return (
    <Card className="rise">
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-ink">
          {prefix}
          {value}
          {suffix}
        </span>
      </div>
      {delta !== undefined && (
        <p
          className={`mt-1.5 text-xs font-medium flex items-center gap-1 ${
            positive ? "text-ok" : "text-danger"
          }`}
        >
          {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {Math.abs(delta)}% vs last period
        </p>
      )}
    </Card>
  );
}

export function EmptyState({ title, body }) {
  return (
    <div className="text-center py-16">
      <p className="font-semibold text-ink">{title}</p>
      <p className="text-sm text-muted mt-1 max-w-sm mx-auto">{body}</p>
    </div>
  );
}
