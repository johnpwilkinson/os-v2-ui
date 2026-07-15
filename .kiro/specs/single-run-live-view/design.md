# Single-Run Live View — Design

## Overview

Feature #1 of the dark-factory observability UI: a single-run live view that
replaces terminal-tailing as the operator's window into a chamber run. One
screen, reachable from a phone or MacBook over LAN/tailnet, that answers:
which run, what stage, what is it doing right now, is it stalled, what did it
cost, did it merge or halt and why.

The data source is the host filesystem surfaces documented in
`docs/observability-data-inventory.md` (ground truth, verified against real
runs). This UI is a strictly READ-ONLY consumer of `~/chamber-artifacts/`: it
never writes to any artifact path and never calls chamber-bridge or engine
action endpoints. The artifacts root comes from env `CHAMBER_ARTIFACTS_DIR`
(default `~/chamber-artifacts`, `~` expanded via `os.homedir()`).

Decisions settled in the brainstorm, with the alternatives that died:

- **Slice choice.** The operator picked "single-run live view" over
  "glance screen first" and "run history first": it replaces the terminal
  today, and the glance board (F2) later reuses the same data layer. Bigger
  map, context only, explicitly NOT specced here: F2 glance/home board, F3
  run history + per-stage economics from the `repo.bundle` ledger, F4 fleet
  grid over 10 chambers, F5 alert push. Fleet-readiness is paid ONLY in the
  data layer (run discovery lists the artifacts root; every query and the
  subscription are keyed by `runId`); no other fleet tax in this feature.
- **Component set** (operator multi-selected all): RunPicker, GateBanner
  (with repo-link icon), NowLine with stall badge, TokenMeter, StageTree,
  JournalFeed, plus finished-run mode (same tree, static, scoreboard header).
- **Form factor.** Mobile-first responsive Tailwind: single column by
  default, `lg:` splits StageTree and JournalFeed side by side. No separate
  phone/desktop designs.
- **Transport.** tRPC v11 is the only API layer (queries `runs.list`,
  `runs.get`; subscription `runs.journalTail`). Live delivery uses tRPC v11
  SSE subscriptions via `httpSubscriptionLink` (SSE under the hood,
  dependency-free) with `tracked()` events so reconnects resume from
  `lastEventId` by replaying journal lines after that index. Rejected: a
  hand-rolled SSE route handler beside tRPC (two transports, untyped
  payloads, manual reconnect) and polling (2s latency, phone battery,
  no push).
- **Repo link.** The GateBanner carries an icon opening the run's GitHub
  repo in a new tab. URL resolution order (operator pick): scan the run's
  `result.json` for a GitHub remote/URL string, else env `CHAMBER_REPO_URL`,
  else hide the icon. No PR deep-linking in v1.
- **Defensive parsing is the growth valve.** Journal line kinds vary and
  will grow. Every line classifies into a discriminated union with an
  `unknown` member that carries the raw text and renders harmlessly as a
  muted mono row. Malformed JSON, unrecognized shapes, and EVT lines whose
  inner JSON fails to parse must never throw.
- **Both run layouts.** New runs are flat (one top-level `journal.jsonl`).
  Old child-turbo-era runs also contain `turbo-<stage>-<feature>/`
  subdirectories with their own `journal.jsonl`. Finished-run rendering
  merges nested journals with a source-directory badge. Live tailing watches
  ONLY the top-level journal (all new runs are flat, per inventory §1).
  Both `runner-summary.json` count shapes are normalized: driver
  `dispatch_counts {execCount, llmHops, turboRuns}` and child-era
  `{exec, llm_live, llm_replayed}` (inventory §3).
- **Stall detection** mirrors the chamber-bridge watchdog's mtime-quiet
  logic without depending on the bridge (inventory §8-9): journal file
  mtime quiet longer than `STALL_QUIET_MINUTES` (env, default 10) while the
  run has no `runner-summary.json` shows a STALLED badge. Task-mode
  chambers with no live stream (inventory §9) fall out naturally: their
  runs render from whatever files exist at exit.
- **Timestamps.** Journal leg lines carry no timestamps; only durations
  (`ms`) and the file's mtime are trustworthy. The NowLine therefore shows
  "last activity Ns ago" derived from journal mtime (rendered relative,
  viewer-local), not a fabricated per-leg elapsed clock.
