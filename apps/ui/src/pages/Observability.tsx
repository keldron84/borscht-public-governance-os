import { api } from "../api";
import { useT } from "../i18n";
import { Card, ErrorState, Kpi, Loading, useAsync } from "../components/ui";

function Bars({ data }: { data: Array<{ label: string; value: number }> }) {
  const t = useT();
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <p className="muted">{t("obs.noData")}</p>;
  return (
    <div className="bars">
      {data.map((d, i) => (
        <div key={i} className="bar" style={{ height: `${(d.value / max) * 100}%` }} title={`${d.label}: ${d.value}`}>
          <span>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Observability() {
  const t = useT();
  const { data, error, loading } = useAsync(() => api.observability(), []);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  const o = data!;

  const volume = o.run_volume.map((r) => ({ label: String(r.day).slice(5), value: Number(r.total || 0) }));
  const denials = Object.entries(o.denials_by_policy).map(([k, v]) => ({ label: k.slice(0, 8), value: v }));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t("obs.title")}</h1>
          <p>{t("obs.subtitle")}</p>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 16 }}>
        <Kpi label={t("obs.kpi.latency")} value={`${o.avg_approval_latency_s}s`} />
        <Kpi label={t("obs.kpi.rollback")} value={o.rollback_events} />
        <Kpi label={t("obs.kpi.succeeded")} value={o.status_counts["succeeded"] || 0} />
        <Kpi label={t("obs.kpi.failed")} value={o.status_counts["failed"] || 0} tone={(o.status_counts["failed"] || 0) ? "danger" : undefined} />
      </div>

      <div className="grid cols-2">
        <Card title={t("obs.volume")}><Bars data={volume} /></Card>
        <Card title={t("obs.denials")}><Bars data={denials} /></Card>
        <Card title={t("obs.statusBreakdown")}>
          <table><tbody>
            {Object.entries(o.status_counts).map(([k, v]) => (
              <tr key={k}><td>{t("status." + k)}</td><td>{v}</td></tr>
            ))}
          </tbody></table>
        </Card>
        <Card title={t("obs.topFailing")}>
          {o.top_failing_workflows.length === 0 ? <p className="muted">{t("obs.noFailures")}</p> : (
            <table><tbody>
              {o.top_failing_workflows.map((w) => (
                <tr key={w.workflow}><td>{w.workflow}</td><td>{w.failures}</td></tr>
              ))}
            </tbody></table>
          )}
        </Card>
      </div>
    </div>
  );
}
