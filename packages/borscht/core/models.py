"""Unified run/case data model shared by CLI, API and UI.

A single state language keeps the control plane coherent: every screen and
command speaks in terms of Run, Step, PolicyDecision and EvidenceItem.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional

from borscht.core.ids import now_iso


class RunStatus:
    DRAFT = "draft"
    QUEUED = "queued"
    RUNNING = "running"
    AWAITING_APPROVAL = "awaiting_approval"
    BLOCKED_BY_POLICY = "blocked_by_policy"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"
    WAIVED = "waived"

    ALL = [
        DRAFT,
        QUEUED,
        RUNNING,
        AWAITING_APPROVAL,
        BLOCKED_BY_POLICY,
        SUCCEEDED,
        FAILED,
        ROLLED_BACK,
        WAIVED,
    ]
    TERMINAL = [SUCCEEDED, FAILED, ROLLED_BACK, WAIVED]


class Verdict:
    PENDING = "pending"
    GO = "GO"
    HOLD = "HOLD"
    REVISE = "REVISE"
    STOP = "STOP"

    ALL = [PENDING, GO, HOLD, REVISE, STOP]


class RiskClass:
    P0 = "P0"  # destructive / data exfil / secrets / outbound external
    P1 = "P1"  # spend increase / public publish / data mutation / launch
    P2 = "P2"  # low-risk internal drafts / analysis / summaries

    ALL = [P0, P1, P2]


class PolicyEffect:
    ALLOW = "allow"
    DENY = "deny"
    REQUIRE_APPROVAL = "require_approval"

    ALL = [ALLOW, DENY, REQUIRE_APPROVAL]


@dataclass
class PolicyDecision:
    rule_id: str
    pack: str
    severity: str
    effect: str
    reason: str
    scope: str = ""
    matched: bool = True
    simulated: bool = False
    at: str = field(default_factory=now_iso)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class EvidenceItem:
    id: str
    kind: str  # "markdown" | "json" | "file" | "log"
    title: str
    path: str = ""
    preview: str = ""
    at: str = field(default_factory=now_iso)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Step:
    id: str
    name: str  # signal | context | policy | decision | execution | evidence | rollback
    actor: str
    outcome: str  # ok | blocked | denied | pending | failed | skipped
    detail: str = ""
    raw: Dict[str, Any] = field(default_factory=dict)
    started_at: str = field(default_factory=now_iso)
    duration_ms: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class Run:
    id: str
    workflow: str
    title: str
    signal: Dict[str, Any]
    owner: str
    risk_class: str
    status: str = RunStatus.DRAFT
    verdict: str = Verdict.PENDING
    approver: str = ""
    task_contract: str = ""
    explanation: str = ""
    tags: List[str] = field(default_factory=list)
    tool_scopes: List[str] = field(default_factory=list)
    steps: List[Step] = field(default_factory=list)
    policy_decisions: List[PolicyDecision] = field(default_factory=list)
    evidence: List[EvidenceItem] = field(default_factory=list)
    created_at: str = field(default_factory=now_iso)
    updated_at: str = field(default_factory=now_iso)

    # ---- serialization ---------------------------------------------------
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "workflow": self.workflow,
            "title": self.title,
            "signal": self.signal,
            "owner": self.owner,
            "risk_class": self.risk_class,
            "status": self.status,
            "verdict": self.verdict,
            "approver": self.approver,
            "task_contract": self.task_contract,
            "explanation": self.explanation,
            "tags": list(self.tags),
            "tool_scopes": list(self.tool_scopes),
            "steps": [s.to_dict() for s in self.steps],
            "policy_decisions": [p.to_dict() for p in self.policy_decisions],
            "evidence": [e.to_dict() for e in self.evidence],
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @staticmethod
    def from_dict(d: Dict[str, Any]) -> "Run":
        run = Run(
            id=d["id"],
            workflow=d["workflow"],
            title=d.get("title", ""),
            signal=d.get("signal", {}),
            owner=d.get("owner", ""),
            risk_class=d.get("risk_class", RiskClass.P1),
            status=d.get("status", RunStatus.DRAFT),
            verdict=d.get("verdict", Verdict.PENDING),
            approver=d.get("approver", ""),
            task_contract=d.get("task_contract", ""),
            explanation=d.get("explanation", ""),
            tags=list(d.get("tags", [])),
            tool_scopes=list(d.get("tool_scopes", [])),
            created_at=d.get("created_at", now_iso()),
            updated_at=d.get("updated_at", now_iso()),
        )
        run.steps = [Step(**s) for s in d.get("steps", [])]
        run.policy_decisions = [PolicyDecision(**p) for p in d.get("policy_decisions", [])]
        run.evidence = [EvidenceItem(**e) for e in d.get("evidence", [])]
        return run

    # ---- helpers ---------------------------------------------------------
    def touch(self) -> None:
        self.updated_at = now_iso()

    def add_step(self, step: Step) -> None:
        self.steps.append(step)
        self.touch()

    def add_policy_decision(self, decision: PolicyDecision) -> None:
        self.policy_decisions.append(decision)
        self.touch()

    def add_evidence(self, item: EvidenceItem) -> None:
        self.evidence.append(item)
        self.touch()

    def requires_approval(self) -> bool:
        return any(
            d.matched and not d.simulated and d.effect == PolicyEffect.REQUIRE_APPROVAL
            for d in self.policy_decisions
        )

    def is_denied(self) -> bool:
        return any(
            d.matched and not d.simulated and d.effect == PolicyEffect.DENY
            for d in self.policy_decisions
        )
