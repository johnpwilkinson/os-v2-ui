import type { ConsoleRun, ConsoleState } from "./types";

export const FIXTURE_STATE_ACTIVE: ConsoleState = {
  ts: "2026-07-17T12:00:00.000Z",
  engine: {
    active: true,
    phase: "planning",
    repo: "os-v2-ui",
    feature: "console-state-panel",
    runId: "run-42",
  },
  optimalNext: "Ship the console state panel",
  decisions: [
    {
      id: "dec-1",
      kind: "verdict",
      repo: "os-v2-ui",
      feature: "console-state-panel",
      runId: "run-42",
      title: "Parser review",
      recommendation: "Fix the malformed-entry tolerance before merge",
      ts: "2026-07-17T11:55:00.000Z",
      expiresAt: "2026-07-17T13:55:00.000Z",
    },
    {
      id: "dec-2",
      kind: "halt",
      repo: "os-v2-ui",
      feature: "console-state-panel",
      runId: "run-43",
      title: "Bridge unreachable",
      recommendation: "Investigate bridge connectivity",
      ts: "2026-07-17T11:58:00.000Z",
      expiresAt: "2026-07-17T12:58:00.000Z",
    },
  ],
  watchQueueDepth: 2,
  repos: {
    "os-v2-ui": { class: "primary", watched: true, driver: true },
    "chamber-bridge": { class: "support", watched: true, driver: false },
  },
  runs: {
    "os-v2-ui": { active: true, phase: "planning", feature: "console-state-panel", runId: "run-42" },
  },
};

export const FIXTURE_STATE_IDLE: ConsoleState = {
  ts: "2026-07-17T12:00:00.000Z",
  engine: null,
  optimalNext: "Idle — no pending work",
  decisions: [],
  watchQueueDepth: 0,
  repos: {
    "os-v2-ui": { class: "primary", watched: true, driver: false },
  },
  runs: {},
};

export const FIXTURE_STATE_MULTI_RUN: ConsoleState = {
  ts: "2026-07-17T12:00:00.000Z",
  engine: {
    active: true,
    phase: "planning",
    repo: "os-v2-ui",
    feature: "console-state-panel",
    runId: "run-42",
  },
  optimalNext: "Ship the console multi-run board",
  decisions: [],
  watchQueueDepth: 0,
  repos: {
    "os-v2-ui": { class: "primary", watched: true, driver: true },
    "chamber-bridge": { class: "support", watched: true, driver: false },
  },
  runs: {
    sim: { active: true, phase: "planning", feature: "console-multi-run", runId: "run-42" },
    ui: { active: true, phase: "review", feature: "runs-board", runId: "run-43" },
  } satisfies Record<string, ConsoleRun>,
};

export const FIXTURE_RAW_MALFORMED: unknown = {
  ts: "2026-07-17T12:00:00.000Z",
  optimalNext: "Idle",
  decisions: "not-an-array",
  repos: {},
};

export const FIXTURE_RAW_LEGACY_NO_RUNS: unknown = {
  ts: "2026-07-17T12:00:00.000Z",
  engine: null,
  optimalNext: "Idle — no pending work",
  decisions: [],
  watchQueueDepth: 0,
  repos: {
    "os-v2-ui": { class: "primary", watched: true, driver: false },
  },
};
