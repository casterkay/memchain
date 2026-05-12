#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { encodeFunctionData, getAddress, keccak256, stringToBytes, zeroHash } from "viem";

if (process.argv.length !== 4) {
  console.error("usage: scripts/prepare-safe-anchor-receipt.mjs <registry-address> <receipt-path>");
  process.exit(1);
}

function sha256DigestBytes32(value) {
  const digest = value.startsWith("sha256:") ? value.slice("sha256:".length) : value;
  if (!/^[0-9a-fA-F]{64}$/.test(digest)) {
    throw new Error(`invalid sha256 digest: ${value}`);
  }
  return `0x${digest}`;
}

function optionalCommitBytes32(value) {
  return value ? keccak256(stringToBytes(value)) : zeroHash;
}

const [, , registryAddress, receiptPath] = process.argv;
const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));

const data = encodeFunctionData({
  abi: [
    {
      type: "function",
      name: "anchorMemory",
      stateMutability: "nonpayable",
      inputs: [
        { name: "agentId", type: "bytes32" },
        { name: "commitHash", type: "bytes32" },
        { name: "parentCommitHash", type: "bytes32" },
        { name: "metadataHash", type: "bytes32" },
        { name: "artifactHash", type: "bytes32" },
        { name: "ipfsCid", type: "string" }
      ],
      outputs: []
    }
  ],
  functionName: "anchorMemory",
  args: [
    keccak256(stringToBytes(receipt.agent_id)),
    keccak256(stringToBytes(receipt.commit_hash)),
    optionalCommitBytes32(receipt.parent_commit_hash),
    sha256DigestBytes32(receipt.metadata_sha256),
    sha256DigestBytes32(receipt.artifact_sha256),
    receipt.ipfs_cid
  ]
});

console.log(`TX_TO=${getAddress(registryAddress)}`);
console.log(`TX_DATA=${data}`);
