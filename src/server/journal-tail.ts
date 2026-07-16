import { promises as fs } from "node:fs";
import path from "node:path";
import { tracked } from "@trpc/server";
import { watch as watchFile, type FSWatcher } from "chokidar";
import { classifyLine } from "@/lib/journal/parse";
import type { JournalLine } from "@/lib/journal/types";
import { artifactsRoot } from "@/server/runs";

const STATUS_INTERVAL_MS = 15_000;

export interface JournalTailLineEvent {
  type: "line";
  index: number;
  line: JournalLine;
}

export interface JournalTailStatusEvent {
  type: "status";
  mtimeMs: number;
  finished: boolean;
  stallAfterMs: number;
}

type QueueSignal = "change" | "tick" | "abort";

function createSignalQueue() {
  const pending: QueueSignal[] = [];
  let wake: (() => void) | null = null;

  return {
    push(signal: QueueSignal) {
      pending.push(signal);
      if (wake) {
        const resolve = wake;
        wake = null;
        resolve();
      }
    },
    async next(): Promise<QueueSignal> {
      while (pending.length === 0) {
        await new Promise<void>((resolve) => {
          wake = resolve;
        });
      }
      return pending.shift() as QueueSignal;
    },
  };
}

async function statMtimeMs(target: string): Promise<number> {
  try {
    return (await fs.stat(target)).mtimeMs;
  } catch {
    return 0;
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

export async function* tailJournal(
  runId: string,
  lastEventId: string | null | undefined,
  signal: AbortSignal | undefined,
): AsyncGenerator<
  ReturnType<typeof tracked<JournalTailLineEvent>> | JournalTailStatusEvent
> {
  const runDir = path.join(artifactsRoot(), runId);
  const journalPath = path.join(runDir, "journal.jsonl");
  const summaryPath = path.join(runDir, "runner-summary.json");
  const stallAfterMs = Number(process.env.STALL_QUIET_MINUTES ?? 10) * 60_000;
  const resumeAfter = lastEventId != null ? Number(lastEventId) : -1;

  let offset = 0;
  let pendingBytes = Buffer.alloc(0);
  let nextIndex = 0;

  async function readNewLines(): Promise<string[]> {
    let size: number;
    try {
      size = (await fs.stat(journalPath)).size;
    } catch {
      return [];
    }
    if (size <= offset) {
      return [];
    }
    const length = size - offset;
    const chunk = Buffer.alloc(length);
    const handle = await fs.open(journalPath, "r");
    try {
      await handle.read(chunk, 0, length, offset);
    } finally {
      await handle.close();
    }
    offset += length;
    pendingBytes = Buffer.concat([pendingBytes, chunk]);

    const lines: string[] = [];
    let start = 0;
    let newlineIndex = pendingBytes.indexOf(0x0a, start);
    while (newlineIndex !== -1) {
      lines.push(pendingBytes.subarray(start, newlineIndex).toString("utf8"));
      start = newlineIndex + 1;
      newlineIndex = pendingBytes.indexOf(0x0a, start);
    }
    pendingBytes = pendingBytes.subarray(start);
    return lines;
  }

  async function currentStatus(): Promise<JournalTailStatusEvent> {
    const [mtimeMs, finished] = await Promise.all([
      statMtimeMs(journalPath),
      fileExists(summaryPath),
    ]);
    return { type: "status", mtimeMs, finished, stallAfterMs };
  }

  const queue = createSignalQueue();
  const onAbort = () => queue.push("abort");
  signal?.addEventListener("abort", onAbort);

  let watcher: FSWatcher | undefined = watchFile(journalPath, {
    ignoreInitial: true,
  });
  watcher.on("all", (event) => {
    if (event === "change" || event === "add") {
      queue.push("change");
    }
  });
  watcher.on("error", () => {
    // journal watching errors are surfaced via status polling; ignore here
  });

  let timer: ReturnType<typeof setInterval> | undefined = setInterval(() => {
    queue.push("tick");
  }, STATUS_INTERVAL_MS);

  async function cleanup() {
    signal?.removeEventListener("abort", onAbort);
    if (timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
    if (watcher !== undefined) {
      const toClose = watcher;
      watcher = undefined;
      await toClose.close();
    }
  }

  try {
    const initialLines = await readNewLines();
    for (const raw of initialLines) {
      const index = nextIndex++;
      if (index > resumeAfter) {
        yield tracked(String(index), {
          type: "line",
          index,
          line: classifyLine(raw),
        });
      }
    }

    if (signal?.aborted) {
      return;
    }

    yield await currentStatus();

    while (!signal?.aborted) {
      const item = await queue.next();
      if (item === "abort" || signal?.aborted) {
        return;
      }

      if (item === "change") {
        const newLines = await readNewLines();
        for (const raw of newLines) {
          const index = nextIndex++;
          yield tracked(String(index), {
            type: "line",
            index,
            line: classifyLine(raw),
          });
        }
      }

      yield await currentStatus();
    }
  } finally {
    await cleanup();
  }
}
