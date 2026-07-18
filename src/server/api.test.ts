import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { FIXTURE_STATE_ACTIVE } from "@/lib/console/fixtures";
import { fetchConsoleState } from "./console";
import { appRouter } from "./api";

vi.mock("./console", () => ({
  fetchConsoleState: vi.fn(),
}));

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

describe("appRouter.console.state", () => {
  test("passes through a bridge fetch failure [req:1.3]", async () => {
    vi.mocked(fetchConsoleState).mockResolvedValue({
      ok: false,
      error: "bridge unreachable: timeout",
    });

    const caller = appRouter.createCaller({});
    const result = await caller.console.state();

    expect(result).toEqual({ ok: false, error: "bridge unreachable: timeout" });
  });

  test("rejects a malformed payload with 'malformed console state' [req:1.4]", async () => {
    vi.mocked(fetchConsoleState).mockResolvedValue({ ok: true, raw: { not: "valid" } });

    const caller = appRouter.createCaller({});
    const result = await caller.console.state();

    expect(result).toEqual({ ok: false, error: "malformed console state" });
  });

  test("resolves the parsed state on a well-formed payload [req:1.4]", async () => {
    vi.mocked(fetchConsoleState).mockResolvedValue({ ok: true, raw: FIXTURE_STATE_ACTIVE });

    const caller = appRouter.createCaller({});
    const result = await caller.console.state();

    expect(result).toEqual({ ok: true, state: FIXTURE_STATE_ACTIVE });
  });
});
