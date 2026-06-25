import React from "react";
import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { api } from "./api";
import { useI18n, SUPPORTED } from "./i18n";
import Overview from "./pages/Overview";
import NewRun from "./pages/NewRun";
import Runs from "./pages/Runs";
import RunDetail from "./pages/RunDetail";
import Approvals from "./pages/Approvals";
import Policies from "./pages/Policies";
import Observability from "./pages/Observability";
import Evaluations from "./pages/Evaluations";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";

const NAV = [
  { to: "/", key: "nav.overview", end: true },
  { to: "/runs", key: "nav.runs" },
  { to: "/approvals", key: "nav.approvals" },
  { to: "/policies", key: "nav.policies" },
  { to: "/observability", key: "nav.observability" },
  { to: "/evaluations", key: "nav.evaluations" },
  { to: "/templates", key: "nav.templates" },
  { to: "/settings", key: "nav.settings" },
];

function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { t, lang, setLang } = useI18n();
  const [q, setQ] = React.useState("");
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    api.settings().then((s) => setPaused(s.emergency_pause)).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (location.pathname === "/runs") {
      setQ(params.get("q") || "");
    }
  }, [location.pathname, params]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term.startsWith("run-")) navigate(`/runs/${term}`);
    else if (term) navigate(`/runs?q=${encodeURIComponent(term)}`);
    else navigate("/runs");
  };

  const togglePause = async () => {
    const next = !paused;
    setPaused(next);
    await api.saveSettings({ emergency_pause: next });
  };

  return (
    <div className="topbar">
      <form className="search" onSubmit={onSearch}>
        <input
          type="search"
          placeholder={t("top.search")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>
      <span className="env-badge">env: local</span>
      <span className="env-badge">user:operator</span>
      <select
        className="lang-select"
        aria-label={t("lang.label")}
        value={lang}
        onChange={(e) => setLang(e.target.value as (typeof SUPPORTED)[number])}
      >
        {SUPPORTED.map((l) => (
          <option key={l} value={l}>
            {l.toUpperCase()}
          </option>
        ))}
      </select>
      <button className="btn-primary btn-sm" onClick={() => navigate("/new")}>
        {t("top.newRun")}
      </button>
      <button
        className={paused ? "btn-danger btn-sm" : "btn-sm"}
        onClick={togglePause}
        title={t("top.pauseTitle")}
      >
        {paused ? t("top.paused") : t("top.pauseAll")}
      </button>
    </div>
  );
}

function Shell() {
  const { t } = useI18n();
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          Borscht
          <small>{t("brand.subtitle")}</small>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              <span className="nav-dot" />
              {t(n.key)}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          {t("sidebar.pipeline")}
        </div>
      </aside>
      <div className="main">
        <TopBar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/new" element={<NewRun />} />
            <Route path="/runs" element={<Runs />} />
            <Route path="/runs/:id" element={<RunDetail />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/observability" element={<Observability />} />
            <Route path="/evaluations" element={<Evaluations />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
