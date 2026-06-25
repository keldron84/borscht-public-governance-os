"""Audit-grade local storage.

- SQLite (``data/borscht.sqlite``) holds run metadata for fast queries.
- ``data/runs/<id>.json`` holds the full run document (source of truth).
- ``data/evidence/<id>/*`` holds artifacts (markdown/json/files).
- ``data/logs/events.jsonl`` is an append-only event log for replay.

This is enough for audit-grade replay on a local machine.
"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional

from borscht import config
from borscht.core.ids import evidence_id, now_iso
from borscht.core.models import EvidenceItem, Run

_SCHEMA = """
CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY,
    workflow TEXT,
    title TEXT,
    owner TEXT,
    risk_class TEXT,
    status TEXT,
    verdict TEXT,
    created_at TEXT,
    updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_updated ON runs(updated_at);
"""


class EvidenceStore:
    def __init__(self) -> None:
        self.db = config.db_path()
        self._init_db()

    # ---- low level -------------------------------------------------------
    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        conn = self._connect()
        try:
            conn.executescript(_SCHEMA)
            conn.commit()
        finally:
            conn.close()

    def _run_json_path(self, run_id: str) -> Path:
        return config.runs_dir() / "{0}.json".format(run_id)

    # ---- run persistence -------------------------------------------------
    def save_run(self, run: Run) -> None:
        self._run_json_path(run.id).write_text(
            json.dumps(run.to_dict(), indent=2, ensure_ascii=False), encoding="utf-8"
        )
        conn = self._connect()
        try:
            conn.execute(
                """INSERT INTO runs(id, workflow, title, owner, risk_class, status,
                       verdict, created_at, updated_at)
                   VALUES(?,?,?,?,?,?,?,?,?)
                   ON CONFLICT(id) DO UPDATE SET
                       workflow=excluded.workflow, title=excluded.title,
                       owner=excluded.owner, risk_class=excluded.risk_class,
                       status=excluded.status, verdict=excluded.verdict,
                       updated_at=excluded.updated_at""",
                (
                    run.id,
                    run.workflow,
                    run.title,
                    run.owner,
                    run.risk_class,
                    run.status,
                    run.verdict,
                    run.created_at,
                    run.updated_at,
                ),
            )
            conn.commit()
        finally:
            conn.close()

    def load_run(self, run_id: str) -> Optional[Run]:
        p = self._run_json_path(run_id)
        if not p.is_file():
            return None
        return Run.from_dict(json.loads(p.read_text(encoding="utf-8")))

    def list_runs(self, limit: int = 500) -> List[Run]:
        conn = self._connect()
        try:
            rows = conn.execute(
                "SELECT id FROM runs ORDER BY updated_at DESC LIMIT ?", (limit,)
            ).fetchall()
        finally:
            conn.close()
        runs: List[Run] = []
        for row in rows:
            run = self.load_run(row["id"])
            if run is not None:
                runs.append(run)
        return runs

    # ---- evidence artifacts ---------------------------------------------
    def write_artifact(
        self, run_id: str, kind: str, title: str, content: str, ext: str = "md"
    ) -> EvidenceItem:
        ev_dir = config.evidence_dir() / run_id
        ev_dir.mkdir(parents=True, exist_ok=True)
        eid = evidence_id()
        fname = "{0}.{1}".format(eid, ext)
        fpath = ev_dir / fname
        fpath.write_text(content, encoding="utf-8")
        rel = str(fpath.relative_to(config.data_dir()))
        preview = content[:500]
        return EvidenceItem(id=eid, kind=kind, title=title, path=rel, preview=preview)

    def read_artifact(self, rel_path: str) -> str:
        fpath = config.data_dir() / rel_path
        if not fpath.is_file():
            return ""
        return fpath.read_text(encoding="utf-8")

    # ---- event log -------------------------------------------------------
    def append_event(self, event: Dict[str, Any]) -> None:
        event = dict(event)
        event.setdefault("at", now_iso())
        log = config.logs_dir() / "events.jsonl"
        with log.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(event, ensure_ascii=False) + "\n")

    def read_events(self, limit: int = 200) -> List[Dict[str, Any]]:
        log = config.logs_dir() / "events.jsonl"
        if not log.is_file():
            return []
        lines = log.read_text(encoding="utf-8").splitlines()
        out: List[Dict[str, Any]] = []
        for line in lines[-limit:]:
            line = line.strip()
            if not line:
                continue
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        return out
