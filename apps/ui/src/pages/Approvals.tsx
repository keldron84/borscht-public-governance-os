import React from "react";
import { useNavigate } from "react-router-dom";
import { api, RunBrief } from "../api";
import { useI18n } from "../i18n";
import { Card, Empty, ErrorState, Loading, RiskBadge, useAsync, ClickableRow } from "../components/ui";

export default function Approvals() {
  const navigate = useNavigate();
  const { t, templateName } = useI18n();
  const { data, error, loading, reload } = useAsync(() => api.approvals(), []);
  const [selected, setSelected] = React.useState<RunBrief | null>(null);
  const [busy, setBusy] = React.useState(false);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  const runs = data!.runs;

  const decide = async (action: string) => {
    if (!selected) return;
    setBusy(true);
    try {
      await api.runAction(selected.id, action, {
        actor: "approver:lead",
        reason: action === "reject" ? t("rd.rejectedFromUi") : `${action} from inbox`,
      });
      setSelected(null);
      reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t("ap.title")}</h1>
          <p>{t("ap.subtitle")}</p>
        </div>
      </div>

      {runs.length === 0 ? (
        <Empty title={t("ap.emptyTitle")} hint={t("ap.emptyHint")} />
      ) : (
        <div className="detail-layout">
          <div className="card table-card">
            <div className="table-wrap">
            <table>
              <thead><tr><th>{t("ap.col.run")}</th><th>{t("ap.col.risk")}</th><th>{t("ap.col.owner")}</th><th>{t("ap.col.waiting")}</th></tr></thead>
              <tbody>
                {runs.map((r) => (
                  <ClickableRow key={r.id} label={r.title} onClick={() => setSelected(r)}>
                    <td>{r.title}</td>
                    <td><RiskBadge risk={r.risk_class} /></td>
                    <td className="dim">{r.owner}</td>
                    <td className="muted">{r.updated_at.replace("T", " ").slice(0, 16)}</td>
                  </ClickableRow>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          <div className="sticky-side">
            {selected ? (
              <Card title={t("ap.detail")}>
                <p><strong>{selected.title}</strong></p>
                <p className="dim mono">{selected.id}</p>
                <div className="row between"><span className="muted">{t("ap.col.risk")}</span><RiskBadge risk={selected.risk_class} /></div>
                <div className="row between" style={{ margin: "6px 0" }}><span className="muted">{t("ap.workflow")}</span><span>{templateName(selected.workflow, selected.workflow)}</span></div>
                <div className="btn-row" style={{ marginTop: 14 }}>
                  <button className="btn-ok" disabled={busy} onClick={() => decide("approve")}>{t("rd.approve")}</button>
                  <button className="btn-danger" disabled={busy} onClick={() => decide("reject")}>{t("rd.reject")}</button>
                </div>
                <button className="btn-sm" style={{ marginTop: 10 }} onClick={() => navigate(`/runs/${selected.id}`)}>{t("ap.openDetail")}</button>
              </Card>
            ) : (
              <Card><p className="muted">{t("ap.selectRun")}</p></Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
