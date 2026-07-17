# Plan 015: Live panel and LINK DOWN banner render simultaneously on stale error

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on.
> If anything under "STOP conditions" occurs, stop and report — do not
> improvise. The dispatching driver maintains the status index in
> `plans/README.md` — do not edit it.
>
> **Drift check (run first)**: `git diff --stat ef9b2f0..HEAD -- src/components/console-panel/console-panel.tsx`
> If the file changed since planning, compare "Current state" below against
> the live code before proceeding; on a mismatch treat it as a STOP condition.

## Status

- **Priority**: P2
- **Severity**: MED
- **Feature**: console-state-panel
- **Dimension**: correctness
- **Planned at**: commit `ef9b2f0`, 2026-07-17

## Why this matters

The design specifies three mutually-exclusive page states: (a) link-down banner when the query errors or ok:false, (b) idle panel, (c) live panel. The implementation instead computes `linkDown` from `queryError`/`data.ok` and `state` from `data.ok` independently, then renders both blocks with separate `{linkDown ? ... : null}` and `{state ? ... : null}` JSX blocks rather than an if/else. TanStack Query v5 (this repo pins ^5.101.2) intentionally keeps the last successful `data` around across a failed background refetch while also populating `error`/setting status to 'error' — that is precisely why both fields exist on the same result. Concretely: the panel loads successfully once (`data = {ok:true, state}`), then a subsequent 5s poll fails (bridge blips, times out, or the server briefly 5xxs). At that point `stateQuery.data` is still the old `{ok:true, state}` and `stateQuery.error` is now set. `linkDown` becomes true (banner renders) AND `state` is still truthy (the full engine/fleet/decisions panel renders too), so the operator sees a red 'LINK DOWN' banner stacked on top of a fully-populated, but now-frozen and no-longer-updating, telemetry panel — exactly the confusing/misleading UI the exclusive-states design was meant to prevent.

## Current state

- File: `src/components/console-panel/console-panel.tsx` (line 36)
- Evidence: src/components/console-panel/console-panel.tsx:36-44: `const data = stateQuery.data; const queryError = stateQuery.error; const linkDown = Boolean(queryError) || (data !== undefined && !data.ok); ... const state = data && data.ok ? data.state : null;` followed by two independent conditional render blocks at lines 58 (`{linkDown ? (...) : null}`) and 67 (`{state ? (...) : null}`) — both can be true at once when a later poll fails after an earlier poll succeeded.

## The fix

Make `state` and the link-down banner mutually exclusive, e.g. treat any error/failed poll as authoritative even when stale data exists: `const state = linkDown ? null : data && data.ok ? data.state : null;` (or restructure as a single if/else-if/else over `linkDown` / `state` / idle so only one branch ever renders).

## Done criteria

- The issue described above no longer reproduces at `src/components/console-panel/console-panel.tsx:36`.
- The project's build and test suite pass.
- No file outside the scope of this fix (and its direct tests) was modified.

## STOP conditions

- The "Current state" excerpt no longer matches the live code.
- A correct fix requires editing files unrelated to this finding.
- The fix requires a design decision this plan does not spell out.
