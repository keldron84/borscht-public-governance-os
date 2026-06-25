# GEMINI.md — Antigravity overrides

**Source of truth is [`AGENTS.md`](AGENTS.md). Read and follow it first.**

This file exists only because Google Antigravity reads `GEMINI.md` and lets it
override `AGENTS.md` on conflict. Keep it minimal — do **not** duplicate the
guide here (that causes drift). Add Antigravity-specific overrides only.

## Antigravity-specific

- Use **system `node`/`npm`** for the UI (`cd apps/ui && npm ci`). Do not rely
  on any editor-bundled Node runtime.
- All build/test/run commands and conventions: see `AGENTS.md`.
- Quality gate before finishing: `python3 -m pytest` and
  `python3 apps/cli/borscht test` must pass.
