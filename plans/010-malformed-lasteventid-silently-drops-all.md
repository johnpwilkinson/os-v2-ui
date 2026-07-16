# Plan 010: Malformed lastEventId silently drops all replay lines, untested

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything under "STOP conditions" occurs, stop and report — do not
> improvise. The dispatching driver maintains the status index in
> `plans/README.md` — do not edit it.
>
> **Drift check (run first)**: `git diff --stat bb2f8d7..HEAD -- src/server/journal-tail.ts`
> If the file changed since planning, compare "Current state" below against
> the live code before proceeding; on a mismatch treat it as a STOP condition.

## Status

- **Priority**: P2
- **Severity**: MED
- **Feature**: single-run-live-view
- **Dimension**: tests
- **Planned at**: commit `bb2f8d7`, 2026-07-16

## Why this matters

`resumeAfter = Number(lastEventId)` is used directly in `index > resumeAfter` without validating it's a finite number. If a client reconnects with a corrupted/non-numeric lastEventId, Number() yields NaN, and every comparison `index > NaN` is false, so no lines are replayed on reconnect — a silent data-loss path for the resume feature this test file is supposed to cover (req:4.2). No test exercises a non-numeric or out-of-range lastEventId.

## Current state

- File: `src/server/journal-tail.ts` (line 78)
- Evidence: src/server/journal-tail.ts:78: `const resumeAfter = lastEventId != null ? Number(lastEventId) : -1;` then line 162: `if (index > resumeAfter) { yield tracked(...) }` — journal-tail.test.ts only tests lastEventId values "0" and null.

## The fix

Add a test calling tailJournal(runId, "not-a-number", signal) (and one with lastEventId far beyond the current line count) and assert the documented/intended fallback behavior (e.g., treat invalid ids as -1 by using `Number.isFinite` guard, and add the corresponding test).

## Done criteria

- The issue described above no longer reproduces at `src/server/journal-tail.ts:78`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
