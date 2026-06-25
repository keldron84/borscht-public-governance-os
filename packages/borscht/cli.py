"""Borscht Public Edition CLI.

Commands: init, dev, run, approve, hold, rollback, retry, waive, trace, test,
export, policy check, import-template, runs, serve.
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any, Dict, Optional

from borscht import config
from borscht.core.engine import Engine, EngineError
from borscht.eval.runner import run_suite
from borscht.trace.timeline import build_timeline


def _print(obj: Any) -> None:
    print(json.dumps(obj, indent=2, ensure_ascii=False))


def _load_signal(args) -> Dict[str, Any]:
    if getattr(args, "file", None):
        data = json.loads(open(args.file, "r", encoding="utf-8").read())
        return data
    signal: Dict[str, Any] = {}
    if getattr(args, "text", None):
        signal["text"] = args.text
    if getattr(args, "data", None):
        signal.update(json.loads(args.data))
    return {"signal": signal}


# ---- command handlers ----------------------------------------------------
def cmd_init(args) -> int:
    eng = Engine()  # creates data dir, db, identity, default settings
    config.load_settings()
    config.save_settings(config.load_settings())
    print("Initialized Borscht data at: {0}".format(config.data_dir()))
    print("Templates available: {0}".format(", ".join(t.id for t in eng.templates.list())))
    print("Policy packs: {0}".format(", ".join(p.id for p in eng.policy.packs())))
    return 0


def cmd_dev(args) -> int:
    from borscht.api import serve
    serve(host=args.host, port=args.port)
    return 0


def cmd_serve(args) -> int:
    return cmd_dev(args)


def cmd_run(args) -> int:
    eng = Engine()
    payload = _load_signal(args)
    workflow = args.workflow or payload.get("workflow")
    if not workflow:
        print("error: workflow required", file=sys.stderr)
        return 2
    try:
        run = eng.create_run(
            workflow=workflow,
            signal=payload.get("signal", {}),
            owner=args.owner or payload.get("owner", "user:operator"),
            risk_class=args.risk or payload.get("risk_class"),
            title=args.title or "",
        )
    except EngineError as exc:
        print("error: {0}".format(exc), file=sys.stderr)
        return 1
    print("run: {0}".format(run.id))
    print("status: {0}  verdict: {1}".format(run.status, run.verdict))
    print("explanation: {0}".format(run.explanation))
    return 0


def cmd_approve(args) -> int:
    eng = Engine()
    try:
        run = eng.approve(args.run_id, approver=args.actor)
    except EngineError as exc:
        print("error: {0}".format(exc), file=sys.stderr)
        return 1
    print("status: {0}  verdict: {1}".format(run.status, run.verdict))
    return 0


def cmd_reject(args) -> int:
    eng = Engine()
    try:
        run = eng.reject(args.run_id, approver=args.actor, reason=args.reason or "")
    except EngineError as exc:
        print("error: {0}".format(exc), file=sys.stderr)
        return 1
    print("status: {0}".format(run.status))
    return 0


def cmd_hold(args) -> int:
    eng = Engine()
    try:
        run = eng.hold(args.run_id, actor=args.actor)
    except EngineError as exc:
        print("error: {0}".format(exc), file=sys.stderr)
        return 1
    print("status: {0}".format(run.status))
    return 0


def cmd_waive(args) -> int:
    eng = Engine()
    try:
        run = eng.waive(args.run_id, actor=args.actor, reason=args.reason or "")
    except EngineError as exc:
        print("error: {0}".format(exc), file=sys.stderr)
        return 1
    print("status: {0}  verdict: {1}".format(run.status, run.verdict))
    return 0


def cmd_rollback(args) -> int:
    eng = Engine()
    try:
        run = eng.rollback(args.run_id, actor=args.actor, reason=args.reason or "")
    except EngineError as exc:
        print("error: {0}".format(exc), file=sys.stderr)
        return 1
    print("status: {0}".format(run.status))
    return 0


def cmd_retry(args) -> int:
    eng = Engine()
    try:
        run = eng.retry(args.run_id, actor=args.actor)
    except EngineError as exc:
        print("error: {0}".format(exc), file=sys.stderr)
        return 1
    print("status: {0}".format(run.status))
    return 0


def cmd_trace(args) -> int:
    eng = Engine()
    run = eng.get_run(args.run_id)
    if run is None:
        print("error: run not found", file=sys.stderr)
        return 1
    if args.json:
        _print({"run": run.to_dict(), "timeline": build_timeline(run)})
        return 0
    print("Run {0} [{1}] verdict={2}".format(run.id, run.status, run.verdict))
    print("Workflow: {0}  Owner: {1}  Risk: {2}".format(run.workflow, run.owner, run.risk_class))
    print("-" * 60)
    for ev in build_timeline(run):
        print("{0:>2}. {1:<10} {2:<16} {3:<8} {4}".format(
            ev["index"], ev["name"], ev["actor"], ev["outcome"], ev["detail"]))
    if run.policy_decisions:
        print("-" * 60)
        print("Policy:")
        for d in run.policy_decisions:
            print("  [{0}] {1} {2} -> {3}: {4}".format(
                d.severity, d.pack, d.rule_id, d.effect, d.reason))
    return 0


def cmd_runs(args) -> int:
    eng = Engine()
    runs = eng.list_runs(status=args.status, owner=args.owner, workflow=args.workflow)
    if args.json:
        _print([r.to_dict() for r in runs])
        return 0
    for r in runs:
        print("{0}  {1:<18} {2:<18} {3:<6} {4}".format(
            r.id, r.status, r.workflow, r.risk_class, r.title))
    if not runs:
        print("(no runs)")
    return 0


def cmd_test(args) -> int:
    result = run_suite()
    if args.json:
        _print(result)
    else:
        s = result["summary"]
        print("Eval: {0}/{1} passed ({2}%)  blocking_failures={3}  -> {4}".format(
            s["passed"], s["total"], s["pass_rate"], s["blocking_failures"],
            s["release_recommendation"].upper()))
        for p in result["packs"]:
            print("  [{0}] {1}: {2}/{3}".format(
                p["type"], p["title"], p["passed"], p["total"]))
            for c in p["cases"]:
                if not c["ok"]:
                    print("    FAIL {0}: expected {1}, got {2}".format(
                        c["id"], c["expected"], c["actual"]))
    return 0 if result["summary"]["release_recommendation"] == "release" else 1


def cmd_export(args) -> int:
    eng = Engine()
    run = eng.get_run(args.run_id)
    if run is None:
        print("error: run not found", file=sys.stderr)
        return 1
    bundle = {
        "run": run.to_dict(),
        "timeline": build_timeline(run),
        "evidence": [
            {**e.to_dict(), "content": eng.store.read_artifact(e.path)}
            for e in run.evidence
        ],
    }
    out = args.out or "{0}-export.json".format(run.id)
    open(out, "w", encoding="utf-8").write(json.dumps(bundle, indent=2, ensure_ascii=False))
    print("exported: {0}".format(out))
    return 0


def cmd_policy(args) -> int:
    eng = Engine()
    if args.policy_cmd == "check":
        payload = _load_signal(args)
        signal = payload.get("signal", {})
        result = eng.simulate_policy(args.workflow, signal, risk_class=args.risk)
        if args.json:
            _print(result)
        else:
            print("effect: {0}".format(result["effect"]))
            for d in result["decisions"]:
                print("  [{0}] {1} {2} -> {3}: {4}".format(
                    d["severity"], d["pack"], d["rule_id"], d["effect"], d["reason"]))
        return 0
    if args.policy_cmd == "list":
        for p in eng.policy.packs():
            print("{0:<18} active={1}  rules={2}".format(p.id, p.active, len(p.rules)))
        return 0
    print("error: unknown policy command", file=sys.stderr)
    return 2


def cmd_import_template(args) -> int:
    eng = Engine()
    data = json.loads(open(args.file, "r", encoding="utf-8").read())
    tpl = eng.templates.install_from_dict(data)
    print("installed template: {0}".format(tpl.id))
    return 0


# ---- parser --------------------------------------------------------------
def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="borscht", description="Borscht Public Edition control plane")
    sub = p.add_subparsers(dest="cmd")

    sp = sub.add_parser("init", help="initialize local data + defaults")
    sp.set_defaults(func=cmd_init)

    for name in ("dev", "serve"):
        sp = sub.add_parser(name, help="serve API + UI")
        sp.add_argument("--host", default="127.0.0.1")
        sp.add_argument("--port", type=int, default=8799)
        sp.set_defaults(func=cmd_dev if name == "dev" else cmd_serve)

    sp = sub.add_parser("run", help="create and start a run")
    sp.add_argument("workflow", nargs="?")
    sp.add_argument("--file")
    sp.add_argument("--text")
    sp.add_argument("--data", help="extra signal fields as a JSON object")
    sp.add_argument("--owner")
    sp.add_argument("--risk", choices=["P0", "P1", "P2"])
    sp.add_argument("--title")
    sp.set_defaults(func=cmd_run)

    for name, fn, extra in (
        ("approve", cmd_approve, []),
        ("hold", cmd_hold, []),
        ("retry", cmd_retry, []),
        ("reject", cmd_reject, ["reason"]),
        ("waive", cmd_waive, ["reason"]),
        ("rollback", cmd_rollback, ["reason"]),
    ):
        sp = sub.add_parser(name, help="{0} a run".format(name))
        sp.add_argument("run_id")
        sp.add_argument("--actor", default="user:operator")
        if "reason" in extra:
            sp.add_argument("--reason")
        sp.set_defaults(func=fn)

    sp = sub.add_parser("trace", help="show run trace/timeline")
    sp.add_argument("run_id")
    sp.add_argument("--json", action="store_true")
    sp.set_defaults(func=cmd_trace)

    sp = sub.add_parser("runs", help="list runs")
    sp.add_argument("--status")
    sp.add_argument("--owner")
    sp.add_argument("--workflow")
    sp.add_argument("--json", action="store_true")
    sp.set_defaults(func=cmd_runs)

    sp = sub.add_parser("test", help="run eval suite")
    sp.add_argument("--json", action="store_true")
    sp.set_defaults(func=cmd_test)

    sp = sub.add_parser("export", help="export a run bundle")
    sp.add_argument("run_id")
    sp.add_argument("--out")
    sp.set_defaults(func=cmd_export)

    sp = sub.add_parser("policy", help="policy operations")
    psub = sp.add_subparsers(dest="policy_cmd")
    pc = psub.add_parser("check", help="simulate policy for an input")
    pc.add_argument("workflow")
    pc.add_argument("--file")
    pc.add_argument("--text")
    pc.add_argument("--data", help="extra signal fields as a JSON object")
    pc.add_argument("--risk", choices=["P0", "P1", "P2"])
    pc.add_argument("--json", action="store_true", help="emit JSON output")
    pc.set_defaults(func=cmd_policy)
    pl = psub.add_parser("list", help="list policy packs")
    pl.set_defaults(func=cmd_policy)

    sp = sub.add_parser("import-template", help="install a workflow template from JSON")
    sp.add_argument("file")
    sp.set_defaults(func=cmd_import_template)

    return p


def main(argv: Optional[list] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if not getattr(args, "func", None):
        parser.print_help()
        return 0
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
