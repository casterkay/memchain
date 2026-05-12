#!/usr/bin/env node
import { encodeFunctionData, getAddress, keccak256, stringToBytes } from "viem";

if (process.argv.length !== 5) {
  console.error("usage: scripts/prepare-safe-register-agent.mjs <registry-address> <agent-id> <metadata-uri>");
  process.exit(1);
}

const [, , registryAddress, agentId, metadataUri] = process.argv;

const data = encodeFunctionData({
  abi: [
    {
      type: "function",
      name: "registerAgent",
      stateMutability: "nonpayable",
      inputs: [
        { name: "agentId", type: "bytes32" },
        { name: "metadataURI", type: "string" }
      ],
      outputs: []
    }
  ],
  functionName: "registerAgent",
  args: [keccak256(stringToBytes(agentId)), metadataUri]
});

console.log(`TX_TO=${getAddress(registryAddress)}`);
console.log(`TX_DATA=${data}`);
