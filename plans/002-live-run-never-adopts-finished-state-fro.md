# Plan 002: Live run never adopts finished state from tail status

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
- **Dimension**: correctness
- **Planned at**: commit `bb2f8d7`, 2026-07-16

## Why this matters

`finished` is derived only from the one-shot `runs.get` snapshot (`snapshot.finished`), never from the journal-tail subscription's live `status.finished` field that the client itself receives and stores in `status` state (line 90) but then never reads anywhere. Per requirement 4.3 and design.md's tailJournal spec, the subscription's untracked status event exists specifically to report finish transitions (`finished` = `runner-summary.json` exists) without a page reload. Because `finished` is frozen at whatever `snapshot.finished` was at the moment the `runs.get` query first resolved, a run that completes while the operator is watching it live will never flip the UI to the finished state: `subscriptionInput` (line 71-77) keeps the subscription open forever instead of skipping per requirement 5.4, `summary` stays `snapshot.summary ?? null` (line 123, still `null`/stale since the finishing write to runner-summary.json is never re-fetched) so GateBanner (line 129 area) can never show MERGED/HALTED and instead eventually falls through to the generic zinc INCOMPLETE state once `live` goes false, and NowLine (line 134) is told `finished={finished}` (always false) so once the journal mtime goes quiet past the stall window it will incorrectly render a STALLED badge on a run that actually completed cleanly.

## Current state

- File: `src/components/run-view/run-view.tsx` (line 70)
- Evidence: const finished = snapshot?.ok ? snapshot.finished : false; (run-view.tsx:70) ... } else if (event.type === "status") { setStatus({ mtimeMs: event.mtimeMs, finished: event.finished, stallAfterMs: event.stallAfterMs, }); } (run-view.tsx:87-92) -- `status.finished` is stored but `finished` above never reads `status`, only `snapshot.finished`.

## The fix

Derive `finished` from the live status once available, e.g. `const finished = status?.finished ?? (snapshot?.ok ? snapshot.finished : false);`, and when `status.finished` flips true, invalidate/refetch `snapshotQuery` (e.g. `queryClient.invalidateQueries` or `snapshotQuery.refetch()`) so `summary`/`engineState`/`repoUrl` pick up the final runner-summary.json contents instead of staying at their pre-finish values.

## Done criteria

- The issue described above no longer reproduces at `src/components/run-view/run-view.tsx:70`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
