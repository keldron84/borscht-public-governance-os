# AGENTS.md — Borscht Public Edition

Canonical, tool-agnostic guide for AI coding agents and human contributors.
This single file is the source of truth and is read natively by **Cursor**,
**OpenAI Codex**, and **Google Antigravity**. Tool-specific shims
(`.cursor/rules/`, `GEMINI.md`) only point back here — keep them in sync.

## Project overview

Borscht Public Edition is a small but complete agent governance control plane.
The whole product is one loop:

```
Signal → Triage → Decision → Execution → Evidence
```

…wrapped in fail-closed governance (policy + approvals), an audit trail (trace +
evidence), observability, and eval gates. Local-first, no external services.

## Setup

- **Python 3.9+** — engine/CLI/API use the **standard library only** (no pip deps).
- **Node 18+** + **npm** — only to build the web UI.

```bash
# UI deps (reproducible from the committed lockfile)
cd apps/ui && npm ci   # or: npm install
```

## Commands (use these exactly)

```bash
# CLI (no install needed)
python3 apps/cli/borscht init
python3 apps/cli/borscht run <workflow> --file examples/<wf>/signal.json
python3 apps/cli/borscht approve <run-id>
python3 apps/cli/borscht trace <run-id>

# Eval gate (must stay at RELEASE)
python3 apps/cli/borscht test

# Unit tests
python3 -m pytest            # or: PYTHONPATH=packages python3 -m pytest

# Build UI
cd apps/ui && npm run build

# Serve API + built SPA  → http://127.0.0.1:8799/
./scripts/serve.sh
```

> The CLI/API need `packages/` on the path. The launchers (`apps/cli/borscht`,
> `apps/api/server.py`) and `pytest` handle this automatically. If importing
> `borscht` directly, set `PYTHONPATH=packages` or `pip install -e .`.

## Architecture

Full map: [docs/architecture.md](docs/architecture.md). One orchestrator
(`packages/borscht/core/engine.py`) drives the loop for CLI **and** API **and**
UI — route new behavior through it, never duplicate the loop.

| Module (`packages/borscht/…`) | Responsibility |
|---|---|
| `core` | Run/Step/PolicyDecision/Evidence models + the `Engine` |
| `policy` | Declarative fail-closed JSON packs (P0/P1/P2) |
| `identity` · `runs` | Actors/ownership · run state machine |
| `execution` · `evidence` · `trace` | Executors · SQLite+files store · timeline |
| `observe` · `eval` · `memory_lite` · `templates` | Metrics · gates · recall · workflows |

> Python needs a package root, so the spec's `packages/core/` etc. live under
> `packages/borscht/` and import as `borscht.core`, `borscht.policy`, …

## Conventions

- **Backend = Python stdlib only.** Do **not** add runtime pip dependencies to
  the engine. Keep code **Python 3.9 compatible** (`from __future__ import
  annotations`; no `match`; no `X | Y` runtime unions).
- **Single state language:** statuses/verdicts/risk in `core/models.py`. Don't
  invent parallel status strings.
- **Policies are JSON** in `packages/borscht/policy/packs/`; resolution is
  fail-closed: `deny > require_approval > allow`. Simulate before trusting.
- **UI:** React 18 + Vite + TypeScript, strict mode. No new npm deps without
  updating both `package.json` **and** `package-lock.json`.
- New workflow? Add a template JSON whose `actions` match existing policy packs.

## Before changes & quality checks

1. `python3 -m pytest` → all green.
2. `python3 apps/cli/borscht test` → `release` recommendation.
3. If UI changed: `cd apps/ui && npm run build` must succeed.

## Off-limits / safety

- **Never commit secrets.** `data/`, `node_modules/`, `apps/ui/dist/` are
  git-ignored — do not force-add them.
- Do not edit generated output in `apps/ui/dist/`.
- Keep v1 **offline & deterministic**: no hard dependency on Neo4j / graph DB /
  an LLM. Engine network calls only via allowlisted executors.
- Do not push or create remotes unless the maintainer explicitly asks.

## Tool-specific notes

- **Cursor** — repo rules in `.cursor/rules/` (they reference this file).
- **Codex** — `AGENTS.md` is native; Codex caps combined guidance at ~32 KiB,
  so keep this file lean. `AGENTS.override.md` / `.codex/config.toml` are
  optional local overrides.
- **Antigravity** — reads `AGENTS.md` and `GEMINI.md`; **`GEMINI.md` overrides
  this file**, so keep `GEMINI.md` a thin pointer to avoid drift.
