# Quickstart

Borscht Public Edition is a small but complete agent governance control plane.
Everything runs locally and file-based — no external services required.

## Requirements

- Python 3.9+ (standard library only — no pip dependencies for the engine)
- Node 18+ (only to build the web UI)

## 1. Initialize

```bash
python3 apps/cli/borscht init
```

This creates `data/` (SQLite + run/evidence/log files), seeds identity and
default settings, and lists available templates and policy packs.

## 2. Run the full loop from the CLI

```bash
# Create a run from an example signal (P1 → approval-gated)
python3 apps/cli/borscht run marketing-review --file examples/marketing-review/signal.json
# -> status: awaiting_approval

# List what's waiting
python3 apps/cli/borscht runs --status awaiting_approval

# Approve it (executes + writes evidence)
python3 apps/cli/borscht approve <run-id>

# Inspect the decision timeline
python3 apps/cli/borscht trace <run-id>

# Roll it back
python3 apps/cli/borscht rollback <run-id> --reason "demo rollback"
```

## 3. See policy in action

```bash
# Low-risk internal → allowed
python3 apps/cli/borscht policy check incident-postmortem --text "Write the outage timeline" --risk P2

# Secrets in an outbound signal → denied (P0, fail-closed)
python3 apps/cli/borscht policy check content-publish --text "Publish our api_key and password"
```

## 4. Run the eval suite

```bash
python3 apps/cli/borscht test
# golden + adversarial + policy-correctness, with a release recommendation
```

## 5. Open the web control plane

```bash
./scripts/serve.sh
# -> http://127.0.0.1:8799/
```

The 10 screens: Overview, New Run, Runs, Run Detail, Approvals, Policies,
Observability, Evaluations, Templates, Settings.

## First-run demo (10–15 minutes)

1. Overview → **Run demo workflow**
2. Choose `marketing-review`, paste a signal
3. See it stop at **awaiting_approval** (policy hit)
4. **Approvals Inbox** → Approve
5. **Run Detail** → Trace + Evidence
6. **Evaluations** → Run eval suite
7. **Run Detail** → Rollback

If you can do all of this, you have a working open edition of Borscht.

## Docker

```bash
docker compose up --build
# -> http://127.0.0.1:8799/
```
