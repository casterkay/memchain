#!/usr/bin/env bash
set -euo pipefail

cat <<'EOF'
# Run these commands in your normal terminal, not inside the restricted agent sandbox.

# 1. Create encrypted agent wallet keystore.
mkdir -p ~/.monskills/keystore
cast wallet new ~/.monskills/keystore --unsafe-password ""

# 2. List the generated wallet address.
cast wallet list --dir ~/.monskills/keystore

# 3. Fund the agent wallet on Monad testnet.
# Faucet: https://testnet.monad.xyz

# 4. Send these values back to Codex:
# - agent wallet address
# - keystore filename under ~/.monskills/keystore
# - two signer wallet addresses you want on the Safe
EOF
