import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execa } from "execa";

export async function git(repoPath: string, args: string[]): Promise<string> {
  const result = await execa("git", args, { cwd: repoPath });
  return result.stdout.trim();
}

export async function ensureGitRepo(repoPath: string): Promise<void> {
  try {
    const topLevel = await git(repoPath, ["rev-parse", "--show-toplevel"]);
    if (path.resolve(topLevel) !== path.resolve(repoPath)) {
      await git(repoPath, ["init"]);
    }
  } catch {
    await git(repoPath, ["init"]);
  }
}

export async function currentCommit(repoPath: string): Promise<string | null> {
  try {
    return await git(repoPath, ["rev-parse", "HEAD"]);
  } catch {
    return null;
  }
}

export async function createCommit(repoPath: string, message: string): Promise<string> {
  await git(repoPath, ["add", "."]);
  const status = await git(repoPath, ["status", "--porcelain"]);
  if (!status) {
    const head = await currentCommit(repoPath);
    if (!head) throw new Error("nothing to commit and repository has no HEAD");
    return head;
  }
  await git(repoPath, ["commit", "-m", message]);
  const commit = await currentCommit(repoPath);
  if (!commit) throw new Error("git commit did not produce HEAD");
  return commit;
}

export async function createBundle(repoPath: string, outPath: string): Promise<void> {
  await git(repoPath, ["bundle", "create", outPath, "--all"]);
}

export async function bundleContainsCommit(bundlePath: string, commitHash: string): Promise<boolean> {
  const temp = await mkdtemp(path.join(tmpdir(), "memchain-bundle-"));
  try {
    await execa("git", ["clone", bundlePath, temp]);
    await execa("git", ["cat-file", "-e", `${commitHash}^{commit}`], { cwd: temp });
    return true;
  } catch {
    return false;
  }
}

export async function checkoutBundle(bundlePath: string, commitHash: string, outPath: string): Promise<string> {
  const clonePath = path.join(outPath, ".memchain-source");
  await execa("git", ["clone", bundlePath, clonePath]);
  await execa("git", ["checkout", commitHash], { cwd: clonePath });
  return clonePath;
}