- **Auth: none in v1.** Private tool on a private tailnet. The commercial
  path is a future middleware seam; this feature adds no auth surface.
- **Visual direction.** The project skill `design-taste-frontend` §13 rules
  dashboards out of its own scope; its transferable law still binds this
  feature: zero em-dash/en-dash characters in rendered UI strings, no pure
  `#000`/`#fff` surfaces in feature components, status dots only where they
  carry real semantic state, all numerals in mono, one accent locked,
  WCAG AA contrast in both light and dark, `prefers-reduced-motion`
  honored. Direction: "factory floor at night" — dark-leaning, zinc
  neutrals (`zinc-50`/`zinc-950` bases via `dark:` variants, system
  preference decides), emerald-500 as the single accent (live pulse +
  success states), red-500 failure, amber-500 stall/warning, hairline
  dividers instead of card boxes (cockpit density), `font-mono
  tabular-nums` for every number. The only animation in the feature is a
  `motion-safe:animate-pulse` on live/running indicators.

Architecture consequence: one line array is the single source of truth on
the client. `runs.get` seeds it, `runs.journalTail` appends to it, and every
component derives its view model from it through the pure functions in
`src/lib/journal/` — no second data path, no component-private fetching.

## File Structure

Legend: **Owns** = this feature is the sole, ongoing owner. **Touches** =
existing shared file, edited only to integrate, not owned.

| Path | Boundary | Purpose |
|---|---|---|
| `src/lib/journal/types.ts` | Owns | `JournalLine` discriminated union (`leg-start`, `leg-complete`, `battery`, `fx-receipt`, `log`, `evt`, `unknown`), `StageNode`, `RunViewModel`, `NormalizedSummary` types. |
| `src/lib/journal/parse.ts` | Owns | `classifyLine(raw: string): JournalLine` — zod-validated shape matching, `EVT ` inner-JSON extraction, never throws; `parseJournal(text: string): JournalLine[]`. |
| `src/lib/journal/stages.ts` | Owns | `groupStages(lines: JournalLine[]): StageNode[]` — group legs by label prefix before the first `:`, first-seen order, per-leg status. |
| `src/lib/journal/derive.ts` | Owns | `deriveRunView(lines: JournalLine[]): RunViewModel` — now-line (last start without completion), token/hop totals, per-stage rollups. |
| `src/lib/journal/fixtures.ts` | Owns | Verbatim fixture lines from inventory §2 (leg start/complete, battery, fx receipt, EVT gate line, plain log) plus malformed/unknown samples, shared by unit tests. |
| `src/lib/journal/parse.test.ts` | Owns | Unit tests for `classifyLine`/`parseJournal`. |
| `src/lib/journal/stages.test.ts` | Owns | Unit tests for `groupStages`. |
| `src/lib/journal/derive.test.ts` | Owns | Unit tests for `deriveRunView`. |
| `src/server/runs.ts` | Owns | Server-only fs data layer: `artifactsRoot()`, `listRuns()`, `readRunSnapshot(runId)` (top-level + nested `turbo-*` journals), `normalizeSummary()`, `readEngineState()`, `resolveRepoUrl(runId)`. Read-only fs. |
| `src/server/journal-tail.ts` | Owns | `tailJournal(runId, lastEventId, signal)` async generator: chokidar watcher on the run's `journal.jsonl`, byte-offset incremental reads, `tracked()` line events + periodic untracked status events (mtime, finished, stall threshold). |
| `src/server/runs.test.ts` | Owns | Unit tests for `runs.ts` against temp fixture directories. |
| `src/server/api.ts` | Owns | `initTRPC` with SSE ping config, `appRouter` (`runs.list`, `runs.get`, `runs.journalTail`), exported `AppRouter` type. |
| `src/app/api/trpc/[trpc]/route.ts` | Owns | tRPC fetch adapter route handler exporting `GET` and `POST`. |
| `src/app/run/[runId]/page.tsx` | Owns | Deep-link page: `const { runId } = await params` (Next 16 params are a Promise), renders `<RunView runId={runId} />`. |
| `src/components/run-view/trpc.ts` | Owns | `createTRPCReact<AppRouter>()` instance + client factory with `splitLink` (subscription → `httpSubscriptionLink`, else `httpBatchLink`, both at `/api/trpc`). |
| `src/components/run-view/run-view.tsx` | Owns | Client shell: QueryClient + tRPC providers, snapshot query, journal subscription, line-array state, responsive layout grid, empty/error states. |
| `src/components/run-view/run-picker.tsx` | Owns | Run selector: newest-first list, LIVE badge, navigates to `/run/<runId>`. |
| `src/components/run-view/gate-banner.tsx` | Owns | MERGED / HALTED / RUNNING / INCOMPLETE banner + repo-link icon (new tab). |
| `src/components/run-view/now-line.tsx` | Owns | Current leg label + "last activity Ns ago" + STALLED badge. |
| `src/components/run-view/token-meter.tsx` | Owns | Cumulative output tokens + LLM hop count (live-derived; summary numbers when finished). |
| `src/components/run-view/stage-tree.tsx` | Owns | Stage groups with per-leg status, tokens, ms. |
| `src/components/run-view/journal-feed.tsx` | Owns | Virtualized line feed (`@tanstack/react-virtual`), bottom-stick autoscroll, kind-specific rows, harmless unknown rows. |
| `src/components/run-view/run-view.test.tsx` | Owns | Component tests for shell states (empty, finished, live). |
| `src/components/run-view/gate-banner.test.tsx` | Owns | Banner variant + repo icon tests. |
| `src/components/run-view/stage-tree.test.tsx` | Owns | Stage grouping render tests. |
| `src/components/run-view/journal-feed.test.tsx` | Owns | Feed rendering tests incl. unknown-kind harmlessness. |
| `src/components/run-view/now-line.test.tsx` | Owns | Now-line + stall badge tests. |
| `src/app/page.tsx` | Touches | Scaffold placeholder replaced: server component resolves newest run via `listRuns()` and renders `<RunView runId={newest} />`, or a composed empty state when no runs exist. No redirect. This is the only edit to scaffold-owned files. |

