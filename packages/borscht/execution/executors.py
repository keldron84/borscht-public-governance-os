"""Constrained-but-real execution harness.

v1 supports: markdown/json export, allowlisted HTTP GET, webhook POST, file
read/write inside the data dir, and manual human handoff. Shell is sandboxed
and OFF by default. Each executor returns content that becomes evidence.
"""

from __future__ import annotations

import json
import urllib.request
import urllib.error
from dataclasses import dataclass, field
from typing import Any, Dict, List
from urllib.parse import urlparse

from borscht import config
from borscht import i18n


class ExecutionError(Exception):
    pass


@dataclass
class ExecutionResult:
    ok: bool
    kind: str  # evidence kind: markdown | json | log | file
    title: str
    content: str
    ext: str = "md"
    detail: str = ""
    raw: Dict[str, Any] = field(default_factory=dict)


def available_executors() -> List[str]:
    return [
        "markdown_export",
        "json_export",
        "http_get",
        "webhook_post",
        "file_write",
        "manual_handoff",
        "shell",
    ]


def _check_allowlist(url: str) -> None:
    settings = config.load_settings()
    allow = settings.get("connectors", {}).get("http_allowlist", [])
    host = urlparse(url).scheme + "://" + (urlparse(url).netloc or "")
    if not any(url.startswith(a) or host == urlparse(a).scheme + "://" + urlparse(a).netloc for a in allow):
        raise ExecutionError("URL not in http_allowlist: {0}".format(url))


def execute_action(action_type: str, params: Dict[str, Any]) -> ExecutionResult:
    params = params or {}

    if action_type in ("analysis", "draft", "summary", "internal_note", "markdown_export", "content_publish"):
        body = params.get("body") or params.get("text") or _render_default_markdown(params)
        title = params.get("title", action_type.replace("_", " ").title())
        return ExecutionResult(
            ok=True, kind="markdown", title=title, content=body, ext="md",
            detail=i18n.t("exec.md_generated", n=len(body)),
        )

    if action_type == "json_export":
        payload = params.get("payload", params)
        content = json.dumps(payload, indent=2, ensure_ascii=False)
        return ExecutionResult(
            ok=True, kind="json", title=params.get("title", "JSON export"),
            content=content, ext="json", detail=i18n.t("exec.json_exported"),
        )

    if action_type in ("http_get",):
        url = params.get("url", "")
        _check_allowlist(url)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "borscht-public/1.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:  # noqa: S310 (allowlisted)
                data = resp.read().decode("utf-8", errors="replace")[:5000]
            return ExecutionResult(
                ok=True, kind="log", title="HTTP GET {0}".format(url),
                content=data, ext="txt", detail=i18n.t("exec.http_fetched", url=url),
            )
        except (urllib.error.URLError, ValueError) as exc:
            raise ExecutionError("http_get failed: {0}".format(exc))

    if action_type in ("webhook_post", "outbound_message", "spend_increase", "campaign_launch", "data_mutation", "data_write", "budget_change", "external_publish"):
        # In public v1 these are simulated side-effects with a recorded payload,
        # so a fork is safe out of the box. Wire real connectors in Settings.
        payload = params.get("payload", params)
        content = json.dumps(
            {"action": action_type, "status": "executed (simulated connector)", "payload": payload},
            indent=2, ensure_ascii=False,
        )
        return ExecutionResult(
            ok=True, kind="json", title=i18n.t("exec.action_title", action=action_type),
            content=content, ext="json",
            detail=i18n.t("exec.action_executed", action=action_type),
            raw={"simulated": True},
        )

    if action_type == "file_write":
        rel = params.get("path", "outputs/output.txt")
        target = (config.data_dir() / rel).resolve()
        if config.data_dir() not in target.parents and target != config.data_dir():
            raise ExecutionError("file_write must stay inside data dir")
        target.parent.mkdir(parents=True, exist_ok=True)
        body = params.get("body", "")
        target.write_text(body, encoding="utf-8")
        return ExecutionResult(
            ok=True, kind="file", title="File written: {0}".format(rel),
            content=body, ext="txt", detail=i18n.t("exec.file_written", path=rel),
        )

    if action_type == "manual_handoff":
        note = params.get("note", i18n.t("exec.handoff_body"))
        title = i18n.t("exec.handoff_title")
        return ExecutionResult(
            ok=True, kind="markdown", title=title,
            content="# {0}\n\n{1}\n".format(title, note), ext="md",
            detail=i18n.t("exec.handoff"),
        )

    if action_type == "shell":
        settings = config.load_settings()
        if not settings.get("connectors", {}).get("shell_enabled", False):
            raise ExecutionError("shell executor disabled (enable in Settings)")
        raise ExecutionError("shell sandbox not provisioned in this build")

    raise ExecutionError("unknown action_type: {0}".format(action_type))


def _render_default_markdown(params: Dict[str, Any]) -> str:
    lines = ["# {0}".format(params.get("title", i18n.t("body.result"))), ""]
    for k, v in params.items():
        if k in ("title", "body", "text"):
            continue
        lines.append("- **{0}:** {1}".format(k, v))
    lines.append("")
    lines.append("_{0}_".format(i18n.t("body.generated_by")))
    return "\n".join(lines)
