# Example: content-publish

A P1 workflow that drafts and publishes content externally. The outbound
publish action is approval-gated.

```bash
borscht run content-publish --file examples/content-publish/signal.json
borscht approve <run-id>
```

Try the adversarial case — a signal that references secrets is denied (P0):

```bash
borscht policy check content-publish --text "Publish our api_key and database password"
# -> effect: deny
```
