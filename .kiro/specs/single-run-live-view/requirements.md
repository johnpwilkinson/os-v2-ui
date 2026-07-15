# Single-Run Live View — Requirements

## Requirement 1: Run Discovery and Selection

**User Story:** As the operator, I want the app to find chamber runs on the host and open the newest one by default, so that one URL always lands on what the factory is doing now.

Acceptance Criteria:
- 1.1 WHEN `listRuns()` executes THE SYSTEM SHALL read the directory names under the artifacts root resolved from env `CHAMBER_ARTIFACTS_DIR` (default `~/chamber-artifacts` with `~` expanded via `os.homedir()`), include only directories, exclude dot-entries such as `.engine-state.json`, and return them sorted lexicographically descending so the newest runId is first.
- 1.2 WHEN a run directory contains `runner-summary.json` THE SYSTEM SHALL flag that run as finished, and WHEN it does not THE SYSTEM SHALL flag it as live.
- 1.3 WHEN `/` renders and at least one run exists THE SYSTEM SHALL render the run view for the lexicographically greatest runId without issuing a redirect.
- 1.4 IF `/` renders and the artifacts root is missing or contains zero run directories THE SYSTEM SHALL render a composed empty state and SHALL NOT crash.
- 1.5 WHEN `/run/<runId>` is requested THE SYSTEM SHALL render the run view for that runId, reading the dynamic segment by awaiting the `params` Promise (Next 16 convention).
- 1.6 WHEN the operator selects a different run in the RunPicker THE SYSTEM SHALL navigate to `/run/<runId>` for the selected run.
- 1.7 WHEN the RunPicker lists runs THE SYSTEM SHALL show a LIVE indicator on runs flagged live and SHALL list runs newest-first.

## Requirement 2: Defensive Journal Line Parsing

**User Story:** As the operator, I want every journal line the engine emits now or later to render without breaking the UI, so that new line kinds degrade gracefully instead of crashing the window.

Acceptance Criteria:
- 2.1 WHEN `classifyLine` receives a JSON line with a `label` and `phase` equal to `start` THE SYSTEM SHALL classify it as `leg-start` carrying the label and leg kind.
- 2.2 WHEN `classifyLine` receives a JSON line with a `label` and an `ok` boolean THE SYSTEM SHALL classify it as `leg-complete` carrying `ok`, and the `tokens`, `ms`, and `error` fields when present.
- 2.3 WHEN `classifyLine` receives a JSON line with `kind` equal to `battery` THE SYSTEM SHALL classify it as `battery` carrying `label`, and `start`, `ok`, `exitCode`, `ms` when present.
- 2.4 WHEN `classifyLine` receives a JSON line with a string `log` field THE SYSTEM SHALL classify it as `log`, and IF the log text starts with `EVT ` and the remainder parses as JSON THE SYSTEM SHALL classify it as `evt` carrying the inner `type` and payload.
- 2.5 IF the log text starts with `EVT ` and the remainder does NOT parse as JSON THE SYSTEM SHALL classify the line as plain `log` and SHALL NOT throw.
- 2.6 IF a line is not valid JSON, or is valid JSON matching no known shape THE SYSTEM SHALL classify it as `unknown` carrying the raw line text and SHALL NOT throw.
- 2.7 WHEN any module under `src/lib/journal/` is imported THE SYSTEM SHALL NOT transitively import `react`, `next`, or `node:fs`; the module SHALL operate on strings and arrays only.

## Requirement 3: Stage Grouping and Derived Run State

**User Story:** As the operator, I want journal legs grouped into a stage tree with per-leg status and run totals, so that one glance shows how far the run has progressed and what it costs.

