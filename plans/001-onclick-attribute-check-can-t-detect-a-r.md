# Plan 001: onclick attribute check can't detect a React onClick prop

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything under "STOP conditions" occurs, stop and report — do not
> improvise. The dispatching driver maintains the status index in
> `plans/README.md` — do not edit it.
>
> **Drift check (run first)**: `git diff --stat 5317383..HEAD -- src/components/drill-runway-check/drill-runway-check.test.tsx`
> If the file changed since planning, compare "Current state" below against
> the live code before proceeding; on a mismatch treat it as a STOP condition.

## Status

- **Priority**: P2
- **Severity**: MED
- **Feature**: drill-runway-check
- **Dimension**: tests
- **Planned at**: commit `5317383`, 2026-07-16

## Why this matters

Requirement 3.3 requires a test proving the component attaches no onClick handler. The test uses `container.querySelector("[onclick]")`, but React never renders an `onClick` prop as an inline DOM `onclick="..."` attribute — it attaches handlers via its synthetic event system instead. This means the assertion passes regardless of whether the component actually has a React `onClick` prop, so it provides zero regression protection for that half of req 3.3: someone could add `<div onClick={...}>` to DrillRunwayCheck and this test would still pass.

## Current state

- File: `src/components/drill-runway-check/drill-runway-check.test.tsx` (line 20)
- Evidence: test("renders no interactive elements or onClick handler [req:3.3]", () => {
  const { container } = render(<DrillRunwayCheck />);
  expect(container.querySelectorAll("a").length).toBe(0);
  expect(container.querySelectorAll("button").length).toBe(0);
  expect(container.querySelector("[onclick]")).toBeNull();
});

Verified via a standalone probe: rendering `<div onClick={() => {}}>...</div>` and running `container.querySelector("[onclick]")` against it still returns null (test passes) — confirming the assertion cannot catch a real onClick prop.

## The fix

Replace the DOM-attribute check with an assertion on the React element itself, e.g. inspect the rendered element's props via a lighter-weight approach: render with `@testing-library/react` and use `fireEvent.click(el)` plus a spy, or more directly assert on the component's return value using `react-test-renderer`/`ReactDOMServer` and check `element.props.onClick` is undefined. Simplest fix: since this is a static server component the intent is just 'no interactivity was added', so drop the misleading `[onclick]` selector check (it tests nothing) and rely on the `a`/`button` element-count checks plus a code-level guarantee, or explicitly assert `Object.keys(DrillRunwayCheck()).includes('onClick')` is false via the JSX element's `.props`.

## Done criteria

- The issue described above no longer reproduces at `src/components/drill-runway-check/drill-runway-check.test.tsx:20`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
