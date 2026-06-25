# Templates

A template declares a workflow: its default risk, the **actions** it intends to
take (used by the policy engine), required tool scopes, and an execution plan.

## Shipped templates

| Template | Risk | Approval | Actions |
|----------|------|----------|---------|
| `marketing-review` | P1 | yes | analysis, content_publish |
| `spend-approval` | P1 | yes | analysis, spend_increase |
| `content-publish` | P1 | yes | draft, external_publish |
| `client-change-request` | P1 | yes | analysis, data_mutation |
| `incident-postmortem` | P2 | no | analysis, summary |
| `blank` | P2 | no | analysis |

## Template format

```json
{
  "id": "marketing-review",
  "name": "Marketing review",
  "description": "...",
  "risk_class": "P1",
  "actions": ["analysis", "content_publish"],
  "tool_scopes": ["markdown_export"],
  "tags": ["marketing", "publish"],
  "requires_approval_hint": true,
  "signal_fields": ["text", "url"],
  "execution_plan": [
    { "action": "analysis", "title": "Marketing review notes" },
    { "action": "content_publish", "title": "Publish reviewed asset" }
  ]
}
```

## Installing your own

```bash
borscht import-template path/to/template.json
```

User templates persist to `data/installed_templates.json`. The `actions` field is
what couples a template to governance — pick action names that your policy packs
recognize so the right gates fire.
