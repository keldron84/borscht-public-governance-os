"""Declarative, fail-closed policy engine.

Policies are JSON packs of rules. Each rule has a severity (P0/P1/P2), a scope,
an effect (allow/deny/require_approval) and a declarative ``match`` block.
Rules are evaluated against a context assembled from the run and its proposed
actions. Resolution is fail-closed: deny > require_approval > allow.

User overrides (toggles + custom packs) live in ``data/policies.local.json`` so
shipped packs are never mutated.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from borscht import config
from borscht.core.models import PolicyDecision, PolicyEffect


@dataclass
class PolicyRule:
    id: str
    severity: str
    effect: str
    reason: str
    scope: str = ""
    match: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PolicyPack:
    id: str
    title: str
    description: str
    active: bool
    rules: List[PolicyRule] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "active": self.active,
            "rules": [
                {
                    "id": r.id,
                    "severity": r.severity,
                    "effect": r.effect,
                    "reason": r.reason,
                    "scope": r.scope,
                    "match": r.match,
                }
                for r in self.rules
            ],
        }


def _matches(match: Dict[str, Any], ctx: Dict[str, Any]) -> bool:
    """All present conditions must hold (logical AND)."""
    if not match:
        return False
    if match.get("always"):
        return True

    def _in(key: str, ctx_key: str) -> Optional[bool]:
        if key not in match:
            return None
        wanted = set(match[key])
        have = ctx.get(ctx_key)
        if isinstance(have, (list, tuple, set)):
            return bool(wanted.intersection(set(have)))
        return have in wanted

    checks = [
        _in("risk_class_in", "risk_class"),
        _in("workflow_in", "workflow"),
        _in("tool_in", "tools"),
        _in("action_in", "actions"),
        _in("tag_in", "tags"),
    ]

    if "signal_contains_any" in match:
        text = (ctx.get("signal_text") or "").lower()
        needles = [str(n).lower() for n in match["signal_contains_any"]]
        checks.append(any(n in text for n in needles))

    present = [c for c in checks if c is not None]
    if not present:
        return False
    return all(present)


class PolicyEngine:
    def __init__(self) -> None:
        self._packs: Dict[str, PolicyPack] = {}
        self._load()

    # ---- loading ---------------------------------------------------------
    def _load(self) -> None:
        self._packs = {}
        for fp in sorted(config.POLICY_PACKS_DIR.glob("*.json")):
            data = json.loads(fp.read_text(encoding="utf-8"))
            pack = PolicyPack(
                id=data["id"],
                title=data.get("title", data["id"]),
                description=data.get("description", ""),
                active=bool(data.get("active", True)),
                rules=[PolicyRule(**r) for r in data.get("rules", [])],
            )
            self._packs[pack.id] = pack
        self._apply_overrides()

    def _apply_overrides(self) -> None:
        p = config.policies_local_path()
        if not p.is_file():
            return
        try:
            overrides = json.loads(p.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return
        for pack_id, state in overrides.get("active", {}).items():
            if pack_id in self._packs:
                self._packs[pack_id].active = bool(state)

    def set_pack_active(self, pack_id: str, active: bool) -> None:
        if pack_id not in self._packs:
            raise KeyError(pack_id)
        self._packs[pack_id].active = active
        p = config.policies_local_path()
        overrides: Dict[str, Any] = {"active": {}}
        if p.is_file():
            try:
                overrides = json.loads(p.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                overrides = {"active": {}}
        overrides.setdefault("active", {})[pack_id] = active
        p.write_text(json.dumps(overrides, indent=2, ensure_ascii=False), encoding="utf-8")

    # ---- introspection ---------------------------------------------------
    def packs(self) -> List[PolicyPack]:
        return list(self._packs.values())

    def reload(self) -> None:
        self._load()

    # ---- evaluation ------------------------------------------------------
    def evaluate(self, ctx: Dict[str, Any], simulated: bool = False) -> List[PolicyDecision]:
        decisions: List[PolicyDecision] = []
        for pack in self._packs.values():
            if not pack.active and not simulated:
                continue
            for rule in pack.rules:
                if _matches(rule.match, ctx):
                    decisions.append(
                        PolicyDecision(
                            rule_id=rule.id,
                            pack=pack.id,
                            severity=rule.severity,
                            effect=rule.effect,
                            reason=rule.reason,
                            scope=rule.scope,
                            matched=True,
                            simulated=simulated or not pack.active,
                        )
                    )
        return decisions

    @staticmethod
    def resolve(decisions: List[PolicyDecision]) -> str:
        """Fail-closed resolution into an effect."""
        effective = [d for d in decisions if d.matched and not d.simulated]
        if any(d.effect == PolicyEffect.DENY for d in effective):
            return PolicyEffect.DENY
        if any(d.effect == PolicyEffect.REQUIRE_APPROVAL for d in effective):
            return PolicyEffect.REQUIRE_APPROVAL
        return PolicyEffect.ALLOW
