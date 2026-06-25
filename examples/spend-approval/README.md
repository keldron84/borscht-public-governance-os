# Example: spend-approval

A P1 workflow requesting a spend/budget increase. Requires human approval
before the (simulated) budget change is applied.

```bash
borscht run spend-approval --file examples/spend-approval/signal.json
borscht approve <run-id>
```
