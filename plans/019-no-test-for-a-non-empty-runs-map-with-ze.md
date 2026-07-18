# Plan 019: No test for a non-empty runs map with zero active entries

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything under "STOP conditions" occurs, stop and report — do not
> improvise. The dispatching driver maintains the status index in
> `plans/README.md` — do not edit it.
>
> **Drift check (run first)**: `git diff --stat 4d2aac0..HEAD -- src/components/console-panel/runs-board.test.tsx`
> If the file changed since planning, compare "Current state" below against
> the live code before proceeding; on a mismatch treat it as a STOP condition.

## Status

- **Priority**: P2
- **Severity**: MED
- **Feature**: console-multi-run
- **Dimension**: tests
- **Planned at**: commit `4d2aac0`, 2026-07-18

## Why this matters

RunsBoard's legacy-fallback branch is keyed on `entries.length === 0` (runs-board.tsx:21), not on whether any entry is active. Every existing test that exercises a non-empty runs map includes at least one active entry (FIXTURE_STATE_MULTI_RUN: both active; the dimmed-row test: sim active/ui inactive; the sort-order test: alpha/beta active, delta/zeta inactive). There is no test where the runs map is non-empty but every entry has active:false. If a future change (or a bug introduced now) conflates 'no entries' with 'no active entries' — e.g. someone 'simplifies' the condition to `entries.filter(r => r.active).length === 0`, which would be an easy, plausible mistake given the design's active/inactive framing — the board would silently fall back to the legacy engine line instead of showing the all-dimmed rows, and no test in this suite would catch the regression.

## Current state

- File: `src/components/console-panel/runs-board.test.tsx` (line 1)
- Evidence: const entries = Object.entries(runs).sort(...); ... {entries.length === 0 ? (<legacy line>) : (entries.map(...))} — runs-board.tsx:13-21. All current test fixtures with non-empty runs (FIXTURE_STATE_MULTI_RUN, and the inline fixtures in the dimmed-row and sort-order tests) contain at least one active:true entry.

## The fix

Add a test in runs-board.test.tsx rendering RunsBoard with a runs map that has 2+ entries all active:false, and assert the board renders those dimmed rows (not the legacy engine/dash text) — e.g. expect(screen.getByText("SIM :: IDLE :: ...")).toBeInTheDocument() and expect(screen.queryByText(legacyText)).not.toBeInTheDocument().

## Done criteria

- The issue described above no longer reproduces at `src/components/console-panel/runs-board.test.tsx:1`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
