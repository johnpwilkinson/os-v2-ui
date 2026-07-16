# Plan 005: resolveRepoUrl has no test coverage anywhere

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything under "STOP conditions" occurs, stop and report — do not
> improvise. The dispatching driver maintains the status index in
> `plans/README.md` — do not edit it.
>
> **Drift check (run first)**: `git diff --stat bb2f8d7..HEAD -- src/server/runs.test.ts`
> If the file changed since planning, compare "Current state" below against
> the live code before proceeding; on a mismatch treat it as a STOP condition.

## Status

- **Priority**: P1
- **Severity**: HIGH
- **Feature**: single-run-live-view
- **Dimension**: tests
- **Planned at**: commit `bb2f8d7`, 2026-07-16

## Why this matters

runs.ts exports resolveRepoUrl, a new function with several distinct branches (scan result.json for a `github.com` URL via regex, normalize `git@github.com:owner/repo.git` SSH form, fall back to CHAMBER_REPO_URL env var, else return null) called out explicitly in design.md's Concrete Shape section. None of these branches — found-in-result.json, SSH-normalized, env fallback, or null-when-nothing-matches — are exercised by any test in the diff.

## Current state

- File: `src/server/runs.test.ts` (line 152)
- Evidence: src/server/runs.ts:200-233 defines scanForGithubUrl/resolveRepoUrl; src/server/runs.test.ts (152 lines) only contains describe blocks for listRuns, readRunSnapshot, and normalizeSummary — grep for 'resolveRepoUrl' across the whole diff returns only its declaration and its single call site in src/server/api.ts:14.

## The fix

Add a describe("resolveRepoUrl") block in runs.test.ts using the existing tmpRoot fixture: write a result.json containing an https URL, one containing a git@ SSH remote, one with no URL plus CHAMBER_REPO_URL set, and one with neither, asserting the returned string/null in each case.

## Done criteria

- The issue described above no longer reproduces at `src/server/runs.test.ts:152`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
