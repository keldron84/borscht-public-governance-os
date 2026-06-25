"""Workflow templates (onboarding engine).

A template declares the workflow's default risk, the actions it intends to take
(used by the policy engine), required tool scopes and an execution plan. Shipped
packs live in ``templates/packs/``; users can install more via the CLI/API into
``data/installed_templates.json``.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from borscht import config


@dataclass
class WorkflowTemplate:
    id: str
    name: str
    description: str
    risk_class: str
    actions: List[str] = field(default_factory=list)
    tool_scopes: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    requires_approval_hint: bool = False
    execution_plan: List[Dict[str, Any]] = field(default_factory=list)
    signal_fields: List[str] = field(default_factory=lambda: ["text"])

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "risk_class": self.risk_class,
            "actions": self.actions,
            "tool_scopes": self.tool_scopes,
            "tags": self.tags,
            "requires_approval_hint": self.requires_approval_hint,
            "execution_plan": self.execution_plan,
            "signal_fields": self.signal_fields,
        }


class TemplateLibrary:
    def __init__(self) -> None:
        self._templates: Dict[str, WorkflowTemplate] = {}
        self._load()

    def _load_file(self, path) -> None:
        data = json.loads(path.read_text(encoding="utf-8"))
        tpl = WorkflowTemplate(
            id=data["id"],
            name=data.get("name", data["id"]),
            description=data.get("description", ""),
            risk_class=data.get("risk_class", "P2"),
            actions=list(data.get("actions", [])),
            tool_scopes=list(data.get("tool_scopes", [])),
            tags=list(data.get("tags", [])),
            requires_approval_hint=bool(data.get("requires_approval_hint", False)),
            execution_plan=list(data.get("execution_plan", [])),
            signal_fields=list(data.get("signal_fields", ["text"])),
        )
        self._templates[tpl.id] = tpl

    def _load(self) -> None:
        self._templates = {}
        # blank starter is always available
        self._templates["blank"] = WorkflowTemplate(
            id="blank",
            name="Blank workflow",
            description="Start from scratch: provide a signal and let policy decide.",
            risk_class="P2",
            actions=["analysis"],
            tool_scopes=["markdown_export"],
            tags=["blank"],
            execution_plan=[{"action": "analysis", "title": "Analysis"}],
        )
        for fp in sorted(config.TEMPLATE_PACKS_DIR.glob("*.json")):
            self._load_file(fp)
        # user-installed templates
        inst = config.installed_templates_path()
        if inst.is_file():
            try:
                for data in json.loads(inst.read_text(encoding="utf-8")).get("templates", []):
                    tpl = WorkflowTemplate(
                        id=data["id"],
                        name=data.get("name", data["id"]),
                        description=data.get("description", ""),
                        risk_class=data.get("risk_class", "P2"),
                        actions=list(data.get("actions", [])),
                        tool_scopes=list(data.get("tool_scopes", [])),
                        tags=list(data.get("tags", [])),
                        requires_approval_hint=bool(data.get("requires_approval_hint", False)),
                        execution_plan=list(data.get("execution_plan", [])),
                        signal_fields=list(data.get("signal_fields", ["text"])),
                    )
                    self._templates[tpl.id] = tpl
            except (json.JSONDecodeError, OSError, KeyError):
                pass

    def list(self) -> List[WorkflowTemplate]:
        return list(self._templates.values())

    def get(self, template_id: str) -> Optional[WorkflowTemplate]:
        return self._templates.get(template_id)

    def install_from_dict(self, data: Dict[str, Any]) -> WorkflowTemplate:
        inst = config.installed_templates_path()
        bundle = {"templates": []}
        if inst.is_file():
            try:
                bundle = json.loads(inst.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                bundle = {"templates": []}
        bundle.setdefault("templates", [])
        bundle["templates"] = [t for t in bundle["templates"] if t.get("id") != data["id"]]
        bundle["templates"].append(data)
        inst.write_text(json.dumps(bundle, indent=2, ensure_ascii=False), encoding="utf-8")
        self._load()
        return self._templates[data["id"]]
