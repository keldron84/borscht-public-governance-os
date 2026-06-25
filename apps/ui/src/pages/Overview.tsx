import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useI18n } from "../i18n";
import { Card, ErrorState, Kpi, Loading, RiskBadge, StatusBadge, useAsync, Empty, ClickableRow } from "../components/ui";

const DEMO_WORKFLOW = "marketing-review";

export default function Overview() {
  const navigate = useNavigate();
  const { t, templateName } = useI18n();
  const { data, error, loading } = useAsync(() => api.overview(), []);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  if (!data) return null;

  const k = data.kpis;
  const empty = k.total_runs === 0;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t("ov.title")}</h1>
          <p>{t("ov.subtitle")}</p>
        </div>
        <button className="btn-primary" onClick={() => navigate(`/new?workflow=${DEMO_WORKFLOW}`)}>{t("ov.runDemo")}</button>
      </div>

      {data.emergency_pause && <div className="banner warn">{t("ov.pauseBanner")}</div>}

      {empty ? (
        <Empty
          title={t("ov.emptyTitle")}
          hint={t("ov.emptyHint")}
          action={<button className="btn-primary" onClick={() => navigate(`/new?workflow=${DEMO_WORKFLOW}`)}>{t("ov.newRun")}</button>}
        />
      ) : (
        <>
          <div className="grid cols-4" style={{ marginBottom: 16 }}>
            <Kpi label={t("ov.kpi.active")} value={k.active_runs} />
            <Kpi label={t("ov.kpi.awaiting")} value={k.awaiting_approvals} tone={k.awaiting_approvals ? "alert" : undefined} />
            <Kpi label={t("ov.kpi.blocked")} value={k.blocked_by_policy} tone={k.blocked_by_policy ? "danger" : undefined} />
            <Kpi label={t("ov.kpi.success")} value={`${k.success_rate}%`} />
          </div>

          <div className="grid cols-2">
            <Card title={t("ov.attention")}>
              {data.attention.length === 0 ? (
                <p className="muted">{t("ov.attentionEmpty")}</p>
              ) : (
                <table>
                  <tbody>
                    {data.attention.map((r) => (
                      <ClickableRow key={r.id} label={r.title} onClick={() => navigate(`/runs/${r.id}`)}>
                        <td><StatusBadge status={r.status} /></td>
                        <td>{r.title}</td>
                        <td><RiskBadge risk={r.risk_class} /></td>
                      </ClickableRow>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title={t("ov.recent")} actions={<Link to="/runs">{t("ov.allRuns")}</Link>}>
              <table>
                <tbody>
                  {data.recent.map((r) => (
                    <ClickableRow key={r.id} label={r.title} onClick={() => navigate(`/runs/${r.id}`)}>
                      <td className="mono">{r.id.slice(0, 18)}</td>
                      <td>{templateName(r.workflow, r.workflow)}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </ClickableRow>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
