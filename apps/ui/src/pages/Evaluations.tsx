import React from "react";
import { api, EvalResult } from "../api";
import { useT } from "../i18n";
import { Card, ErrorState, Loading } from "../components/ui";

export default function Evaluations() {
  const t = useT();
  const [data, setData] = React.useState<EvalResult | null>(null);
  const [error, setError] = React.useState("");
  const [running, setRunning] = React.useState(false);

  const run = React.useCallback(async () => {
    setRunning(true);
    setError("");
    try {
      setData(await api.evaluations());
    } catch (e: any) {
      setError(String(e.message || e));
    } finally {
      setRunning(false);
    }
  }, []);

  React.useEffect(() => { run(); }, [run]);

  if (running && !data) return <Loading />;
  if (error) return <ErrorState error={error} />;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t("ev.title")}</h1>
          <p>{t("ev.subtitle")}</p>
        </div>
        <button className="btn-primary" disabled={running} onClick={run}>{running ? t("ev.running") : t("ev.run")}</button>
      </div>

      {data && (
        <>
          <div className={`banner ${data.summary.release_recommendation === "release" ? "ok" : "danger"}`}>
            {data.summary.release_recommendation === "release"
              ? t("ev.safe", { passed: data.summary.passed, total: data.summary.total, rate: data.summary.pass_rate })
              : t("ev.unsafe", { failed: data.summary.failed, blocking: data.summary.blocking_failures })}
          </div>

          <div className="stack">
            {data.packs.map((p) => (
              <Card key={p.id} title={`${p.title} · ${p.type}${p.blocking ? " " + t("ev.blocking") : ""}`}>
                <p className="dim">{t("ev.passedOf", { passed: p.passed, total: p.total })}</p>
                <table>
                  <thead><tr><th>{t("ev.col.case")}</th><th>{t("ev.col.workflow")}</th><th>{t("ev.col.expected")}</th><th>{t("ev.col.actual")}</th><th>{t("ev.col.result")}</th></tr></thead>
                  <tbody>
                    {p.cases.map((c) => (
                      <tr key={c.id}>
                        <td className="mono">{c.id}</td>
                        <td>{c.workflow}</td>
                        <td>{c.expected}</td>
                        <td>{c.actual}</td>
                        <td className={c.ok ? "eff-allow" : "eff-deny"}>{c.ok ? t("ev.pass") : t("ev.fail")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
