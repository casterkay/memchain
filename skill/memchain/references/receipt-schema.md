# Receipt Schema

```json
{
  "schema": "memchain.receipt.v1",
  "agent_id": "openclaw-demo",
  "decision_id": "eth-long-001",
  "commit_hash": "git commit hash",
  "parent_commit_hash": "previous git commit hash or null",
  "ipfs_cid": "local:sha256...",
  "artifact_sha256": "sha256:...",
  "metadata_sha256": "sha256:...",
  "manifest_sha256": "sha256:...",
  "intent_sha256": "sha256:...",
  "monad_tx": "transaction hash or null",
  "registry": "registry address or null",
  "created_at": "ISO timestamp"
}
```

The receipt is the handoff back to the agent. Store it with the decision log before continuing.
