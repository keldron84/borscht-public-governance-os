"""Runtime paths and settings resolution.

Everything is local and file-based by default. No external services required.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict


def _find_repo_root() -> Path:
    # When running from source, the repo root holds pyproject.toml.
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / "pyproject.toml").is_file():
            return parent
    return Path.cwd()


REPO_ROOT = _find_repo_root()
PACKAGE_ROOT = Path(__file__).resolve().parent


def data_dir() -> Path:
    raw = os.environ.get("BORSCHT_DATA_DIR")
    base = Path(raw).expanduser().resolve() if raw else (REPO_ROOT / "data")
    base.mkdir(parents=True, exist_ok=True)
    return base


def runs_dir() -> Path:
    d = data_dir() / "runs"
    d.mkdir(parents=True, exist_ok=True)
    return d


def evidence_dir() -> Path:
    d = data_dir() / "evidence"
    d.mkdir(parents=True, exist_ok=True)
    return d


def logs_dir() -> Path:
    d = data_dir() / "logs"
    d.mkdir(parents=True, exist_ok=True)
    return d


def db_path() -> Path:
    return data_dir() / "borscht.sqlite"


def identity_path() -> Path:
    return data_dir() / "identity.json"


def policies_local_path() -> Path:
    return data_dir() / "policies.local.json"


def installed_templates_path() -> Path:
    return data_dir() / "installed_templates.json"


def settings_path() -> Path:
    return data_dir() / "settings.local.json"


# Built-in (shipped) pack locations.
POLICY_PACKS_DIR = PACKAGE_ROOT / "policy" / "packs"
TEMPLATE_PACKS_DIR = PACKAGE_ROOT / "templates" / "packs"
EVAL_PACKS_DIR = PACKAGE_ROOT / "eval" / "packs"


DEFAULT_SETTINGS: Dict[str, Any] = {
    "environment": "local",
    "language": "en",  # UI/CLI/content language; "en" or "ru" (UI auto-detects)
    "current_actor": "user:operator",
    "storage_path": "",  # empty => default data_dir()
    "default_risk_class": "P1",
    "providers": {
        # Public v1 runs deterministic triage/decision by default.
        # Optional keys are accepted but not required.
        "llm_provider": "",
        "llm_api_key": "",
    },
    "connectors": {
        "http_allowlist": ["https://example.com", "https://api.github.com"],
        "shell_enabled": False,
    },
    "notifications": {"webhook_url": ""},
    "emergency_pause": False,
}


def load_settings() -> Dict[str, Any]:
    p = settings_path()
    settings = json.loads(json.dumps(DEFAULT_SETTINGS))  # deep copy
    if p.is_file():
        try:
            user = json.loads(p.read_text(encoding="utf-8"))
            if isinstance(user, dict):
                settings.update(user)
        except (json.JSONDecodeError, OSError):
            pass
    return settings


def save_settings(settings: Dict[str, Any]) -> None:
    settings_path().write_text(
        json.dumps(settings, indent=2, ensure_ascii=False), encoding="utf-8"
    )
