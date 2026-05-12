#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="$ROOT/demo/.work/tamper-demo"

MEMCHAIN_DEMO_WORK="$WORK" bash "$ROOT/demo/run-demo.sh" >/dev/null

RECEIPT="$WORK/openclaw-memories/.memchain/receipts/eth-long-001.json"
BUNDLE="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).artifact_bundle_path)" "$RECEIPT")"
printf 'tampered\n' > "$BUNDLE"

if node "$ROOT/dist/cli.js" verify --receipt "$RECEIPT" >/tmp/memchain-tamper.log 2>&1; then
  echo "tamper demo failed: verification unexpectedly passed"
  exit 1
fi

grep -q "artifact hash mismatch" /tmp/memchain-tamper.log
echo "tamper ok: artifact hash mismatch detected"
