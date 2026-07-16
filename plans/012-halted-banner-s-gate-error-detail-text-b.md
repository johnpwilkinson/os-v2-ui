# Plan 012: HALTED banner's gate/error detail text branch is untested

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything under "STOP conditions" occurs, stop and report — do not
> improvise. The dispatching driver maintains the status index in
> `plans/README.md` — do not edit it.
>
> **Drift check (run first)**: `git diff --stat bb2f8d7..HEAD -- src/components/run-view/gate-banner.test.tsx`
> If the file changed since planning, compare "Current state" below against
> the live code before proceeding; on a mismatch treat it as a STOP condition.

## Status

- **Priority**: P2
- **Severity**: MED
- **Feature**: single-run-live-view
- **Dimension**: tests
- **Planned at**: commit `bb2f8d7`, 2026-07-16

## Why this matters

gate-banner.tsx's HALTED branch renders `[summary.halt_kind, summary.gate ?? summary.error ?? ""]`, but the only HALTED test passes a summary with halt_kind set and no gate/error, so detailText is always the empty string and gets filtered out by `detail.length > 0`. The branch where a halted run's gate or error text actually renders next to HALTED is never asserted.

## Current state

- File: `src/components/run-view/gate-banner.test.tsx` (line 21)
- Evidence: src/components/run-view/gate-banner.tsx:58-65 computes `detailText = summary.gate ?? summary.error ?? ""`; src/components/run-view/gate-banner.test.tsx:21-33 only sets `{ halt_kind: "validate-nogo" }`, no gate/error field.

## The fix

Add a test rendering GateBanner with `summary({ halt_kind: "validate-nogo", gate: "gate-x" })` and one with `{ halt_kind: "x", error: "boom" }`, asserting the respective detail text is visible.

## Done criteria

- The issue described above no longer reproduces at `src/components/run-view/gate-banner.test.tsx:21`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
