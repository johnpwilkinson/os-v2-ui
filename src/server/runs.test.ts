import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { listRuns, normalizeSummary, readRunSnapshot, resolveRepoUrl } from "./runs";

let tmpRoot: string;
let previousArtifactsDir: string | undefined;
let previousRepoUrl: string | undefined;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "runs-test-"));
  previousArtifactsDir = process.env.CHAMBER_ARTIFACTS_DIR;
  process.env.CHAMBER_ARTIFACTS_DIR = tmpRoot;
  previousRepoUrl = process.env.CHAMBER_REPO_URL;
  delete process.env.CHAMBER_REPO_URL;
});

afterEach(async () => {
  if (previousArtifactsDir === undefined) {
    delete process.env.CHAMBER_ARTIFACTS_DIR;
  } else {
    process.env.CHAMBER_ARTIFACTS_DIR = previousArtifactsDir;
  }
  if (previousRepoUrl === undefined) {
    delete process.env.CHAMBER_REPO_URL;
  } else {
    process.env.CHAMBER_REPO_URL = previousRepoUrl;
  }
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

async function makeRunDir(runId: string): Promise<string> {
  const runDir = path.join(tmpRoot, runId);
  await fs.mkdir(runDir, { recursive: true });
  return runDir;
}

describe("listRuns", () => {
  test("orders runs newest-first lexicographically [req:9.5]", async () => {
    await makeRunDir("run-a");
    await makeRunDir("run-b");

    const runs = await listRuns();

    expect(runs.map((r) => r.runId)).toEqual(["run-b", "run-a"]);
  });

  test("excludes .engine-state.json and other dot-entries [req:9.5]", async () => {
    await fs.writeFile(path.join(tmpRoot, ".engine-state.json"), "{}");
    await makeRunDir(".hidden-run");
    await makeRunDir("run-visible");

    const runs = await listRuns();

    expect(runs.map((r) => r.runId)).toEqual(["run-visible"]);
  });

  test("reports finished true only when runner-summary.json exists [req:9.5]", async () => {
    const finishedDir = await makeRunDir("run-finished");
    await fs.writeFile(path.join(finishedDir, "runner-summary.json"), "{}");
    await makeRunDir("run-unfinished");

    const runs = await listRuns();

    expect(runs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ runId: "run-finished", finished: true }),
        expect.objectContaining({ runId: "run-unfinished", finished: false }),
      ]),
    );
  });

  test("reports mtimeMs from the run directory's own mtime, viewer-local (no raw UTC string) [req:7.9]", async () => {
    const runDir = await makeRunDir("run-with-mtime");
    const stats = await fs.stat(runDir);

    const runs = await listRuns();

    expect(runs).toEqual([
      expect.objectContaining({ runId: "run-with-mtime", mtimeMs: stats.mtimeMs }),
    ]);
  });

  test("includes normalized gate, haltKind, outputTokens, and llmHops when runner-summary.json exists [req:2.1]", async () => {
    const runDir = await makeRunDir("run-with-summary");
    await fs.writeFile(
      path.join(runDir, "runner-summary.json"),
      JSON.stringify({
        gate: "gate-a",
        halt_kind: "budget",
        live_output_tokens: 42,
        dispatch_counts: { execCount: 1, llmHops: 7, turboRuns: 0 },
      }),
    );

    const runs = await listRuns();

    expect(runs).toEqual([
      expect.objectContaining({
        runId: "run-with-summary",
        finished: true,
        gate: "gate-a",
        haltKind: "budget",
        outputTokens: 42,
        llmHops: 7,
      }),
    ]);
  });

  test("marks an entry with no runner-summary.json as unfinished, status live, with no summary fields [req:2.2]", async () => {
    await makeRunDir("run-no-summary");

    const runs = await listRuns();

    expect(runs).toEqual([
      expect.objectContaining({ runId: "run-no-summary", finished: false, status: "live" }),
    ]);
    expect(runs[0].gate).toBeUndefined();
    expect(runs[0].haltKind).toBeUndefined();
    expect(runs[0].outputTokens).toBeUndefined();
    expect(runs[0].llmHops).toBeUndefined();
  });

  test("keeps finished true with summary fields undefined for an unreadable/malformed runner-summary.json instead of throwing [req:2.3]", async () => {
    const runDir = await makeRunDir("run-malformed");
    await fs.writeFile(path.join(runDir, "runner-summary.json"), "{not valid json");

    const runs = await listRuns();

    expect(runs).toEqual([
      expect.objectContaining({ runId: "run-malformed", finished: true, status: "passed" }),
    ]);
    expect(runs[0].gate).toBeUndefined();
    expect(runs[0].haltKind).toBeUndefined();
    expect(runs[0].outputTokens).toBeUndefined();
    expect(runs[0].llmHops).toBeUndefined();
  });

  test("derives status halted for finished entries with a non-null haltKind and passed otherwise [req:2.4]", async () => {
    const haltedDir = await makeRunDir("run-halted");
    await fs.writeFile(
      path.join(haltedDir, "runner-summary.json"),
      JSON.stringify({ halt_kind: "gate-fail" }),
    );
    const passedDir = await makeRunDir("run-passed");
    await fs.writeFile(
      path.join(passedDir, "runner-summary.json"),
      JSON.stringify({ halt_kind: null }),
    );

    const runs = await listRuns();

    expect(runs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ runId: "run-halted", finished: true, status: "halted" }),
        expect.objectContaining({ runId: "run-passed", finished: true, status: "passed" }),
      ]),
    );
  });

  test("a well-formed runner-summary.json carries gate, haltKind, outputTokens, llmHops and status passed or halted per halt_kind [req:11.2]", async () => {
    const haltedDir = await makeRunDir("run-well-formed-halted");
    await fs.writeFile(
      path.join(haltedDir, "runner-summary.json"),
      JSON.stringify({
        gate: "gate-halted",
        halt_kind: "budget",
        live_output_tokens: 11,
        dispatch_counts: { execCount: 1, llmHops: 4, turboRuns: 0 },
      }),
    );
    const passedDir = await makeRunDir("run-well-formed-passed");
    await fs.writeFile(
      path.join(passedDir, "runner-summary.json"),
      JSON.stringify({
        gate: "gate-passed",
        halt_kind: null,
        live_output_tokens: 22,
        dispatch_counts: { execCount: 2, llmHops: 9, turboRuns: 1 },
      }),
    );

    const runs = await listRuns();

    expect(runs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          runId: "run-well-formed-halted",
          finished: true,
          status: "halted",
          gate: "gate-halted",
          haltKind: "budget",
          outputTokens: 11,
          llmHops: 4,
        }),
        expect.objectContaining({
          runId: "run-well-formed-passed",
          finished: true,
          status: "passed",
          gate: "gate-passed",
          haltKind: null,
          outputTokens: 22,
          llmHops: 9,
        }),
      ]),
    );
  });

  test("an entry without runner-summary.json is finished false with status live and no summary fields [req:11.2]", async () => {
    await makeRunDir("run-missing-summary");

    const runs = await listRuns();
    const entry = runs.find((r) => r.runId === "run-missing-summary");

    expect(entry).toEqual(expect.objectContaining({ finished: false, status: "live" }));
    expect(entry?.gate).toBeUndefined();
    expect(entry?.haltKind).toBeUndefined();
    expect(entry?.outputTokens).toBeUndefined();
    expect(entry?.llmHops).toBeUndefined();
  });

  test("an entry with malformed JSON in runner-summary.json is finished true with status passed, undefined summary fields, and does not throw [req:11.2]", async () => {
    const runDir = await makeRunDir("run-malformed-summary");
    await fs.writeFile(path.join(runDir, "runner-summary.json"), "{not valid json at all");

    const runs = await listRuns();
    const entry = runs.find((r) => r.runId === "run-malformed-summary");

    expect(entry).toEqual(expect.objectContaining({ finished: true, status: "passed" }));
    expect(entry?.gate).toBeUndefined();
    expect(entry?.haltKind).toBeUndefined();
    expect(entry?.outputTokens).toBeUndefined();
    expect(entry?.llmHops).toBeUndefined();
  });
});

