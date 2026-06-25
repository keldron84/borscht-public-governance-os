import React from "react";
import { api, PolicyPack } from "../api";
import { useI18n } from "../i18n";
import { Card, EffectBadge, ErrorState, Loading, RiskBadge, useAsync } from "../components/ui";

export default function Policies() {
  const { t, policyReason } = useI18n();
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
          <h1>{t("pol.title")}</h1>
          <p>{t("pol.subtitle")}</p>
        </div>
      </div>

      <div className="detail-layout">
        <div>
          <Card title={pack ? pack.title : t("pol.pack")}>
            {pack && (
              <>
                <p className="dim">{pack.description}</p>
                <div className="row between" style={{ margin: "10px 0" }}>
                  <span className="muted">{t("pol.status")}</span>
                  <label className="row" style={{ gap: 8 }}>
                    <input type="checkbox" style={{ width: "auto" }} checked={pack.active} onChange={(e) => toggle(pack.id, e.target.checked)} />
                    {pack.active ? t("pol.active") : t("pol.inactive")}
                  </label>
                </div>
                <table>
                  <thead><tr><th>{t("pol.col.severity")}</th><th>{t("pol.col.rule")}</th><th>{t("pol.col.effect")}</th><th>{t("pol.col.reason")}</th></tr></thead>
                  <tbody>
                    {pack.rules.map((r) => (
                      <tr key={r.id}>
                        <td><RiskBadge risk={r.severity} /></td>
                        <td className="mono">{r.id}</td>
                        <td><EffectBadge effect={r.effect} /></td>
                        <td className="dim">{policyReason(r.id, r.reason)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <h3 style={{ marginTop: 16 }}>{t("pol.rawConfig")}</h3>
                <pre className="code">{JSON.stringify(pack, null, 2)}</pre>
              </>
            )}
          </Card>
        </div>
        <div className="sticky-side stack">
          <Card title={t("pol.packs")}>
            <div className="stack">
              {packs.map((p) => (
                <button key={p.id} className={`step-chip ${pack && pack.id === p.id ? "active" : ""}`} onClick={() => setSelected(p.id)} style={{ textAlign: "left" }}>
                  {p.title} {p.active ? "" : t("pol.off")}
                </button>
              ))}
            </div>
          </Card>
          <Card title={t("pol.simulation")}>
            <label className="field"><span>{t("pol.workflow")}</span>
              <input value={sim.workflow} onChange={(e) => setSim({ ...sim, workflow: e.target.value })} /></label>
            <label className="field"><span>{t("pol.signalText")}</span>
              <textarea value={sim.text} onChange={(e) => setSim({ ...sim, text: e.target.value })} /></label>
            <label className="field"><span>{t("pol.risk")}</span>
              <select value={sim.risk} onChange={(e) => setSim({ ...sim, risk: e.target.value })}>
                <option>P0</option><option>P1</option><option>P2</option>
              </select></label>
            <button className="btn-primary" onClick={simulate}>{t("pol.simulate")}</button>
            {simResult && <div style={{ marginTop: 12 }}>{t("pol.result")} <EffectBadge effect={simResult.effect} /></div>}
          </Card>
        </div>
      </div>
    </div>
  );
}
