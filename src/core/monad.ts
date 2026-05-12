import { createWalletClient, http, keccak256, stringToBytes, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const abi = [
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

export async function anchorMemoryIfRequested(input: AnchorInput): Promise<{ txHash: string | null; registry: string | null }> {
  if (!input.enabled) return { txHash: null, registry: null };
  const rpcUrl = process.env.MEMCHAIN_RPC_URL;
  const privateKey = process.env.MEMCHAIN_PRIVATE_KEY as Hex | undefined;
  const registry = process.env.MEMCHAIN_REGISTRY_ADDRESS as Hex | undefined;
  if (!rpcUrl || !privateKey || !registry) {
    throw new Error("Monad anchoring requires MEMCHAIN_RPC_URL, MEMCHAIN_PRIVATE_KEY, and MEMCHAIN_REGISTRY_ADDRESS");
  }
  const account = privateKeyToAccount(privateKey);
  const client = createWalletClient({
    account,
    transport: http(rpcUrl)
  });
  const txHash = await client.writeContract({
    address: registry,
    abi,
    functionName: "anchorMemory",
    chain: null,
    args: [
      bytes32Text(input.agentId),
      bytes32Text(input.commitHash),
      bytes32Text(input.parentCommitHash),
      bytes32Text(input.metadataHash),
      bytes32Text(input.artifactHash),
      input.ipfsCid
    ],
    gas: 180000n
  });
  return { txHash, registry };
}
