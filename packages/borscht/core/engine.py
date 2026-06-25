"""The Borscht control loop: Signal -> Triage -> Decision -> Execution -> Evidence.

This is the product. Every CLI command and API endpoint goes through this
single orchestrator so behavior is consistent and auditable.
"""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from borscht import config
from borscht import i18n
from borscht.core.ids import now_iso, run_id, step_id
from borscht.core.models import (
    PolicyEffect,
    RiskClass,
    Run,
    RunStatus,
    Step,
    Verdict,
)
from borscht.evidence.store import EvidenceStore
from borscht.execution.executors import ExecutionError, execute_action
from borscht.identity.registry import IdentityRegistry
from borscht.memory_lite.registry import MemoryLite
from borscht.policy.engine import PolicyEngine
from borscht.runs.state_machine import assert_transition
from borscht.templates.loader import TemplateLibrary


class EngineError(Exception):
    pass


class Engine:
    def __init__(self) -> None:
        i18n.set_lang(i18n.resolve_lang())
        self.store = EvidenceStore()
        self.policy = PolicyEngine()
        self.identity = IdentityRegistry()
        self.templates = TemplateLibrary()
        self.memory = MemoryLite(self.store)

    # ---- helpers ---------------------------------------------------------
    def _set_status(self, run: Run, dst: str) -> None:
        if run.status != dst:
            assert_transition(run.status, dst)
            run.status = dst
            run.touch()

    def _signal_text(self, signal: Dict[str, Any]) -> str:
        return " ".join(str(v) for v in signal.values() if v is not None)

    def _add_step(self, run: Run, name: str, actor: str, outcome: str,
                  detail: str = "", raw: Optional[Dict[str, Any]] = None,
                  duration_ms: int = 0) -> None:
        run.add_step(
            Step(
                id=step_id(),
                name=name,
                actor=actor,
                outcome=outcome,
                detail=detail,
                raw=raw or {},
                started_at=now_iso(),
                duration_ms=duration_ms,
            )
        )

    def _build_ctx(self, run: Run, actions: List[str], tools: List[str]) -> Dict[str, Any]:
        return {
            "risk_class": run.risk_class,
            "workflow": run.workflow,
            "actions": actions,
            "tools": tools,
            "tags": run.tags,
            "signal_text": self._signal_text(run.signal),
        }

    # ---- creation + run --------------------------------------------------
    def create_run(
        self,
        workflow: str,
        signal: Dict[str, Any],
        owner: str = "user:operator",
        risk_class: Optional[str] = None,
        title: str = "",
        actor: str = "user:operator",
        use_memory: bool = True,
        autostart: bool = True,
    ) -> Run:
        tpl = self.templates.get(workflow)
        if tpl is None:
            raise EngineError("unknown workflow/template: {0}".format(workflow))
        if config.load_settings().get("emergency_pause"):
            raise EngineError("emergency pause is active; new runs are blocked")

        rc = risk_class or tpl.risk_class or RiskClass.P1
        run = Run(
            id=run_id(),
            workflow=workflow,
            title=title or "{0}: {1}".format(tpl.name, (self._signal_text(signal)[:48] or "untitled")),
            signal=signal,
            owner=owner,
            risk_class=rc,
            tags=list(tpl.tags),
            tool_scopes=list(tpl.tool_scopes),
        )

        # 1) Signal
        self._add_step(run, "signal", actor, "ok",
                       i18n.t("step.signal_received", workflow=workflow),
                       raw={"signal": signal})

        # 2) Triage / context
        recalled: List[Dict[str, Any]] = []
        if use_memory:
            recalled = self.memory.recall(workflow, self._signal_text(signal), run.tags)
        run.task_contract = i18n.t(
            "contract.text",
            name=tpl.name,
            risk=rc,
            actions=", ".join(tpl.actions) or i18n.t("actions.none"),
            owner=owner,
        )
        self._add_step(run, "context", "agent:triage", "ok",
                       i18n.t("step.context_built", n=len(recalled)),
                       raw={"task_contract": run.task_contract, "recalled": recalled})

        self.store.save_run(run)
        self.store.append_event({"event": "run_created", "run_id": run.id, "workflow": workflow})

        if autostart:
            self._evaluate_and_proceed(run, tpl.actions, tpl.tool_scopes, actor)
        return run

    def _evaluate_and_proceed(self, run: Run, actions: List[str], tools: List[str], actor: str) -> None:
        self._set_status(run, RunStatus.RUNNING)

        # 3) Policy
        t0 = time.time()
        decisions = self.policy.evaluate(self._build_ctx(run, actions, tools))
        run.policy_decisions = decisions
        effect = PolicyEngine.resolve(decisions)
        dur = int((time.time() - t0) * 1000)

        if effect == PolicyEffect.DENY:
            self._add_step(run, "policy", "agent:triage", "denied",
                           i18n.t("step.policy_denied"), raw={"effect": effect}, duration_ms=dur)
            run.verdict = Verdict.STOP
            run.explanation = self._first_reason(decisions, PolicyEffect.DENY) or i18n.t("explain.denied_default")
            self._set_status(run, RunStatus.BLOCKED_BY_POLICY)
            self.store.save_run(run)
            self.store.append_event({"event": "run_blocked", "run_id": run.id})
            return

        if effect == PolicyEffect.REQUIRE_APPROVAL:
            self._add_step(run, "policy", "agent:triage", "pending",
                           i18n.t("step.policy_approval"),
                           raw={"effect": effect}, duration_ms=dur)
            run.verdict = Verdict.HOLD
            run.explanation = (
                self._first_reason(decisions, PolicyEffect.REQUIRE_APPROVAL)
                or i18n.t("explain.approval_default")
            )
            self._set_status(run, RunStatus.AWAITING_APPROVAL)
            self.store.save_run(run)
            self.store.append_event({"event": "run_awaiting_approval", "run_id": run.id})
            return

        # allow
        self._add_step(run, "policy", "agent:triage", "ok",
                       i18n.t("step.policy_allow"), raw={"effect": effect}, duration_ms=dur)
        run.verdict = Verdict.GO
        run.explanation = i18n.t("explain.allowed")
        self._add_step(run, "decision", "agent:triage", "ok", i18n.t("step.decision_go"))
        self._execute(run, actor)

    def _execute(self, run: Run, actor: str) -> None:
        if run.status not in (RunStatus.RUNNING, RunStatus.AWAITING_APPROVAL, RunStatus.WAIVED):
            self._set_status(run, RunStatus.RUNNING)
        tpl = self.templates.get(run.workflow)
        plan = tpl.execution_plan if tpl else [{"action": a} for a in []]
        try:
            for stage in plan:
                action_type = stage.get("action")
                params = dict(stage)
                params.pop("action", None)
                params.setdefault("title", stage.get("title", action_type))
                params.setdefault("body", self._default_body(run, stage))
                t0 = time.time()
                result = execute_action(action_type, params)
                dur = int((time.time() - t0) * 1000)
                ev = self.store.write_artifact(
                    run.id, result.kind, result.title, result.content, ext=result.ext
                )
                run.add_evidence(ev)
                self._add_step(run, "execution", "agent:executor", "ok",
                               result.detail, raw={"action": action_type, "evidence": ev.id},
                               duration_ms=dur)
            self._add_step(run, "evidence", "agent:executor", "ok",
                           i18n.t("step.evidence_written", n=len(run.evidence)))
            run.verdict = Verdict.GO
            self._set_status(run, RunStatus.SUCCEEDED)
            self.store.append_event({"event": "run_succeeded", "run_id": run.id})
        except ExecutionError as exc:
            self._add_step(run, "execution", "agent:executor", "failed", str(exc))
            run.verdict = Verdict.STOP
            run.explanation = i18n.t("explain.exec_failed", error=exc)
            self._set_status(run, RunStatus.FAILED)
            self.store.append_event({"event": "run_failed", "run_id": run.id, "error": str(exc)})
        self.store.save_run(run)

    def _default_body(self, run: Run, stage: Dict[str, Any]) -> str:
        return (
            "# {title}\n\n"
            "**{run_l}:** {rid}\n\n"
            "**{wf_l}:** {wf}\n\n"
            "**{sig_l}:**\n\n```\n{sig}\n```\n\n"
            "_{footer}_\n"
        ).format(
            title=stage.get("title", i18n.t("body.result")),
            run_l=i18n.t("body.run"),
            rid=run.id,
            wf_l=i18n.t("body.workflow"),
            wf=run.workflow,
            sig_l=i18n.t("body.signal"),
            sig=self._signal_text(run.signal) or i18n.t("body.empty"),
            footer=i18n.t("body.generated_by"),
        )

    @staticmethod
    def _first_reason(decisions, effect: str) -> str:
        for d in decisions:
            if d.effect == effect and d.matched and not d.simulated:
                return i18n.policy_reason(d.rule_id, d.reason)
        return ""

    # ---- lifecycle actions ----------------------------------------------
    def approve(self, run_id_: str, approver: str = "approver:lead") -> Run:
        run = self._require(run_id_)
        if run.status != RunStatus.AWAITING_APPROVAL:
            raise EngineError("run is not awaiting approval (status={0})".format(run.status))
        run.approver = approver
        run.verdict = Verdict.GO
        self._add_step(run, "decision", approver, "ok", i18n.t("step.approved", actor=approver))
        self.store.append_event({"event": "run_approved", "run_id": run.id, "approver": approver})
        self._execute(run, approver)
        return run

    def reject(self, run_id_: str, approver: str = "approver:lead", reason: str = "") -> Run:
        run = self._require(run_id_)
        if run.status not in (RunStatus.AWAITING_APPROVAL, RunStatus.BLOCKED_BY_POLICY):
            raise EngineError("run cannot be rejected (status={0})".format(run.status))
        run.approver = approver
        run.verdict = Verdict.STOP
        run.explanation = reason or i18n.t("step.rejected", actor=approver)
        self._add_step(run, "decision", approver, "blocked", run.explanation)
        self._set_status(run, RunStatus.FAILED)
        self.store.save_run(run)
        self.store.append_event({"event": "run_rejected", "run_id": run.id, "approver": approver})
        return run

    def hold(self, run_id_: str, actor: str = "user:operator") -> Run:
        run = self._require(run_id_)
        if run.status == RunStatus.RUNNING:
            self._set_status(run, RunStatus.AWAITING_APPROVAL)
        run.verdict = Verdict.HOLD
        self._add_step(run, "decision", actor, "pending", i18n.t("step.held"))
        self.store.save_run(run)
        self.store.append_event({"event": "run_held", "run_id": run.id})
        return run

    def waive(self, run_id_: str, actor: str = "user:operator", reason: str = "") -> Run:
        run = self._require(run_id_)
        if run.status not in (RunStatus.BLOCKED_BY_POLICY, RunStatus.AWAITING_APPROVAL):
            raise EngineError("only blocked/awaiting runs can be waived")
        run.explanation = i18n.t("explain.waived", actor=actor, reason=reason).strip()
        self._add_step(run, "decision", actor, "ok", run.explanation)
        self._set_status(run, RunStatus.WAIVED)
        self.store.save_run(run)
        self.store.append_event({"event": "run_waived", "run_id": run.id})
        self._execute(run, actor)
        return run

    def rollback(self, run_id_: str, actor: str = "user:operator", reason: str = "") -> Run:
        run = self._require(run_id_)
        if run.status not in (RunStatus.SUCCEEDED, RunStatus.FAILED, RunStatus.WAIVED):
            raise EngineError("only finished runs can be rolled back (status={0})".format(run.status))
        note = "# {0}\n\n{1}\n\n{2}\n".format(
            i18n.t("rollback.title"),
            i18n.t("rollback.note", id=run.id, actor=actor),
            reason,
        )
        ev = self.store.write_artifact(run.id, "markdown", i18n.t("rollback.title"), note)
        run.add_evidence(ev)
        self._add_step(run, "rollback", actor, "ok", i18n.t("step.rollback"), raw={"reason": reason})
        run.verdict = Verdict.STOP
        self._set_status(run, RunStatus.ROLLED_BACK)
        self.store.save_run(run)
        self.store.append_event({"event": "run_rolled_back", "run_id": run.id})
        return run

    def retry(self, run_id_: str, actor: str = "user:operator") -> Run:
        run = self._require(run_id_)
        if run.status != RunStatus.FAILED:
            raise EngineError("only failed runs can be retried")
        self._set_status(run, RunStatus.RUNNING)
        self._add_step(run, "decision", actor, "ok", i18n.t("step.retry"))
        self._execute(run, actor)
        return run

    # ---- queries ---------------------------------------------------------
    def _require(self, run_id_: str) -> Run:
        run = self.store.load_run(run_id_)
        if run is None:
            raise EngineError("run not found: {0}".format(run_id_))
        return run

    def get_run(self, run_id_: str) -> Optional[Run]:
        return self.store.load_run(run_id_)

    def list_runs(self, status: Optional[str] = None, owner: Optional[str] = None,
                  workflow: Optional[str] = None, limit: int = 500) -> List[Run]:
        runs = self.store.list_runs(limit=limit)
        if status:
            runs = [r for r in runs if r.status == status]
        if owner:
            runs = [r for r in runs if r.owner == owner]
        if workflow:
            runs = [r for r in runs if r.workflow == workflow]
        return runs

    def approvals(self) -> List[Run]:
        return [r for r in self.store.list_runs() if r.status == RunStatus.AWAITING_APPROVAL]

    # ---- policy simulation ----------------------------------------------
    def simulate_policy(self, workflow: str, signal: Dict[str, Any],
                        risk_class: Optional[str] = None) -> Dict[str, Any]:
        tpl = self.templates.get(workflow)
        actions = tpl.actions if tpl else []
        tools = tpl.tool_scopes if tpl else []
        rc = risk_class or (tpl.risk_class if tpl else RiskClass.P1)
        ctx = {
            "risk_class": rc,
            "workflow": workflow,
            "actions": actions,
            "tools": tools,
            "tags": tpl.tags if tpl else [],
            "signal_text": self._signal_text(signal),
        }
        decisions = self.policy.evaluate(ctx, simulated=True)
        # resolve as if all matched packs were active
        active = [d for d in decisions if d.matched]
        effect = PolicyEffect.ALLOW
        if any(d.effect == PolicyEffect.DENY for d in active):
            effect = PolicyEffect.DENY
        elif any(d.effect == PolicyEffect.REQUIRE_APPROVAL for d in active):
            effect = PolicyEffect.REQUIRE_APPROVAL
        return {
            "effect": effect,
            "decisions": [d.to_dict() for d in decisions],
        }
