# Plan 013: evt/battery/leg-start row branches in JournalFeed are untested

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything under "STOP conditions" occurs, stop and report — do not
> improvise. The dispatching driver maintains the status index in
> `plans/README.md` — do not edit it.
>
> **Drift check (run first)**: `git diff --stat bb2f8d7..HEAD -- src/components/run-view/journal-feed.test.tsx`
> If the file changed since planning, compare "Current state" below against
> the live code before proceeding; on a mismatch treat it as a STOP condition.

## Status

- **Priority**: P2
- **Severity**: MED
- **Feature**: single-run-live-view
- **Dimension**: tests
- **Planned at**: commit `bb2f8d7`, 2026-07-16

## Why this matters

JournalRow's switch handles six line kinds (leg-start, leg-complete, battery, evt, log, unknown), but the tests only render leg-complete, unknown, and a source-tagged log line. The evt row (EvtRow, which formats payload key=value pairs) and the battery/leg-start LegRow variants are never rendered in any test, so a regression in those branches (e.g. a crash formatting evt payload, or wrong status dot for a battery-start row) would not be caught.

## Current state

- File: `src/components/run-view/journal-feed.test.tsx` (line 1)
- Evidence: src/components/run-view/journal-feed.tsx:98-122 switches on line.kind including 'evt' (EvtRow) and 'battery'/'leg-start' (LegRow); journal-feed.test.tsx only constructs `kind: "leg-complete"`, `kind: "unknown"`, and `kind: "log"` fixtures.

## The fix

Add test cases rendering an `evt` line (asserting the evtType badge and key=value summary text) and a `battery` start line (asserting the running status dot), matching the coverage already given to leg-complete and unknown.

## Done criteria

- The issue described above no longer reproduces at `src/components/run-view/journal-feed.test.tsx:1`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
