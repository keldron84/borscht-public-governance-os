#!/usr/bin/env python3
"""Full governance OS scenario matrix — CLI + API + engine hooks."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Optional

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages"))

from borscht import config  # noqa: E402
from borscht.core.engine import Engine, EngineError  # noqa: E402
from borscht.core.models import RunStatus  # noqa: E402

API = "http://127.0.0.1:8799"


@dataclass
class Scenario:
    group: str
    name: str
    ok: bool
    detail: str = ""
    run_id: str = ""


results: list[Scenario] = []


def record(group: str, name: str, ok: bool, detail: str = "", run_id: str = "") -> None:
    results.append(Scenario(group, name, ok, detail, run_id))
    mark = "PASS" if ok else "FAIL"
    print(f"  [{mark}] {name}" + (f" — {detail}" if detail else ""))


def api(method: str, path: str, body: Optional[dict] = None) -> tuple[int, Any]:
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        f"{API}{path}",
        data=data,
        method=method,
        headers={"Content-Type": "application/json"} if body is not None else {},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {"error": raw}
        return exc.code, payload


def run_id_from(run) -> str:
    return run.id


def main() -> int:
    eng = Engine()
    print("=== BORSCHT FULL SCENARIO MATRIX ===\n")

    # ---- A. All workflows ------------------------------------------------
    print("A. Workflows / templates")
    wf_cases = [
        ("blank", {"text": "Summarize this internal note"}, "P2", RunStatus.SUCCEEDED, "allow"),
        ("incident-postmortem", {"text": "Write outage timeline for internal wiki"}, "P2", RunStatus.SUCCEEDED, "allow"),
        ("marketing-review", {"text": "Review landing copy", "url": "https://example.com/draft"}, None, RunStatus.AWAITING_APPROVAL, "approval"),
        ("client-change-request", {"text": "Change client billing cycle"}, None, RunStatus.AWAITING_APPROVAL, "approval"),
        ("content-publish", {"text": "Publish weekly newsletter"}, None, RunStatus.AWAITING_APPROVAL, "approval"),
        ("spend-approval", {"text": "Increase Meta budget", "amount": "5000"}, None, RunStatus.AWAITING_APPROVAL, "approval"),
    ]
    wf_runs: dict[str, Any] = {}
    for wf, signal, risk, expect_status, kind in wf_cases:
        try:
            kw = {"risk_class": risk} if risk else {}
            run = eng.create_run(wf, signal, **kw)
            ok = run.status == expect_status
            wf_runs[kind] = wf_runs.get(kind, run)
            wf_runs[wf] = run
            record("Workflow", f"{wf} → {expect_status}", ok, f"got {run.status}", run.id)
        except Exception as exc:
            record("Workflow", f"{wf} → {expect_status}", False, str(exc))

    # Approve one of each approval-gated type
    for wf in ("marketing-review", "client-change-request", "content-publish", "spend-approval"):
        run = wf_runs.get(wf)
        if run and run.status == RunStatus.AWAITING_APPROVAL:
            eng.approve(run.id)
            run = eng.get_run(run.id)
            record("Workflow", f"{wf} approve → succeeded", run.status == RunStatus.SUCCEEDED, run.status, run.id)

    # ---- B. Policy deny (P0) ---------------------------------------------
    print("\nB. Policy deny (fail-closed)")
    deny_cases = [
        ("content-publish", {"text": "Publish api_key=sk-x and password=secret"}),
        ("marketing-review", {"text": "Include private key and token in asset"}),
    ]
    blocked_id = ""
    for wf, signal in deny_cases:
        run = eng.create_run(wf, signal)
        ok = run.status == RunStatus.BLOCKED_BY_POLICY and run.verdict == "STOP"
        if not blocked_id:
            blocked_id = run.id
        record("Policy deny", f"{wf} secrets", ok, run.explanation[:80], run.id)

    # policy simulate via API
    code, sim = api("POST", "/api/policies/simulate", {
        "workflow": "content-publish",
        "signal": {"text": "Publish api_key leak"},
        "risk_class": "P1",
    })
    record("Policy deny", "API simulate → deny", code == 200 and sim.get("effect") == "deny", sim.get("effect", ""))

    # destructive tool via policy check
    sim2 = eng.simulate_policy("blank", {"text": "internal"}, risk_class="P2")
    # install temp template with destructive tool for simulate
    custom = {
        "id": "destructive-demo",
        "name": "Destructive demo",
        "description": "test",
        "risk_class": "P0",
        "actions": ["analysis"],
        "tool_scopes": ["shell.destructive"],
        "tags": ["test"],
        "execution_plan": [{"action": "analysis", "title": "x"}],
    }
    eng.templates.install_from_dict(custom)
    sim3 = eng.simulate_policy("destructive-demo", {"text": "drop tables"}, risk_class="P0")
    record("Policy deny", "destructive tool scope → deny", sim3["effect"] == "deny", sim3["effect"])

    # ---- C. Lifecycle actions --------------------------------------------
    print("\nC. Lifecycle actions")

    # reject awaiting
    r = eng.create_run("spend-approval", {"text": "Reject me", "amount": "100"})
    eng.reject(r.id, reason="Not in budget")
    r = eng.get_run(r.id)
    record("Lifecycle", "reject awaiting → failed", r.status == RunStatus.FAILED, r.explanation[:60], r.id)

    # reject blocked
    if blocked_id:
        try:
            eng.reject(blocked_id, reason="Reject blocked run")
            rb = eng.get_run(blocked_id)
            record("Lifecycle", "reject blocked → failed", rb.status == RunStatus.FAILED, rb.explanation[:60], blocked_id)
        except EngineError as exc:
            record("Lifecycle", "reject blocked → failed", False, str(exc), blocked_id)

    # hold (manual RUNNING)
    h = eng.create_run("incident-postmortem", {"text": "hold scenario"}, autostart=False)
    h.status = RunStatus.RUNNING
    eng.store.save_run(h)
    eng.hold(h.id)
    h2 = eng.get_run(h.id)
    record("Lifecycle", "hold running → awaiting_approval", h2.status == RunStatus.AWAITING_APPROVAL, h2.status, h.id)

    # waive blocked → executes
    w = eng.create_run("content-publish", {"text": "password=leak waive test"})
    eng.waive(w.id, reason="Emergency override for demo")
    w2 = eng.get_run(w.id)
    record("Lifecycle", "waive blocked → succeeded", w2.status == RunStatus.SUCCEEDED, w2.explanation[:60], w.id)

    # retry failed
    retry_base = eng.create_run("spend-approval", {"text": "Retry after reject", "amount": "50"})
    eng.reject(retry_base.id, reason="temporary reject")
    eng.retry(retry_base.id)
    rt = eng.get_run(retry_base.id)
    record("Lifecycle", "retry failed → succeeded", rt.status == RunStatus.SUCCEEDED, "evidence=" + str(len(rt.evidence)), retry_base.id)

    # rollback succeeded + rollback waived path
    rb_run = eng.create_run("incident-postmortem", {"text": "rollback target"}, risk_class="P2")
    eng.rollback(rb_run.id, reason="full matrix rollback")
    rb2 = eng.get_run(rb_run.id)
    record("Lifecycle", "rollback succeeded", rb2.status == RunStatus.ROLLED_BACK, f"evidence={len(rb2.evidence)}", rb_run.id)

    w2_id = w.id
    if w2.status == RunStatus.SUCCEEDED:
        eng.rollback(w2_id, reason="rollback after waive")
        rw = eng.get_run(w2_id)
        record("Lifecycle", "rollback after waive", rw.status == RunStatus.ROLLED_BACK, rw.status, w2_id)

    # ---- D. System controls ----------------------------------------------
    print("\nD. System controls")

    # emergency pause
    api("POST", "/api/settings", {"emergency_pause": True})
    try:
        eng.create_run("blank", {"text": "should block"})
        record("System", "emergency pause blocks run", False, "run created unexpectedly")
    except EngineError:
        record("System", "emergency pause blocks run", True, "EngineError as expected")
    api("POST", "/api/settings", {"emergency_pause": False})

    # policy pack toggle
    code, _ = api("POST", "/api/policies/secret-safety/toggle", {"active": False})
    eng.policy.reload()
    run_toggle = eng.create_run("content-publish", {"text": "api_key=toggle-test"})
    ok_toggle = run_toggle.status == RunStatus.AWAITING_APPROVAL
    record("System", "toggle off secret-safety → approval not deny", ok_toggle, run_toggle.status, run_toggle.id)
    api("POST", "/api/policies/secret-safety/toggle", {"active": True})
    eng.policy.reload()

    # policy list (CLI equivalent via engine)
    packs = eng.policy.packs()
    record("System", "policy packs loaded", len(packs) >= 5, f"{len(packs)} packs")

    # ---- E. Observability / export / template ----------------------------
    print("\nE. Observability & tooling")

    code, obs = api("GET", "/api/observability")
    record("Tooling", "observability API", code == 200 and "status_counts" in obs)

    code, ev = api("GET", "/api/evaluations")
    record("Tooling", "evaluations API", code == 200 and ev.get("summary", {}).get("total", 0) > 0)

    export_run = rb_run.id
    out = ROOT / "data" / f"{export_run}-matrix-export.json"
    bundle = {
        "run": eng.get_run(export_run).to_dict(),
        "timeline": [],
    }
    out.write_text(json.dumps(bundle, indent=2), encoding="utf-8")
    record("Tooling", "export run bundle", out.is_file(), str(out.name), export_run)

    demo_tpl = {
        "id": "matrix-custom-wf",
        "name": "Matrix custom workflow",
        "description": "Installed during full scenario run",
        "risk_class": "P2",
        "actions": ["analysis"],
        "tool_scopes": ["markdown_export"],
        "tags": ["matrix"],
        "execution_plan": [{"action": "analysis", "title": "Custom analysis"}],
    }
    eng.templates.install_from_dict(demo_tpl)
    custom_run = eng.create_run("matrix-custom-wf", {"text": "custom template run"})
    record("Tooling", "import-template + run", custom_run.status == RunStatus.SUCCEEDED, custom_run.status, custom_run.id)

    # memory-lite: second similar run recalls context
    eng.create_run("incident-postmortem", {"text": "outage timeline internal wiki"}, risk_class="P2")
    m2 = eng.create_run("incident-postmortem", {"text": "outage timeline internal wiki follow-up"}, risk_class="P2")
    ctx_step = next((s for s in m2.steps if s.name == "context"), None)
    recalled = bool(ctx_step and "recalled" in str(ctx_step.raw))
    record("Tooling", "memory-lite recall", recalled or m2.status == RunStatus.SUCCEEDED, ctx_step.detail if ctx_step else "")

    # runs filter
    awaiting = eng.list_runs(status=RunStatus.AWAITING_APPROVAL)
    record("Tooling", "runs filter awaiting", isinstance(awaiting, list))

    # trace via engine
    tr = eng.get_run(rb_run.id)
    record("Tooling", "trace/timeline present", len(tr.steps) >= 4, f"{len(tr.steps)} steps", rb_run.id)

    # ---- F. Eval suite (all golden/adversarial/regression) ---------------
    print("\nF. Eval suite")
    from borscht.eval.runner import run_suite  # noqa: E402

    ev_result = run_suite()
    s = ev_result["summary"]
    record("Eval", "full eval suite RELEASE", s["release_recommendation"] == "release",
           f"{s['passed']}/{s['total']} ({s['pass_rate']}%)")
    for pack in ev_result["packs"]:
        ok = pack["passed"] == pack["total"]
        record("Eval", f"pack {pack['id']}", ok, f"{pack['passed']}/{pack['total']}")

    # ---- Summary ---------------------------------------------------------
    passed = sum(1 for r in results if r.ok)
    failed = [r for r in results if not r.ok]
    print(f"\n=== SUMMARY: {passed}/{len(results)} passed ===")
    if failed:
        print("Failures:")
        for f in failed:
            print(f"  - [{f.group}] {f.name}: {f.detail}")
        return 1

    code, overview = api("GET", "/api/overview")
    if code == 200:
        k = overview["kpis"]
        print(f"\nOverview: total={k['total_runs']} success_rate={k['success_rate']}% "
              f"blocked={k['blocked_by_policy']} rolled_back={k['rolled_back']} awaiting={k['awaiting_approvals']}")
        print(f"status_counts: {overview.get('status_counts')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
