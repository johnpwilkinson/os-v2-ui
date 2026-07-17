# Plan 016: linkUp prop's false branch is unreachable dead code

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything under "STOP conditions" occurs, stop and report — do not
> improvise. The dispatching driver maintains the status index in
> `plans/README.md` — do not edit it.
>
> **Drift check (run first)**: `git diff --stat ef9b2f0..HEAD -- src/components/console-panel/optimal-next.tsx`
> If the file changed since planning, compare "Current state" below against
> the live code before proceeding; on a mismatch treat it as a STOP condition.

## Status

- **Priority**: P2
- **Severity**: MED
- **Feature**: console-state-panel
- **Dimension**: simplify
- **Planned at**: commit `ef9b2f0`, 2026-07-17

## Why this matters

OptimalNext takes `linkUp: boolean` and branches on it to render either the green or red LINK dot, but the sole call site (console-panel.tsx:70) always passes the JSX shorthand `linkUp` (i.e. literally `true`), and that call is itself nested inside `state ? ... : null`, which is only reached when the query resolved `ok: true`. There is no code path in the component that ever constructs `<OptimalNext linkUp={false} />`. The red-dot branch and the boolean parameterization are dead weight — either wire it to the real link state (drive it from `linkDown` so a stale-but-still-`ok` cache with a live query error shows the red dot) or drop the prop and hardcode the green dot markup, matching what's actually reachable today.

## Current state

- File: `src/components/console-panel/optimal-next.tsx` (line 6)
- Evidence: src/components/console-panel/optimal-next.tsx:7-9 `const dotClasses = linkUp ? "...bg-[#4AF626]..." : "...bg-[#E61919]..."`; only call site is src/components/console-panel/console-panel.tsx:70 `<OptimalNext directive={state.optimalNext} linkUp />`, itself gated by `state ? ... : null` at line 67, where `state` is null whenever `data.ok` is false.

## The fix

Either (a) simplify: remove the `linkUp` prop and always render the green-dot markup in OptimalNext, since that's the only reachable branch given the current shell logic, or (b) if the red state is meant to be reachable (e.g. stale cached data + a failed refetch), pass `linkUp={!linkDown}` from console-panel.tsx instead of the hardcoded shorthand so the prop actually varies. Pick one — don't leave an unexercised boolean branch in a component with no test coverage for the false case.

## Done criteria

- The issue described above no longer reproduces at `src/components/console-panel/optimal-next.tsx:6`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
