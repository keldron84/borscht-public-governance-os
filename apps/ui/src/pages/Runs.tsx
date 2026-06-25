import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useT } from "../i18n";
import { Empty, ErrorState, Loading, RiskBadge, StatusBadge, useAsync } from "../components/ui";

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
  const t = useT();
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
        <button className="btn-primary" onClick={() => navigate("/new")}>{t("top.newRun")}</button>
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
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>{t("runs.col.run")}</th><th>{t("runs.col.workflow")}</th><th>{t("runs.col.status")}</th><th>{t("runs.col.owner")}</th>
                <th>{t("runs.col.risk")}</th><th>{t("runs.col.verdict")}</th><th>{t("runs.col.evidence")}</th><th>{t("runs.col.updated")}</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/runs/${r.id}`)}>
                  <td className="mono">{r.id.replace("run-", "")}</td>
                  <td>{r.workflow}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="dim">{r.owner}</td>
                  <td><RiskBadge risk={r.risk_class} /></td>
                  <td>{r.verdict}</td>
                  <td>{r.evidence_count}</td>
                  <td className="muted">{r.updated_at.replace("T", " ").slice(0, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