No other files are touched. `src/app/layout.tsx`, `src/app/globals.css`,
`src/components/ui/**`, `src/lib/utils.ts`, `src/hooks/**`, `src/test/setup.ts`,
`package.json`, `vitest.config.ts`, `next.config.ts`, `tsconfig.json`, and
`.dependency-cruiser.cjs` are all out of scope. The scaffold (shadcn
component inventory, configs) is project property; this feature claims no
ownership of it.

## Boundary Commitments

| Commitment | Detail |
|---|---|
| `src/lib/journal/` is pure and React-free | No import of `react`, `next/*`, `node:fs`, or any server API from any file under `src/lib/journal/`; plain functions over strings/arrays only, so the module is unit-testable and shareable with future features. |
| Read-only filesystem consumer | `src/server/**` uses only read operations (`readdir`, `readFile`, `stat`, chokidar watching); no `writeFile`, `mkdir`, `rm`, `appendFile`, or any mutation of anything under `CHAMBER_ARTIFACTS_DIR`. |
| No engine or bridge calls | No HTTP request to `127.0.0.1:8378` or any chamber-bridge/engine endpoint anywhere in the feature; liveness and stall are derived from the filesystem alone. |
| No new npm dependencies | `package.json` is not edited; the feature uses only already-installed packages (`@trpc/*`, `@tanstack/react-query`, `@tanstack/react-virtual`, `chokidar`, `zod`, `date-fns`, `lucide-react`, existing `src/components/ui/*`). |
| Scaffold fence | `src/components/ui/**`, `src/app/layout.tsx`, `src/app/globals.css`, `vitest.config.ts`, `next.config.ts`, `tsconfig.json`, `.dependency-cruiser.cjs` are byte-identical before and after this feature. |
| Bounded touch to `src/app/page.tsx` | The only scaffold file edited: its placeholder content is replaced with newest-run resolution + `<RunView>` mount (plus the zero-runs empty state); no other route or shared file is modified. |
| Unknown journal kinds render harmlessly | Any line that is not valid JSON or matches no known shape classifies as `unknown` and renders as a muted mono raw-text row; no code path throws on unrecognized input, including `EVT ` lines with unparseable inner JSON. |
| Both summary shapes normalized | `normalizeSummary()` accepts driver-mode `dispatch_counts` (`execCount`/`llmHops`/`turboRuns`) and child-era (`exec`/`llm_live`/`llm_replayed`) counts and produces one `NormalizedSummary`; no component reads raw summary JSON. |
| Nested turbo layout supported read-only | `readRunSnapshot` discovers `turbo-*/journal.jsonl` subdirectory journals and merges their lines tagged with a `source` directory label for finished-run rendering; live tailing watches only the top-level `journal.jsonl`. |
| tRPC is the only API layer | All client-server traffic goes through `/api/trpc` procedures; no bespoke REST/SSE route handlers; the live stream is a tRPC v11 subscription over `httpSubscriptionLink` with `tracked()` ids enabling `lastEventId` resume. |
| No em-dash or en-dash in UI strings | Rendered UI string literals in feature components contain no `—` or `–` characters (regular hyphen only), per the project taste skill. |
| Semantic-only status color | Colored dots/badges appear only where they encode real run/leg state; palette locked to emerald-500 (live/success), red-500 (failure/halt), amber-500 (stall/warning), zinc neutrals for everything else; no decorative dots, no gradients, no additional accent hues. |
| Numbers in mono | Every rendered numeral (tokens, ms, counts, hop totals) uses the existing `--font-geist-mono` stack (`font-mono tabular-nums`); no new font is loaded. |
| Motion budget | The only animation is `motion-safe:animate-pulse` on live/running indicators; no other transitions/animations are introduced, and reduced-motion users see a static dot. |
| No auth surface | No middleware, login, session, or token code is added; network exposure policy stays outside this feature. |
| Config surface is exactly three env vars | `CHAMBER_ARTIFACTS_DIR` (default `~/chamber-artifacts`), `CHAMBER_REPO_URL` (optional repo-link fallback), `STALL_QUIET_MINUTES` (default `10`); no other env vars, config files, or settings UI. |
| Defensive engine-state read | `.engine-state.json` absent or malformed yields `null` and the UI degrades (banner falls back to summary/liveness logic); it is never a hard dependency. |
| Times render viewer-local and relative | The UI shows relative times derived from file mtimes ("42s ago" via `date-fns/formatDistanceToNowStrict`); it never renders raw UTC strings and never fabricates per-leg wall-clock elapsed from data the journal does not carry. |

