"""Smoke tests for the Borscht Public Edition engine.

Run with: PYTHONPATH=packages python3 -m pytest  (or: python3 -m pytest)
Uses a temp data dir so it never touches your real ``data/``.
"""

import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "packages"))


def _fresh_engine():
    tmp = tempfile.mkdtemp(prefix="borscht-test-")
    os.environ["BORSCHT_DATA_DIR"] = tmp
    # import after env is set so config picks up the temp dir
    import importlib
    import borscht.config as cfg
    importlib.reload(cfg)
    from borscht.core.engine import Engine
    return Engine()


def test_low_risk_allows_and_succeeds():
    eng = _fresh_engine()
    run = eng.create_run("incident-postmortem", {"text": "internal outage writeup"}, risk_class="P2")
    assert run.status == "succeeded"
    assert run.verdict == "GO"
    assert len(run.evidence) >= 1


def test_external_publish_requires_approval():
    eng = _fresh_engine()
    run = eng.create_run("content-publish", {"text": "publish the newsletter"})
    assert run.status == "awaiting_approval"
    approved = eng.approve(run.id)
    assert approved.status == "succeeded"


def test_secrets_are_denied_fail_closed():
    eng = _fresh_engine()
    run = eng.create_run("content-publish", {"text": "publish our api_key and password"})
    assert run.status == "blocked_by_policy"
    assert run.verdict == "STOP"


def test_eval_suite_releases():
    _fresh_engine()
    from borscht.eval.runner import run_suite
    result = run_suite()
    assert result["summary"]["release_recommendation"] == "release"


def test_rollback_after_success():
    eng = _fresh_engine()
    run = eng.create_run("incident-postmortem", {"text": "writeup"}, risk_class="P2")
    rolled = eng.rollback(run.id, reason="test")
    assert rolled.status == "rolled_back"
