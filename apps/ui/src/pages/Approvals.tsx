import React from "react";
import { useNavigate } from "react-router-dom";
import { api, RunBrief } from "../api";
import { Card, Empty, ErrorState, Loading, RiskBadge, useAsync } from "../components/ui";

export default function Approvals() {
  const navigate = useNavigate();
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
      await api.runAction(selected.id, action, { actor: "approver:lead", reason: `${action} from inbox` });
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
          <h1>Approvals Inbox</h1>
          <p>Human-in-the-loop, fast and transparent. Every item explains why approval is required.</p>
        </div>
      </div>

      {runs.length === 0 ? (
        <Empty title="Nothing needs human review." hint="Approval-gated runs will appear here." />
      ) : (
        <div className="detail-layout">
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead><tr><th>Run</th><th>Risk</th><th>Owner</th><th>Waiting since</th></tr></thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => setSelected(r)}>
                    <td>{r.title}</td>
                    <td><RiskBadge risk={r.risk_class} /></td>
                    <td className="dim">{r.owner}</td>
                    <td className="muted">{r.updated_at.replace("T", " ").slice(0, 16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sticky-side">
            {selected ? (
              <Card title="Approval detail">
                <p><strong>{selected.title}</strong></p>
                <p className="dim mono">{selected.id}</p>
                <div className="row between"><span className="muted">Risk</span><RiskBadge risk={selected.risk_class} /></div>
                <div className="row between" style={{ margin: "6px 0" }}><span className="muted">Workflow</span><span>{selected.workflow}</span></div>
                <div className="btn-row" style={{ marginTop: 14 }}>
                  <button className="btn-ok" disabled={busy} onClick={() => decide("approve")}>Approve</button>
                  <button className="btn-danger" disabled={busy} onClick={() => decide("reject")}>Reject</button>
                </div>
                <button className="btn-sm" style={{ marginTop: 10 }} onClick={() => navigate(`/runs/${selected.id}`)}>Open run detail →</button>
              </Card>
            ) : (
              <Card><p className="muted">Select a run to review.</p></Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
