import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useT } from "../i18n";
import { ErrorState, Loading, RiskBadge, useAsync } from "../components/ui";

export default function Templates() {
  const navigate = useNavigate();
  const t = useT();
  const { data, error, loading } = useAsync(() => api.templates(), []);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t("tpl.title")}</h1>
          <p>{t("tpl.subtitle")}</p>
        </div>
      </div>

      <div className="grid cols-3">
        {data!.templates.map((tpl) => (
          <div className="card" key={tpl.id}>
            <div className="row between">
              <strong>{tpl.name}</strong>
              <RiskBadge risk={tpl.risk_class} />
            </div>
            <p className="muted" style={{ minHeight: 44 }}>{tpl.description}</p>
            <div style={{ marginBottom: 8 }}>
              {tpl.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
            </div>
            <p className="dim" style={{ fontSize: 12 }}>
              {t("tpl.actions")}: {tpl.actions.join(", ")}<br />
              {t("tpl.approval")}: {tpl.requires_approval_hint ? t("tpl.likely") : t("tpl.notRequired")}
            </p>
            <button className="btn-primary btn-sm" onClick={() => navigate(`/new?workflow=${tpl.id}`)}>{t("tpl.use")}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
