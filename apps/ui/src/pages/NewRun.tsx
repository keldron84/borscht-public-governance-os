import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, WorkflowTemplate } from "../api";
import { useT } from "../i18n";
import { Card, EffectBadge, ErrorState, Loading, RiskBadge, useAsync } from "../components/ui";

export default function NewRun() {
  const navigate = useNavigate();
  const t = useT();
  const STEPS = [t("nr.step.choose"), t("nr.step.signal"), t("nr.step.context"), t("nr.step.confirm")];
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
  const tpl: WorkflowTemplate | undefined = templates.find((x) => x.id === workflow);

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
          <h1>{t("nr.title")}</h1>
          <p>{t("nr.subtitle")}</p>
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
          {templates.map((tpl2) => (
            <div
              key={tpl2.id}
              className="card"
              style={{ cursor: "pointer", borderColor: workflow === tpl2.id ? "var(--accent)" : undefined }}
              onClick={() => setWorkflow(tpl2.id)}
            >
              <div className="row between">
                <strong>{tpl2.name}</strong>
                <RiskBadge risk={tpl2.risk_class} />
              </div>
              <p className="muted" style={{ minHeight: 40 }}>{tpl2.description}</p>
              {tpl2.requires_approval_hint && <span className="badge eff-require_approval">{t("nr.mayNeedApproval")}</span>}
            </div>
          ))}
        </div>
      )}

      {step === 1 && tpl && (
        <Card title={t("nr.signalFor", { name: tpl.name })}>
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
        <Card title={t("nr.context")}>
          <label className="field">
            <span>{t("nr.owner")}</span>
            <input value={owner} onChange={(e) => setOwner(e.target.value)} />
          </label>
          <label className="field">
            <span>{t("nr.riskClass")}</span>
            <select value={risk || tpl.risk_class} onChange={(e) => setRisk(e.target.value)}>
              <option value="P0">{t("nr.risk.p0")}</option>
              <option value="P1">{t("nr.risk.p1")}</option>
              <option value="P2">{t("nr.risk.p2")}</option>
            </select>
          </label>
        </Card>
      )}

      {step === 3 && tpl && (
        <Card title={t("nr.confirm")}>
          <table>
            <tbody>
              <tr><th>{t("nr.workflow")}</th><td>{tpl.name}</td></tr>
              <tr><th>{t("nr.owner")}</th><td>{owner}</td></tr>
              <tr><th>{t("rd.risk")}</th><td><RiskBadge risk={risk || tpl.risk_class} /></td></tr>
              <tr><th>{t("nr.intendedActions")}</th><td>{tpl.actions.join(", ")}</td></tr>
              <tr><th>{t("nr.approvalPath")}</th><td>{preview ? <EffectBadge effect={preview.effect} /> : t("common.dash")}</td></tr>
            </tbody>
          </table>
          {submitErr && <div className="banner danger" style={{ marginTop: 12 }}>{submitErr}</div>}
        </Card>
      )}

      <div className="btn-row" style={{ marginTop: 20 }}>
        <button disabled={step === 0} onClick={() => setStep((s) => s - 1)}>{t("common.back")}</button>
        {step < 3 ? (
          <button className="btn-primary" disabled={step === 0 && !workflow} onClick={next}>{t("common.next")}</button>
        ) : (
          <button className="btn-primary" disabled={submitting} onClick={submit}>
            {submitting ? t("nr.starting") : t("nr.startRun")}
          </button>
        )}
      </div>
    </div>
  );
}
