#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 3 ]; then
  echo "usage: scripts/verify-contract.sh <chain-id> <contract-address> <compiler-version>"
  echo "example: scripts/verify-contract.sh 10143 0xRegistry... v0.8.24+commit.e11b9ed9"
  exit 1
fi

CHAIN_ID="$1"
CONTRACT_ADDRESS="$2"
COMPILER_VERSION="$3"
CONTRACT_NAME="contracts/MemoryAnchorRegistry.sol:MemoryAnchorRegistry"
STANDARD_INPUT="/tmp/memchain-standard-input.json"
FOUNDRY_METADATA="/tmp/memchain-foundry-metadata.json"
VERIFY_BODY="/tmp/memchain-verify.json"

forge verify-contract "$CONTRACT_ADDRESS" "$CONTRACT_NAME" \
  --chain "$CHAIN_ID" \
  --show-standard-json-input > "$STANDARD_INPUT"

jq '.metadata' out/MemoryAnchorRegistry.sol/MemoryAnchorRegistry.json > "$FOUNDRY_METADATA"

jq -n \
  --argjson chainId "$CHAIN_ID" \
  --arg contractAddress "$CONTRACT_ADDRESS" \
  --arg contractName "$CONTRACT_NAME" \
  --arg compilerVersion "$COMPILER_VERSION" \
  --slurpfile standardJsonInput "$STANDARD_INPUT" \
  --slurpfile foundryMetadata "$FOUNDRY_METADATA" \
  '{
    chainId: $chainId,
    contractAddress: $contractAddress,
    contractName: $contractName,
    compilerVersion: $compilerVersion,
    standardJsonInput: $standardJsonInput[0],
    foundryMetadata: $foundryMetadata[0]
  }' > "$VERIFY_BODY"

curl -X POST https://agents.devnads.com/v1/verify \
  -H "Content-Type: application/json" \
  -d @"$VERIFY_BODY"
