import { promises as fs } from "node:fs";

export async function fileExists(target: string): Promise<boolean> {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

export async function mtimeMsOf(target: string): Promise<number> {
  try {
    const stats = await fs.stat(target);
    return stats.mtimeMs;
  } catch {
    return 0;
  }
}
