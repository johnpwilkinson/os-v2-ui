# Plan 007: fs helper functions duplicated between runs.ts and journal-tail.ts

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
- **Dimension**: simplify
- **Planned at**: commit `bb2f8d7`, 2026-07-16

## Why this matters

`fileExists` is copy-pasted verbatim into journal-tail.ts even though an identical implementation already exists in runs.ts (which journal-tail.ts already imports `artifactsRoot` from). `statMtimeMs` in journal-tail.ts is likewise a rename of `mtimeMsOf` in runs.ts with the same try/catch-return-0 body. A reviewer has to notice both copies stay behaviorally identical over time; a bug fix (e.g. distinguishing ENOENT from other stat errors) applied to one won't reach the other.

## Current state

- File: `src/server/journal-tail.ts` (line 50)
- Evidence: src/server/runs.ts:48-54:
```ts
async function fileExists(target: string): Promise<boolean> {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}
```
and src/server/runs.ts:57-63 `mtimeMsOf` vs. src/server/journal-tail.ts:50-64 `statMtimeMs`/`fileExists` which are the same logic re-implemented.

## The fix

Extract `fileExists` and `mtimeMsOf`/`statMtimeMs` into a shared helper (e.g. `src/server/fs-helpers.ts`, which is still within the `src/server/` boundary the spec allows for new files) and have both runs.ts and journal-tail.ts import them instead of each defining their own copy.

## Done criteria

- The issue described above no longer reproduces at `src/server/journal-tail.ts:50`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
