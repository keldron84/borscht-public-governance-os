"""Local memory-lite: a useful index over past runs (no graph DB).

Provides retrieval of similar past runs by workflow/tags and simple keyword
overlap. This is the optional context a new run can pull in at triage time.
"""

from __future__ import annotations

from typing import Any, Dict, List

from borscht.core.models import Run
from borscht.evidence.store import EvidenceStore


def _tokens(text: str) -> set:
    return {t for t in "".join(c.lower() if c.isalnum() else " " for c in text).split() if len(t) > 2}


class MemoryLite:
    def __init__(self, store: EvidenceStore) -> None:
        self.store = store

    def recall(self, workflow: str, signal_text: str, tags: List[str], limit: int = 3) -> List[Dict[str, Any]]:
        runs = self.store.list_runs(limit=200)
        query = _tokens(signal_text) | {t.lower() for t in tags}
        scored = []
        for r in runs:
            score = 0
            if r.workflow == workflow:
                score += 3
            score += len(set(t.lower() for t in r.tags) & {t.lower() for t in tags}) * 2
            sig = " ".join(str(v) for v in r.signal.values())
            score += len(_tokens(sig) & query)
            if score > 0:
                scored.append((score, r))
        scored.sort(key=lambda x: x[0], reverse=True)
        out = []
        for score, r in scored[:limit]:
            out.append(
                {
                    "id": r.id,
                    "title": r.title,
                    "workflow": r.workflow,
                    "verdict": r.verdict,
                    "status": r.status,
                    "score": score,
                }
            )
        return out

    def pattern_cards(self) -> List[Dict[str, Any]]:
        """Reusable cards derived from succeeded runs grouped by workflow."""
        runs = self.store.list_runs(limit=200)
        by_workflow: Dict[str, Dict[str, Any]] = {}
        for r in runs:
            card = by_workflow.setdefault(
                r.workflow, {"workflow": r.workflow, "runs": 0, "succeeded": 0}
            )
            card["runs"] += 1
            if r.status == "succeeded":
                card["succeeded"] += 1
        return list(by_workflow.values())
