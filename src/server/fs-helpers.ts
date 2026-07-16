import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Joins `segments` onto `root` and returns the resolved path only if it stays
 * within `root`. Returns null for traversal-shaped input (e.g. "../../etc")
 * instead of resolving outside the root.
 */
export function resolveWithinRoot(root: string, ...segments: string[]): string | null {
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, ...segments);
  if (target !== resolvedRoot && !target.startsWith(resolvedRoot + path.sep)) {
    return null;
  }
  return target;
}

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
