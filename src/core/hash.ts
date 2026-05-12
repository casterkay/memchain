import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export function sha256Text(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export async function sha256File(path: string): Promise<string> {
  return `sha256:${createHash("sha256").update(await readFile(path)).digest("hex")}`;
}

export function canonicalJson(value: unknown): string {
  return `${JSON.stringify(value, Object.keys(value as object).sort(), 2)}\n`;
}
