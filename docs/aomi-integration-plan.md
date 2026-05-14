# Aomi Integration Plan

Date: 2026-05-14

## Goal

Integrate Aomi as an agent-facing client for MemChain proofs without moving proof logic out of MemChain.

MemChain remains the source of truth for:

- memory repo initialization
- intent validation
- git commit and bundle creation
- redaction checks
- IPFS artifact storage
- Monad anchoring
- receipt verification
- historical checkout

Aomi provides a typed tool surface an agent can call before economically meaningful actions.

## Product Boundary

The integration is an adapter, not a rewrite.

```text
Aomi agent tools
  -> memchain CLI JSON contract
  -> MemChain core
  -> Git bundle + IPFS artifact + Monad anchor
  -> receipt
```

Do not duplicate MemChain proof logic in Rust. The Aomi app shells out to the `memchain` CLI, parses stable JSON, and returns concise tool results.

Do not let Aomi become the trading agent, wallet manager, or memory runtime. The agent decides when proof is needed. MemChain performs the proof. Aomi makes that handoff clean.

## Canonical Workflow

1. Agent decides the next action needs a memory proof.
2. Agent calls Aomi's MemChain tool to prepare or validate an intent.
3. Agent calls the commit tool.
4. MemChain validates redaction policy, commits memory, packages the artifact, stores it, and optionally anchors on Monad.
5. Aomi returns the receipt path and proof summary.
6. Agent stores the receipt with the decision or transaction log.
7. Agent proceeds only after proof succeeds, unless the user explicitly approves degraded mode.

## V1 Tool Surface

Keep the first Aomi app small.

### `prepare_memory_intent`

Purpose: create or validate a `memchain.intent.v1` file for the planned action.

Inputs:

- `repo_path`
- `intent_path`
- `agent_id`
- `decision_id`
- `action`
- `summary`
- `symbols`
- `mode`
- `strategy_version`
- `external_reference`

Output:

- `intent_path`
- `agent_id`
- `decision_id`
- `action`
- `ready_for_commit`

This tool writes intent only. It does not commit, upload, or anchor.

### `commit_memory_proof`

Purpose: call `memchain commit` and return the receipt.

Inputs:

- `repo_path`
- `intent_path`
- `storage_mode`: `local` or `remote`
- `anchor`: boolean
- `confirmed`: boolean

Rules:

- `anchor=true` requires `confirmed=true`.
- If anchoring is requested, MemChain env vars must already be configured.
- The tool must not ask for or store private keys.
- The tool must fail closed when the CLI exits nonzero.

Output:

- `receipt_path`
- `commit_hash`
- `ipfs_cid`
- `artifact_sha256`
- `metadata_sha256`
- `monad_tx`
- `registry`
- `next_step_hint`

### `verify_memory_receipt`

Purpose: call `memchain verify --receipt`.

Inputs:

- `receipt_path`

Output:

- `ok`
- `commit_hash`
- `receipt_path`

The tool reports verification failure as a structured error. It must not soften a failed proof into a warning for trading actions.

### `checkout_memory_state`

Purpose: call `memchain checkout --receipt --out` for audit and replay.

Inputs:

- `receipt_path`
- `out_path`

Output:

- `out_path`
- `commit_hash`
- `ready_for_replay`

Checkout restores memory state. It does not claim deterministic model replay.

## Deferred Tool

### `create_memory_block`

Add this after proof, verify, and checkout are stable through Aomi.

Purpose: package an anchored commit or commit range as a Memory Block.

V1 proof:

```text
This Memory Block came from anchored commits owned by this agent.
```

Payment, licensing, buyer-specific encryption, and delivery control stay outside the first Aomi integration.

## File Layout

Add the Aomi app under an integration boundary:

```text
integrations/
  aomi/
    memchain/
      Cargo.toml
      README.md
      src/
        lib.rs
        client.rs
        tool.rs
      tests/
        cli_contract.rs
```

Responsibilities:

- `lib.rs`: manifest, preamble, tool registration
- `client.rs`: CLI invocation, JSON parsing, error normalization
- `tool.rs`: Aomi tool args, descriptions, and result shaping
- `tests/cli_contract.rs`: tool-level checks using a fake or fixture CLI response
- `README.md`: local build and smoke-test instructions

Do not move existing TypeScript files to support Aomi. Keep the current core in:

- `src/cli.ts`
- `src/core/commit.ts`
- `src/core/verify.ts`
- `src/core/checkout.ts`
- `src/core/schemas.ts`
- `src/core/monad.ts`

## CLI Contract Work

Aomi needs stable machine-readable CLI behavior.

Add or preserve these guarantees:

- Successful commands print one JSON object to stdout.
- Failed commands print one JSON error object when `--json` is supplied.
- Nonzero exits remain nonzero.
- Error objects include:

```json
{
  "ok": false,
  "error": {
    "code": "redaction_failed",
    "message": "redaction check failed: .env",
    "retryable": false
  }
}
```

Suggested error codes:

- `invalid_args`
- `intent_invalid`
- `redaction_failed`
- `git_failed`
- `storage_failed`
- `anchor_failed`
- `receipt_invalid`
- `verify_failed`
- `checkout_failed`
- `env_missing`

Keep CLI error codes small and stable. Avoid exposing stack traces or secrets through Aomi.

## Storage Boundary

Local/mock storage remains the first smoke path.

