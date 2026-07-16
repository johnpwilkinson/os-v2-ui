# Plan 009: appRouter's runs.get merge logic is untested

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything under "STOP conditions" occurs, stop and report — do not
> improvise. The dispatching driver maintains the status index in
> `plans/README.md` — do not edit it.
>
> **Drift check (run first)**: `git diff --stat bb2f8d7..HEAD -- src/server/api.ts`
> If the file changed since planning, compare "Current state" below against
> the live code before proceeding; on a mismatch treat it as a STOP condition.

## Status

- **Priority**: P2
- **Severity**: MED
- **Feature**: single-run-live-view
- **Dimension**: tests
- **Planned at**: commit `bb2f8d7`, 2026-07-16

## Why this matters

server/api.ts is a new Owns file (per design.md) that combines readRunSnapshot and resolveRepoUrl via `{ ...snapshot, repoUrl }`, but no api.test.ts exists anywhere in the diff. In particular the case where snapshot is `{ ok: false }` still gets `repoUrl` spread onto it, producing a shape (`{ ok: false, repoUrl: ... }`) that no test verifies matches what run-view.tsx expects when reading `snapshot.repoUrl` only inside the `snapshot.ok` branch.

## Current state

- File: `src/server/api.ts` (line 16)
- Evidence: src/server/api.ts:11-17: `const [snapshot, repoUrl] = await Promise.all([readRunSnapshot(...), resolveRepoUrl(...)]); return { ...snapshot, repoUrl };` — no test file for src/server/api.ts exists in the changed-files list.

## The fix

Add src/server/api.ts tests (or extend runs.test.ts) that call appRouter.createCaller({}).runs.get({ runId }) against a temp fixture directory and assert the merged shape for both a found run (ok:true + repoUrl) and a missing run (ok:false + repoUrl still present but unused).

## Done criteria

- The issue described above no longer reproduces at `src/server/api.ts:16`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
