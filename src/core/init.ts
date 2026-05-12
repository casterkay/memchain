import path from "node:path";
import { writeFile } from "node:fs/promises";
import { defaultDenyPatterns } from "./redaction.js";
import { ensureDir, writeJson } from "./fs.js";
import { ensureGitRepo } from "./git.js";

export async function initRepo(repoPath: string, agentId: string): Promise<void> {
  await ensureDir(repoPath);
  await ensureGitRepo(repoPath);
  await ensureDir(path.join(repoPath, ".memchain", "decisions"));
  await ensureDir(path.join(repoPath, ".memchain", "receipts"));
  await ensureDir(path.join(repoPath, ".memchain", "anchors"));
  await ensureDir(path.join(repoPath, ".memchain", "artifacts"));
  await writeJson(path.join(repoPath, ".memchain", "agent.json"), {
    schema: "memchain.agent.v1",
    agent_id: agentId,
    created_at: new Date().toISOString()
  });
  await writeFile(path.join(repoPath, ".memchainignore"), `${defaultDenyPatterns.join("\n")}\n`);
}
