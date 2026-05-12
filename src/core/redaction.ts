import { readdir } from "node:fs/promises";
import path from "node:path";
import { sha256Text } from "./hash.js";

export const defaultDenyPatterns = [
  ".env",
  ".env.*",
  "*.pem",
  "*.key",
  "*private-key*",
  "*wallet*",
  "*keystore*",
  "*account-export*",
  "Cookies",
  "Login Data"
];

function matches(pattern: string, relativePath: string): boolean {
  if (pattern.includes("*")) {
    const escaped = pattern.split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");
    return new RegExp(`^${escaped}$`).test(path.basename(relativePath)) || new RegExp(escaped).test(relativePath);
  }
  return relativePath === pattern || relativePath.endsWith(`/${pattern}`) || path.basename(relativePath) === pattern;
}

async function walk(dir: string, root: string, found: string[]): Promise<void> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full);
    if (entry.isDirectory()) await walk(full, root, found);
    else if (defaultDenyPatterns.some((pattern) => matches(pattern, rel))) found.push(rel);
  }
}

export async function redactionReport(repoPath: string): Promise<{ blocked: string[]; sha256: string }> {
  const blocked: string[] = [];
  await walk(repoPath, repoPath, blocked);
  const body = JSON.stringify({ blocked: blocked.sort() });
  return { blocked, sha256: sha256Text(body) };
}
