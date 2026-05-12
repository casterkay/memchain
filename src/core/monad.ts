import { createWalletClient, http, keccak256, stringToBytes, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

const abi = [
  {
    type: "function",
    name: "registerAgent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "bytes32" },
      { name: "metadataURI", type: "string" }
    ],
    outputs: []
  },
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
] as const;

type AnchorInput = {
  enabled: boolean;
  agentId: string;
  commitHash: string;
  parentCommitHash: string | null;
  metadataHash: string;
  artifactHash: string;
  ipfsCid: string;
};

export function bytes32Text(value: string | null): Hex {
  return keccak256(stringToBytes(value ?? ""));
}

export function optionalCommitBytes32(value: string | null): Hex {
  return value ? bytes32Text(value) : ZERO_BYTES32;
}

export function sha256DigestBytes32(value: string): Hex {
  const digest = value.startsWith("sha256:") ? value.slice("sha256:".length) : value;
  if (!/^[0-9a-fA-F]{64}$/.test(digest)) {
    throw new Error(`invalid sha256 digest: ${value}`);
  }
  return `0x${digest}` as Hex;
}

function monadEnv(): { rpcUrl: string; privateKey: Hex; registry: Hex } {
  const rpcUrl = process.env.MEMCHAIN_RPC_URL;
  const privateKey = process.env.MEMCHAIN_PRIVATE_KEY as Hex | undefined;
  const registry = process.env.MEMCHAIN_REGISTRY_ADDRESS as Hex | undefined;
  if (!rpcUrl || !privateKey || !registry) {
    throw new Error("Monad anchoring requires MEMCHAIN_RPC_URL, MEMCHAIN_PRIVATE_KEY, and MEMCHAIN_REGISTRY_ADDRESS");
  }
  return { rpcUrl, privateKey, registry };
}

function walletClient(rpcUrl: string, privateKey: Hex) {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    transport: http(rpcUrl)
  });
}

export async function registerAgentOnchain(agentId: string, metadataUri: string): Promise<{ txHash: string; registry: string }> {
  const { rpcUrl, privateKey, registry } = monadEnv();
  const client = walletClient(rpcUrl, privateKey);
  const txHash = await client.writeContract({
    address: registry,
    abi,
    functionName: "registerAgent",
    chain: null,
    args: [bytes32Text(agentId), metadataUri],
    gas: 120000n
  });
  return { txHash, registry };
}

export async function anchorMemoryIfRequested(input: AnchorInput): Promise<{ txHash: string | null; registry: string | null }> {
  if (!input.enabled) return { txHash: null, registry: null };
  const { rpcUrl, privateKey, registry } = monadEnv();
  const client = walletClient(rpcUrl, privateKey);
  const txHash = await client.writeContract({
    address: registry,
    abi,
    functionName: "anchorMemory",
    chain: null,
    args: [
      bytes32Text(input.agentId),
      bytes32Text(input.commitHash),
      optionalCommitBytes32(input.parentCommitHash),
      sha256DigestBytes32(input.metadataHash),
      sha256DigestBytes32(input.artifactHash),
      input.ipfsCid
    ],
    gas: 180000n
  });
  return { txHash, registry };
}