## Concrete Shape

**Line classification** (`src/lib/journal/parse.ts`) — shapes verbatim from
inventory §2; zod schemas with `.passthrough()`-style tolerance, tried in
order, `unknown` as the fall-through:

```ts
export type JournalLine =
  | { kind: "leg-start"; label: string; legKind: string; raw: string }
  | { kind: "leg-complete"; label: string; legKind: string; ok: boolean;
      tokens?: number; ms?: number; error?: string; raw: string }
  | { kind: "battery"; label: string; start?: boolean; ok?: boolean;
      exitCode?: number; ms?: number; raw: string }
  | { kind: "evt"; evtType: string; payload: Record<string, unknown>; raw: string }
  | { kind: "log"; text: string; raw: string }
  | { kind: "unknown"; raw: string };
```

Classification rules: JSON with `kind === "battery"` → `battery`; JSON with
`label` + `phase === "start"` → `leg-start`; JSON with `label` + (`ok` or
boundary `start`/completion fields) → `leg-complete` (fx receipts share this
shape and are distinguished downstream by label prefix, so no separate
classifier branch is needed beyond the union's `fx-receipt` alias resolving
to `leg-complete` legs grouped under fx prefixes); JSON with a `log` string →
`log`, and if the text starts with `"EVT "` parse the remainder as JSON into
`evt` (on inner-parse failure, stay `log`); anything else (invalid JSON
included) → `unknown`.

**Stage grouping** (`stages.ts`): stage key = label substring before the
first `:` (`val:9.1` → `val`); first-seen order preserved; known prefixes
map to display titles (`impl` Implement, `debug` Debug, `val`/`refute`
Validate, `vfix` Validate-fix, `mech` Battery, `setup` Setup, `finalize`
Finalize, `merge` Merge, `note` Notes, `enforce` Enforce, `gate` Gate,
`prsurface` PR surface); unknown prefixes become their own group titled by
the raw prefix. Leg status: start without completion → `running`; `ok:true`
→ `done`; `ok:false` → `failed` carrying `error`.

