import React from "react";
import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { api } from "./api";
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
  { to: "/", label: "Overview", end: true },
  { to: "/runs", label: "Runs" },
  { to: "/approvals", label: "Approvals" },
  { to: "/policies", label: "Policies" },
  { to: "/observability", label: "Observability" },
  { to: "/evaluations", label: "Evaluations" },
  { to: "/templates", label: "Templates" },
  { to: "/settings", label: "Settings" },
];

function TopBar() {
  const navigate = useNavigate();
  const [q, setQ] = React.useState("");
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    api.settings().then((s) => setPaused(s.emergency_pause)).catch(() => {});
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term.startsWith("run-")) navigate(`/runs/${term}`);
    else if (term) navigate(`/runs?q=${encodeURIComponent(term)}`);
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
          placeholder="Search runs (id or text)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>
      <span className="env-badge">env: local</span>
      <span className="env-badge">user:operator</span>
      <button className="btn-primary btn-sm" onClick={() => navigate("/new")}>
        + New Run
      </button>
      <button
        className={paused ? "btn-danger btn-sm" : "btn-sm"}
        onClick={togglePause}
        title="Emergency pause: blocks new runs"
      >
        {paused ? "Paused" : "Pause all"}
      </button>
    </div>
  );
}

function Shell() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          Borscht
          <small>Public Edition · control plane</small>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              <span className="nav-dot" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          Signal → Triage → Decision → Execution → Evidence
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