Acceptance Criteria:
- 3.1 WHEN `groupStages` processes lines THE SYSTEM SHALL group leg and battery lines by the label substring before the first `:` and SHALL preserve first-seen stage order.
- 3.2 WHEN a stage prefix matches a known vocabulary entry (`impl`, `debug`, `val`, `refute`, `vfix`, `mech`, `setup`, `finalize`, `merge`, `note`, `enforce`, `gate`, `prsurface`) THE SYSTEM SHALL use its display title, and WHEN it does not THE SYSTEM SHALL create a group titled by the raw prefix without error.
- 3.3 WHEN a leg has a `leg-start` line and no matching completion THE SYSTEM SHALL mark it `running`; WHEN its completion has `ok` true THE SYSTEM SHALL mark it `done`; WHEN `ok` is false THE SYSTEM SHALL mark it `failed` and carry the `error` string.
- 3.4 WHEN `deriveRunView` processes lines THE SYSTEM SHALL report the now-line as the most recent `leg-start` without a matching completion, or null when none exists.
- 3.5 WHEN `deriveRunView` computes totals THE SYSTEM SHALL sum the numeric `tokens` fields across `leg-complete` lines as output tokens and SHALL count those lines as LLM hops.

## Requirement 4: Live Journal Tail over tRPC SSE

**User Story:** As the operator, I want new journal lines pushed to my phone as the chamber writes them, with automatic resume after a dropped connection, so that the view is genuinely live without manual refresh.

Acceptance Criteria:
- 4.1 WHEN the `runs.journalTail` subscription is active and a complete new line is appended to the run's top-level `journal.jsonl` THE SYSTEM SHALL yield it as a tRPC `tracked()` event whose id is the line's zero-based index as a string.
- 4.2 WHEN a client (re)connects with a `lastEventId` THE SYSTEM SHALL replay, from the file, every line whose index is greater than `Number(lastEventId)` before streaming new lines.
- 4.3 WHILE the subscription is active THE SYSTEM SHALL yield an untracked status event at least every 15 seconds and on file change, carrying the journal file's `mtimeMs`, a `finished` flag (`runner-summary.json` exists), and the stall threshold in ms derived from env `STALL_QUIET_MINUTES` (default 10).
- 4.4 WHEN the subscription is aborted via its `AbortSignal` THE SYSTEM SHALL close the chokidar watcher and SHALL NOT leak watchers across reconnects.
- 4.5 WHEN the client receives a line event whose index is already present in its line array THE SYSTEM SHALL ignore it, so replays and races cause no duplicates.
- 4.6 WHEN new lines arrive THE SYSTEM SHALL append them to the feed without a page reload, keep the feed pinned to the bottom while the operator has not scrolled up, and stop auto-scrolling once the operator scrolls up.
- 4.7 IF the run is not finished and `now - mtimeMs` exceeds the stall threshold THE SYSTEM SHALL show a STALLED badge in the NowLine, and WHEN activity resumes THE SYSTEM SHALL remove it.
- 4.8 WHEN the tRPC server is initialized THE SYSTEM SHALL enable SSE keep-alive pings (`sse.ping.enabled` true), and the client SHALL route subscription operations through `httpSubscriptionLink` and all other operations through `httpBatchLink` via `splitLink`, both against `/api/trpc`.

## Requirement 5: Run Snapshot and Finished-Run Mode

**User Story:** As the operator, I want to open any past run and see the same view rendered statically from its artifacts, so that one component tree serves both live observation and post-run review.

Acceptance Criteria:
- 5.1 WHEN `runs.get` executes for a runId THE SYSTEM SHALL return the parsed lines of the top-level `journal.jsonl` (empty array when the file is absent) plus the line count.
- 5.2 WHEN the run directory contains `turbo-*` subdirectories with their own `journal.jsonl` THE SYSTEM SHALL parse and merge those lines after the top-level lines, each tagged with its source directory name for badge rendering.
- 5.3 WHEN `runner-summary.json` exists THE SYSTEM SHALL return a `NormalizedSummary` accepting BOTH count shapes: driver `dispatch_counts` (`execCount`, `llmHops`, `turboRuns`) and child-era (`exec`, `llm_live`, `llm_replayed`), normalizing to `execCount`/`llmHops`/`turboRuns` plus `gate`, `halt_kind`, `error`, and live token totals.
- 5.4 WHEN the selected run is finished THE SYSTEM SHALL render the same component tree statically, SHALL NOT open a journal subscription, and SHALL show summary-derived numbers in the TokenMeter.
- 5.5 IF `runs.get` is called with a runId whose directory does not exist THE SYSTEM SHALL return a not-found result rendered as a composed empty state and SHALL NOT crash.
- 5.6 WHEN `readEngineState()` executes THE SYSTEM SHALL parse `<artifacts-root>/.engine-state.json`, and IF the file is absent or malformed THE SYSTEM SHALL return null without throwing.

