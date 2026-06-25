import React from "react";

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge dot st-${status}`}>{status.replace(/_/g, " ")}</span>;
}

export function RiskBadge({ risk }: { risk: string }) {
  return <span className={`badge risk-${risk}`}>{risk}</span>;
}

export function EffectBadge({ effect }: { effect: string }) {
  return <span className={`badge eff-${effect}`}>{effect.replace(/_/g, " ")}</span>;
}

export function Card({ title, children, actions }: { title?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="card">
      {(title || actions) && (
        <div className="row between" style={{ marginBottom: title ? 12 : 0 }}>
          {title ? <h3 style={{ margin: 0 }}>{title}</h3> : <span />}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function Kpi({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "alert" | "danger" }) {
  return (
    <div className={`card kpi ${tone || ""}`}>
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="state">
      <h3>{title}</h3>
      {hint && <p className="muted">{hint}</p>}
      {action}
    </div>
  );
}

export function Loading() {
  return <div className="state">Loading…</div>;
}

export function ErrorState({ error }: { error: string }) {
  return (
    <div className="banner danger">Error: {error}</div>
  );
}

export function useAsync<T>(fn: () => Promise<T>, deps: React.DependencyList = []) {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tick, setTick] = React.useState(0);
  const reload = React.useCallback(() => setTick((t) => t + 1), []);
  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fn()
      .then((d) => alive && (setData(d), setError(null)))
      .catch((e) => alive && setError(String(e.message || e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, error, loading, reload };
}
