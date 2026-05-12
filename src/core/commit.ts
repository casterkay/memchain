import path from "node:path";
import { cp, readFile } from "node:fs/promises";
import { currentCommit, createBundle, createCommit } from "./git.js";
import { ensureDir, writeJson } from "./fs.js";
import { canonicalJson, sha256File, sha256Text } from "./hash.js";
import { redactionReport } from "./redaction.js";
import { artifactSchema, intentSchema, manifestSchema, receiptSchema, type Receipt } from "./schemas.js";
import { anchorMemoryIfRequested } from "./monad.js";

export type CommitOptions = {
  repoPath: string;
  intentPath: string;
  local?: boolean;
  anchor?: boolean;
};

export async function commitMemory(options: CommitOptions): Promise<Receipt> {
  const repoPath = path.resolve(options.repoPath);
  const intentText = await readFile(options.intentPath, "utf8");
  const intent = intentSchema.parse(JSON.parse(intentText));
  const report = await redactionReport(repoPath);
  if (report.blocked.length > 0) {
    throw new Error(`redaction check failed: ${report.blocked.join(", ")}`);
  }

  const now = new Date().toISOString();
  const parentCommit = await currentCommit(repoPath);
  const manifestRel = `.memchain/decisions/${intent.decision_id}.json`;
  const manifestPath = path.join(repoPath, manifestRel);
  const manifest = manifestSchema.parse({
    schema: "memchain.manifest.v1",
    agent_id: intent.agent_id,
    decision_id: intent.decision_id,
    created_at: now,
    parent_commit: parentCommit,
    summary: intent.summary,
    intent_sha256: sha256Text(intentText),
    redaction_report_sha256: report.sha256,
    memory_path: repoPath
  });
  await writeJson(manifestPath, manifest);

  const commitHash = await createCommit(repoPath, `memchain: ${intent.decision_id}`);
  const artifactDir = path.join(repoPath, ".memchain", "artifacts", commitHash);
  await ensureDir(artifactDir);
  const bundlePath = path.join(artifactDir, `memchain-${intent.agent_id}-${commitHash}.bundle`);
  await createBundle(repoPath, bundlePath);
  const artifactSha = await sha256File(bundlePath);
  const manifestSha = await sha256File(manifestPath);
  const metadata = artifactSchema.parse({
    schema: "memchain.artifact.v1",
    agent_id: intent.agent_id,
    decision_id: intent.decision_id,
    commit_hash: commitHash,
    parent_commit_hash: parentCommit,
    artifact_type: "git_bundle",
    artifact_sha256: artifactSha,
    manifest_path: manifestRel,
    manifest_sha256: manifestSha
  });
  const metadataPath = path.join(artifactDir, "artifact.json");
  await writeJson(metadataPath, metadata);
  const metadataSha = sha256Text(canonicalJson(metadata));
  const cid = `local:${artifactSha.replace("sha256:", "")}`;
  const localCidDir = path.join(repoPath, ".memchain", "artifacts", cid.replace(":", "-"));
  await ensureDir(localCidDir);
  await cp(bundlePath, path.join(localCidDir, path.basename(bundlePath)));
  await cp(metadataPath, path.join(localCidDir, "artifact.json"));

  const anchor = await anchorMemoryIfRequested({
    enabled: Boolean(options.anchor && !options.local),
    agentId: intent.agent_id,
    commitHash,
    parentCommitHash: parentCommit,
    metadataHash: metadataSha,
    artifactHash: artifactSha,
    ipfsCid: cid
  });

  const receiptPath = path.join(repoPath, ".memchain", "receipts", `${intent.decision_id}.json`);
  const receipt = receiptSchema.parse({
    schema: "memchain.receipt.v1",
    agent_id: intent.agent_id,
    decision_id: intent.decision_id,
    commit_hash: commitHash,
    parent_commit_hash: parentCommit,
    ipfs_cid: cid,
    artifact_sha256: artifactSha,
    metadata_sha256: metadataSha,
    manifest_sha256: manifestSha,
    intent_sha256: sha256Text(intentText),
    monad_tx: anchor.txHash,
    registry: anchor.registry,
    created_at: new Date().toISOString(),
    repo_path: repoPath,
    receipt_path: receiptPath,
    artifact_bundle_path: bundlePath,
    artifact_metadata_path: metadataPath,
    manifest_path: manifestPath
  });
  await writeJson(receiptPath, receipt);
  return receipt;
}
