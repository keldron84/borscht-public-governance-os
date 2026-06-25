import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useI18n } from "../i18n";
import {
  Card, EffectBadge, ErrorState, Loading, RiskBadge, StatusBadge, useAsync,
} from "../components/ui";

const TABS = [
  { key: "Summary", labelKey: "rd.tab.summary" },
  { key: "Trace", labelKey: "rd.tab.trace" },
  { key: "Policy", labelKey: "rd.tab.policy" },
  { key: "Evidence", labelKey: "rd.tab.evidence" },
  { key: "Actions", labelKey: "rd.tab.actions" },
];

export default function RunDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, policyReason } = useI18n();
  const { data, error, loading, reload } = useAsync(() => api.run(id!), [id]);
  const [tab, setTab] = React.useState("Summary");
  const [busy, setBusy] = React.useState(false);
  const [actionErr, setActionErr] = React.useState("");

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  const run = data!;

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    setActionErr("");
    try {
      await api.runAction(run.id, action, extra);
      reload();
      setTab("Trace");
    } catch (e: any) {
      setActionErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  const canApprove = run.status === "awaiting_approval";
  const canWaive = run.status === "blocked_by_policy" || run.status === "awaiting_approval";
  const canRollback = ["succeeded", "failed", "waived"].includes(run.status);
  const canRetry = run.status === "failed";

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{run.title}</h1>
          <p className="mono dim">{run.id}</p>
        </div>
        <button onClick={() => navigate("/runs")}>{t("rd.backRuns")}</button>
      </div>

      {actionErr && <div className="banner danger">{actionErr}</div>}

      <div className="detail-layout">
        <div>
          <div className="tabs">
            {TABS.map((tb) => (
              <button key={tb.key} className={`tab ${tab === tb.key ? "active" : ""}`} onClick={() => setTab(tb.key)}>
                {t(tb.labelKey)}
                {tb.key === "Policy" && run.policy_decisions.length ? ` (${run.policy_decisions.length})` : ""}
                {tb.key === "Evidence" && run.evidence.length ? ` (${run.evidence.length})` : ""}
              </button>
            ))}
          </div>

          {tab === "Summary" && (
            <Card>
              <h3>{t("rd.whyVerdict")}</h3>
              <p>{run.explanation || t("common.dash")}</p>
              <h3 style={{ marginTop: 16 }}>{t("rd.taskContract")}</h3>
              <p className="dim">{run.task_contract}</p>
              <h3 style={{ marginTop: 16 }}>{t("rd.signal")}</h3>
              <pre className="code">{JSON.stringify(run.signal, null, 2)}</pre>
            </Card>
          )}

          {tab === "Trace" && (
            <Card title={t("rd.timeline")}>
              <ul className="timeline">
                {run.timeline.map((s) => (
                  <li key={s.id}>
                    <span className={`node ${s.outcome}`} />
                    <div className="tl-head">
                      <span className="tl-name">{s.name}</span>
                      <span className="badge">{s.outcome}</span>
                      <span className="tl-meta">{s.actor} · {s.at.replace("T", " ").slice(11, 19)} · {s.duration_ms}ms</span>
                    </div>
                    <div className="dim">{s.detail}</div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {tab === "Policy" && (
            <Card title={t("rd.rulesEvaluated")}>
              {run.policy_decisions.length === 0 ? (
                <p className="muted">{t("rd.noRules")}</p>
              ) : (
                <table>
                  <thead><tr><th>{t("rd.col.severity")}</th><th>{t("rd.col.pack")}</th><th>{t("rd.col.rule")}</th><th>{t("rd.col.effect")}</th><th>{t("rd.col.reason")}</th></tr></thead>
                  <tbody>
                    {run.policy_decisions.map((d, i) => (
                      <tr key={i}>
                        <td><RiskBadge risk={d.severity} /></td>
                        <td>{d.pack}</td>
                        <td className="mono">{d.rule_id}</td>
                        <td><EffectBadge effect={d.effect} /></td>
                        <td className="dim">{policyReason(d.rule_id, d.reason)}{d.simulated ? ` ${t("rd.inactive")}` : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          )}

          {tab === "Evidence" && (
            <div className="stack">
              {run.evidence.length === 0 ? (
                <Card><p className="muted">{t("rd.noEvidence")}</p></Card>
              ) : (
                run.evidence.map((e) => (
                  <Card key={e.id} title={`${e.title} · ${e.kind}`}>
                    <pre className="code">{e.preview}</pre>
                    <p className="muted mono">{e.path}</p>
                  </Card>
                ))
              )}
            </div>
          )}

          {tab === "Actions" && (
            <Card title={t("rd.tab.actions")}>
              <div className="btn-row">
                <button className="btn-ok" disabled={!canApprove || busy} onClick={() => act("approve", { actor: "approver:lead" })}>{t("rd.approve")}</button>
                <button className="btn-danger" disabled={!(canApprove || run.status === "blocked_by_policy") || busy} onClick={() => act("reject", { actor: "approver:lead", reason: t("rd.rejectedFromUi") })}>{t("rd.reject")}</button>
                <button disabled={run.status !== "running" || busy} onClick={() => act("hold")}>{t("rd.hold")}</button>
                <button disabled={!canWaive || busy} onClick={() => act("waive", { reason: t("rd.waivedFromUi") })}>{t("rd.waive")}</button>
                <button disabled={!canRetry || busy} onClick={() => act("retry")}>{t("rd.retry")}</button>
                <button className="btn-danger" disabled={!canRollback || busy} onClick={() => act("rollback", { reason: t("rd.rolledBackFromUi") })}>{t("rd.rollback")}</button>
                <a className="btn btn-sm" href={`/api/runs/${run.id}`} target="_blank" rel="noreferrer">{t("rd.exportJson")}</a>
              </div>
            </Card>
          )}
        </div>

        <div className="sticky-side stack">
          <Card>
            <div className="stack">
              <div className="row between"><span className="muted">{t("rd.state")}</span><StatusBadge status={run.status} /></div>
              <div className="row between"><span className="muted">{t("rd.verdict")}</span><strong>{run.verdict}</strong></div>
              <div className="row between"><span className="muted">{t("rd.risk")}</span><RiskBadge risk={run.risk_class} /></div>
              <div className="row between"><span className="muted">{t("rd.owner")}</span><span>{run.owner}</span></div>
              <div className="row between"><span className="muted">{t("rd.approver")}</span><span>{run.approver || t("common.dash")}</span></div>
            </div>
          </Card>
          <Card title={t("rd.toolScopes")}>
            {run.tool_scopes.length ? run.tool_scopes.map((ts) => <span key={ts} className="tag">{ts}</span>) : <span className="muted">{t("common.none")}</span>}
          </Card>
          {canApprove && (
            <Card title={t("rd.needsYou")}>
              <p className="dim">{t("rd.waitingApproval")}</p>
              <div className="btn-row">
                <button className="btn-ok" disabled={busy} onClick={() => act("approve", { actor: "approver:lead" })}>{t("rd.approve")}</button>
                <button className="btn-danger" disabled={busy} onClick={() => act("reject", { actor: "approver:lead", reason: t("rd.rejectedFromUi") })}>{t("rd.reject")}</button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
