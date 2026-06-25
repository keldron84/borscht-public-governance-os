# Policies

Policies are declarative JSON packs. They are **fail-closed**: if rules conflict,
the strongest effect wins (`deny > require_approval > allow`).

## Shipped packs

| Pack | Severity | Effect | Triggers on |
|------|----------|--------|-------------|
| `secret-safety` | P0 | deny | signal mentions secrets/credentials; destructive tools |
| `external-publish` | P1 | require_approval | `external_publish`, `outbound_message`, `content_publish` |
| `spend-controls` | P1 | require_approval | `spend_increase`, `campaign_launch`, `budget_change` |
| `data-access` | P1 | require_approval | data mutations; any P0/P1 run |
| `tool-scopes` | P2 | allow | low-risk internal analysis/draft/summary |

## Rule format

```json
{
  "id": "external-publish",
  "title": "External publish",
  "description": "...",
  "active": true,
  "rules": [
    {
      "id": "p1-external-publish",
      "severity": "P1",
      "scope": "action",
      "effect": "require_approval",
      "reason": "Action publishes/sends externally; human approval required.",
      "match": { "action_in": ["external_publish", "outbound_message"] }
    }
  ]
}
```

## Match conditions (AND of all present keys)

- `always: true`
- `risk_class_in: ["P0","P1"]`
- `workflow_in: ["marketing-review"]`
- `action_in: ["external_publish"]`
- `tool_in: ["shell.destructive"]`
- `tag_in: ["client"]`
- `signal_contains_any: ["api_key","password"]`

## Editing

- Toggle a pack on/off in the **Policies** screen (persists to
  `data/policies.local.json`; shipped packs are never mutated).
- Add a new pack: drop a JSON file in `packages/borscht/policy/packs/`.
- **Simulate** before you trust it: Policies → Simulation, or
  `borscht policy check <workflow> --text "..."`.
