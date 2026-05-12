import { cp, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function cleanDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
  await ensureDir(dir);
}

export async function copyTree(source: string, target: string): Promise<void> {
  await cleanDir(target);
  const entries = await readdir(source);
  for (const entry of entries) {
    if (entry === ".git") continue;
    await cp(path.join(source, entry), path.join(target, entry), {
      recursive: true,
      filter: (src) => !src.includes(`${path.sep}.git${path.sep}`)
    });
  }
}

export async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}
