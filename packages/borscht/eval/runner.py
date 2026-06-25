"""Eval gates: golden / regression / adversarial / policy-correctness.

Cases assert the policy effect for a (workflow, signal, risk) input using the
engine's simulator, so the suite is deterministic and has no side effects.
Run with one command: ``borscht test``.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List

from borscht import config
from borscht.core.engine import Engine


def _load_packs() -> List[Dict[str, Any]]:
    packs: List[Dict[str, Any]] = []
    for fp in sorted(config.EVAL_PACKS_DIR.glob("*.json")):
        packs.append(json.loads(fp.read_text(encoding="utf-8")))
    return packs


def run_suite() -> Dict[str, Any]:
    engine = Engine()
    packs_out: List[Dict[str, Any]] = []
    total = 0
    passed = 0
    blocking_failures = 0

    for pack in _load_packs():
        cases_out = []
        pack_pass = 0
        for case in pack.get("cases", []):
            total += 1
            sim = engine.simulate_policy(
                case["workflow"], case.get("signal", {}), case.get("risk_class")
            )
            actual = sim["effect"]
            expected = case["expect_effect"]
            ok = actual == expected
            if ok:
                passed += 1
                pack_pass += 1
            elif pack.get("blocking"):
                blocking_failures += 1
            cases_out.append(
                {
                    "id": case["id"],
                    "workflow": case["workflow"],
                    "expected": expected,
                    "actual": actual,
                    "ok": ok,
                }
            )
        packs_out.append(
            {
                "id": pack["id"],
                "title": pack.get("title", pack["id"]),
                "type": pack.get("type", "regression"),
                "blocking": bool(pack.get("blocking")),
                "passed": pack_pass,
                "total": len(pack.get("cases", [])),
                "cases": cases_out,
            }
        )

    pass_rate = round(100.0 * passed / total, 1) if total else 0.0
    release = "release" if blocking_failures == 0 and pass_rate >= 90.0 else "block"

    return {
        "summary": {
            "total": total,
            "passed": passed,
            "failed": total - passed,
            "pass_rate": pass_rate,
            "blocking_failures": blocking_failures,
            "release_recommendation": release,
        },
        "packs": packs_out,
    }