**Tail subscription** (`src/server/api.ts` + `journal-tail.ts`):

```ts
const t = initTRPC.create({ sse: { ping: { enabled: true, intervalMs: 15_000 } } });

journalTail: t.procedure
  .input(z.object({ runId: z.string(), lastEventId: z.string().nullish() }))
  .subscription(async function* (opts) {
    yield* tailJournal(opts.input.runId, opts.input.lastEventId, opts.signal);
  });
```

`tailJournal` re-reads the journal from byte offset 0 on connect, counts
lines, replays lines with index > Number(lastEventId ?? -1) as
`tracked(String(index), { type: "line", index, line })`, then watches with
chokidar (`{ signal }`-aware cleanup via `watcher.close()`) and yields newly
appended complete lines the same way (partial trailing lines are buffered
until their newline arrives). Every ~15s and on each change event it yields
an untracked `{ type: "status", mtimeMs, finished, stallAfterMs }` where
`finished` = `runner-summary.json` exists and `stallAfterMs` =
`STALL_QUIET_MINUTES * 60_000`.

**Route handler** (`src/app/api/trpc/[trpc]/route.ts`): standard
`fetchRequestHandler` from `@trpc/server/adapters/fetch` with
`endpoint: "/api/trpc"`, exported as both `GET` and `POST`. Before writing
any Next-specific code, implementers must read the relevant guide under
`node_modules/next/dist/docs/` (project rule in `AGENTS.md`; Next 16 differs
from training data — e.g. dynamic `params` are a `Promise` and must be
awaited).

**Client wiring** (`src/components/run-view/trpc.ts`):

```ts
splitLink({
  condition: (op) => op.type === "subscription",
  true: httpSubscriptionLink({ url: "/api/trpc" }),
  false: httpBatchLink({ url: "/api/trpc" }),
})
```

`run-view.tsx` holds `lines: JournalLine[]` seeded from `runs.get` and
appended by subscription line events (deduped by index: ignore events whose
index is already present), passes `lastEventId` = last seen index on
subscribe, and derives everything via `groupStages`/`deriveRunView` in
`useMemo`. Finished runs skip the subscription entirely
(`enabled: !snapshot.finished`).

**Layout** (`run-view.tsx`): single column
`flex flex-col gap-4 px-4 py-4 max-w-7xl mx-auto`; at `lg:` the tree/feed
pair becomes `lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]` with the
banner/now-line/meter row full-width above. Base surfaces
`bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`; rows
separated by `divide-y divide-zinc-200 dark:divide-zinc-800`; no card
chrome around data rows. Live dot:
`size-2 rounded-full bg-emerald-500 motion-safe:animate-pulse`.

**GateBanner logic**, in priority order: summary present and `gate` starts
with `"MERGED"` → emerald banner "MERGED" + feature name; summary present
and `halt_kind` non-null → red banner "HALTED" + `halt_kind` + `gate`/
`error` text; no summary and run is live (newest + engine-state
`phase === "running"`, or journal mtime within stall window) → neutral
banner "RUNNING" with pulse dot; no summary otherwise → zinc "INCOMPLETE".
Repo icon: `lucide-react` `ExternalLink` inside an `<a target="_blank"
rel="noopener noreferrer">`, rendered only when `resolveRepoUrl` returned a
URL (scan `result.json` string values for
`/github\.com[:/][\w.-]+\/[\w.-]+/`, normalize `git@github.com:owner/repo(.git)`
to `https://github.com/owner/repo`; else `CHAMBER_REPO_URL`; else `null`).

**Tests**: pure-lib tests assert classification of each inventory §2 fixture
line, unknown fall-through, EVT decode + EVT inner-parse failure, grouping
order, running/failed status, now-line selection, and token/hop totals.
`runs.test.ts` builds temp run directories (flat and nested `turbo-*`,
driver and child-era summaries) and asserts list order, finished flags,
snapshot merging, summary normalization, and missing-run behavior.
Component tests (jsdom + testing-library, per `vitest.config.ts`) assert
banner variants, repo-icon presence/absence, stall badge, stage render, and
that an `unknown` line renders its raw text without crashing the feed.