## Requirement 6: Gate Banner and Repo Link

**User Story:** As the operator, I want a top banner that answers "did it merge, did it halt and why, or is it still going" plus one tap to the repo, so that the outcome is readable before any detail.

Acceptance Criteria:
- 6.1 WHEN the run's summary `gate` starts with `MERGED` THE SYSTEM SHALL render an emerald success banner showing MERGED and the feature name portion after the colon.
- 6.2 WHEN the run's summary `halt_kind` is non-null THE SYSTEM SHALL render a red banner showing HALTED, the `halt_kind`, and the gate or error text.
- 6.3 WHEN no summary exists and the run is live (engine-state `phase` is `running` for the newest run, or journal mtime is within the stall threshold) THE SYSTEM SHALL render a RUNNING banner with a pulsing live dot.
- 6.4 WHEN no summary exists and the run is not live THE SYSTEM SHALL render a neutral INCOMPLETE banner.
- 6.5 WHEN `resolveRepoUrl` executes THE SYSTEM SHALL scan the run's `result.json` string values for a GitHub repo reference, normalize SSH form `git@github.com:owner/repo(.git)` to `https://github.com/owner/repo`, fall back to env `CHAMBER_REPO_URL` when no match, and return null when neither yields a URL.
- 6.6 WHEN a repo URL resolves THE SYSTEM SHALL render an external-link icon as an anchor with `target="_blank"` and `rel="noopener noreferrer"`, and WHEN it resolves null THE SYSTEM SHALL render no icon.

## Requirement 7: Responsive Composition and Visual Law

**User Story:** As the operator, I want one calm, information-dense screen that works from phone to desktop in both color schemes, so that a glance answers "is everything okay and what is it doing".

Acceptance Criteria:
- 7.1 WHEN the run view renders below the `lg` breakpoint THE SYSTEM SHALL lay out banner, now-line, meter, stage tree, and feed in a single column, and WHEN at `lg` and above THE SYSTEM SHALL place StageTree and JournalFeed side by side via a grid while the banner row spans full width.
- 7.2 WHEN any numeral (tokens, ms, counts) renders THE SYSTEM SHALL style it with the existing Geist Mono stack (`font-mono tabular-nums`).
- 7.3 WHEN feature components render text THE SYSTEM SHALL NOT include the em-dash (`—`) or en-dash (`–`) characters in any rendered UI string literal.
- 7.4 WHEN colored status indicators render THE SYSTEM SHALL use them only for real semantic state with the locked palette (emerald-500 live/success, red-500 failure/halt, amber-500 stall/warning, zinc neutrals otherwise) and SHALL NOT render decorative dots or additional accent hues.
- 7.5 WHEN feature components style surfaces THE SYSTEM SHALL use paired light/dark utilities on zinc bases (e.g. `bg-zinc-50 dark:bg-zinc-950`) and SHALL NOT use pure `#000`/`#fff` backgrounds in feature components.
- 7.6 WHEN a live/running indicator animates THE SYSTEM SHALL gate the pulse behind `motion-safe:` so reduced-motion users see a static dot, and THE SYSTEM SHALL introduce no other animation.
- 7.7 WHEN the JournalFeed renders THE SYSTEM SHALL virtualize rows with `@tanstack/react-virtual` inside a fixed-height scroll container.
- 7.8 WHEN an `unknown` line renders in the feed THE SYSTEM SHALL show its raw text as a muted mono row that does not disturb sibling row layout.
- 7.9 WHEN relative times render (last activity, list metadata) THE SYSTEM SHALL derive them from file mtimes in the viewer's local time via `date-fns` and SHALL NOT render raw UTC strings.