Remote storage should extend the existing receipt model rather than replacing it:

- upload encrypted artifacts to public IPFS through Pinata
- use an environment key such as `MEMCHAIN_ENCRYPTION_KEY`
- keep `ipfs_cid`, `artifact_sha256`, `metadata_sha256`, `manifest_sha256`, and `intent_sha256`
- verify remote proofs by fetching, decrypting, and hash-checking before bundle verification

Aomi must not upload memory directly. It calls MemChain and reports the resulting receipt.

## Monad Boundary

MemChain owns Monad anchoring.

Aomi may request anchoring only through `memchain commit --anchor` after explicit confirmation. The Aomi app should not manage private keys, Safe signing, or registry deployment in v1.

Production Monad operations should continue to use the existing Safe-oriented workflow. Direct private-key use remains a local or test-only path when the user knowingly configures it.

Monad-specific rule: keep explicit gas limits in MemChain's transaction path because Monad charges by gas limit.

## Agent Preamble Requirements

The Aomi app preamble must say:

- You are a MemChain proof client, not the trading agent.
- Use MemChain before trades, rebalances, strategy updates, external financial commitments, and memory-block packaging.
- Prepare intent before committing memory.
- Do not proceed with economic action after proof failure unless the user explicitly accepts degraded mode.
- Require explicit confirmation before Monad anchoring.
- Treat public IPFS as public; rely on MemChain encryption/redaction policy for remote storage.
- Store the receipt beside the decision or transaction log.
- Verification and checkout prove memory state, not deterministic model output.

## Implementation Phases

### Phase 1: Documentation Alignment

- Add this plan.
- Update `docs/pitch.md` so it no longer implies background monitoring or automatic trading hooks.
- Make the canonical wording: the agent explicitly calls MemChain before economic action.

Verification:

```bash
rg -n "monitor|自动|watch|hook|wrap|bypass" docs README.md skill
```

Expected result: any remaining automatic wording is either removed or clearly marked as non-v1.

### Phase 2: Stable CLI JSON Contract

- Add `--json` error output to `src/cli.ts`.
- Keep current success output shape unchanged.
- Add focused tests for structured errors.

Verification:

```bash
npm test
npm run typecheck
npm run build
```

Expected result: tests pass and `dist/cli.js` still supports the current demo commands.

### Phase 3: Aomi Adapter Scaffold

- Create `integrations/aomi/memchain`.
- Register four tools: `prepare_memory_intent`, `commit_memory_proof`, `verify_memory_receipt`, `checkout_memory_state`.
- Shell out to the built `memchain` CLI.
- Normalize CLI output into stable Aomi JSON.

Verification:

```bash
cargo build --manifest-path integrations/aomi/memchain/Cargo.toml
cargo test --manifest-path integrations/aomi/memchain/Cargo.toml
```

Expected result: the adapter builds and tool tests pass with fixture CLI responses.

### Phase 4: Local End-to-End Smoke

- Run the current MemChain demo path.
- Run the Aomi commit tool against a local demo repo.
- Verify the receipt.
- Checkout the memory state.

Verification:

```bash
npm run build
bash demo/run-demo.sh
```

Expected result: the Aomi path produces a receipt that `memchain verify` accepts and `memchain checkout` can replay.

### Phase 5: Encrypted Pinata Storage

- Add encrypted public IPFS storage to MemChain core.
- Keep local/mock mode as default.
- Add remote verify and checkout checks that fetch, decrypt, hash-check, and then verify the bundle.
- Let Aomi select remote storage only through MemChain CLI flags.

Verification:

```bash
npm test
npm run typecheck
npm run build
```

Expected result: local tests remain green; remote tests are gated on Pinata env vars and fail closed when required env is missing.

### Phase 6: Monad Anchor Smoke

- Use existing MemChain Monad env configuration.
- Call the Aomi commit tool with `anchor=true` and `confirmed=true`.
- Verify the resulting receipt against the registry.

Verification:

```bash
node dist/cli.js verify --receipt <receipt-path>
```

Expected result: receipt verification succeeds and includes `monad_tx` plus `registry`.

## Test Matrix

Required before calling the integration complete:

- TypeScript unit tests pass.
- TypeScript build passes.
- Aomi adapter builds.
- Aomi adapter tests pass.
- Local demo still works without network access.
- Aomi local proof flow produces a receipt accepted by `memchain verify`.
- Checkout from that receipt restores a replay directory.
- Anchored flow refuses to run without confirmation.
- Anchored flow refuses to run when required Monad env vars are missing.
- Redaction failure blocks commit before storage or anchoring.

## Non-Goals

- Rewriting MemChain in Rust.
- Adding a long-running MemChain daemon.
- Adding background file watching.
- Wrapping trade commands.
- Managing Safe signatures from Aomi.
- Inferring agent intent from file changes.
- Uploading plaintext memory to public IPFS.
- Proving deterministic model output.

## Completion Criteria

The integration is complete when:

- Aomi can prepare intent, commit proof, verify receipt, and checkout memory state through the existing MemChain CLI.
- MemChain remains fully usable without Aomi.
- No proof logic is duplicated in the Aomi crate.
- Monad anchoring requires explicit confirmation.
- Public remote storage goes through MemChain encryption and redaction policy.
- Documentation clearly presents Aomi as an adapter, not as the MemChain runtime.
