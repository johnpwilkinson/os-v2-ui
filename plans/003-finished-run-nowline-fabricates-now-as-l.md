# Plan 003: Finished-run NowLine fabricates 'now' as last-activity time

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything under "STOP conditions" occurs, stop and report — do not
> improvise. The dispatching driver maintains the status index in
> `plans/README.md` — do not edit it.
>
> **Drift check (run first)**: `git diff --stat bb2f8d7..HEAD -- src/components/run-view/run-view.tsx`
> If the file changed since planning, compare "Current state" below against
> the live code before proceeding; on a mismatch treat it as a STOP condition.

## Status

- **Priority**: P1
- **Severity**: HIGH
- **Feature**: single-run-live-view
- **Dimension**: integration
- **Planned at**: commit `bb2f8d7`, 2026-07-16

## Why this matters

For a finished run (or any run whose subscription is skipToken'd), `status` is never populated because `journalTail.useSubscription` is only invoked when `!snapshot.finished`. NowLine's `mtimeMs` prop then falls back to `now` (the browser's own clock, ticked every 30s by the effect at line ~53-58), so `formatDistanceToNowStrict(mtimeMs, ...)` always renders something like 'less than a minute ago' for every finished run, no matter how old it actually is. This directly contradicts the design's explicit 'Timestamps' commitment that last-activity must be derived from the journal file's real mtime, never fabricated from a live clock. No server response field carries the run's journal mtime for this path: `ReadRunSnapshotResult` (src/server/runs.ts) has no `mtimeMs`, and `runs.get` (src/server/api.ts) doesn't add one either — only `journal-tail.ts`'s live status events carry `mtimeMs`, and only `listRuns()`'s `RunListEntry.mtimeMs` (directory mtime, unused here) exists elsewhere.

## Current state

- File: `src/components/run-view/run-view.tsx` (line 133)
- Evidence: src/components/run-view/run-view.tsx:131-136: `<NowLine nowLabel={derived.nowLine} mtimeMs={status?.mtimeMs ?? now ?? 0} finished={finished} stallAfterMs={status?.stallAfterMs ?? DEFAULT_STALL_AFTER_MS} />` combined with the subscription gate at line ~99-105 (`snapshot?.ok && !snapshot.finished ? {...} : skipToken`) and `ReadRunSnapshotResult` in src/server/runs.ts:394-403 having no mtime field.

## The fix

Have `readRunSnapshot` in src/server/runs.ts stat the top-level `journal.jsonl` and include its `mtimeMs` in `ReadRunSnapshotResult`; thread it through the `runs.get` procedure in src/server/api.ts; in run-view.tsx use `snapshot.mtimeMs` as the NowLine fallback (`status?.mtimeMs ?? snapshot.mtimeMs`) instead of the browser's `now`, reserving `now` only as an absolute last resort before any data has loaded.

## Done criteria

- The issue described above no longer reproduces at `src/components/run-view/run-view.tsx:133`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