## Requirement 8: Ownership, Dependency, and Read-Only Boundaries

**User Story:** As the maintainer, I want the feature fenced to its own files with zero new dependencies and zero side effects on the factory, so that the observability UI can never interfere with the system it observes.

Acceptance Criteria:
- 8.1 WHEN this feature is implemented THE SYSTEM SHALL leave `package.json` unedited, adding no npm dependency.
- 8.2 WHEN server code accesses the artifacts root THE SYSTEM SHALL use only read operations (readdir, readFile, stat, watch) and SHALL NOT write, create, or delete anything under it.
- 8.3 WHEN this feature is implemented THE SYSTEM SHALL make no HTTP request to chamber-bridge (`127.0.0.1:8378`) or any engine endpoint.
- 8.4 WHERE new files are added THE SYSTEM SHALL place them exclusively under `src/lib/journal/`, `src/server/`, `src/app/api/trpc/[trpc]/`, `src/app/run/[runId]/`, and `src/components/run-view/`, with `src/app/page.tsx` as the only edited existing file.
- 8.5 WHEN this feature is implemented THE SYSTEM SHALL leave `src/components/ui/**`, `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/utils.ts`, `src/hooks/**`, `src/test/setup.ts`, `vitest.config.ts`, `next.config.ts`, `tsconfig.json`, and `.dependency-cruiser.cjs` byte-identical.
- 8.6 WHEN this feature is implemented THE SYSTEM SHALL add no auth, middleware, session, or token code.

## Requirement 9: Test Coverage

**User Story:** As the maintainer, I want the parsing core, fs layer, and components covered by tagged tests, so that the validation battery proves the behaviors above without manual verification.

Acceptance Criteria:
- 9.1 WHEN `parse.test.ts` runs THE SYSTEM SHALL verify classification of fixture lines for each known kind: leg-start, leg-complete (ok and failed with `error`), battery (start and completion with `exitCode`), plain log, and EVT gate line decode.
- 9.2 WHEN `parse.test.ts` runs THE SYSTEM SHALL verify the defensive paths: non-JSON input, JSON of unrecognized shape, and an `EVT ` line with unparseable inner JSON, none throwing.
- 9.3 WHEN `stages.test.ts` runs THE SYSTEM SHALL verify prefix grouping with first-seen order, known-prefix titles, unknown-prefix fallback grouping, and running/done/failed leg status.
- 9.4 WHEN `derive.test.ts` runs THE SYSTEM SHALL verify now-line selection (including null when all legs complete) and token/hop totals.
- 9.5 WHEN `runs.test.ts` runs THE SYSTEM SHALL verify, against temp fixture directories: newest-first ordering, dot-entry exclusion, finished flags, nested `turbo-*` journal merging with source tags, summary normalization of BOTH count shapes, and missing-run behavior.
- 9.6 WHEN `gate-banner.test.tsx` runs THE SYSTEM SHALL verify all four banner variants and repo-icon presence with a URL versus absence with null.
- 9.7 WHEN `now-line.test.tsx` runs THE SYSTEM SHALL verify current-leg display and the stall badge appearing only past the threshold on unfinished runs.
- 9.8 WHEN `stage-tree.test.tsx` runs THE SYSTEM SHALL verify stage groups render with per-leg status, tokens, and ms in mono styling.
- 9.9 WHEN `journal-feed.test.tsx` runs THE SYSTEM SHALL verify known-kind rows render and an unknown-kind row renders its raw text harmlessly.
- 9.10 WHEN `run-view.test.tsx` runs THE SYSTEM SHALL verify the empty state (no runs / missing run) and the finished-run static render with summary numbers.
- 9.11 WHEN the repo battery runs (`npm run build`, `npx vitest run`, `npx depcruise src`) THE SYSTEM SHALL exit green with the feature in place.
