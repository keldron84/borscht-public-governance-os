import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, WorkflowTemplate } from "../api";
import { Card, EffectBadge, ErrorState, Loading, RiskBadge, useAsync } from "../components/ui";

const STEPS = ["Choose workflow", "Provide signal", "Assign context", "Confirm"];

export default function NewRun() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data, error, loading } = useAsync(() => api.templates(), []);
  const [step, setStep] = React.useState(0);
  const [workflow, setWorkflow] = React.useState<string>(params.get("workflow") || "");
  const [signal, setSignal] = React.useState<Record<string, string>>({});
  const [owner, setOwner] = React.useState("user:operator");
  const [risk, setRisk] = React.useState("");
  const [preview, setPreview] = React.useState<{ effect: string } | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitErr, setSubmitErr] = React.useState("");

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  const templates = data!.templates;
  const tpl: WorkflowTemplate | undefined = templates.find((t) => t.id === workflow);

  const fields = tpl?.signal_fields || ["text"];

  const runSimulate = async () => {
    if (!tpl) return;
    const res = await api.simulatePolicy({ workflow, signal, risk_class: risk || tpl.risk_class });
    setPreview({ effect: res.effect });
  };

  const submit = async () => {
    if (!tpl) return;
    setSubmitting(true);
    setSubmitErr("");
    try {
      const run = await api.createRun({ workflow, signal, owner, risk_class: risk || undefined });
      navigate(`/runs/${run.id}`);
    } catch (e: any) {
      setSubmitErr(String(e.message || e));
      setSubmitting(false);
    }
  };

  const next = () => {
    if (step === 2) runSimulate();
    setStep((s) => Math.min(3, s + 1));
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>New Run</h1>
          <p>Think in terms of which case you are running and what you feed in — not internal architecture.</p>
        </div>
      </div>

      <div className="steps">
        {STEPS.map((s, i) => (
          <span key={s} className={`step-chip ${i === step ? "active" : i < step ? "done" : ""}`}>
            {i + 1}. {s}
          </span>
        ))}
      </div>

      {step === 0 && (
        <div className="grid cols-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="card"
              style={{ cursor: "pointer", borderColor: workflow === t.id ? "var(--accent)" : undefined }}
              onClick={() => setWorkflow(t.id)}
            >
              <div className="row between">
                <strong>{t.name}</strong>
                <RiskBadge risk={t.risk_class} />
              </div>
              <p className="muted" style={{ minHeight: 40 }}>{t.description}</p>
              {t.requires_approval_hint && <span className="badge eff-require_approval">may need approval</span>}
            </div>
          ))}
        </div>
      )}

      {step === 1 && tpl && (
        <Card title={`Signal for ${tpl.name}`}>
          {fields.map((f) => (
            <label className="field" key={f}>
              <span>{f}</span>
              {f === "text" ? (
                <textarea value={signal[f] || ""} onChange={(e) => setSignal({ ...signal, [f]: e.target.value })} />
              ) : (
                <input value={signal[f] || ""} onChange={(e) => setSignal({ ...signal, [f]: e.target.value })} />
              )}
            </label>
          ))}
        </Card>
      )}

      {step === 2 && tpl && (
        <Card title="Context">
          <label className="field">
            <span>Owner (holds the risk)</span>
            <input value={owner} onChange={(e) => setOwner(e.target.value)} />
          </label>
          <label className="field">
            <span>Risk class</span>
            <select value={risk || tpl.risk_class} onChange={(e) => setRisk(e.target.value)}>
              <option value="P0">P0 — destructive / secrets / outbound external</option>
              <option value="P1">P1 — spend / publish / data mutation</option>
              <option value="P2">P2 — low-risk internal</option>
            </select>
          </label>
        </Card>
      )}

      {step === 3 && tpl && (
        <Card title="Confirm">
          <table>
            <tbody>
              <tr><th>Workflow</th><td>{tpl.name}</td></tr>
              <tr><th>Owner</th><td>{owner}</td></tr>
              <tr><th>Risk</th><td><RiskBadge risk={risk || tpl.risk_class} /></td></tr>
              <tr><th>Intended actions</th><td>{tpl.actions.join(", ")}</td></tr>
              <tr><th>Expected approval path</th><td>{preview ? <EffectBadge effect={preview.effect} /> : "—"}</td></tr>
            </tbody>
          </table>
          {submitErr && <div className="banner danger" style={{ marginTop: 12 }}>{submitErr}</div>}
        </Card>
      )}

      <div className="btn-row" style={{ marginTop: 20 }}>
        <button disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</button>
        {step < 3 ? (
          <button className="btn-primary" disabled={step === 0 && !workflow} onClick={next}>Next</button>
        ) : (
          <button className="btn-primary" disabled={submitting} onClick={submit}>
            {submitting ? "Starting…" : "Start Run"}
          </button>
        )}
      </div>
    </div>
  );
}
