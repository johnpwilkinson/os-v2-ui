# Plan 011: Partial trailing-line buffering is documented but never tested

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything under "STOP conditions" occurs, stop and report — do not
> improvise. The dispatching driver maintains the status index in
> `plans/README.md` — do not edit it.
>
> **Drift check (run first)**: `git diff --stat bb2f8d7..HEAD -- src/server/journal-tail.test.ts`
> If the file changed since planning, compare "Current state" below against
> the live code before proceeding; on a mismatch treat it as a STOP condition.

## Status

- **Priority**: P2
- **Severity**: MED
- **Feature**: single-run-live-view
- **Dimension**: tests
- **Planned at**: commit `bb2f8d7`, 2026-07-16

## Why this matters

design.md states explicitly: 'partial trailing lines are buffered until their newline arrives.' journal-tail.ts's readNewLines implements this by holding back bytes after the last newline in pendingBytes, but no test ever appends a chunk without a trailing newline to verify the incomplete line is NOT emitted until completed.

## Current state

- File: `src/server/journal-tail.test.ts` (line 216)
- Evidence: src/server/journal-tail.ts:104-113 buffers `pendingBytes` past the last `\n`; the only append test (journal-tail.test.ts:99-124) always appends a complete `'{"log":"b"}\n'` line with a trailing newline.

## The fix

Add a test that appends a chunk with no trailing newline (e.g. `'{"log":"partial"'`), asserts no new tracked line event is yielded, then appends the closing `'}\n'` and asserts exactly one tracked line event now fires for the completed line.

## Done criteria

- The issue described above no longer reproduces at `src/server/journal-tail.test.ts:216`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
