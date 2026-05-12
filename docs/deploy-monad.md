# Deploy MemChain to Monad

Target order: local verification, Safe deployment, contract verification, then CLI anchoring.

## 1. Install Required Tooling

Foundry is required for `forge`, `cast`, and the encrypted keystore workflow.

```bash
foundryup --version
forge --version
cast --version
```

## 2. Verify Locally

```bash
npm test
npm run build
forge test
```

Do not deploy if `forge test` is not green.

## 3. Prepare Monad Testnet Wallet and Safe

Use the monskills wallet flow:

- encrypted agent wallet at `~/.monskills/keystore`
- no plaintext private keys
- Safe multisig recorded in `~/.monskills/multisig.json`
- Monad testnet chain id `10143`
- Monad testnet chain id hex `0x279F`
- Monad testnet RPC `https://testnet-rpc.monad.xyz`
- faucet `https://testnet.monad.xyz`
- explorer `https://testnet.monadexplorer.com/`
- explorer `https://monad-testnet.socialscan.io/`

All deployment transactions after Safe creation should be proposed through:

```bash
.agents/skills/monskill/wallet/utils/propose.sh
```

## 4. Prepare Safe Deployment Bytecode

```bash
scripts/prepare-safe-deploy.sh 10143 <SAFE_ADDRESS>
```

The script validates the target chain and Safe address, then prints the registry deployment bytecode. Use it as `DEPLOYMENT_BYTECODE` for the monskills Safe proposer.

## 5. Propose Deployment Through Safe

Use the exact monskills wallet wrapper. Do not run direct `forge --broadcast` deployment for the registry.

```bash
SCRIPT_DIR="$PWD/.agents/skills/monskill/wallet/utils"
CHAIN_ID=10143 \
SAFE_ADDRESS=<SAFE_ADDRESS> \
PRIVATE_KEY="$(cast wallet decrypt-keystore --keystore-dir ~/.monskills/keystore <KEYSTORE_FILENAME> --unsafe-password "" | awk '{print $NF}')" \
DEPLOYMENT_BYTECODE=<BYTECODE_FROM_DRY_RUN> \
bash "$SCRIPT_DIR/propose.sh"
```

After proposal, approve and execute in Safe UI, then record the deployed registry address in `deployments/monad-testnet.json`.

## 6. Verify Contract

Use the monskills verification API script:

```bash
scripts/verify-contract.sh 10143 <REGISTRY_ADDRESS> <COMPILER_VERSION>
```

Record the API response under `deployments/`.

## 7. Register Agent

The Safe should own the agent registration. Prepare calldata, then submit it with the monskills Safe proposer.

```bash
eval "$(scripts/prepare-safe-register-agent.mjs <REGISTRY_ADDRESS> openclaw-demo ipfs://openclaw-demo)"

SCRIPT_DIR="$PWD/.agents/skills/monskill/wallet/utils"
CHAIN_ID=10143 \
SAFE_ADDRESS=<SAFE_ADDRESS> \
PRIVATE_KEY="$(cast wallet decrypt-keystore --keystore-dir ~/.monskills/keystore <KEYSTORE_FILENAME> --unsafe-password "" | awk '{print $NF}')" \
TX_TO="$TX_TO" \
TX_DATA="$TX_DATA" \
bash "$SCRIPT_DIR/propose.sh"
```

Approve and execute in Safe UI before anchoring memory for that agent.

## 8. Anchor Smoke Test

Create a local receipt first:

```bash
bash demo/run-demo.sh
```

Then prepare and propose the anchor call through Safe:

```bash
RECEIPT=demo/.work/run-demo/openclaw-memories/.memchain/receipts/eth-long-001.json
eval "$(scripts/prepare-safe-anchor-receipt.mjs <REGISTRY_ADDRESS> "$RECEIPT")"

SCRIPT_DIR="$PWD/.agents/skills/monskill/wallet/utils"
CHAIN_ID=10143 \
SAFE_ADDRESS=<SAFE_ADDRESS> \
PRIVATE_KEY="$(cast wallet decrypt-keystore --keystore-dir ~/.monskills/keystore <KEYSTORE_FILENAME> --unsafe-password "" | awk '{print $NF}')" \
TX_TO="$TX_TO" \
TX_DATA="$TX_DATA" \
bash "$SCRIPT_DIR/propose.sh"
```

`node dist/cli.js agent-register` and `node dist/cli.js commit --anchor` remain useful for local/test-only direct-key smoke checks where the same EOA owns the agent. Production should use Safe calls.

## Notes

- Monad charges by gas limit, not gas used. Keep gas limits tight and adjust after testnet measurements.
- Current CLI direct mode uses explicit limits: `registerAgent` 120,000 and `anchorMemory` 180,000.
- Public IPFS means public memory. The MVP demo uses local/mock CID.
