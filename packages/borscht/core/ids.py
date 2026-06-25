"""Human-friendly, sortable identifiers."""

from __future__ import annotations

import secrets
import time
from datetime import datetime, timezone


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def run_id() -> str:
    stamp = time.strftime("%Y%m%d-%H%M%S", time.gmtime())
    return "run-{0}-{1}".format(stamp, secrets.token_hex(3))


def step_id() -> str:
    return "step-{0}".format(secrets.token_hex(4))


def evidence_id() -> str:
    return "ev-{0}".format(secrets.token_hex(4))
