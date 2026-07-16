# Plan 008: GateBanner's `feature` prop is declared but never read

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything under "STOP conditions" occurs, stop and report — do not
> improvise. The dispatching driver maintains the status index in
> `plans/README.md` — do not edit it.
>
> **Drift check (run first)**: `git diff --stat bb2f8d7..HEAD -- src/components/run-view/gate-banner.tsx`
> If the file changed since planning, compare "Current state" below against
> the live code before proceeding; on a mismatch treat it as a STOP condition.

## Status

- **Priority**: P2
- **Severity**: MED
- **Feature**: single-run-live-view
- **Dimension**: simplify
- **Planned at**: commit `bb2f8d7`, 2026-07-16

## Why this matters

`GateBannerProps.feature: string | null` is part of the public interface and every call site is forced to pass it, but the component destructures only `{ summary, live, repoUrl }` — `feature` is never used anywhere in the render or in `renderBannerContent`. The feature name shown in the MERGED banner is instead re-derived from `summary.gate` by slicing after the colon (line 48-49), making the prop dead weight that suggests unfinished wiring or a leftover from an earlier design.

## Current state

- File: `src/components/run-view/gate-banner.tsx` (line 9)
- Evidence: src/components/run-view/gate-banner.tsx:9 declares `feature: string | null;` in the props interface, but line 12's destructure `export function GateBanner({ summary, live, repoUrl }: GateBannerProps)` omits it, and src/components/run-view/run-view.tsx:130 always passes `feature={null}`.

## The fix

Remove the unused `feature` prop from `GateBannerProps` and drop `feature={null}` from the call site in run-view.tsx, since the feature name is already derived internally from `summary.gate`.

## Done criteria

- The issue described above no longer reproduces at `src/components/run-view/gate-banner.tsx:9`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
