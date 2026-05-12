import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { checkoutBundle } from "./git.js";
import { copyTree } from "./fs.js";
import { receiptSchema } from "./schemas.js";
import { verifyReceipt } from "./verify.js";

export async function checkoutReceipt(options: { receiptPath: string; outPath: string }): Promise<{ outPath: string }> {
  await verifyReceipt({ receiptPath: options.receiptPath });
  const receipt = receiptSchema.parse(JSON.parse(await readFile(options.receiptPath, "utf8")));
  const temp = await mkdtemp(path.join(tmpdir(), "memchain-checkout-"));
  const clone = await checkoutBundle(receipt.artifact_bundle_path, receipt.commit_hash, temp);
  await copyTree(clone, options.outPath);
  await rm(temp, { recursive: true, force: true });
  return { outPath: options.outPath };
}