describe("readRunSnapshot", () => {
  test("merges nested turbo-*/journal.jsonl after top-level lines with source tags, counting lineCount from top-level only [req:9.5]", async () => {
    const runDir = await makeRunDir("run-merge");
    await fs.writeFile(
      path.join(runDir, "journal.jsonl"),
      ['{"log":"top1"}', '{"log":"top2"}'].map((l) => `${l}\n`).join(""),
    );
    const turboDir = path.join(runDir, "turbo-x-feat");
    await fs.mkdir(turboDir, { recursive: true });
    await fs.writeFile(path.join(turboDir, "journal.jsonl"), '{"log":"nested1"}\n');

    const result = await readRunSnapshot("run-merge");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lineCount).toBe(2);
    expect(result.lines).toHaveLength(3);
    expect(result.lines[0]).toMatchObject({ kind: "log", text: "top1" });
    expect(result.lines[0].source).toBeUndefined();
    expect(result.lines[1]).toMatchObject({ kind: "log", text: "top2" });
    expect(result.lines[1].source).toBeUndefined();
    expect(result.lines[2]).toMatchObject({ kind: "log", text: "nested1", source: "turbo-x-feat" });
  });

  test("returns { ok: false } without throwing for a missing runId [req:9.5]", async () => {
    await expect(readRunSnapshot("does-not-exist")).resolves.toEqual({ ok: false });
  });

  test("returns { ok: false } for a traversal-shaped runId instead of escaping artifactsRoot [req:9.5]", async () => {
    const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), "runs-traversal-"));
    const root = path.join(sandbox, "artifacts");
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(path.join(sandbox, "journal.jsonl"), '{"log":"outside"}\n');
    process.env.CHAMBER_ARTIFACTS_DIR = root;

    try {
      await expect(readRunSnapshot("../journal.jsonl")).resolves.toEqual({ ok: false });
      await expect(readRunSnapshot("../../etc")).resolves.toEqual({ ok: false });
    } finally {
      await fs.rm(sandbox, { recursive: true, force: true });
    }
  });

  test("reports mtimeMs from the top-level journal.jsonl's own mtime [req:7.9]", async () => {
    const runDir = await makeRunDir("run-with-journal-mtime");
    const journalPath = path.join(runDir, "journal.jsonl");
    await fs.writeFile(journalPath, '{"log":"top1"}\n');
    const stats = await fs.stat(journalPath);

    const result = await readRunSnapshot("run-with-journal-mtime");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mtimeMs).toBe(stats.mtimeMs);
  });
});

