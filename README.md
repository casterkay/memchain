# MemChain

MemChain is a thin CLI plus agent skill for verifiable trading-agent memory.

The MVP proves one loop:

```text
init -> commit intent -> bundle memory repo -> local CID -> receipt -> verify -> checkout
```

## Install

```bash
npm install
npm run build
npm link
mkdir -p ~/.[AGENT]/skills
ln -sfn "$PWD/skill/memchain" ~/.[AGENT]/skills/memchain
```

If your global npm cache is not writable, use a temp cache:

```bash
npm_config_cache=/private/tmp/memchain-npm-cache npm install
```

Restart Codex after installing the skill.

## Local Demo

```bash
npm test
npm run build
bash demo/run-demo.sh
bash demo/tamper-demo.sh
```

The demo uses local/mock IPFS, so it does not need external services.

## CLI

```bash
node dist/cli.js init ./memories --agent openclaw-demo
node dist/cli.js commit --repo ./memories --intent ./demo/trade-intent.json --local
node dist/cli.js verify --receipt ./memories/.memchain/receipts/eth-long-001.json
node dist/cli.js checkout --receipt ./memories/.memchain/receipts/eth-long-001.json --out ./replay/eth-long-001
```

## Monad Mode

`--anchor` sends the proof to `MemoryAnchorRegistry` when these env vars are set:

```bash
MEMCHAIN_RPC_URL=
MEMCHAIN_PRIVATE_KEY=
MEMCHAIN_REGISTRY_ADDRESS=
```

Local mode is the default MVP path. Monad transactions use explicit gas limits because Monad charges by gas limit.
