#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="${MEMCHAIN_DEMO_WORK:-$ROOT/demo/.work/run-demo}"
MEMORY="$WORK/openclaw-memories"
REPLAY="$WORK/replay"

rm -rf "$WORK"
mkdir -p "$WORK"
cp -R "$ROOT/demo/fixtures/openclaw-memories" "$MEMORY"

node "$ROOT/dist/cli.js" init "$MEMORY" --agent openclaw-demo
git -C "$MEMORY" config user.email "demo@memchain.local"
git -C "$MEMORY" config user.name "MemChain Demo"

node "$ROOT/dist/cli.js" commit --repo "$MEMORY" --intent "$ROOT/demo/trade-intent.json" --local
node "$ROOT/dist/cli.js" verify --receipt "$MEMORY/.memchain/receipts/eth-long-001.json"
node "$ROOT/dist/cli.js" checkout --receipt "$MEMORY/.memchain/receipts/eth-long-001.json" --out "$REPLAY"

test -f "$REPLAY/strategy.md"
echo "demo ok: replay restored at $REPLAY"
