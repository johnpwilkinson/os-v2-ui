# Plan 017: console.state tRPC procedure has zero test coverage

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything under "STOP conditions" occurs, stop and report — do not
> improvise. The dispatching driver maintains the status index in
> `plans/README.md` — do not edit it.
>
> **Drift check (run first)**: `git diff --stat ef9b2f0..HEAD -- src/server/api.ts`
> If the file changed since planning, compare "Current state" below against
> the live code before proceeding; on a mismatch treat it as a STOP condition.

## Status

- **Priority**: P2
- **Severity**: MED
- **Feature**: console-state-panel
- **Dimension**: tests
- **Planned at**: commit `ef9b2f0`, 2026-07-17

## Why this matters

The new `console` router composes fetchConsoleState + parseConsoleState into three distinct outcomes (bridge fetch failure passthrough, successful fetch but malformed payload -> 'malformed console state', and successful parse -> {ok:true,state}), but none of these branches are exercised by any test. `src/server/console.test.ts` only tests `fetchConsoleState` in isolation, and the pre-existing `src/server/api.test.ts` (untouched by this diff) only covers `appRouter.runs.get`. A regression in the composition — e.g. swapping the `!res.ok` check, forgetting to forward `res.error`, or a typo in the 'malformed console state' string that the client can't distinguish from a real bridge error — would ship with a fully green test suite.

## Current state

- File: `src/server/api.ts` (line 26)
- Evidence: src/server/api.ts:26-34:
  console: t.router({
    state: t.procedure.query(async () => {
      const res = await fetchConsoleState();
      if (!res.ok) return { ok: false as const, error: res.error };
      const state = parseConsoleState(res.raw);
      if (!state) return { ok: false as const, error: "malformed console state" };
      return { ok: true as const, state };
    }),
  }),
No test file references `appRouter.console` or `caller.console.state`.

## The fix

Add a describe block to src/server/api.test.ts (or a new file) that calls `appRouter.createCaller({}).console.state()` three times with a mocked/injected bridge: (1) fetchConsoleState failure -> asserts `{ok:false, error}` passthrough, (2) fetch success with a payload parseConsoleState rejects -> asserts `{ok:false, error:'malformed console state'}`, (3) fetch success with a valid payload -> asserts `{ok:true, state}` matches the parsed fixture. Since fetchConsoleState has no injectable seam at the router level, either mock the `@/server/console` module with vi.mock or stub global fetch/CHAMBER_BRIDGE_URL for the duration of the test.

## Done criteria

- The issue described above no longer reproduces at `src/server/api.ts:26`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
