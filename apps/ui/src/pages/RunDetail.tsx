import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, RunDetail as RunDetailT } from "../api";
import {
  Card, EffectBadge, ErrorState, Loading, RiskBadge, StatusBadge, useAsync,
} from "../components/ui";

const TABS = ["Summary", "Trace", "Policy", "Evidence", "Actions"];

export default function RunDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
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
        <button onClick={() => navigate("/runs")}>← Runs</button>
      </div>

      {actionErr && <div className="banner danger">{actionErr}</div>}

      <div className="detail-layout">
        <div>
          <div className="tabs">
            {TABS.map((t) => (
              <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                {t}
                {t === "Policy" && run.policy_decisions.length ? ` (${run.policy_decisions.length})` : ""}
                {t === "Evidence" && run.evidence.length ? ` (${run.evidence.length})` : ""}
              </button>
            ))}
          </div>

          {tab === "Summary" && (
            <Card>
              <h3>Why this verdict</h3>
              <p>{run.explanation || "—"}</p>
              <h3 style={{ marginTop: 16 }}>Task contract</h3>
              <p className="dim">{run.task_contract}</p>
              <h3 style={{ marginTop: 16 }}>Signal</h3>
              <pre className="code">{JSON.stringify(run.signal, null, 2)}</pre>
            </Card>
          )}

          {tab === "Trace" && (
            <Card title="Timeline">
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
            <Card title="Rules evaluated">
              {run.policy_decisions.length === 0 ? (
                <p className="muted">No policy rules matched.</p>
              ) : (
                <table>
                  <thead><tr><th>Severity</th><th>Pack</th><th>Rule</th><th>Effect</th><th>Reason</th></tr></thead>
                  <tbody>
                    {run.policy_decisions.map((d, i) => (
                      <tr key={i}>
                        <td><RiskBadge risk={d.severity} /></td>
                        <td>{d.pack}</td>
                        <td className="mono">{d.rule_id}</td>
                        <td><EffectBadge effect={d.effect} /></td>
                        <td className="dim">{d.reason}{d.simulated ? " (inactive)" : ""}</td>
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
                <Card><p className="muted">No evidence yet.</p></Card>
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
            <Card title="Actions">
              <div className="btn-row">
                <button className="btn-ok" disabled={!canApprove || busy} onClick={() => act("approve", { actor: "approver:lead" })}>Approve</button>
                <button className="btn-danger" disabled={!(canApprove || run.status === "blocked_by_policy") || busy} onClick={() => act("reject", { actor: "approver:lead", reason: "Rejected from UI" })}>Reject</button>
                <button disabled={run.status !== "running" || busy} onClick={() => act("hold")}>Hold</button>
                <button disabled={!canWaive || busy} onClick={() => act("waive", { reason: "Waived from UI" })}>Waive policy</button>
                <button disabled={!canRetry || busy} onClick={() => act("retry")}>Retry</button>
                <button className="btn-danger" disabled={!canRollback || busy} onClick={() => act("rollback", { reason: "Rolled back from UI" })}>Rollback</button>
                <a className="btn btn-sm" href={`/api/runs/${run.id}`} target="_blank" rel="noreferrer">Export JSON</a>
              </div>
            </Card>
          )}
        </div>

        <div className="sticky-side stack">
          <Card>
            <div className="stack">
              <div className="row between"><span className="muted">State</span><StatusBadge status={run.status} /></div>
              <div className="row between"><span className="muted">Verdict</span><strong>{run.verdict}</strong></div>
              <div className="row between"><span className="muted">Risk</span><RiskBadge risk={run.risk_class} /></div>
              <div className="row between"><span className="muted">Owner</span><span>{run.owner}</span></div>
              <div className="row between"><span className="muted">Approver</span><span>{run.approver || "—"}</span></div>
            </div>
          </Card>
          <Card title="Tool scopes">
            {run.tool_scopes.length ? run.tool_scopes.map((t) => <span key={t} className="tag">{t}</span>) : <span className="muted">none</span>}
          </Card>
          {canApprove && (
            <Card title="Needs you">
              <p className="dim">This run is waiting for approval.</p>
              <div className="btn-row">
                <button className="btn-ok" disabled={busy} onClick={() => act("approve", { actor: "approver:lead" })}>Approve</button>
                <button className="btn-danger" disabled={busy} onClick={() => act("reject", { actor: "approver:lead" })}>Reject</button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
