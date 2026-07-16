# Plan 004: Live-run subscription path has zero test coverage

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything under "STOP conditions" occurs, stop and report — do not
> improvise. The dispatching driver maintains the status index in
> `plans/README.md` — do not edit it.
>
> **Drift check (run first)**: `git diff --stat bb2f8d7..HEAD -- src/components/run-view/run-view.test.tsx`
> If the file changed since planning, compare "Current state" below against
> the live code before proceeding; on a mismatch treat it as a STOP condition.

## Status

- **Priority**: P1
- **Severity**: HIGH
- **Feature**: single-run-live-view
- **Dimension**: tests
- **Planned at**: commit `bb2f8d7`, 2026-07-16

## Why this matters

design.md's File Structure table states this file's charter is 'Component tests for shell states (empty, finished, live)', but the file only contains two tests: the { ok: false } empty state and the finished-run (skipToken) state. The entire live-run branch of run-view.tsx — journalTail.useSubscription onData handling, index-based line dedup (seenIndices), status-driven stall/liveness computation (isNewestRun && enginePhaseRunning, mtimeWithinStallWindow), and the GateBanner RUNNING wiring — is never exercised by any test.

## Current state

- File: `src/components/run-view/run-view.test.tsx` (line 1)
- Evidence: src/components/run-view/run-view.test.tsx only has `it("renders the empty state...")` and `it("renders finished-run mode...")`; run-view.tsx:83-124 (onData handler, live computation) has no corresponding test invoking the subscriptionSpy's onData callback or a non-finished snapshot.

## The fix

Add a test that mocks journalTail.useSubscription to invoke its onData callback with a tracked line event and a status event, renders RunView with a non-finished snapshot, and asserts: (1) the new line appears in JournalFeed/StageTree, (2) duplicate-index events are ignored, (3) GateBanner shows RUNNING, and (4) NowLine reflects the status-derived mtimeMs/stallAfterMs.

## Done criteria

- The issue described above no longer reproduces at `src/components/run-view/run-view.test.tsx:1`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
