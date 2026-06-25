import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { Card, ErrorState, Kpi, Loading, RiskBadge, StatusBadge, useAsync, Empty } from "../components/ui";

export default function Overview() {
  const navigate = useNavigate();
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
          <h1>Overview</h1>
          <p>Operational front door. Is the system healthy, what needs attention, where to click next.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/new")}>Run demo workflow</button>
      </div>

      {data.emergency_pause && <div className="banner warn">Emergency pause is active — new runs are blocked.</div>}

      {empty ? (
        <Empty
          title="Install a template and run your first governed workflow."
          hint="Start with the marketing-review demo to see policy, approval, execution, evidence and trace."
          action={<button className="btn-primary" onClick={() => navigate("/new")}>New Run</button>}
        />
      ) : (
        <>
          <div className="grid cols-4" style={{ marginBottom: 16 }}>
            <Kpi label="Active runs" value={k.active_runs} />
            <Kpi label="Awaiting approvals" value={k.awaiting_approvals} tone={k.awaiting_approvals ? "alert" : undefined} />
            <Kpi label="Blocked by policy" value={k.blocked_by_policy} tone={k.blocked_by_policy ? "danger" : undefined} />
            <Kpi label="Success rate" value={`${k.success_rate}%`} />
          </div>

          <div className="grid cols-2">
            <Card title="Needs attention">
              {data.attention.length === 0 ? (
                <p className="muted">Nothing needs human review.</p>
              ) : (
                <table>
                  <tbody>
                    {data.attention.map((r) => (
                      <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/runs/${r.id}`)}>
                        <td><StatusBadge status={r.status} /></td>
                        <td>{r.title}</td>
                        <td><RiskBadge risk={r.risk_class} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="Recent activity" actions={<Link to="/runs">All runs →</Link>}>
              <table>
                <tbody>
                  {data.recent.map((r) => (
                    <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/runs/${r.id}`)}>
                      <td className="mono">{r.id.slice(0, 18)}</td>
                      <td>{r.workflow}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
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
