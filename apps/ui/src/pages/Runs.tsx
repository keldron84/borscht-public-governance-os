import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useI18n } from "../i18n";
import { Empty, ErrorState, Loading, RiskBadge, StatusBadge, useAsync, ClickableRow } from "../components/ui";

const FILTERS = [
  { key: "", labelKey: "runs.filter.all" },
  { key: "awaiting_approval", labelKey: "runs.filter.awaiting" },
  { key: "blocked_by_policy", labelKey: "runs.filter.blocked" },
  { key: "failed", labelKey: "runs.filter.failed" },
  { key: "succeeded", labelKey: "runs.filter.succeeded" },
  { key: "rolled_back", labelKey: "runs.filter.rolled_back" },
];

export default function Runs() {
  const navigate = useNavigate();
  const { t, templateName } = useI18n();
  const [params] = useSearchParams();
  const [status, setStatus] = React.useState("");
  const q = (params.get("q") || "").toLowerCase();
  const { data, error, loading } = useAsync(() => api.runs(status ? { status } : {}), [status]);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  let runs = data!.runs;
  if (q) runs = runs.filter((r) => (r.title + r.id + r.workflow).toLowerCase().includes(q));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t("runs.title")}</h1>
          <p>{t("runs.subtitle")}</p>
        </div>
      </div>

      <div className="steps">
        {FILTERS.map((f) => (
          <button key={f.key} className={`step-chip ${status === f.key ? "active" : ""}`} onClick={() => setStatus(f.key)}>
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {runs.length === 0 ? (
        <Empty title={t("runs.emptyTitle")} hint={t("runs.emptyHint")} action={<button className="btn-primary" onClick={() => navigate("/new")}>{t("ov.newRun")}</button>} />
      ) : (
        <div className="card table-card">
          <div className="table-wrap">
          <table className="runs-table">
            <thead>
              <tr>
                <th>{t("runs.col.run")}</th><th>{t("runs.col.workflow")}</th><th>{t("runs.col.status")}</th><th>{t("runs.col.owner")}</th>
                <th>{t("runs.col.risk")}</th><th>{t("runs.col.verdict")}</th><th>{t("runs.col.evidence")}</th><th>{t("runs.col.updated")}</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <ClickableRow key={r.id} label={r.title} onClick={() => navigate(`/runs/${r.id}`)}>
                  <td className="run-cell">
                    <span className="run-title">{r.title}</span>
                    <span className="mono dim run-id" title={r.id}>{r.id.replace("run-", "")}</span>
                  </td>
                  <td>{templateName(r.workflow, r.workflow)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="dim">{r.owner}</td>
                  <td><RiskBadge risk={r.risk_class} /></td>
                  <td>{r.verdict}</td>
                  <td>{r.evidence_count}</td>
                  <td className="muted">{r.updated_at.replace("T", " ").slice(0, 16)}</td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
