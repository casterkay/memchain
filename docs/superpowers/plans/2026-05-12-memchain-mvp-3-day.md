# MemChain MVP 3-Day Fast Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Ship a demoable MemChain MVP that proves one trading agent memory snapshot can be committed, stored, anchored, verified, and checked out for replay.

**Architecture:** Keep MemChain as an agent skill plus a thin CLI. The agent explicitly calls `memchain commit`; the CLI owns git, manifests, artifact packaging, local/mock IPFS, Monad anchoring, receipts, verification, and checkout.

**Tech Stack:** Node.js + TypeScript CLI, `commander`, `zod`, `execa`, `viem`, Foundry Solidity contract, local filesystem IPFS mock for the demo.

---

## MVP Cut

Build only the audit/replay loop:

- `memchain init`
- `memchain commit --intent <file>`
- `memchain verify --receipt <file>`
- `memchain checkout --receipt <file> --out <dir>`
- agent skill package
- compact `MemoryAnchorRegistry` contract
- local/demo IPFS adapter
- demo memory repo and tamper-failure demo

Defer dashboard, marketplace payment, encryption, ERC-8004 integration, live IPFS pinning, indexer, slash logic, and memory block sales.

## Day 1: Local Proof Spine

**Outcome:** A local memory repo can be initialized, given an intent, committed, bundled, and produce a local receipt without chain dependency.

- [ ] Scaffold a minimal TypeScript CLI: `package.json`, `tsconfig.json`, `src/cli.ts`, `src/commands/*`.
- [ ] Add `init`:
  - creates `.memchain/agent.json`
  - creates `.memchain/decisions`, `.memchain/receipts`, `.memchain/anchors`, `.memchain/artifacts`
  - initializes git if missing
  - writes `.memchainignore` with deny patterns for env files, keys, wallets, browser profiles, and account exports
- [ ] Add schemas with `zod`:
  - `intent`
  - `manifest`
  - `artifact`
  - `receipt`
- [ ] Add git service:
  - detect clean/dirty state
  - write manifest before commit
  - commit all non-ignored memory changes
  - create a git bundle for the commit
- [ ] Add local IPFS adapter:
  - copy artifact metadata and bundle into `.memchain/artifacts/<sha256>/`
  - return a deterministic demo CID such as `local:<sha256>`
- [ ] Add `commit --intent` local mode:
  - validates intent
  - writes `.memchain/decisions/<decision_id>.json`
  - creates git commit
  - bundles artifact
  - writes `.memchain/receipts/<decision_id>.json`
- [ ] Add focused tests for schema validation, init layout, commit receipt, and redaction deny patterns.
- [ ] End-of-day demo:

```bash
npm test
npm run build
node dist/cli.js init ./demo/openclaw-memories --agent openclaw-demo
node dist/cli.js commit --repo ./demo/openclaw-memories --intent ./demo/trade-intent.json --local
```

## Day 2: Monad Anchor and Receipt Integrity

**Outcome:** The same commit path anchors to a compact Monad-compatible registry and receipts carry enough data for verification.

- [ ] Add `contracts/MemoryAnchorRegistry.sol`:
  - `registerAgent(bytes32 agentId, string metadataURI)`
  - `anchorMemory(bytes32 agentId, bytes32 commitHash, bytes32 parentCommitHash, bytes32 metadataHash, bytes32 artifactHash, string ipfsCid)`
  - `latestMemory(bytes32 agentId)`
  - `getMemory(bytes32 agentId, bytes32 commitHash)`
  - `MemoryAnchored` event
- [ ] Add Foundry tests:
  - register agent
  - anchor first memory
  - anchor child memory
  - reject duplicate anchor
  - latest memory updates
- [ ] Add CLI Monad adapter with `viem`:
  - env: `MEMCHAIN_RPC_URL`, `MEMCHAIN_PRIVATE_KEY`, `MEMCHAIN_REGISTRY_ADDRESS`
  - hash git commit strings as `bytes32(keccak256(bytes(commitHash)))`
  - set tight explicit gas limits; Monad charges by gas limit, not gas used
- [ ] Keep `--local` as the default demo path until RPC env is configured.
- [ ] Add `commit --anchor`:
  - performs the Day 1 local proof
  - sends `anchorMemory`
  - stores `monad_tx`, `registry`, and anchor hashes in the receipt
- [ ] Add receipt integrity checks:
  - `intent_sha256`
  - `manifest_sha256`
  - `metadata_sha256`
  - `artifact_sha256`
  - git `commit_hash`
  - `parent_commit_hash`
- [ ] End-of-day demo:

```bash
npm test
forge test
node dist/cli.js commit --repo ./demo/openclaw-memories --intent ./demo/trade-intent.json --local
```

Optional if funded testnet env is ready:

```bash
node dist/cli.js commit --repo ./demo/openclaw-memories --intent ./demo/trade-intent.json --anchor
```

## Day 3: Verify, Checkout, Skill, Demo

**Outcome:** A judge or developer can run one script and see proof creation, verification, replay checkout, and tamper failure.

- [ ] Add `verify --receipt`:
  - loads receipt
  - resolves local CID
  - checks artifact hash
  - checks metadata hash
  - checks bundle contains commit
  - checks manifest hash
  - checks parent commit
  - checks Monad anchor when receipt has `monad_tx` and registry config
  - fails closed on mismatch
- [ ] Add `checkout --receipt --out`:
  - verifies receipt first
  - unbundles or clones artifact
  - checks out receipt commit
  - exports memory tree to output directory
  - prints manifest path and commit diff summary
- [ ] Add the MemChain agent skill package:
  - `skill/memchain/SKILL.md`
  - `skill/memchain/references/intent-schema.md`
  - `skill/memchain/references/receipt-schema.md`
  - `skill/memchain/references/verification.md`
  - keep `SKILL.md` short; move schemas to references
- [ ] Add demo assets:
  - `demo/openclaw-memories/strategy.md`
  - `demo/openclaw-memories/reflections.md`
  - `demo/trade-intent.json`
  - `demo/run-demo.sh`
  - `demo/tamper-demo.sh`
- [ ] Add README quickstart:
  - install
  - init
  - commit
  - verify
  - checkout
  - local mode vs Monad mode
- [ ] End-of-day acceptance run:

```bash
npm test
npm run build
forge test
bash demo/run-demo.sh
bash demo/tamper-demo.sh
```

## Acceptance Criteria

- A fresh clone can run the local demo without external services.
- `memchain commit` produces a git commit, artifact, local CID, manifest, and receipt.
- `memchain verify` passes for an untouched receipt and fails after artifact or manifest tampering.
- `memchain checkout` restores the exact memory tree for the proven commit.
- The contract tests prove the anchor registry behavior.
- Monad anchoring is usable when RPC, key, and registry env vars are present.
- The agent skill clearly instructs agents to prove memory before economic actions and fail closed when proof fails.

## Risk Controls

- Treat public IPFS as public; local/mock IPFS is the default MVP demo path.
- Do not implement background watchers or trading wrappers.
- Do not infer intent from file writes; require explicit intent files.
- Do not store private keys in the repo or receipts.
- Keep chain storage compact: hashes, CID, timestamp, recorder.
- Use explicit gas limits on Monad transactions because users pay by gas limit.

