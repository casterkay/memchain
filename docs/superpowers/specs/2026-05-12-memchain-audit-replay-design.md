# MemChain Design Spec

Date: 2026-05-12

## Summary

MemChain is a local CLI tool for AI trading agents.

It takes an agent's entire memories folder, such as `~/.openclaw/memories`, puts it under git version control, stores signed memory snapshots on IPFS, and records each pre-trade memory commit on Monad.

The core promise:

```text
Given a Monad record and a git commit hash, anyone can restore the exact memory state the trading agent had before making a decision.
```

This makes an agent's past thought framework auditable, replayable, and eventually tradable as an on-chain memory asset.

## Product Positioning

AI trading agents will increasingly act as economic actors. They will read market context, use memory, call tools, make trading decisions, and operate capital.

The problem is that their memories are usually mutable local files or centralized database records. After a bad decision, an agent operator can rewrite, delete, or selectively disclose history.

MemChain turns memory into a verifiable timeline:

- Git gives exact local versions and diffs.
- IPFS stores retrievable memory artifacts.
- Monad anchors pre-decision commits in a public ordering.
- The CLI restores historical memory states by commit hash.

The simplest analogy:

```text
MemChain is a black box recorder for AI trading agents.
```

## V1 Scope

V1 is CLI-first and local-first.

It does not build a trading agent. It wraps or integrates with existing trading agents by tracking their memory folders.

Supported examples:

- `~/.openclaw/memories`
- `~/.hermes/memories`
- `~/.claude/memories`
- Any folder containing markdown, JSON, logs, decision traces, strategy notes, or reflections

## Goals

- Initialize git tracking for an agent memory folder.
- Automatically commit the memory folder before each trading decision.
- Upload the commit artifact to IPFS.
- Record the commit hash, IPFS CID, and metadata hash on Monad.
- Restore a historical memory state with `git checkout`.
- Verify that a memory artifact matches the Monad anchor.
- Package selected anchored memory commits as sellable Memory Blocks.

## Non-Goals

- Build a profitable trading strategy.
- Prove LLM output determinism.
- Store raw memory text on-chain.
- Build a full marketplace in v1.
- Guarantee privacy after public IPFS upload.
- Replace agent-native memory formats.

## Core Workflow

```text
1. User points MemChain at an agent memory folder.
2. MemChain initializes or validates a git repo in that folder.
3. Before a trading decision, MemChain creates a pre-decision commit.
4. MemChain packages that commit as a git bundle or snapshot.
5. MemChain uploads the artifact to IPFS.
6. MemChain anchors the commit record on Monad.
7. The trading agent makes its decision.
8. Later, an auditor uses the commit hash to restore the exact pre-decision memory state.
```

The important design choice is that the anchor happens before the decision. The record proves what the agent knew, remembered, and believed at decision time.

## CLI Interface

```bash
memchain init ~/.openclaw/memories --agent openclaw-demo

memchain before-decision \
  --agent openclaw-demo \
  --decision eth-long-001 \
  --summary "Pre-trade memory snapshot before ETH long decision"

memchain verify \
  --agent openclaw-demo \
  --commit <git_commit_hash>

memchain checkout \
  --agent openclaw-demo \
  --commit <git_commit_hash> \
  --out ./replay/openclaw-eth-long-001

memchain diff <commit_a> <commit_b>

memchain block create \
  --agent openclaw-demo \
  --from <commit_a> \
  --to <commit_b> \
  --name "ETH breakout decision memory"
```

V1 can also expose a wrapper mode:

```bash
memchain run --agent openclaw-demo -- openclaw trade ETH
```

In wrapper mode, MemChain records the pre-decision memory commit before handing control to the trading agent.

## Memory Repo Layout

MemChain should keep its own metadata small and isolated.

```text
~/.openclaw/memories/
  .git/
  .memchain/
    agent.json
    decisions/
      eth-long-001.json
    anchors/
      <commit_hash>.json
    blocks/
      <block_id>.json
  strategy.md
  reflections.md
  market-notes/
  tool-traces/
```

Everything outside `.memchain/` belongs to the trading agent.

## Pre-Decision Manifest

Every pre-decision snapshot writes a manifest before committing.

```json
{
  "schema": "memchain.predecision.v1",
  "agent_id": "openclaw-demo",
  "decision_id": "eth-long-001",
  "created_at": "2026-05-12T10:00:00Z",
  "memory_commit": "2e7b8f1c4a9d0e3f6b5c8a1d4e7f9012bcdef345",
  "parent_commit": "9d4f7e1b6c8a2e5f0a1b3c4d5e6f7890abcde123",
  "summary": "Pre-trade memory snapshot before ETH long decision",
  "agent": {
    "name": "openclaw",
    "version": "demo",
    "memory_path": "~/.openclaw/memories"
  },
  "decision_context": {
    "symbols": ["ETH"],
    "mode": "paper",
    "data_source": "mock-binance-ohlcv"
  }
}
```

This manifest describes the memory state before the agent decides. Post-decision results may be committed later, but they are not the main proof.

## IPFS Artifact

The preferred artifact is a git bundle because it preserves commit history:

```bash
git bundle create memchain-openclaw-demo-<commit>.bundle --all
```

The artifact metadata is canonical JSON:

```json
{
  "schema": "memchain.artifact.v1",
  "agent_id": "openclaw-demo",
  "decision_id": "eth-long-001",
  "commit_hash": "2e7b8f1c4a9d0e3f6b5c8a1d4e7f9012bcdef345",
  "parent_commit_hash": "9d4f7e1b6c8a2e5f0a1b3c4d5e6f7890abcde123",
  "artifact_type": "git_bundle",
  "artifact_sha256": "sha256:...",
  "ipfs_cid": "bafy...",
  "manifest_path": ".memchain/decisions/eth-long-001.json",
  "manifest_sha256": "sha256:..."
}
```

