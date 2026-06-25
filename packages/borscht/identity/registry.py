"""Identity, roles and ownership.

Public v1 keeps this simple but strict: every run and action is attributed to
an actor, and each run has an owner who holds the risk.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, asdict, field
from typing import Dict, List, Optional

from borscht import config


class ActorKind:
    USER = "user"
    AGENT = "agent"
    OWNER = "owner"
    APPROVER = "approver"
    SERVICE = "service"
    ALL = [USER, AGENT, OWNER, APPROVER, SERVICE]


@dataclass
class Actor:
    id: str
    name: str
    kind: str
    roles: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return asdict(self)


_DEFAULT_ACTORS = [
    Actor("user:operator", "Operator", ActorKind.USER, ["owner", "approver"]),
    Actor("agent:triage", "Triage Agent", ActorKind.AGENT, ["triage"]),
    Actor("agent:executor", "Execution Agent", ActorKind.AGENT, ["execute"]),
    Actor("approver:lead", "Approval Lead", ActorKind.APPROVER, ["approver"]),
    Actor("service:scheduler", "Scheduler", ActorKind.SERVICE, ["schedule"]),
]


class IdentityRegistry:
    def __init__(self) -> None:
        self._path = config.identity_path()
        self._actors: Dict[str, Actor] = {}
        self._load()

    def _load(self) -> None:
        if self._path.is_file():
            try:
                data = json.loads(self._path.read_text(encoding="utf-8"))
                for a in data.get("actors", []):
                    self._actors[a["id"]] = Actor(**a)
                return
            except (json.JSONDecodeError, OSError, TypeError):
                pass
        for a in _DEFAULT_ACTORS:
            self._actors[a.id] = a
        self._save()

    def _save(self) -> None:
        self._path.write_text(
            json.dumps(
                {"actors": [a.to_dict() for a in self._actors.values()]},
                indent=2,
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )

    def list_actors(self) -> List[Actor]:
        return list(self._actors.values())

    def get(self, actor_id: str) -> Optional[Actor]:
        return self._actors.get(actor_id)

    def exists(self, actor_id: str) -> bool:
        return actor_id in self._actors

    def upsert(self, actor: Actor) -> None:
        self._actors[actor.id] = actor
        self._save()

    def approvers(self) -> List[Actor]:
        return [a for a in self._actors.values() if "approver" in a.roles]
