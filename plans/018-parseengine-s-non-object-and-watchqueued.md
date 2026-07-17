# Plan 018: parseEngine's non-object-and-watchQueueDepth-coercion branches are untested

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything under "STOP conditions" occurs, stop and report — do not
> improvise. The dispatching driver maintains the status index in
> `plans/README.md` — do not edit it.
>
> **Drift check (run first)**: `git diff --stat ef9b2f0..HEAD -- src/lib/console/parse.test.ts`
> If the file changed since planning, compare "Current state" below against
> the live code before proceeding; on a mismatch treat it as a STOP condition.

## Status

- **Priority**: P2
- **Severity**: MED
- **Feature**: console-state-panel
- **Dimension**: tests
- **Planned at**: commit `ef9b2f0`, 2026-07-17

## Why this matters

parse.ts has two documented-but-unexercised branches: (a) `parseEngine` returns `null` when `raw.engine` is not a plain object (src/lib/console/parse.ts:44), and (b) `watchQueueDepth: Number(raw.watchQueueDepth) || 0` (parse.ts:75) coerces missing/non-numeric values to 0. Neither FIXTURE_STATE_IDLE (which has `engine: null`) nor a malformed/missing `watchQueueDepth` value is ever fed through `parseConsoleState` in parse.test.ts — the only fixture round-tripped is FIXTURE_STATE_ACTIVE, which has a populated engine object and a valid number. If a future change broke either coercion (e.g. `engine` defaulting to `{}` instead of `null`, or a non-numeric `watchQueueDepth` throwing instead of defaulting to 0), no test would catch it.

## Current state

- File: `src/lib/console/parse.test.ts` (line 7)
- Evidence: src/lib/console/parse.ts:43-52 (parseEngine null-on-non-object) and parse.ts:75 (`Number(raw.watchQueueDepth) || 0`); src/lib/console/parse.test.ts only imports FIXTURE_RAW_MALFORMED and FIXTURE_STATE_ACTIVE — FIXTURE_STATE_IDLE (engine: null, watchQueueDepth: 0) is never passed to parseConsoleState in this file.

## The fix

Add a test asserting `parseConsoleState({...FIXTURE_STATE_ACTIVE, engine: undefined}).engine === null` (or run FIXTURE_STATE_IDLE-shaped raw input through parseConsoleState and assert `result.engine === null`), and a test asserting `parseConsoleState({...FIXTURE_STATE_ACTIVE, watchQueueDepth: 'not-a-number'}).watchQueueDepth === 0`.

## Done criteria

- The issue described above no longer reproduces at `src/lib/console/parse.test.ts:7`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
