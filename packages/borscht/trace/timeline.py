"""Trace = the time-line of a decision.

Turns a run's steps into an ordered, explainable timeline:
signal -> context -> policy checks -> decision -> execution -> evidence -> final.
"""

from __future__ import annotations

from typing import Any, Dict, List

from borscht.core.models import Run


def build_timeline(run: Run) -> List[Dict[str, Any]]:
    timeline: List[Dict[str, Any]] = []
    for idx, step in enumerate(run.steps, start=1):
        timeline.append(
            {
                "index": idx,
                "id": step.id,
                "name": step.name,
                "actor": step.actor,
                "outcome": step.outcome,
                "detail": step.detail,
                "at": step.started_at,
                "duration_ms": step.duration_ms,
                "raw": step.raw,
            }
        )
    return timeline
