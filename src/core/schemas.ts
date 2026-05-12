import { z } from "zod";

export const intentSchema = z.object({
  schema: z.literal("memchain.intent.v1"),
  agent_id: z.string().min(1),
  decision_id: z.string().min(1).regex(/^[A-Za-z0-9._-]+$/),
  action: z.enum(["trade", "rebalance", "strategy_update", "commitment", "research", "memory_block"]),
  summary: z.string().min(1),
  symbols: z.array(z.string().min(1)).default([]),
  mode: z.string().min(1).default("paper"),
  strategy_version: z.string().min(1),
  external_reference: z.string().optional()
});

export const manifestSchema = z.object({
  schema: z.literal("memchain.manifest.v1"),
  agent_id: z.string(),
  decision_id: z.string(),
  created_at: z.string(),
  parent_commit: z.string().nullable(),
  summary: z.string(),
  intent_sha256: z.string(),
  redaction_report_sha256: z.string(),
  memory_path: z.string()
});

export const artifactSchema = z.object({
  schema: z.literal("memchain.artifact.v1"),
  agent_id: z.string(),
  decision_id: z.string(),
  commit_hash: z.string(),
  parent_commit_hash: z.string().nullable(),
  artifact_type: z.literal("git_bundle"),
  artifact_sha256: z.string(),
  manifest_path: z.string(),
  manifest_sha256: z.string()
});

export const receiptSchema = z.object({
  schema: z.literal("memchain.receipt.v1"),
  agent_id: z.string(),
  decision_id: z.string(),
  commit_hash: z.string(),
  parent_commit_hash: z.string().nullable(),
  ipfs_cid: z.string(),
  artifact_sha256: z.string(),
  metadata_sha256: z.string(),
  manifest_sha256: z.string(),
  intent_sha256: z.string(),
  monad_tx: z.string().nullable(),
  registry: z.string().nullable(),
  created_at: z.string(),
  repo_path: z.string(),
  receipt_path: z.string(),
  artifact_bundle_path: z.string(),
  artifact_metadata_path: z.string(),
  manifest_path: z.string()
});

export type Intent = z.infer<typeof intentSchema>;
export type Manifest = z.infer<typeof manifestSchema>;
export type ArtifactMetadata = z.infer<typeof artifactSchema>;
export type Receipt = z.infer<typeof receiptSchema>;
