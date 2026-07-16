import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { isTrackedEnvelope } from "@trpc/server";
import * as chokidar from "chokidar";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { tailJournal } from "./journal-tail";

let tmpRoot: string;
let runId: string;
let runDir: string;
let previousArtifactsDir: string | undefined;
let previousStallMinutes: string | undefined;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "journal-tail-"));
  runId = "run-abc";
  runDir = path.join(tmpRoot, runId);
  await fs.mkdir(runDir, { recursive: true });

  previousArtifactsDir = process.env.CHAMBER_ARTIFACTS_DIR;
  previousStallMinutes = process.env.STALL_QUIET_MINUTES;
  process.env.CHAMBER_ARTIFACTS_DIR = tmpRoot;
});

afterEach(async () => {
  vi.useRealTimers();
  vi.restoreAllMocks();

  if (previousArtifactsDir === undefined) {
    delete process.env.CHAMBER_ARTIFACTS_DIR;
  } else {
    process.env.CHAMBER_ARTIFACTS_DIR = previousArtifactsDir;
  }
  if (previousStallMinutes === undefined) {
    delete process.env.STALL_QUIET_MINUTES;
  } else {
    process.env.STALL_QUIET_MINUTES = previousStallMinutes;
  }

  await fs.rm(tmpRoot, { recursive: true, force: true });
});

async function writeJournal(lines: string[]): Promise<void> {
  await fs.writeFile(path.join(runDir, "journal.jsonl"), lines.map((l) => `${l}\n`).join(""));
}

