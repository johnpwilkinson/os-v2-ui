import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { appRouter } from "./api";

let tmpRoot: string;
let previousArtifactsDir: string | undefined;
let previousRepoUrl: string | undefined;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "api-test-"));
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

describe("appRouter.runs.get", () => {
  test("merges the run snapshot with the resolved repoUrl for a found run [req:9.5]", async () => {
    const runDir = path.join(tmpRoot, "run-found");
    await fs.mkdir(runDir, { recursive: true });
    await fs.writeFile(path.join(runDir, "journal.jsonl"), '{"log":"hello"}\n');
    await fs.writeFile(
      path.join(runDir, "result.json"),
      JSON.stringify({ remote: "https://github.com/acme/widgets.git" }),
    );

    const caller = appRouter.createCaller({});
    const result = await caller.runs.get({ runId: "run-found" });

    expect(result.ok).toBe(true);
    expect(result.repoUrl).toBe("https://github.com/acme/widgets");
  });

  test("still merges repoUrl onto an { ok: false } snapshot for a missing run [req:9.5]", async () => {
    process.env.CHAMBER_REPO_URL = "https://github.com/acme/fallback";

    const caller = appRouter.createCaller({});
    const result = await caller.runs.get({ runId: "does-not-exist" });

    expect(result.ok).toBe(false);
    expect(result.repoUrl).toBe("https://github.com/acme/fallback");
  });
});
