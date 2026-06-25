"""Run state machine.

A single, explicit transition table keeps UI and CLI honest: no screen can
move a run into a state the engine would reject.
"""

from __future__ import annotations

from typing import Dict, List

from borscht.core.models import RunStatus as S


class StateError(Exception):
    pass


TRANSITIONS: Dict[str, List[str]] = {
    S.DRAFT: [S.QUEUED, S.RUNNING, S.FAILED],
    S.QUEUED: [S.RUNNING, S.FAILED],
    S.RUNNING: [
        S.AWAITING_APPROVAL,
        S.BLOCKED_BY_POLICY,
        S.SUCCEEDED,
        S.FAILED,
    ],
    S.AWAITING_APPROVAL: [S.RUNNING, S.BLOCKED_BY_POLICY, S.SUCCEEDED, S.FAILED, S.WAIVED],
    S.BLOCKED_BY_POLICY: [S.AWAITING_APPROVAL, S.RUNNING, S.WAIVED, S.FAILED],
    S.SUCCEEDED: [S.ROLLED_BACK],
    S.FAILED: [S.QUEUED, S.RUNNING, S.ROLLED_BACK],
    S.WAIVED: [S.RUNNING, S.SUCCEEDED, S.ROLLED_BACK],
    S.ROLLED_BACK: [],
}


def can_transition(src: str, dst: str) -> bool:
    return dst in TRANSITIONS.get(src, [])


def assert_transition(src: str, dst: str) -> None:
    if not can_transition(src, dst):
        raise StateError("invalid transition: {0} -> {1}".format(src, dst))
