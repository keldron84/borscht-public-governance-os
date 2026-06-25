# Architecture

Borscht Public Edition is a **control plane**, not a chat playground. The core
is one loop, wrapped in fail-closed governance and audit.

```
Signal → Triage → Decision → Execution → Evidence
            │         │           │
         policy    approvals    trace
```

## The loop (packages/borscht/core/engine.py)

Every CLI command and API endpoint goes through one orchestrator (`Engine`), so
behavior is identical across surfaces and always auditable.

1. **Signal** — input received, recorded as the first step.
2. **Triage** — build a task contract, recall similar past runs (memory-lite).
3. **Decision** — evaluate policy; resolve fail-closed: `deny > require_approval > allow`.
   - `deny` → `blocked_by_policy`, verdict `STOP`
   - `require_approval` → `awaiting_approval`, verdict `HOLD`
   - `allow` → execute, verdict `GO`
4. **Execution** — run the template's plan through the constrained executor.
5. **Evidence** — write artifacts (markdown/json) + append the event log.

## Modules (packages/borscht/)

| Module | Responsibility |
|--------|----------------|
| `core` | Run/Step/PolicyDecision/Evidence models + the engine |
| `policy` | Declarative, fail-closed rule packs (P0/P1/P2) |
| `identity` | Actors, roles, ownership |
| `runs` | Explicit state machine (transition table) |
| `execution` | Constrained executors (markdown/json/http/file/handoff; shell off) |
| `evidence` | SQLite metadata + `data/runs/*.json` + `data/evidence/**` + event log |
| `trace` | Decision timeline builder |
| `observe` | Operational metrics (health, not BI) |
| `eval` | Golden / adversarial / policy-correctness gates |
| `memory_lite` | Local recall over past runs (no graph DB) |
| `templates` | Workflow packs (the onboarding engine) |

> Note on layout: the spec lists `packages/core/`, `packages/policy/`, etc.
> Python needs a package root, so these live under `packages/borscht/` and are
> imported as `borscht.core`, `borscht.policy`, …

## Apps

- `apps/api/server.py` — Python stdlib HTTP server: JSON API + serves the built SPA.
- `apps/cli/borscht` — the `borscht` CLI.
- `apps/ui/` — React 18 + Vite + TypeScript control-plane UI (10 screens).

## Storage (all local)

- `data/borscht.sqlite` — run metadata for fast queries.
- `data/runs/<id>.json` — full run document (source of truth).
- `data/evidence/<id>/*` — artifacts.
- `data/logs/events.jsonl` — append-only event log for replay.

## State machine

```
draft → queued → running → {awaiting_approval, blocked_by_policy, succeeded, failed}
awaiting_approval → {running, succeeded, failed, waived}
blocked_by_policy → {awaiting_approval, running, waived, failed}
succeeded/failed/waived → rolled_back
```

## Optional in v1 (deliberately not included)

Neo4j / graph brain, enterprise SSO, multi-tenant billing, complex swarm
orchestration. Public v1 is **complete, not huge**: monetization is built on top
(hosted control plane, team workspaces, premium packs, enterprise auth), not by
removing functionality.
