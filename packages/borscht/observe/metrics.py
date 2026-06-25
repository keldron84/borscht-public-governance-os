"""Operational metrics over runs (system health, not BI)."""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List

from borscht.core.models import Run, RunStatus, Verdict, PolicyEffect


def _parse(ts: str) -> datetime:
    try:
        return datetime.fromisoformat(ts)
    except (ValueError, TypeError):
        return datetime.now(timezone.utc)


def _approval_latency_seconds(run: Run) -> float:
    start = None
    end = None
    for s in run.steps:
        if s.name == "policy" and s.outcome in ("pending", "blocked"):
            start = _parse(s.started_at)
        if s.name == "decision" and s.outcome == "ok" and start is not None:
            end = _parse(s.started_at)
    if start and end:
        return max(0.0, (end - start).total_seconds())
    return 0.0


def build_overview(runs: List[Run]) -> Dict[str, Any]:
    status_counts = Counter(r.status for r in runs)
    succeeded = status_counts.get(RunStatus.SUCCEEDED, 0)
    finished = succeeded + status_counts.get(RunStatus.FAILED, 0)
    success_rate = round(100.0 * succeeded / finished, 1) if finished else 0.0

    attention = [
        r for r in runs
        if r.status in (RunStatus.BLOCKED_BY_POLICY, RunStatus.AWAITING_APPROVAL, RunStatus.FAILED)
    ]

    return {
        "kpis": {
            "active_runs": status_counts.get(RunStatus.RUNNING, 0)
            + status_counts.get(RunStatus.QUEUED, 0),
            "awaiting_approvals": status_counts.get(RunStatus.AWAITING_APPROVAL, 0),
            "blocked_by_policy": status_counts.get(RunStatus.BLOCKED_BY_POLICY, 0),
            "success_rate": success_rate,
            "total_runs": len(runs),
            "rolled_back": status_counts.get(RunStatus.ROLLED_BACK, 0),
        },
        "attention": [
            {
                "id": r.id,
                "title": r.title,
                "status": r.status,
                "risk_class": r.risk_class,
                "owner": r.owner,
                "updated_at": r.updated_at,
            }
            for r in attention[:10]
        ],
        "status_counts": dict(status_counts),
    }


def build_observability(runs: List[Run]) -> Dict[str, Any]:
    status_counts = Counter(r.status for r in runs)
    verdict_counts = Counter(r.verdict for r in runs)

    denials_by_pack: Counter = Counter()
    approvals_by_pack: Counter = Counter()
    for r in runs:
        for d in r.policy_decisions:
            if d.simulated:
                continue
            if d.effect == PolicyEffect.DENY:
                denials_by_pack[d.pack] += 1
            elif d.effect == PolicyEffect.REQUIRE_APPROVAL:
                approvals_by_pack[d.pack] += 1

    by_day: Dict[str, Counter] = defaultdict(Counter)
    for r in runs:
        day = (r.created_at or "")[:10]
        by_day[day]["total"] += 1
        by_day[day][r.status] += 1

    latencies = [_approval_latency_seconds(r) for r in runs]
    latencies = [x for x in latencies if x > 0]
    avg_latency = round(sum(latencies) / len(latencies), 1) if latencies else 0.0

    workflow_fail: Counter = Counter()
    for r in runs:
        if r.status == RunStatus.FAILED:
            workflow_fail[r.workflow] += 1

    return {
        "run_volume": [
            {"day": day, **dict(counts)} for day, counts in sorted(by_day.items())
        ],
        "status_counts": dict(status_counts),
        "verdict_counts": dict(verdict_counts),
        "denials_by_policy": dict(denials_by_pack),
        "approvals_by_policy": dict(approvals_by_pack),
        "avg_approval_latency_s": avg_latency,
        "rollback_events": status_counts.get(RunStatus.ROLLED_BACK, 0),
        "top_failing_workflows": [
            {"workflow": w, "failures": c} for w, c in workflow_fail.most_common(5)
        ],
    }
