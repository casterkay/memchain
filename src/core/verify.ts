import { readFile } from "node:fs/promises";
import { bundleContainsCommit } from "./git.js";
import { canonicalJson, sha256File, sha256Text } from "./hash.js";
import { artifactSchema, receiptSchema } from "./schemas.js";

export async function verifyReceipt(options: { receiptPath: string }): Promise<{ ok: true; commit: string }> {
  const receipt = receiptSchema.parse(JSON.parse(await readFile(options.receiptPath, "utf8")));
  const artifactHash = await sha256File(receipt.artifact_bundle_path);
  if (artifactHash !== receipt.artifact_sha256) {
    throw new Error(`artifact hash mismatch: expected ${receipt.artifact_sha256}, got ${artifactHash}`);
  }
  const metadata = artifactSchema.parse(JSON.parse(await readFile(receipt.artifact_metadata_path, "utf8")));
  const metadataHash = sha256Text(canonicalJson(metadata));
  if (metadataHash !== receipt.metadata_sha256) {
    throw new Error(`metadata hash mismatch: expected ${receipt.metadata_sha256}, got ${metadataHash}`);
  }
  if (metadata.commit_hash !== receipt.commit_hash) {
    throw new Error("metadata commit mismatch");
  }
  if (metadata.parent_commit_hash !== receipt.parent_commit_hash) {
    throw new Error("metadata parent commit mismatch");
  }
  if (metadata.manifest_sha256 !== receipt.manifest_sha256) {
    throw new Error("metadata manifest hash mismatch");
  }
  const manifestHash = await sha256File(receipt.manifest_path);
  if (manifestHash !== receipt.manifest_sha256) {
    throw new Error(`manifest hash mismatch: expected ${receipt.manifest_sha256}, got ${manifestHash}`);
  }
  if (!(await bundleContainsCommit(receipt.artifact_bundle_path, receipt.commit_hash))) {
    throw new Error("artifact does not contain receipt commit");
  }
  return { ok: true, commit: receipt.commit_hash };
}