describe("tailJournal", () => {
  test("replays existing lines as tracked events keyed by zero-based index [req:4.1]", async () => {
    await writeJournal(['{"log":"a"}', '{"log":"b"}']);
    const controller = new AbortController();

    const generator = tailJournal(runId, null, controller.signal);
    try {
      const first = await generator.next();
      expect(isTrackedEnvelope(first.value)).toBe(true);
      if (isTrackedEnvelope(first.value)) {
        expect(first.value[0]).toBe("0");
        expect(first.value[1]).toMatchObject({ type: "line", index: 0 });
      }

      const second = await generator.next();
      expect(isTrackedEnvelope(second.value)).toBe(true);
      if (isTrackedEnvelope(second.value)) {
        expect(second.value[0]).toBe("1");
        expect(second.value[1]).toMatchObject({ type: "line", index: 1 });
      }

      const statusResult = await generator.next();
      expect(isTrackedEnvelope(statusResult.value)).toBe(false);
      expect(statusResult.value).toMatchObject({ type: "status", finished: false });
    } finally {
      controller.abort();
      await generator.return(undefined);
    }
  });

  test("resumes from lastEventId, replaying only lines with a greater index [req:4.2]", async () => {
    await writeJournal(['{"log":"a"}', '{"log":"b"}', '{"log":"c"}']);
    const controller = new AbortController();

    const generator = tailJournal(runId, "0", controller.signal);
    try {
      const first = await generator.next();
      expect(isTrackedEnvelope(first.value)).toBe(true);
      if (isTrackedEnvelope(first.value)) {
        expect(first.value[0]).toBe("1");
        expect(first.value[1]).toMatchObject({ type: "line", index: 1 });
      }

      const second = await generator.next();
      expect(isTrackedEnvelope(second.value)).toBe(true);
      if (isTrackedEnvelope(second.value)) {
        expect(second.value[0]).toBe("2");
        expect(second.value[1]).toMatchObject({ type: "line", index: 2 });
      }
    } finally {
      controller.abort();
      await generator.return(undefined);
    }
  });

  test("replays all lines from index 0 when lastEventId is non-numeric, instead of dropping them [req:4.2]", async () => {
    await writeJournal(['{"log":"a"}', '{"log":"b"}']);
    const controller = new AbortController();

    const generator = tailJournal(runId, "not-a-number", controller.signal);
    try {
      const first = await generator.next();
      expect(isTrackedEnvelope(first.value)).toBe(true);
      if (isTrackedEnvelope(first.value)) {
        expect(first.value[0]).toBe("0");
        expect(first.value[1]).toMatchObject({ type: "line", index: 0 });
      }

      const second = await generator.next();
      expect(isTrackedEnvelope(second.value)).toBe(true);
      if (isTrackedEnvelope(second.value)) {
        expect(second.value[0]).toBe("1");
        expect(second.value[1]).toMatchObject({ type: "line", index: 1 });
      }
    } finally {
      controller.abort();
      await generator.return(undefined);
    }
  });

  test("status event carries journal mtimeMs, finished flag from runner-summary.json, and env-derived stall threshold [req:4.3]", async () => {
    process.env.STALL_QUIET_MINUTES = "5";
    await writeJournal(['{"log":"a"}']);
    await fs.writeFile(path.join(runDir, "runner-summary.json"), "{}");
    const stat = await fs.stat(path.join(runDir, "journal.jsonl"));
    const controller = new AbortController();

    const generator = tailJournal(runId, null, controller.signal);
    try {
      await generator.next(); // line 0
      const statusResult = await generator.next();
      expect(statusResult.value).toMatchObject({
        type: "status",
        finished: true,
        mtimeMs: stat.mtimeMs,
        stallAfterMs: 5 * 60_000,
      });
    } finally {
      controller.abort();
      await generator.return(undefined);
    }
  });

  test("yields a tracked line and a status event when a new complete line is appended [req:4.1] [req:4.3]", async () => {
    await writeJournal(['{"log":"a"}']);
    const controller = new AbortController();

    const generator = tailJournal(runId, null, controller.signal);
    try {
      await generator.next(); // initial line 0
      await generator.next(); // initial status

      await fs.appendFile(path.join(runDir, "journal.jsonl"), '{"log":"b"}\n');

      const lineEvent = await generator.next();
      expect(isTrackedEnvelope(lineEvent.value)).toBe(true);
      if (isTrackedEnvelope(lineEvent.value)) {
        expect(lineEvent.value[0]).toBe("1");
        expect(lineEvent.value[1]).toMatchObject({ type: "line", index: 1 });
      }

      const statusEvent = await generator.next();
      expect(isTrackedEnvelope(statusEvent.value)).toBe(false);
      expect(statusEvent.value).toMatchObject({ type: "status" });
    } finally {
      controller.abort();
      await generator.return(undefined);
    }
  }, 10_000);

  test("buffers a partial trailing line until its closing newline arrives, then emits exactly one line for it [req:4.1]", async () => {
    await writeJournal(['{"log":"a"}']);
    const controller = new AbortController();

    const generator = tailJournal(runId, null, controller.signal);
    try {
      await generator.next(); // initial line 0
      await generator.next(); // initial status

      await fs.appendFile(path.join(runDir, "journal.jsonl"), '{"log":"partial"');

      const afterPartialAppend = await generator.next();
      expect(isTrackedEnvelope(afterPartialAppend.value)).toBe(false);
      expect(afterPartialAppend.value).toMatchObject({ type: "status" });

      // A brief pause ensures the closing write below is observed by the
      // watcher as a distinct change from the partial write above, rather
      // than the two being coalesced by filesystem mtime granularity.
      await new Promise((resolve) => setTimeout(resolve, 50));

      await fs.appendFile(path.join(runDir, "journal.jsonl"), '}\n');

      const lineEvent = await generator.next();
      expect(isTrackedEnvelope(lineEvent.value)).toBe(true);
      if (isTrackedEnvelope(lineEvent.value)) {
        expect(lineEvent.value[0]).toBe("1");
        expect(lineEvent.value[1]).toMatchObject({
          type: "line",
          index: 1,
          line: { kind: "log", text: "partial" },
        });
      }

      const statusEvent = await generator.next();
      expect(isTrackedEnvelope(statusEvent.value)).toBe(false);
      expect(statusEvent.value).toMatchObject({ type: "status" });
    } finally {
      controller.abort();
      await generator.return(undefined);
    }
  }, 20_000);

  test("yields an untracked status event at least every 15 seconds with no file activity [req:4.3]", async () => {
    await writeJournal(['{"log":"a"}']);
    const controller = new AbortController();
    vi.useFakeTimers();

    const generator = tailJournal(runId, null, controller.signal);
    try {
      await generator.next(); // initial line 0
      await generator.next(); // initial status

      const nextPromise = generator.next();
      await vi.advanceTimersByTimeAsync(15_000);
      const tickResult = await nextPromise;

      expect(isTrackedEnvelope(tickResult.value)).toBe(false);
      expect(tickResult.value).toMatchObject({ type: "status" });
    } finally {
      vi.useRealTimers();
      controller.abort();
      await generator.return(undefined);
    }
  });

  test("closes the chokidar watcher on abort and does not leak watchers across reconnects [req:4.4]", async () => {
    await writeJournal(['{"log":"a"}']);
    const closeSpy = vi.spyOn(chokidar.FSWatcher.prototype, "close");

    const controllerA = new AbortController();
    const generatorA = tailJournal(runId, null, controllerA.signal);
    await generatorA.next();
    await generatorA.next();
    controllerA.abort();
    await generatorA.next();
    expect(closeSpy).toHaveBeenCalledTimes(1);

    const controllerB = new AbortController();
    const generatorB = tailJournal(runId, null, controllerB.signal);
    await generatorB.next();
    await generatorB.next();
    controllerB.abort();
    await generatorB.next();
    expect(closeSpy).toHaveBeenCalledTimes(2);
  });

  test("ends immediately for a traversal-shaped runId instead of escaping artifactsRoot [req:9.5]", async () => {
    const controller = new AbortController();

    const generator = tailJournal("../journal.jsonl", null, controller.signal);
    try {
      const result = await generator.next();
      expect(result.done).toBe(true);
    } finally {
      controller.abort();
      await generator.return(undefined);
    }
  });

  test("makes no HTTP request to chamber-bridge or any engine endpoint [req:8.3]", async () => {
    await writeJournal(['{"log":"a"}']);
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const controller = new AbortController();

    const generator = tailJournal(runId, null, controller.signal);
    try {
      await generator.next();
      await generator.next();
      await fs.appendFile(path.join(runDir, "journal.jsonl"), '{"log":"b"}\n');
      await generator.next();
      await generator.next();
    } finally {
      controller.abort();
      await generator.return(undefined);
    }

    expect(fetchSpy).not.toHaveBeenCalled();
  }, 10_000);
});
