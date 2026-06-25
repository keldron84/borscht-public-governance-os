import React from "react";
import { api, Settings as SettingsT } from "../api";
import { useI18n, SUPPORTED, Lang } from "../i18n";
import { Card, ErrorState, Loading, useAsync } from "../components/ui";

export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const { data, error, loading } = useAsync(() => api.settings(), []);
  const [form, setForm] = React.useState<SettingsT | null>(null);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => { if (data) setForm(data); }, [data]);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  if (!form) return null;

  const save = async () => {
    await api.saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t("set.title")}</h1>
          <p>{t("set.subtitle")}</p>
        </div>
        <button className="btn-primary" onClick={save}>{t("set.save")}</button>
      </div>

      {saved && <div className="banner ok">{t("set.saved")}</div>}

      <div className="grid cols-2">
        <Card title={t("set.defaults")}>
          <label className="field"><span>{t("set.language")}</span>
            <select value={form.language || lang} onChange={(e) => {
              const next = e.target.value as Lang;
              setForm({ ...form, language: next });
              setLang(next);
            }}>
              {SUPPORTED.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select></label>
          <label className="field"><span>{t("set.defaultRisk")}</span>
            <select value={form.default_risk_class} onChange={(e) => setForm({ ...form, default_risk_class: e.target.value })}>
              <option>P0</option><option>P1</option><option>P2</option>
            </select></label>
          <label className="field"><span>{t("set.currentActor")}</span>
            <input value={form.current_actor} onChange={(e) => setForm({ ...form, current_actor: e.target.value })} /></label>
        </Card>

        <Card title={t("set.providers")}>
          <p className="muted" style={{ marginTop: 0 }}>{t("set.providersNote")}</p>
          <label className="field"><span>{t("set.llmProvider")}</span>
            <input value={form.providers.llm_provider || ""} onChange={(e) => setForm({ ...form, providers: { ...form.providers, llm_provider: e.target.value } })} /></label>
          <label className="field"><span>{t("set.llmKey")}</span>
            <input type="password" value={form.providers.llm_api_key || ""} onChange={(e) => setForm({ ...form, providers: { ...form.providers, llm_api_key: e.target.value } })} /></label>
        </Card>

        <Card title={t("set.connectors")}>
          <label className="field"><span>{t("set.httpAllowlist")}</span>
            <input
              value={form.connectors.http_allowlist.join(", ")}
              onChange={(e) => setForm({ ...form, connectors: { ...form.connectors, http_allowlist: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } })}
            /></label>
          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" style={{ width: "auto" }} checked={form.connectors.shell_enabled} onChange={(e) => setForm({ ...form, connectors: { ...form.connectors, shell_enabled: e.target.checked } })} />
            {t("set.shell")}
          </label>
        </Card>

        <Card title={t("set.safety")}>
          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" style={{ width: "auto" }} checked={form.emergency_pause} onChange={(e) => setForm({ ...form, emergency_pause: e.target.checked })} />
            {t("set.emergency")}
          </label>
          <label className="field" style={{ marginTop: 14 }}><span>{t("set.webhook")}</span>
            <input value={form.notifications.webhook_url || ""} onChange={(e) => setForm({ ...form, notifications: { ...form.notifications, webhook_url: e.target.value } })} /></label>
        </Card>
      </div>
    </div>
  );
}
