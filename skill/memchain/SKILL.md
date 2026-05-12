---
name: memchain
description: Create verifiable memory proofs for AI trading agents before trades, rebalances, strategy updates, external commitments, audits, replay, or memory packaging.
compatibility: Requires the memchain CLI, git, network access for Monad anchoring when not using local mode, and a configured agent memory folder.
allowed-tools: Bash(memchain:*) Bash(git:*) Read Write
---

# MemChain

Use MemChain before an economic action when the agent's memory state should be auditable later.

Do not watch files, wrap trading commands, or infer intent from edits. The agent chooses when proof is required.

## Workflow

1. Decide whether the next action needs proof.
2. Write an intent file matching `references/intent-schema.md`.
3. Run `memchain commit --repo <memory_repo> --intent <intent_file> --local` for local proof, or `--anchor` when Monad env vars are configured.
4. Read the receipt.
5. Store the receipt beside the decision or transaction.
6. Continue only after proof succeeds, unless the user explicitly accepts degraded mode.

Fail closed for trades, rebalances, strategy changes, and external financial commitments.

## Audit

Use `memchain verify --receipt <receipt>` to prove the receipt still matches the artifact and manifest.

Use `memchain checkout --receipt <receipt> --out <dir>` to restore the memory tree for replay. Replay restores context; it does not prove deterministic model output.
