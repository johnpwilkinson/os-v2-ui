import { promises as fs, type Dirent } from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseJournal } from "@/lib/journal/parse";
import type { NormalizedSummary, RunJournalLine } from "@/lib/journal/types";

export interface RunListEntry {
  runId: string;
  finished: boolean;
}

export interface EngineState {
  phase?: string;
  [key: string]: unknown;
}

export type { RunJournalLine } from "@/lib/journal/types";

export type ReadRunSnapshotResult =
  | { ok: false }
  | {
      ok: true;
      lines: RunJournalLine[];
      lineCount: number;
      finished: boolean;
      summary?: NormalizedSummary;
      engineState: EngineState | null;
    };

export function artifactsRoot(): string {
  const envDir = process.env.CHAMBER_ARTIFACTS_DIR;
  if (envDir && envDir.length > 0) {
    return envDir;
  }
  return path.join(os.homedir(), "chamber-artifacts");
}

async function isDirectory(target: string): Promise<boolean> {
  try {
    const stats = await fs.stat(target);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function fileExists(target: string): Promise<boolean> {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

async function readFileOrEmpty(target: string): Promise<string> {
  try {
    return await fs.readFile(target, "utf8");
  } catch {
    return "";
  }
}

async function readDirEntries(target: string): Promise<Dirent[]> {
  try {
    return await fs.readdir(target, { withFileTypes: true });
  } catch {
    return [];
  }
}

export async function listRuns(): Promise<RunListEntry[]> {
  const root = artifactsRoot();
  const entries = await readDirEntries(root);

  const runIds = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  return Promise.all(
    runIds.map(async (runId) => ({
      runId,
      finished: await fileExists(path.join(root, runId, "runner-summary.json")),
    })),
  );
}

export function normalizeSummary(json: unknown): NormalizedSummary {
  const record = (json && typeof json === "object" ? json : {}) as Record<string, unknown>;
  const dispatchCounts =
    record.dispatch_counts && typeof record.dispatch_counts === "object"
      ? (record.dispatch_counts as Record<string, unknown>)
      : null;

  let execCount: number | undefined;
  let llmHops: number | undefined;
  let turboRuns: number | null = null;

  if (dispatchCounts) {
    execCount = typeof dispatchCounts.execCount === "number" ? dispatchCounts.execCount : undefined;
    llmHops = typeof dispatchCounts.llmHops === "number" ? dispatchCounts.llmHops : undefined;
    turboRuns = typeof dispatchCounts.turboRuns === "number" ? dispatchCounts.turboRuns : null;
  } else {
    execCount = typeof record.exec === "number" ? record.exec : undefined;
    const llmLive = typeof record.llm_live === "number" ? record.llm_live : undefined;
    const llmReplayed = typeof record.llm_replayed === "number" ? record.llm_replayed : undefined;
    llmHops = llmLive === undefined && llmReplayed === undefined ? undefined : (llmLive ?? 0) + (llmReplayed ?? 0);
  }

  return {
    execCount,
    llmHops,
    turboRuns,
    gate: typeof record.gate === "string" ? record.gate : undefined,
    halt_kind: record.halt_kind === null || typeof record.halt_kind === "string" ? record.halt_kind : undefined,
    error: typeof record.error === "string" ? record.error : undefined,
    live_output_tokens: typeof record.live_output_tokens === "number" ? record.live_output_tokens : undefined,
    live_input_tokens: typeof record.live_input_tokens === "number" ? record.live_input_tokens : undefined,
  };
}

export async function readEngineState(): Promise<EngineState | null> {
  const target = path.join(artifactsRoot(), ".engine-state.json");
  try {
    const raw = await fs.readFile(target, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as EngineState;
    }
    return null;
  } catch {
    return null;
  }
}

export async function readRunSnapshot(runId: string): Promise<ReadRunSnapshotResult> {
  const root = artifactsRoot();
  const runDir = path.join(root, runId);

  if (!(await isDirectory(runDir))) {
    return { ok: false };
  }

  const topLines: RunJournalLine[] = parseJournal(await readFileOrEmpty(path.join(runDir, "journal.jsonl")));

  const subEntries = await readDirEntries(runDir);
  const turboDirs = subEntries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("turbo-"))
    .map((entry) => entry.name)
    .sort();

  const turboLines: RunJournalLine[] = [];
  for (const dirName of turboDirs) {
    const text = await readFileOrEmpty(path.join(runDir, dirName, "journal.jsonl"));
    for (const line of parseJournal(text)) {
      turboLines.push({ ...line, source: dirName });
    }
  }

  const finished = await fileExists(path.join(runDir, "runner-summary.json"));
  let summary: NormalizedSummary | undefined;
  if (finished) {
    const raw = await readFileOrEmpty(path.join(runDir, "runner-summary.json"));
    try {
      summary = normalizeSummary(JSON.parse(raw));
    } catch {
      summary = undefined;
    }
  }

  const engineState = await readEngineState();

  return {
    ok: true,
    lines: [...topLines, ...turboLines],
    lineCount: topLines.length,
    finished,
    summary,
    engineState,
  };
}

function scanForGithubUrl(value: unknown): string | null {
  if (typeof value === "string") {
    const match = value.match(/github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/"\s]|$)/);
    if (match) {
      return `https://github.com/${match[1]}/${match[2]}`;
    }
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = scanForGithubUrl(item);
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) {
      const found = scanForGithubUrl(nested);
      if (found) return found;
    }
    return null;
  }
  return null;
}

export async function resolveRepoUrl(runId: string): Promise<string | null> {
  const resultPath = path.join(artifactsRoot(), runId, "result.json");
  try {
    const raw = await fs.readFile(resultPath, "utf8");
    const parsed: unknown = JSON.parse(raw);
    const found = scanForGithubUrl(parsed);
    if (found) {
      return found;
    }
  } catch {
    // fall through to env fallback
  }
  return process.env.CHAMBER_REPO_URL ?? null;
}
