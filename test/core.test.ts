import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execa } from "execa";
import { describe, expect, it } from "vitest";

import { initRepo } from "../src/core/init.js";
import { commitMemory } from "../src/core/commit.js";
import { verifyReceipt } from "../src/core/verify.js";
import { checkoutReceipt } from "../src/core/checkout.js";

async function tempRepo() {
  const dir = await mkdtemp(path.join(tmpdir(), "memchain-test-"));
  await execa("git", ["init"], { cwd: dir });
  await execa("git", ["config", "user.email", "test@memchain.local"], { cwd: dir });
  await execa("git", ["config", "user.name", "MemChain Test"], { cwd: dir });
  await writeFile(path.join(dir, "strategy.md"), "risk: max 1% per trade\n");
  await writeFile(path.join(dir, "reflections.md"), "No prior trades.\n");
  return dir;
}

describe("local MemChain proof flow", () => {
  it("initializes metadata and default ignore policy", async () => {
    const repo = await tempRepo();

    await initRepo(repo, "openclaw-demo");

    await expect(readFile(path.join(repo, ".memchain/agent.json"), "utf8")).resolves.toContain("openclaw-demo");
    await expect(readFile(path.join(repo, ".memchainignore"), "utf8")).resolves.toContain(".env");
  });

  it("initializes a nested memory folder as its own git repo", async () => {
    const outer = await mkdtemp(path.join(tmpdir(), "memchain-outer-"));
    await execa("git", ["init"], { cwd: outer });
    const nested = path.join(outer, "memories");

    await initRepo(nested, "openclaw-demo");

    await expect(readFile(path.join(nested, ".git", "config"), "utf8")).resolves.toContain("[core]");
  });

  it("commits memory, verifies receipt, and checks out replay tree", async () => {
    const repo = await tempRepo();
    await initRepo(repo, "openclaw-demo");
    const intentPath = path.join(repo, "trade-intent.json");
    await writeFile(
      intentPath,
      JSON.stringify({
        schema: "memchain.intent.v1",
        agent_id: "openclaw-demo",
        decision_id: "eth-long-001",
        action: "trade",
        summary: "Considering ETH long after breakout confirmation",
        symbols: ["ETH"],
        mode: "paper",
        strategy_version: "dual-momentum-v0",
        external_reference: "paper-order-1"
      })
    );

    const receipt = await commitMemory({ repoPath: repo, intentPath, local: true });

    expect(receipt.schema).toBe("memchain.receipt.v1");
    expect(receipt.commit_hash).toMatch(/^[0-9a-f]{40}$/);
    expect(receipt.ipfs_cid).toMatch(/^local:/);
    await expect(verifyReceipt({ receiptPath: receipt.receipt_path })).resolves.toMatchObject({ ok: true });

    const out = path.join(repo, "..", "replay");
    await checkoutReceipt({ receiptPath: receipt.receipt_path, outPath: out });
    await expect(readFile(path.join(out, "strategy.md"), "utf8")).resolves.toContain("risk: max 1%");
  });

  it("fails verification after artifact tampering", async () => {
    const repo = await tempRepo();
    await initRepo(repo, "openclaw-demo");
    const intentPath = path.join(repo, "trade-intent.json");
    await writeFile(
      intentPath,
      JSON.stringify({
        schema: "memchain.intent.v1",
        agent_id: "openclaw-demo",
        decision_id: "eth-short-001",
        action: "trade",
        summary: "Considering ETH hedge",
        symbols: ["ETH"],
        mode: "paper",
        strategy_version: "dual-momentum-v0"
      })
    );
    const receipt = await commitMemory({ repoPath: repo, intentPath, local: true });
    const parsed = JSON.parse(await readFile(receipt.receipt_path, "utf8"));

    await writeFile(parsed.artifact_bundle_path, "tampered");

    await expect(verifyReceipt({ receiptPath: receipt.receipt_path })).rejects.toThrow(/artifact hash mismatch/);
  });
});
