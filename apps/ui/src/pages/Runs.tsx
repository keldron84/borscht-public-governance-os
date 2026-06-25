import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { Empty, ErrorState, Loading, RiskBadge, StatusBadge, useAsync } from "../components/ui";

const FILTERS = [
  { key: "", label: "All" },
  { key: "awaiting_approval", label: "Awaiting approval" },
  { key: "blocked_by_policy", label: "Blocked" },
  { key: "failed", label: "Failed" },
  { key: "succeeded", label: "Succeeded" },
  { key: "rolled_back", label: "Rolled back" },
];

export default function Runs() {
  const navigate = useNavigate();
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
          <h1>Runs</h1>
          <p>One operational inbox for every case. Sorted by what needs attention first.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/new")}>+ New Run</button>
      </div>

      <div className="steps">
        {FILTERS.map((f) => (
          <button key={f.key} className={`step-chip ${status === f.key ? "active" : ""}`} onClick={() => setStatus(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {runs.length === 0 ? (
        <Empty title="No runs yet." hint="Create your first governed run." action={<button className="btn-primary" onClick={() => navigate("/new")}>New Run</button>} />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Run</th><th>Workflow</th><th>Status</th><th>Owner</th>
                <th>Risk</th><th>Verdict</th><th>Evidence</th><th>Updated</th>
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
