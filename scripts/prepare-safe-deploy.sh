#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "usage: scripts/prepare-safe-deploy.sh <chain-id> <safe-address>"
  echo "example: scripts/prepare-safe-deploy.sh 10143 0xSafe..."
  exit 1
fi

CHAIN_ID="$1"
SAFE_ADDRESS="$2"

case "$CHAIN_ID" in
  10143|143) ;;
  *) echo "unsupported Monad chain id: $CHAIN_ID"; exit 1 ;;
esac

cast to-check-sum-address "$SAFE_ADDRESS" >/dev/null
forge inspect contracts/MemoryAnchorRegistry.sol:MemoryAnchorRegistry bytecode
