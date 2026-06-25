# Borscht Public Edition v1

> 🌐 **Language / Язык:** English (this file) · [Русский](README.ru.md). The web
> UI and CLI auto-detect your language (English / Russian) and you can switch it
> in **Settings** or with `--lang` / `BORSCHT_LANG`.

A small but **complete** agent governance control plane. Not a demo, not a
chat playground — a local-first OS for the loop:

```
Signal → Triage → Decision → Execution → Evidence
```

…with fail-closed governance (policy + approvals), an audit trail (trace +
evidence), observability, and eval gates. No external services, no graph DB,
no enterprise jungle. Just a control plane that works.

## Why

The value of an agent system is in the **governed decision and the evidence
loop**, not in generation. Borscht Public Edition gives you the whole loop you
can run on your own machine: connect a signal, triage it, hit policy, get a
verdict, approve, execute, see the trace, and roll back.

## Quickstart

```bash
# 1. Initialize local data
python3 apps/cli/borscht init

# 2. Run the loop end-to-end
python3 apps/cli/borscht run marketing-review --file examples/marketing-review/signal.json
python3 apps/cli/borscht approve <run-id>
python3 apps/cli/borscht trace  <run-id>

# 3. Eval gates
python3 apps/cli/borscht test

# 4. Web control plane (10 screens)
./scripts/serve.sh   # → http://127.0.0.1:8799/
```

Full walkthrough: [docs/quickstart.md](docs/quickstart.md).

## What's inside

- **Engine** — one orchestrator for CLI + API + UI ([architecture](docs/architecture.md)).
- **Policy** — declarative, fail-closed P0/P1/P2 packs ([policies](docs/policies.md)).
- **Identity** — actors, roles, ownership (every action is attributed).
- **Runs** — explicit state machine.
- **Execution** — constrained-but-real executors (shell off by default).
- **Evidence** — SQLite + JSON/markdown files + append-only event log.
- **Trace** — the decision timeline.
- **Observe** — operational health metrics.
- **Eval** — golden / adversarial / policy-correctness gates with a release verdict.
- **Memory-lite** — recall over past runs (no graph DB).
- **Templates** — workflow packs ([templates](docs/templates.md)).
- **UI** — React 18 + Vite control plane: Overview, New Run, Runs, Run Detail,
  Approvals, Policies, Observability, Evaluations, Templates, Settings.

## CLI

```
borscht init | dev | run | approve | reject | hold | waive | retry
        | rollback | trace | runs | test | export | policy check | import-template
```

## Stack

- Backend: **Python standard library only** (HTTP API, SQLite, JSON/JSONL).
- Frontend: **React 18 + Vite + TypeScript**.
- Packaging: local CLI + `./scripts/serve.sh` + Docker Compose.

## Languages (i18n)

The control plane is usable by non-English speakers out of the box — **English**
and **Russian** ship in v1.

- **Web UI** auto-detects the browser language; switch any time via the selector
  in the top bar or **Settings → Interface & content language**. The choice is
  stored locally and synced to the backend.
- **CLI**: `borscht --lang ru run …` or `export BORSCHT_LANG=ru`. Resolution
  order is `--lang` / `BORSCHT_LANG` → `language` setting → `en`.
- **Generated content** (artifact bodies, trace step text, explanations) is
  written in the active language; policy reasons are localized at display time.
- **Docs**: Russian translations live in [`docs/ru/`](docs/ru/) and
  [`README.ru.md`](README.ru.md).

Adding a language means adding one dictionary in `apps/ui/src/i18n.tsx` (UI) and
`packages/borscht/i18n.py` (backend) — no new dependencies.

## Works with any agent tool

Contributors can use **Cursor**, **OpenAI Codex**, or **Google Antigravity** —
the project ships a single, tool-agnostic guide in [`AGENTS.md`](AGENTS.md)
(read natively by all three) plus thin shims that point back to it:
[`GEMINI.md`](GEMINI.md) for Antigravity and `.cursor/rules/` for Cursor. Build,
test, and run commands use standard `python3` / `npm`, so nothing is locked to a
particular editor.

## Layout

```
apps/      ui (React)  ·  api (stdlib server)  ·  cli (borscht)
packages/borscht/  core policy identity runs execution evidence
                   trace observe eval memory_lite templates
examples/  marketing-review · spend-approval · content-publish
data/      runs · evidence · logs  (created at runtime, git-ignored)
docs/      quickstart · architecture · policies · templates · specs/
```

## Readiness criteria (v1)

A new user can, locally and without a call: create a run, understand why it was
allowed/blocked, pass an approval, see the trace, get evidence, roll back, check
system health, and run the eval suite. All of the above works in this build.

## License

MIT — see [LICENSE](LICENSE).