describe("resolveRepoUrl", () => {
  test("finds an https github.com URL inside result.json [req:9.5]", async () => {
    const runDir = await makeRunDir("run-https-url");
    await fs.writeFile(
      path.join(runDir, "result.json"),
      JSON.stringify({ remote: "https://github.com/acme/widgets.git" }),
    );

    await expect(resolveRepoUrl("run-https-url")).resolves.toBe("https://github.com/acme/widgets");
  });

  test("normalizes a git@github.com:owner/repo.git SSH remote in result.json [req:9.5]", async () => {
    const runDir = await makeRunDir("run-ssh-url");
    await fs.writeFile(
      path.join(runDir, "result.json"),
      JSON.stringify({ remote: "git@github.com:acme/widgets.git" }),
    );

    await expect(resolveRepoUrl("run-ssh-url")).resolves.toBe("https://github.com/acme/widgets");
  });

  test("falls back to CHAMBER_REPO_URL when result.json has no github URL [req:9.5]", async () => {
    await makeRunDir("run-no-url");
    process.env.CHAMBER_REPO_URL = "https://github.com/acme/fallback";

    await expect(resolveRepoUrl("run-no-url")).resolves.toBe("https://github.com/acme/fallback");
  });

  test("returns null when there is no result.json and no CHAMBER_REPO_URL fallback [req:9.5]", async () => {
    await makeRunDir("run-nothing");

    await expect(resolveRepoUrl("run-nothing")).resolves.toBeNull();
  });

  test("does not escape artifactsRoot for a traversal-shaped runId [req:9.5]", async () => {
    const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), "runs-traversal-"));
    const root = path.join(sandbox, "artifacts");
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(
      path.join(sandbox, "result.json"),
      JSON.stringify({ remote: "https://github.com/acme/leaked.git" }),
    );
    process.env.CHAMBER_ARTIFACTS_DIR = root;

    try {
      await expect(resolveRepoUrl("../result.json")).resolves.toBeNull();
    } finally {
      await fs.rm(sandbox, { recursive: true, force: true });
    }
  });
});

describe("normalizeSummary", () => {
  test("maps the driver dispatch_counts shape and the child-era count shape to the same normalized fields [req:9.5]", () => {
    const driverShape = normalizeSummary({
      dispatch_counts: { execCount: 5, llmHops: 3, turboRuns: 2 },
      gate: "gate-1",
      halt_kind: null,
      error: "boom",
      live_output_tokens: 10,
      live_input_tokens: 20,
    });

    expect(driverShape).toEqual({
      execCount: 5,
      llmHops: 3,
      turboRuns: 2,
      gate: "gate-1",
      halt_kind: null,
      error: "boom",
      live_output_tokens: 10,
      live_input_tokens: 20,
    });

    const childEraShape = normalizeSummary({ exec: 0, llm_live: 15, llm_replayed: 0 });

    expect(childEraShape).toEqual({
      execCount: 0,
      llmHops: 15,
      turboRuns: null,
      gate: undefined,
      halt_kind: undefined,
      error: undefined,
      live_output_tokens: undefined,
      live_input_tokens: undefined,
    });
  });

  test("folds child-era llm_replayed into llmHops alongside llm_live [req:9.5]", () => {
    const childEraShape = normalizeSummary({ exec: 2, llm_live: 15, llm_replayed: 4 });

    expect(childEraShape).toMatchObject({
      execCount: 2,
      llmHops: 19,
      turboRuns: null,
    });
  });
});
