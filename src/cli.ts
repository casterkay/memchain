#!/usr/bin/env node
import { Command } from "commander";
import { initRepo } from "./core/init.js";
import { commitMemory } from "./core/commit.js";
import { verifyReceipt } from "./core/verify.js";
import { checkoutReceipt } from "./core/checkout.js";
import { registerAgentOnchain } from "./core/monad.js";

const program = new Command();

program.name("memchain").description("Verifiable memory proofs for trading agents").version("0.1.0");

program
  .command("init")
  .argument("<repo>")
  .requiredOption("--agent <agentId>")
  .action(async (repo: string, options: { agent: string }) => {
    await initRepo(repo, options.agent);
    console.log(`initialized ${repo} for ${options.agent}`);
  });

program
  .command("commit")
  .requiredOption("--repo <repo>")
  .requiredOption("--intent <intent>")
  .option("--local", "use local mock IPFS and skip Monad anchoring", false)
  .option("--anchor", "anchor receipt on Monad", false)
  .action(async (options: { repo: string; intent: string; local: boolean; anchor: boolean }) => {
    const receipt = await commitMemory({
      repoPath: options.repo,
      intentPath: options.intent,
      local: options.local || !options.anchor,
      anchor: options.anchor
    });
    console.log(JSON.stringify(receipt, null, 2));
  });

program
  .command("agent-register")
  .requiredOption("--agent <agentId>")
  .requiredOption("--metadata-uri <metadataUri>")
  .action(async (options: { agent: string; metadataUri: string }) => {
    const result = await registerAgentOnchain(options.agent, options.metadataUri);
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command("verify")
  .requiredOption("--receipt <receipt>")
  .action(async (options: { receipt: string }) => {
    const result = await verifyReceipt({ receiptPath: options.receipt });
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command("checkout")
  .requiredOption("--receipt <receipt>")
  .requiredOption("--out <out>")
  .action(async (options: { receipt: string; out: string }) => {
    const result = await checkoutReceipt({ receiptPath: options.receipt, outPath: options.out });
    console.log(JSON.stringify(result, null, 2));
  });

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
