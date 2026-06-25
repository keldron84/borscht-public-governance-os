import React from "react";
import { api, PolicyPack } from "../api";
import { Card, EffectBadge, ErrorState, Loading, RiskBadge, useAsync } from "../components/ui";

export default function Policies() {
  const { data, error, loading, reload } = useAsync(() => api.policies(), []);
  const [selected, setSelected] = React.useState<string>("");
  const [sim, setSim] = React.useState<{ workflow: string; text: string; risk: string }>({
    workflow: "marketing-review", text: "Publish the new landing page", risk: "P1",
  });
  const [simResult, setSimResult] = React.useState<{ effect: string } | null>(null);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  const packs = data!.packs;
  const pack: PolicyPack | undefined = packs.find((p) => p.id === selected) || packs[0];

  const toggle = async (id: string, active: boolean) => {
    await api.togglePolicy(id, active);
    reload();
  };

  const simulate = async () => {
    const res = await api.simulatePolicy({ workflow: sim.workflow, signal: { text: sim.text }, risk_class: sim.risk });
    setSimResult({ effect: res.effect });
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Policies</h1>
          <p>Change the rules without fear of breaking the system. Toggle packs, then simulate.</p>
        </div>
      </div>

      <div className="detail-layout">
        <div>
          <Card title={pack ? pack.title : "Policy pack"}>
            {pack && (
              <>
                <p className="dim">{pack.description}</p>
                <div className="row between" style={{ margin: "10px 0" }}>
                  <span className="muted">Status</span>
                  <label className="row" style={{ gap: 8 }}>
                    <input type="checkbox" style={{ width: "auto" }} checked={pack.active} onChange={(e) => toggle(pack.id, e.target.checked)} />
                    {pack.active ? "Active" : "Inactive"}
                  </label>
                </div>
                <table>
                  <thead><tr><th>Severity</th><th>Rule</th><th>Effect</th><th>Reason</th></tr></thead>
                  <tbody>
                    {pack.rules.map((r) => (
                      <tr key={r.id}>
                        <td><RiskBadge risk={r.severity} /></td>
                        <td className="mono">{r.id}</td>
                        <td><EffectBadge effect={r.effect} /></td>
                        <td className="dim">{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <h3 style={{ marginTop: 16 }}>Raw config (JSON)</h3>
                <pre className="code">{JSON.stringify(pack, null, 2)}</pre>
              </>
            )}
          </Card>
        </div>
        <div className="sticky-side stack">
          <Card title="Policy packs">
            <div className="stack">
              {packs.map((p) => (
                <button key={p.id} className={`step-chip ${pack && pack.id === p.id ? "active" : ""}`} onClick={() => setSelected(p.id)} style={{ textAlign: "left" }}>
                  {p.title} {p.active ? "" : "· off"}
                </button>
              ))}
            </div>
          </Card>
          <Card title="Simulation">
            <label className="field"><span>Workflow</span>
              <input value={sim.workflow} onChange={(e) => setSim({ ...sim, workflow: e.target.value })} /></label>
            <label className="field"><span>Signal text</span>
              <textarea value={sim.text} onChange={(e) => setSim({ ...sim, text: e.target.value })} /></label>
            <label className="field"><span>Risk</span>
              <select value={sim.risk} onChange={(e) => setSim({ ...sim, risk: e.target.value })}>
                <option>P0</option><option>P1</option><option>P2</option>
              </select></label>
            <button className="btn-primary" onClick={simulate}>Simulate</button>
            {simResult && <div style={{ marginTop: 12 }}>Result: <EffectBadge effect={simResult.effect} /></div>}
          </Card>
        </div>
      </div>
    </div>
  );
}
