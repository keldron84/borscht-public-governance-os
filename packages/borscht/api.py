"""Borscht Public Edition HTTP API + SPA host (Python stdlib only).

Mirrors the project's serving pattern: a ThreadingHTTPServer that exposes a JSON
API under ``/api/*`` and serves the built React SPA from ``apps/ui/dist``.
"""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
from urllib.parse import parse_qs, urlparse

from borscht import config
from borscht.core.engine import Engine, EngineError
from borscht.eval.runner import run_suite
from borscht.observe.metrics import build_observability, build_overview
from borscht.trace.timeline import build_timeline

DIST = config.REPO_ROOT / "apps" / "ui" / "dist"


def _run_view(engine: Engine, run) -> Dict[str, Any]:
    d = run.to_dict()
    d["timeline"] = build_timeline(run)
    d["requires_approval"] = run.requires_approval()
    d["evidence_count"] = len(run.evidence)
    return d


class Handler(BaseHTTPRequestHandler):
    server_version = "borscht-public/1.0"

    # ---- io helpers ------------------------------------------------------
    def _json(self, payload: Any, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _bytes(self, data: bytes, ctype: str) -> None:
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _read_body(self) -> Dict[str, Any]:
        length = int(self.headers.get("Content-Length", 0) or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        try:
            return json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            return {}

    def log_message(self, fmt: str, *args: Any) -> None:  # quieter logs
        return

    # ---- routing ---------------------------------------------------------
    def do_OPTIONS(self) -> None:  # CORS preflight for dev
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)
        if path.startswith("/api/"):
            try:
                self._api_get(path, query)
            except EngineError as exc:
                self._json({"error": str(exc)}, status=400)
            except Exception as exc:  # noqa: BLE001
                self._json({"error": "internal", "detail": str(exc)}, status=500)
            return
        self._serve_spa(path)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        if not path.startswith("/api/"):
            self._json({"error": "not_found"}, status=404)
            return
        try:
            self._api_post(path, self._read_body())
        except EngineError as exc:
            self._json({"error": str(exc)}, status=400)
        except Exception as exc:  # noqa: BLE001
            self._json({"error": "internal", "detail": str(exc)}, status=500)

    # ---- API GET ---------------------------------------------------------
    def _api_get(self, path: str, query: Dict[str, Any]) -> None:
        engine = Engine()

        if path == "/api/overview":
            runs = engine.list_runs()
            payload = build_overview(runs)
            payload["recent"] = [_brief(r) for r in runs[:8]]
            payload["events"] = engine.store.read_events(limit=12)
            payload["emergency_pause"] = config.load_settings().get("emergency_pause", False)
            self._json(payload)
            return

        if path == "/api/runs":
            runs = engine.list_runs(
                status=_first(query, "status"),
                owner=_first(query, "owner"),
                workflow=_first(query, "workflow"),
            )
            self._json({"runs": [_brief(r) for r in runs]})
            return

        if path.startswith("/api/runs/"):
            run_id = path[len("/api/runs/"):]
            run = engine.get_run(run_id)
            if run is None:
                self._json({"error": "not_found"}, status=404)
                return
            self._json(_run_view(engine, run))
            return

        if path == "/api/approvals":
            self._json({"runs": [_brief(r) for r in engine.approvals()]})
            return

        if path == "/api/policies":
            self._json({"packs": [p.to_dict() for p in engine.policy.packs()]})
            return

        if path == "/api/observability":
            self._json(build_observability(engine.list_runs()))
            return

        if path == "/api/evaluations":
            self._json(run_suite())
            return

        if path == "/api/templates":
            self._json({"templates": [t.to_dict() for t in engine.templates.list()]})
            return

        if path == "/api/identity":
            self._json({"actors": [a.to_dict() for a in engine.identity.list_actors()]})
            return

        if path == "/api/settings":
            self._json(config.load_settings())
            return

        self._json({"error": "not_found", "path": path}, status=404)

    # ---- API POST --------------------------------------------------------
    def _api_post(self, path: str, body: Dict[str, Any]) -> None:
        engine = Engine()

        if path == "/api/runs":
            run = engine.create_run(
                workflow=body["workflow"],
                signal=body.get("signal", {}),
                owner=body.get("owner", "user:operator"),
                risk_class=body.get("risk_class"),
                title=body.get("title", ""),
                use_memory=body.get("use_memory", True),
            )
            self._json(_run_view(engine, run), status=201)
            return

        if path.startswith("/api/runs/") and path.endswith("/action"):
            run_id = path[len("/api/runs/"):-len("/action")]
            action = body.get("action", "")
            actor = body.get("actor", "user:operator")
            reason = body.get("reason", "")
            run = _dispatch_action(engine, run_id, action, actor, reason)
            self._json(_run_view(engine, run))
            return

        if path == "/api/policies/simulate":
            self._json(engine.simulate_policy(
                body["workflow"], body.get("signal", {}), body.get("risk_class")))
            return

        if path.startswith("/api/policies/") and path.endswith("/toggle"):
            pack_id = path[len("/api/policies/"):-len("/toggle")]
            engine.policy.set_pack_active(pack_id, bool(body.get("active", True)))
            self._json({"ok": True, "packs": [p.to_dict() for p in engine.policy.packs()]})
            return

        if path.startswith("/api/templates/") and path.endswith("/install"):
            tpl = engine.templates.install_from_dict(body)
            self._json(tpl.to_dict(), status=201)
            return

        if path == "/api/settings":
            settings = config.load_settings()
            settings.update(body)
            config.save_settings(settings)
            self._json(settings)
            return

        self._json({"error": "not_found", "path": path}, status=404)

    # ---- SPA -------------------------------------------------------------
    def _serve_spa(self, path: str) -> None:
        if not DIST.is_dir():
            self._json(
                {
                    "error": "frontend_not_built",
                    "hint": "cd apps/ui && npm install && npm run build (or ./scripts/serve.sh)",
                },
                status=503,
            )
            return
        rel = path.lstrip("/") or "index.html"
        fpath = DIST / rel
        if not fpath.is_file():
            fpath = DIST / "index.html"
        import mimetypes
        ctype = mimetypes.guess_type(str(fpath))[0] or "application/octet-stream"
        self._bytes(fpath.read_bytes(), ctype)


def _first(query: Dict[str, Any], key: str) -> Optional[str]:
    vals = query.get(key)
    return vals[0] if vals else None


def _brief(run) -> Dict[str, Any]:
    return {
        "id": run.id,
        "workflow": run.workflow,
        "title": run.title,
        "status": run.status,
        "verdict": run.verdict,
        "owner": run.owner,
        "risk_class": run.risk_class,
        "evidence_count": len(run.evidence),
        "updated_at": run.updated_at,
        "created_at": run.created_at,
    }


def _dispatch_action(engine: Engine, run_id: str, action: str, actor: str, reason: str):
    if action == "approve":
        return engine.approve(run_id, approver=actor)
    if action == "reject":
        return engine.reject(run_id, approver=actor, reason=reason)
    if action == "hold":
        return engine.hold(run_id, actor=actor)
    if action == "waive":
        return engine.waive(run_id, actor=actor, reason=reason)
    if action == "rollback":
        return engine.rollback(run_id, actor=actor, reason=reason)
    if action == "retry":
        return engine.retry(run_id, actor=actor)
    raise EngineError("unknown action: {0}".format(action))


def serve(host: str = "127.0.0.1", port: int = 8799) -> None:
    Engine()  # warm init (data dir, db, identity, settings)
    httpd = ThreadingHTTPServer((host, port), Handler)
    print("borscht-public: http://{0}:{1}/".format(host, port))
    if not DIST.is_dir():
        print("borscht-public: UI not built yet — API is live; build UI for the SPA.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.shutdown()


if __name__ == "__main__":
    serve()
