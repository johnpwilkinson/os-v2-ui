# Plan 006: STATUS_DOT_CLASSES duplicated verbatim across two files

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything under "STOP conditions" occurs, stop and report — do not
> improvise. The dispatching driver maintains the status index in
> `plans/README.md` — do not edit it.
>
> **Drift check (run first)**: `git diff --stat bb2f8d7..HEAD -- src/components/run-view/journal-feed.tsx`
> If the file changed since planning, compare "Current state" below against
> the live code before proceeding; on a mismatch treat it as a STOP condition.

## Status

- **Priority**: P2
- **Severity**: MED
- **Feature**: single-run-live-view
- **Dimension**: simplify
- **Planned at**: commit `bb2f8d7`, 2026-07-16

## Why this matters

The exact same `Record<LegStatus, string>` map (done/failed/running dot classes) is defined independently in journal-feed.tsx and stage-tree.tsx. Any future palette change (e.g. adjusting the running-state pulse class) has to be made in two places, and it's easy to update one and forget the other, silently desyncing the leg-status color law the design doc locks down (`emerald-500`/`red-500`/amber only, semantic-only status color).

## Current state

- File: `src/components/run-view/journal-feed.tsx` (line 15)
- Evidence: src/components/run-view/journal-feed.tsx:15-19 and src/components/run-view/stage-tree.tsx:9-13 both define:
```ts
const STATUS_DOT_CLASSES: Record<LegStatus, string> = {
  done: "bg-emerald-500",
  failed: "bg-red-500",
  running: "bg-emerald-500 motion-safe:animate-pulse",
};
```

## The fix

Move `STATUS_DOT_CLASSES` (and the `LegStatus` import) into one shared module under src/components/run-view/ (e.g. a small `status-dot.ts` or inline into a shared `<StatusDot status=.../>` component), and import it from both journal-feed.tsx and stage-tree.tsx instead of redefining it.

## Done criteria

- The issue described above no longer reproduces at `src/components/run-view/journal-feed.tsx:15`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
