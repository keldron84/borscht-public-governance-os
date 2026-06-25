import React from "react";
import { api, EvalResult } from "../api";
import { Card, ErrorState, Loading } from "../components/ui";

export default function Evaluations() {
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
          <h1>Evaluations</h1>
          <p>Confidence that the system can be updated without breaking. Can we release, or not — and why.</p>
        </div>
        <button className="btn-primary" disabled={running} onClick={run}>{running ? "Running…" : "Run eval suite"}</button>
      </div>

      {data && (
        <>
          <div className={`banner ${data.summary.release_recommendation === "release" ? "ok" : "danger"}`}>
            {data.summary.release_recommendation === "release"
              ? `Safe to release — ${data.summary.passed}/${data.summary.total} passed (${data.summary.pass_rate}%).`
              : `Do not release — ${data.summary.failed} failing, ${data.summary.blocking_failures} blocking.`}
          </div>

          <div className="stack">
            {data.packs.map((p) => (
              <Card key={p.id} title={`${p.title} · ${p.type}${p.blocking ? " · blocking" : ""}`}>
                <p className="dim">{p.passed}/{p.total} passed</p>
                <table>
                  <thead><tr><th>Case</th><th>Workflow</th><th>Expected</th><th>Actual</th><th>Result</th></tr></thead>
                  <tbody>
                    {p.cases.map((c) => (
                      <tr key={c.id}>
                        <td className="mono">{c.id}</td>
                        <td>{c.workflow}</td>
                        <td>{c.expected}</td>
                        <td>{c.actual}</td>
                        <td className={c.ok ? "eff-allow" : "eff-deny"}>{c.ok ? "PASS" : "FAIL"}</td>
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
