import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { parseConsoleState } from "./parse";
import {
  FIXTURE_RAW_LEGACY_NO_RUNS,
  FIXTURE_RAW_MALFORMED,
  FIXTURE_STATE_ACTIVE,
  FIXTURE_STATE_MULTI_RUN,
} from "./fixtures";

describe("parseConsoleState", () => {
  test("round-trips a valid fixture field-for-field [req:1.4]", () => {
    const result = parseConsoleState(FIXTURE_STATE_ACTIVE);
    expect(result).toEqual(FIXTURE_STATE_ACTIVE);
  });

  test("rejects a malformed top level as null [req:1.4]", () => {
    expect(parseConsoleState(FIXTURE_RAW_MALFORMED)).toBeNull();
  });

  test("ignores unknown extra fields at the top level, on decisions, and on repos [req:1.4]", () => {
    const raw = {
      ...FIXTURE_STATE_ACTIVE,
      unknownTopLevelField: "ignore-me",
      decisions: [
        { ...FIXTURE_STATE_ACTIVE.decisions[0], unknownDecisionField: "ignore-me" },
      ],
      repos: {
        "os-v2-ui": { ...FIXTURE_STATE_ACTIVE.repos["os-v2-ui"], unknownRepoField: "ignore-me" },
      },
    };
    const result = parseConsoleState(raw);
    expect(result).not.toBeNull();
    expect(result?.decisions).toEqual([FIXTURE_STATE_ACTIVE.decisions[0]]);
    expect(result?.repos).toEqual({ "os-v2-ui": FIXTURE_STATE_ACTIVE.repos["os-v2-ui"] });
  });

  test("drops an individually malformed decision entry while keeping the valid remainder [req:1.5]", () => {
    const validDecision = FIXTURE_STATE_ACTIVE.decisions[0];
    const malformedDecision = { id: "dec-bad", kind: "verdict" }; // missing title/recommendation/ts/expiresAt
    const raw = {
      ...FIXTURE_STATE_ACTIVE,
      decisions: [validDecision, malformedDecision],
    };
    const result = parseConsoleState(raw);
    expect(result).not.toBeNull();
    expect(result?.decisions).toEqual([validDecision]);
  });

  test("parses a non-object engine field as null [req:1.4]", () => {
    const raw = { ...FIXTURE_STATE_ACTIVE, engine: undefined };
    const result = parseConsoleState(raw);
    expect(result?.engine).toBeNull();
  });

  test("coerces a non-numeric watchQueueDepth to 0 [req:1.4]", () => {
    const raw = { ...FIXTURE_STATE_ACTIVE, watchQueueDepth: "not-a-number" };
    const result = parseConsoleState(raw);
    expect(result?.watchQueueDepth).toBe(0);
  });

  test("parses each runs entry into a ConsoleRun keyed by its repo alias [req:1.1]", () => {
    const result = parseConsoleState(FIXTURE_STATE_MULTI_RUN);
    expect(result).not.toBeNull();
    expect(result?.runs).toEqual(FIXTURE_STATE_MULTI_RUN.runs);
    expect(result?.runs.sim).toEqual({ active: true, phase: "planning", feature: "console-multi-run", runId: "run-42" });
    expect(result?.runs.ui).toEqual({ active: true, phase: "review", feature: "runs-board", runId: "run-43" });
  });

  test("yields an empty runs map when the runs field is absent, while the rest of the state parses unchanged [req:1.2]", () => {
    const result = parseConsoleState(FIXTURE_RAW_LEGACY_NO_RUNS);
    expect(result).not.toBeNull();
    expect(result?.runs).toEqual({});
    expect(result?.optimalNext).toBe("Idle — no pending work");
    expect(result?.repos).toEqual({ "os-v2-ui": { class: "primary", watched: true, driver: false } });
  });

  test("yields an empty runs map when the runs field is not a plain object [req:1.2]", () => {
    const raw = { ...FIXTURE_STATE_ACTIVE, runs: "not-an-object" };
    const result = parseConsoleState(raw);
    expect(result).not.toBeNull();
    expect(result?.runs).toEqual({});
  });

  test("drops an individually malformed runs entry while retaining every well-formed entry [req:1.3]", () => {
    const raw = {
      ...FIXTURE_STATE_ACTIVE,
      runs: {
        "os-v2-ui": { active: true, phase: "planning", feature: "console-state-panel", runId: "run-42" },
        "chamber-bridge": "not-an-object",
      },
    };
    const result = parseConsoleState(raw);
    expect(result).not.toBeNull();
    expect(result?.runs).toEqual({
      "os-v2-ui": { active: true, phase: "planning", feature: "console-state-panel", runId: "run-42" },
    });
  });

  test("tolerates both watch and watched spellings on repo entries [req:1.5]", () => {
    const raw = {
      ...FIXTURE_STATE_ACTIVE,
      repos: {
        "spelled-watched": { class: "primary", watched: true, driver: false },
        "spelled-watch": { class: "primary", watch: true, driver: false },
        "spelled-neither": { class: "primary", driver: false },
      },
    };
    const result = parseConsoleState(raw);
    expect(result).not.toBeNull();
    expect(result?.repos["spelled-watched"].watched).toBe(true);
    expect(result?.repos["spelled-watch"].watched).toBe(true);
    expect(result?.repos["spelled-neither"].watched).toBe(false);
  });
});

describe("src/lib/console import graph [req:4.3]", () => {
  test("no module in src/lib/console imports from src/server or src/components", () => {
    const dir = import.meta.dirname;
    const sourceFiles = readdirSync(dir).filter(
      (name) => (name.endsWith(".ts") || name.endsWith(".tsx")) && !name.endsWith(".test.ts") && !name.endsWith(".test.tsx"),
    );
    expect(sourceFiles.length).toBeGreaterThan(0);

    const forbiddenImportPattern = /from\s+["'](?:@\/server|@\/components|\.\.\/\.\.\/server|\.\.\/\.\.\/components)/;
    for (const file of sourceFiles) {
      const contents = readFileSync(path.join(dir, file), "utf8");
      expect(contents, `${file} must not import from src/server or src/components`).not.toMatch(forbiddenImportPattern);
    }
  });
});