`metadataHash` on-chain is the `sha256` hash of this canonical metadata.

## Monad Anchor

The v1 contract should stay compact.

```solidity
struct MemoryAnchor {
    bytes32 agentId;
    bytes32 commitHash;
    bytes32 parentCommitHash;
    bytes32 metadataHash;
    bytes32 artifactHash;
    string ipfsCid;
    uint64 timestamp;
    address recorder;
}
```

Minimal interface:

```solidity
function registerAgent(bytes32 agentId, string calldata metadataURI) external;

function anchorMemory(
    bytes32 agentId,
    bytes32 commitHash,
    bytes32 parentCommitHash,
    bytes32 metadataHash,
    bytes32 artifactHash,
    string calldata ipfsCid
) external;

function latestMemory(bytes32 agentId) external view returns (bytes32);
function getMemory(bytes32 agentId, bytes32 commitHash) external view returns (MemoryAnchor memory);
```

Event:

```solidity
event MemoryAnchored(
    bytes32 indexed agentId,
    bytes32 indexed commitHash,
    bytes32 indexed parentCommitHash,
    bytes32 metadataHash,
    bytes32 artifactHash,
    string ipfsCid,
    address recorder
);
```

The Solidity contract stores `bytes32(keccak256(bytes(gitCommitHash)))`. The original git commit string remains in the IPFS metadata and local anchor file.

## Verification

`memchain verify` proves that a memory artifact matches the Monad record.

It checks:

- The Monad anchor exists for `agent_id + commit_hash`.
- The IPFS CID resolves.
- The artifact hash matches the on-chain `artifactHash`.
- The artifact contains the requested git commit.
- The commit parent matches `parentCommitHash`.
- The metadata hash matches `metadataHash`.
- The manifest hash matches the checked-out manifest file.
- The memory tree can be restored cleanly.

Verification fails if any required hash or parent link does not match.

## Replay / Checkout

`memchain checkout` restores the memory folder at a historical commit.

It should:

```text
1. Read the Monad anchor.
2. Fetch the IPFS artifact.
3. Verify artifact and metadata hashes.
4. Clone or unbundle the git repo.
5. Checkout the requested commit.
6. Export the memory tree to the requested output directory.
7. Print the decision manifest and commit diff.
```

This does not guarantee the same model output. It restores the agent's memory context so a human or another agent can inspect the thought framework that existed before the trade.

## Memory Blocks as Assets

A Memory Block is a selected commit or commit range from an anchored memory timeline.

It can represent:

- A pre-decision memory snapshot.
- A strategy lesson across several decisions.
- A redacted set of reflections.
- A proven history segment from a trading agent.
- A distilled experience package for another agent.

Memory Block manifest:

```json
{
  "schema": "memchain.block.v1",
  "block_id": "eth-breakout-memory",
  "seller_agent_id": "openclaw-demo",
  "source_commits": [
    "commit_a",
    "commit_b"
  ],
  "payload_cid": "bafy...",
  "payload_sha256": "sha256:...",
  "provenance_anchor": "monad_tx_or_event_id",
  "license": "demo-evaluation-only",
  "price": "10 MON"
}
```

V1 only needs a listing proof:

```text
This Memory Block came from anchored commits owned by this agent.
```

Payment, encryption, buyer-specific licensing, and delivery control are later work.

## Security and Privacy

Memory folders may contain secrets or private alpha.

V1 must include:

- `.memchainignore`
- default deny patterns for `.env`, private keys, wallet files, and key stores
- a file summary before IPFS upload
- explicit confirmation before public IPFS upload
- mock IPFS mode for local demos

Important limitation:

```text
Anything uploaded to public IPFS should be treated as public.
```

Private Memory Blocks require encryption and access control, which are outside the v1 core.

## Demo Flow

Use one simple demo agent and one decision.

```bash
memchain init ./demo/openclaw-memories --agent openclaw-demo

memchain before-decision \
  --agent openclaw-demo \
  --decision eth-long-001 \
  --summary "Pre-trade memory snapshot before ETH long decision"

# Simulate the trading agent making a decision after the anchor.

memchain verify --agent openclaw-demo --commit <commit>

memchain checkout \
  --agent openclaw-demo \
  --commit <commit> \
  --out ./replay/eth-long-001

memchain block create \
  --agent openclaw-demo \
  --from <commit> \
  --to <commit> \
  --name "ETH long pre-decision memory"
```

The demo should show:

- the local memory folder before decision
- the git commit
- the IPFS CID
- the Monad anchor
- successful verification
- checkout into a replay folder
- a Memory Block listing derived from that anchored commit

## Implementation Boundary

Suggested modules:

```text
cli/
  init
  before_decision
  verify
  checkout
  diff
  block

core/
  git_repo
  manifest
  artifact
  ipfs
  monad
  verifier
  ignore_rules

contracts/
  MemoryAnchorRegistry.sol

demo/
  openclaw-memories/
```

Keep the system thin. MemChain should compose existing primitives instead of inventing a custom versioning system.

## V1 Build Order

1. Local CLI and memory repo initialization.
2. Pre-decision manifest creation.
3. Git commit before decision.
4. Git bundle artifact.
5. Local/mock IPFS storage.
6. Monad anchor contract.
7. CLI verification.
8. Historical checkout.
9. Tamper failure demo.
10. Memory Block listing demo.

## References

- Local memory lifecycle context: `memory-design.md`
- EIP-8004: https://eips.ethereum.org/EIPS/eip-8004
- Local Monad skill notes: `.agents/skills/monskill/`
