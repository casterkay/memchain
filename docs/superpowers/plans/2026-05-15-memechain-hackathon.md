# MemChain IPFS OpenClaw Hackathon Upgrade

## Summary

Upgrade MemChain from a Monad-centered audit/replay MVP into a live, agentic marketplace for
OpenClaw thinking-framework assets.

Canonical demo path: OpenClaw MEMORY.md, AGENTS.md, and SOUL.md are packaged as a verifiable
encrypted asset, pinned with Filecoin Pin on mainnet, registered through ERC-8004 on Base
mainnet, scored from trade evidence, and sold through an Arkhai/NLA escrow operated by Aomi
agents. The live submission also deploys and uses a Filecoin Pay wallet on Filecoin mainnet.

Monad is removed from the judged critical path. Keep the existing Monad code as a post-hackathon
adapter, not as the submission story. The hackathon requires OpenClaw, Filecoin Pin, and
Filecoin Pay on mainnet; making Monad canonical adds live-chain risk without satisfying those
requirements better than the Filecoin/ERC-8004 path.

## Key Changes

- Extend MemChain storage from local:<sha256> to Filecoin Pin mainnet:
    - Upload encrypted profile asset, public preview manifest, and score report.
    - Store root CID, dataset ID, piece CID/CommP, PDP status, and retrieval URLs in receipts.
    - Verify via Filecoin Pin dataset status before treating an asset as live.
- Add a profile asset pipeline:
    - Asset payload includes only MEMORY.md, AGENTS.md, and SOUL.md.
    - Trade intents, receipts, and decision logs are evidence inputs for scoring, not sold
      content.
    - Encrypt payload with a per-asset key; publish plaintext preview and hashes only.
- Add ERC-8004 registration on Base mainnet:
    - Agent card is stored with Filecoin Pin.
    - Agent card references Aomi app endpoint, MemChain verification endpoint, asset manifest
      CID, and supported trust mechanisms.
- Add Filecoin Pay mainnet wallet support:
    - Deploy or connect the seller agent's Filecoin Pay wallet on Filecoin mainnet.
    - Record wallet address, funding status, and payment asset in the demo runbook.
    - Use the Filecoin Pay wallet in the live sale/payment path, not only as setup evidence.
- Add Arkhai/NLA escrowed sale:
    - Buyer creates escrow with a natural-language demand requiring delivery of the decryption
      key for the exact asset CID/hash.
    - Seller fulfills by submitting a delivery proof and buyer-encrypted asset key.
    - Arkhai oracle/arbitration settles the payment.
- Build the Aomi app as the primary UI:
    - Seller agent: inspect profile, create asset, upload, score, register, list.
    - Buyer agent: inspect preview/score, create escrow, verify delivery, decrypt, validate.
    - Aomi tools call a small MemChain HTTP service instead of shelling directly from the UI.

## Interfaces

- CLI additions:
    - memchain asset create --repo <openclaw_dir> --agent <id> --evidence <dir>
    - memchain asset score --asset <manifest>
    - memchain asset upload --asset <manifest> --filecoin-mainnet
    - memchain asset verify --manifest <cid-or-path>
    - memchain market fulfill --listing <id> --buyer-key <pubkey>
- Aomi tool surface:
    - inspect_openclaw_profile
    - create_memory_asset
    - score_memory_asset
    - upload_asset_to_filecoin
    - register_erc8004_agent
    - create_arkhai_sale
    - verify_memory_purchase
- New schemas:
    - memchain.profile_asset.v1: selected file hashes, encrypted payload CID, preview CID, score
      CID, Filecoin proof metadata.
    - memchain.asset_score.v1: deterministic metrics plus Aomi-generated valuation note.
    - memchain.market_listing.v1: seller agent, asset manifest CID, price, escrow UID, delivery
      public-key requirement.

## 72-Hour Build Order

- Day 1: Filecoin Pin mainnet storage, encrypted asset packaging, score report, verification
  command.
- Day 2: ERC-8004 agent card registration, Filecoin Pay wallet setup, Arkhai/NLA escrow flow,
  buyer-key delivery proof.
- Day 3: Aomi app integration, live end-to-end demo polish, submission docs, pitch rewrite
  around the agentic marketplace.

## Test Plan
- Unit tests:
    - Asset packaging includes only the three agent profile files.
    - Missing SOUL.md or hash mismatch fails closed.
    - Score formula is deterministic and does not depend on Aomi text.
    - Encrypted payload cannot be verified without the asset key.
- Integration tests:
    - Filecoin Pin upload output is parsed into receipt fields.
    - Filecoin Pay wallet configuration is present before live marketplace flows run.
    - ERC-8004 token URI includes the pinned filename.
    - Arkhai/NLA create, fulfill, status, and collect wrappers preserve escrow IDs.
    - Aomi tool calls return compact JSON and require explicit confirmation for side effects.
- Live acceptance:
    - A judge can see one seller agent create a memory asset, one buyer agent purchase it, the
      asset decrypt after settlement, and the final files verify against Filecoin/receipt
      hashes.
    - The demo shows the Filecoin Pay mainnet wallet used by the sale flow.

## Assumptions

- Live-only demo, 72-hour scope.
- Required funded wallets/API keys are available: Filecoin mainnet FIL/USDFC, Base mainnet ETH,
  Arkhai/NLA token/RPC, Aomi API key, and LLM key for NLA oracle.
- Aomi is the agentic marketplace layer, not just a chat wrapper.
- The public asset is encrypted; only preview, hashes, score, and provenance are public.
- Monad remains optional post-hackathon infrastructure, not a required judged dependency.
- References used: Aomi Agentic Application (https://aomi.dev/docs/agentic-application), Aomi
  Overview (https://aomi.dev/docs/build/overview), Filecoin Pin FAQ
  (https://docs.filecoin.io/builder-cookbook/filecoin-pin/faq), Filecoin Pin for ERC-8004 Agents
  (https://docs.filecoin.io/builder-cookbook/filecoin-pin/erc-8004-agent-registration), ERC-8004
  (https://eips.ethereum.org/EIPS/eip-8004), Arkhai (https://www.arkhai.io/), Arkhai NLA
  (https://github.com/arkhai-io/natural-language-agreements).
