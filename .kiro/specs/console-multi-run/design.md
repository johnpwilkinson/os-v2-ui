# Console Multi-Run Board — Design

## Overview

Wave F (agents repo, accepted design 2026-07-18) removed the chamber engine's
one-run-at-a-time lock: `/console/state` now serves a `runs` object — one
engine status body per repo alias — alongside the legacy `engine` field, which
degraded to a derived summary (`{active:true, phase:"multi", count}` when
several runs are active). The deployed CRT panel renders only the legacy
field, so the moment the factory does the thing Wave F built it to do, the
panel shows `MULTI :: —/—` — honest but blind.

This feature makes the panel concurrency-native. Settled decisions (operator
pair-pick session, 2026-07-18):

- The `[ ENGINE ]` cell is REPLACED by a `[ RUNS ]` board rendering one row
  per repo alias from the parsed `runs` map: alias, phase, feature, runId.
- Active rows render in the panel's primary glow treatment; inactive rows
  render dimmed. Active rows sort before inactive; alias-alphabetical within
  each group. Rationale: two concurrent builds must be readable at a glance
  from across the room — the board is the rider's own instrument.
- Legacy fallback is a hard requirement, not a nicety: when the `runs` map is
  empty or the field is absent (a pre-Wave-F bridge), the board renders the
  legacy engine summary line byte-for-byte as the current panel does. The
  panel must never regress against an older bridge.
- Parsing is tolerant in the panel's established style: a missing or
  non-object `runs` field yields an empty map without failing the state
  parse; a malformed individual entry is dropped, the rest survive
  (mirrors `parseDecision`'s drop pattern).
- Non-goals, on the record: no staleness/liveness telemetry (backlog console
  UI alerting item 1 — needs a bridge-side field, separate feature), no
  halt-alarm banner treatment (item 2), no bridge/API changes of any kind
  (the bridge already serves everything this feature reads), no new npm
  packages, no polling-cadence changes (the existing 5s tRPC refetch stands).

## File Structure

| File | Owns/Touches | Purpose |
|---|---|---|
| `src/lib/console/types.ts` | Touches | add `ConsoleRun` interface + `runs: Record<string, ConsoleRun>` to `ConsoleState` |
| `src/lib/console/parse.ts` | Touches | add tolerant `parseRuns`; wire into `parseConsoleState` |
| `src/lib/console/fixtures.ts` | Touches | add a two-active-runs fixture + a runs-absent legacy fixture |
| `src/lib/console/parse.test.ts` | Touches | parse coverage for present/absent/malformed `runs` |
| `src/components/console-panel/runs-board.tsx` | Owns | new presentational `[ RUNS ]` board (rows, sort, active/dim styling, legacy fallback line) |
| `src/components/console-panel/runs-board.test.tsx` | Owns | board render coverage |
| `src/components/console-panel/console-panel.tsx` | Touches | swap the `[ ENGINE ]` cell for `<RunsBoard runs={state.runs} engine={state.engine} />` |
| `src/components/console-panel/console-panel.test.tsx` | Touches | integration assertions for multi-run + legacy states |

No other files are touched. No new dependencies enter `package.json`.

## Boundary Commitments

| Commitment | Meaning | depcruise rule |
| --- | --- | --- |
| runs board presentational | `src/components/console-panel/runs-board` MUST NOT import `src/components/console-panel/trpc` |  |
| console lib isolation | `src/lib/console` MUST NOT import `src/components` |  |

## Concrete Shape

`ConsoleRun` is engine-shaped (the bridge serves each `runs` entry with the
same body as the legacy single-run status):

```ts
export interface ConsoleRun {
  active: boolean;
  phase: string | null;
  feature: string | null;
  runId: string | null;
}
```

`parseRuns(raw: unknown): Record<string, ConsoleRun>` — non-object input →
`{}`; each entry parsed with the same field tolerance as `parseEngine`;
non-object entries dropped. `parseConsoleState` gains
`runs: parseRuns(raw.runs)` and nothing else changes.

`RunsBoard({ runs, engine })` — pure presentational, mirrors
`DecisionRow`'s prop-driven pattern (no trpc import, no hooks beyond none):

```tsx
const entries = Object.entries(runs).sort(
  ([aliasA, a], [aliasB, b]) =>
    Number(b.active) - Number(a.active) || aliasA.localeCompare(aliasB),
);
// entries.length === 0 → legacy line, exactly the current ENGINE cell text:
//   engine ? `${(engine.phase ?? "—").toUpperCase()} :: ${engine.repo ?? "—"}/${engine.feature ?? "—"}...` : "—"
// entries.length > 0 → one row per alias:
//   `${alias.toUpperCase()} :: ${(run.phase ?? "—").toUpperCase()} :: ${run.feature ?? "—"}${run.runId ? ` :: ${run.runId}` : ""}`
```

Active rows use the panel's existing primary treatment
(`text-sm [text-shadow:0_0_6px_rgba(234,234,234,0.22)]`); inactive rows use
`text-sm text-[#EAEAEA]/40`. The cell label becomes `[ RUNS ]`. Micro-label
class string reused verbatim from `console-panel.tsx`
(`text-[11px] uppercase tracking-[0.08em] text-[#EAEAEA]/60`).

Test outline: parse tests drive raw JSON through `parseConsoleState`
(two-active fixture, runs-absent fixture, malformed-entry case); board tests
render `RunsBoard` directly (two active rows both visible with glow class,
inactive dimmed, sort order, legacy fallback text equality with the old
ENGINE cell); panel test drives the runs-absent fixture through the shell and
asserts output parity with the pre-feature snapshot expectations.
