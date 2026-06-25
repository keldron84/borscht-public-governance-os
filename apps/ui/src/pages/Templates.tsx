import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { ErrorState, Loading, RiskBadge, useAsync } from "../components/ui";

export default function Templates() {
  const navigate = useNavigate();
  const { data, error, loading } = useAsync(() => api.templates(), []);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Templates</h1>
          <p>Onboarding engine — installed workflow packs that get you to first value fast.</p>
        </div>
      </div>

      <div className="grid cols-3">
        {data!.templates.map((t) => (
          <div className="card" key={t.id}>
            <div className="row between">
              <strong>{t.name}</strong>
              <RiskBadge risk={t.risk_class} />
            </div>
            <p className="muted" style={{ minHeight: 44 }}>{t.description}</p>
            <div style={{ marginBottom: 8 }}>
              {t.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
            </div>
            <p className="dim" style={{ fontSize: 12 }}>
              Actions: {t.actions.join(", ")}<br />
              Approval: {t.requires_approval_hint ? "likely required" : "not required"}
            </p>
            <button className="btn-primary btn-sm" onClick={() => navigate(`/new?workflow=${t.id}`)}>Use template</button>
          </div>
        ))}
      </div>
    </div>
  );
}
