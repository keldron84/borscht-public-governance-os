import React from "react";
import { api, Settings as SettingsT } from "../api";
import { Card, ErrorState, Loading, useAsync } from "../components/ui";

export default function Settings() {
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
          <h1>Settings</h1>
          <p>Essentials only. Frequently used controls live on the working screens, not here.</p>
        </div>
        <button className="btn-primary" onClick={save}>Save</button>
      </div>

      {saved && <div className="banner ok">Settings saved.</div>}

      <div className="grid cols-2">
        <Card title="Defaults">
          <label className="field"><span>Default risk class</span>
            <select value={form.default_risk_class} onChange={(e) => setForm({ ...form, default_risk_class: e.target.value })}>
              <option>P0</option><option>P1</option><option>P2</option>
            </select></label>
          <label className="field"><span>Current actor</span>
            <input value={form.current_actor} onChange={(e) => setForm({ ...form, current_actor: e.target.value })} /></label>
        </Card>

        <Card title="Providers (optional)">
          <p className="muted" style={{ marginTop: 0 }}>Public v1 runs deterministic triage by default. LLM keys are optional.</p>
          <label className="field"><span>LLM provider</span>
            <input value={form.providers.llm_provider || ""} onChange={(e) => setForm({ ...form, providers: { ...form.providers, llm_provider: e.target.value } })} /></label>
          <label className="field"><span>LLM API key</span>
            <input type="password" value={form.providers.llm_api_key || ""} onChange={(e) => setForm({ ...form, providers: { ...form.providers, llm_api_key: e.target.value } })} /></label>
        </Card>

        <Card title="Connectors">
          <label className="field"><span>HTTP allowlist (comma-separated)</span>
            <input
              value={form.connectors.http_allowlist.join(", ")}
              onChange={(e) => setForm({ ...form, connectors: { ...form.connectors, http_allowlist: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } })}
            /></label>
          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" style={{ width: "auto" }} checked={form.connectors.shell_enabled} onChange={(e) => setForm({ ...form, connectors: { ...form.connectors, shell_enabled: e.target.checked } })} />
            Enable shell executor (sandboxed; off by default)
          </label>
        </Card>

        <Card title="Safety">
          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" style={{ width: "auto" }} checked={form.emergency_pause} onChange={(e) => setForm({ ...form, emergency_pause: e.target.checked })} />
            Emergency pause — block all new runs
          </label>
          <label className="field" style={{ marginTop: 14 }}><span>Notification webhook</span>
            <input value={form.notifications.webhook_url || ""} onChange={(e) => setForm({ ...form, notifications: { ...form.notifications, webhook_url: e.target.value } })} /></label>
        </Card>
      </div>
    </div>
  );
}
