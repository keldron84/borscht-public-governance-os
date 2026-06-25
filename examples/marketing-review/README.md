# Example: marketing-review

A P1 workflow that reviews a marketing asset and then publishes it externally.
External publish is approval-gated, so this run will stop at
`awaiting_approval` until a human approves it.

```bash
borscht run marketing-review --file examples/marketing-review/signal.json
# -> status: awaiting_approval
borscht approve <run-id>
# -> status: succeeded, evidence written
borscht trace <run-id>
```
