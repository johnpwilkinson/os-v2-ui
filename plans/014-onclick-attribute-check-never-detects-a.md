# Plan 014: onclick attribute check never detects a real onClick prop

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything under "STOP conditions" occurs, stop and report — do not
> improvise. The dispatching driver maintains the status index in
> `plans/README.md` — do not edit it.
>
> **Drift check (run first)**: `git diff --stat 0b48d4d..HEAD -- src/components/drill-wave-a-cert/drill-wave-a-cert.test.tsx`
> If the file changed since planning, compare "Current state" below against
> the live code before proceeding; on a mismatch treat it as a STOP condition.

## Status

- **Priority**: P2
- **Severity**: MED
- **Feature**: drill-wave-a-cert
- **Dimension**: tests
- **Planned at**: commit `0b48d4d`, 2026-07-16

## Why this matters

The test claims to verify 'no onClick handler' (req:3.3), but React attaches onClick via its synthetic event system (an internal listener), not as a literal `onclick` HTML attribute. `container.querySelector("[onclick]")` only matches inline `onclick="..."` string attributes, which React never produces for a JSX `onClick={...}` prop. I confirmed this empirically: rendering `<div onClick={() => {}}>hi</div>` and running `container.querySelector("[onclick]")` still returns null and the assertion passes. So if a future edit adds `onClick={...}` to the component (directly contradicting the 'no interactivity' boundary commitment in design.md), this test would keep passing and give false confidence that the requirement is enforced.

## Current state

- File: `src/components/drill-wave-a-cert/drill-wave-a-cert.test.tsx` (line 20)
- Evidence: expect(container.querySelector("[onclick]")).toBeNull(); // drill-wave-a-cert.test.tsx:20 — verified via a scratch test that render(<div onClick={() => {}}>hi</div>) still passes this exact assertion

## The fix

Either drop the onclick-attribute assertion (it asserts nothing useful) or replace it with a check that actually exercises interactivity, e.g. `fireEvent.click(el)` plus a spy/mock to prove no handler fires, or a static check via a snapshot of the component's JSX props. Simplest: remove the line and rely on the `a`/`button` tag-count checks, which are the only assertions in this test that can actually fail.

## Done criteria

- The issue described above no longer reproduces at `src/components/drill-wave-a-cert/drill-wave-a-cert.test.tsx:20`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
