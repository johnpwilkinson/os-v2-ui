# Unified Console — Design

## Overview

The repo currently ships two disjoint surfaces: `/run/[runId]` (focal: one
run's live journal tail, stage tree, token meter — `src/components/run-view/`)
and `/console` (ambient: CRT panel polling the bridge's `/console/state` every
5s for engine/fleet/decisions — `src/components/console-panel/`). This feature
fuses them into one surface at `/console`, designed in a visual brainstorm
session (2026-07-19) that converged on a **hybrid**: the broadcast-switcher
shell (a filmstrip of run tiles + one dominant "program monitor") carrying the
existing run-view data machinery inside, all in the console's established CRT
skin.

Settled decisions from the brainstorm, on the record:

- **One route, two zoom levels.** `/console/[[...runId]]` (optional catch-all)
  replaces both pages. No segment → newest run is program. Segment → that run
  is program. `/run/[runId]` and `/` become redirects so existing deep links
  and muscle memory survive. Rejected: keeping two routes (splits state),
  modal-over-console (loses ambient strip while focal).
- **Filmstrip, not sidebar; dim, never remove.** Every run renders as a tile
  in a bottom filmstrip, newest first. Bus filter buttons (LIVE / HALTED /
  PASSED / ALL, each with a count) dim non-matching tiles instead of
  unmounting them — tile positions are spatial anchors and never move.
  Rejected: Select dropdown (hides fleet-at-a-glance), removing filtered tiles
  (destroys spatial memory).
- **Cheap tiles v1.** Tiles carry status LED, runId, relative age, elapsed
  clock, output tokens (finished runs), and repo-alias + phase (live runs,
  joined from the console state's Wave F `runs` map by runId). NO per-tile
  journal tails and NO per-tile stage bands in v1 — both need a per-run digest
  endpoint; deferred (see Non-goals).
- **Running timers everywhere** (operator-requested): a total run clock in the
  stages panel header ticking at 1s until the chamber finishes, a per-stage
  duration on every stage row, and mini clocks on filmstrip tiles. Journal
  lines carry NO wall-clock timestamps (verified: `src/lib/journal/types.ts`,
  fixtures), so the derivation doctrine is: total clock = now − start where
  start is parsed from the runId itself (`YYYYMMDDTHHMMSSmmm`, local time);
  completed-stage duration = sum of that stage's `leg-complete`/`battery` `ms`
  values; the live remainder (total elapsed − all completed leg ms) is
  attributed to the stage owning the most recently opened running leg, which
  therefore ticks. Slightly generous (absorbs inter-leg gaps) and honest —
  exact per-stage timing requires the bridge to emit a `ts` field on journal
  lines, which is an explicitly deferred bridge-side feature.
- **Journal shows everything.** Full history in a virtualized pane (the data
  layer already holds all lines: snapshot seed + subscription append in
  `run-view.tsx`), pinned to the tail by default. Scrolling up unpins
  (amber "reviewing history" state) and arriving lines accumulate into a
  green "▼ N NEW LINES" pill; clicking it or scrolling back to bottom repins.
- **Ambient strip always on:** CONSOLE brand, `[ OPTIMAL NEXT ]` directive,
  `[ INTERCOM ]` compact pending-decision lines with 1s TTL countdowns, and a
  fleet summary. Console-state failure degrades to a LINK DOWN banner without
  breaking run viewing — the two data sources fail independently.
- **Keyboard-first:** `j`/`k` walk the filmstrip highlight, `Enter` takes the
  highlighted run as program, `1`–`4` toggle the bus filters. Keys are ignored
  while focus is in an editable element.
- **Builds on the merged `console-multi-run` feature** (dev-engine, merged
  2026-07-19): its tolerant parse layer — `ConsoleRun`, `parseRuns`, and the
  `runs` map on `ConsoleState` (`src/lib/console/types.ts:27-42`,
  `parse.ts:54-68`) — is consumed AS-IS with zero changes; this feature joins
  tiles to it by runId. Its `[ RUNS ]` board (`runs-board.tsx`) is superseded
  by the filmstrip, which renders every concurrent run as a first-class tile,
  and is deleted along with the rest of `console-panel/`.
- **Consolidation is real:** `src/components/run-view/` and
  `src/components/console-panel/` are deleted (their machinery is adapted into
  the deck), the old `/console/page.tsx` is replaced by the catch-all, and
  `/` + `/run/[runId]` become redirects. No zombie UI.

Status taxonomy, derived server-side onto each run list entry: **live** = no
`runner-summary.json`; **halted** = finished with non-null `halt_kind`;
**passed** = finished otherwise. Stall is a program-monitor annotation (mtime
vs stall window), not a bucket.

## Non-goals

- No bridge/API changes of any kind; the bridge already serves everything this
  feature reads. In particular, exact active-stage timing via a `ts` field on
  journal lines is a **deferred bridge-side feature** the operator has flagged
  for later — v1 ships the derived remainder tick described above.
- No per-tile stage bands or per-tile live journal tails (needs a per-run
  digest endpoint — follow-on).
- No timeline scrubber / run replay (the "tape deck" direction; deferred —
  `deriveRunView` is already a pure fold over lines, so the door stays open).
- No command palette (`⌘K`), no URL persistence of filter state.
- No polling-cadence changes (console state keeps the existing 5s refetch; the
  journal tail keeps the existing SSE subscription).
- No new npm packages (`@tanstack/react-virtual`, `date-fns`, tRPC, zod are
  already dependencies).

## File Structure

Legend: **Owns** = sole ongoing owner. **Touches** = existing shared file,
edited only to integrate. **Deletes** = removed by this feature.

| Path | Boundary | Purpose |
|---|---|---|
| `src/app/console/[[...runId]]/page.tsx` | Owns | Optional catch-all route; extracts the first segment (or null) and renders `<ConsoleDeck runId={...} />`. |
| `src/app/console/[[...runId]]/page.test.tsx` | Owns | Route tests: segment extraction, no-segment default. |
| `src/components/console-deck/trpc.ts` | Owns | tRPC React client for the deck (same split-link pattern as the deleted `run-view/trpc.ts`). |
| `src/components/console-deck/crt.ts` | Owns | Shared CRT class-string constants (micro label, glow, scanline overlay, status colors). |
| `src/components/console-deck/console-deck.tsx` | Owns | Providers + shell: queries `runs.list` + `console.state`, owns selection/walk/filter state, keyboard bindings, CRT frame, composes strip/bus/program/filmstrip. |
| `src/components/console-deck/ambient-strip.tsx` | Owns | Presentational: brand, optimal-next, intercom decision lines with TTL countdown, fleet summary, link-down banner. |
| `src/components/console-deck/bus-filter.tsx` | Owns | Presentational: LIVE/HALTED/PASSED/ALL toggle buttons with counts. |
| `src/components/console-deck/filmstrip.tsx` | Owns | Presentational: ordered tile row, dim application, walk highlight, selection. |
| `src/components/console-deck/run-tile.tsx` | Owns | Presentational: one run tile (LED, runId, age, clock, tokens, alias/phase). |
| `src/components/console-deck/program-monitor.tsx` | Owns | Stateful: snapshot query + journal-tail subscription for the program run; header, meter row, status treatments; composes stage panel + journal pane. |
| `src/components/console-deck/stage-panel.tsx` | Owns | Presentational: stages with per-stage timers and the header total run clock. |
| `src/components/console-deck/journal-pane.tsx` | Owns | Presentational: virtualized full-history journal with pin/unpin + new-lines pill (row renderers adapted from the deleted `journal-feed.tsx`). |
| `src/components/console-deck/*.test.tsx` | Owns | One test file per component above. |
| `src/lib/run-clock/run-clock.ts` | Owns | Pure time helpers: runId→epoch parse, clock formatting, per-stage duration/ticking derivation. |
| `src/lib/run-clock/run-clock.test.ts` | Owns | Unit tests for the above. |
| `src/server/runs.ts` | Touches | `listRuns` reads + normalizes `runner-summary.json` content per entry; `RunListEntry` gains `status`, `gate`, `haltKind`, `outputTokens`, `llmHops`. |
| `src/server/runs.test.ts` | Touches | Coverage for the list extension. |
| `src/app/page.tsx` | Touches | Becomes `redirect("/console")`. |
| `src/app/page.test.tsx` | Touches | Updated to assert the redirect. |
| `src/app/run/[runId]/page.tsx` | Touches | Becomes `redirect("/console/" + runId)`. |
| `src/app/run/[runId]/page.test.tsx` | Touches | Updated to assert the redirect. |
| `src/app/console/page.tsx` + `page.test.tsx` | Deletes | Replaced by the catch-all segment. |
| `src/components/run-view/` (entire directory) | Deletes | Machinery adapted into `console-deck`; nothing imports it afterward. |
| `src/components/console-panel/` (entire directory) | Deletes | Replaced by ambient strip + deck, including the merged `runs-board.tsx` (its role passes to the filmstrip); nothing imports it afterward. |

No other files are touched. `src/server/api.ts`, `src/server/journal-tail.ts`,
`src/server/console.ts`, `src/lib/journal/`, `src/lib/console/`, and
`src/app/api/trpc/` are all out of scope — the tRPC router surface, the
journal parse/derive/stages layer, and the console-state parse layer
(including `ConsoleRun`/`parseRuns`) are consumed as-is.

## Boundary Commitments

| Commitment | Meaning | depcruise rule |
| --- | --- | --- |
| ambient strip presentational | `src/components/console-deck/ambient-strip.tsx` MUST NOT import `src/components/console-deck/trpc.ts` |  |
| bus filter presentational | `src/components/console-deck/bus-filter.tsx` MUST NOT import `src/components/console-deck/trpc.ts` |  |
| run tile presentational | `src/components/console-deck/run-tile.tsx` MUST NOT import `src/components/console-deck/trpc.ts` |  |
| filmstrip presentational | `src/components/console-deck/filmstrip.tsx` MUST NOT import `src/components/console-deck/trpc.ts` |  |
| stage panel presentational | `src/components/console-deck/stage-panel.tsx` MUST NOT import `src/components/console-deck/trpc.ts` |  |
| journal pane presentational | `src/components/console-deck/journal-pane.tsx` MUST NOT import `src/components/console-deck/trpc.ts` |  |
| run clock lib isolation | `src/lib/run-clock` MUST NOT import `src/components` |  |
| journal lib isolation | `src/lib/journal` MUST NOT import `src/components` |  |

## Concrete Shape

**Route** (`src/app/console/[[...runId]]/page.tsx`):
```tsx
export const dynamic = "force-dynamic";
export default async function ConsolePage({ params }: { params: Promise<{ runId?: string[] }> }) {
  const { runId } = await params;
  return <ConsoleDeck runId={runId?.[0] ?? null} />;
}
```
Redirects: `src/app/page.tsx` → `redirect("/console")`;
`src/app/run/[runId]/page.tsx` awaits params then
`redirect(\`/console/${runId}\`)` (both `next/navigation`).

**CRT constants** (`src/components/console-deck/crt.ts`) — carried verbatim
from the deleted console-panel: micro label
`text-[11px] uppercase tracking-[0.08em] text-[#EAEAEA]/60`; primary glow
`text-sm [text-shadow:0_0_6px_rgba(234,234,234,0.22)]`; scanline overlay
`pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.18)_2px,rgba(0,0,0,0.18)_4px)]`;
frame `min-h-[100dvh] bg-[#0A0A0A] text-[#EAEAEA] font-mono`; corner `+`
crosshairs. Status colors: live `text-emerald-400` (LED
`bg-emerald-400` + pulse), halted `#E61919` (LED blink), passed
`text-[#EAEAEA]/40`, stalled/decisions `text-amber-400`.

**run-clock** (`src/lib/run-clock/run-clock.ts`):
```ts
export function parseRunIdStart(runId: string): number | null
// /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(\d{3})$/ → new Date(y, m-1, d, hh, mm, ss, ms).getTime(); null on mismatch
export function formatClock(ms: number): string  // "m:ss", "h:mm:ss" past 1h, clamps negatives to 0:00
export function stageClocks(stages: StageNode[], totalElapsedMs: number): Map<string, { ms: number; ticking: boolean }>
// per stage: sum of completed legs' ms (missing ms → 0). The stage owning the
// most recently opened running leg (last "running" leg in stage order) gets
// ticking=true and ms += max(0, totalElapsedMs − Σ all completed leg ms).
```
Total clock: live → `now − parseRunIdStart(runId)` on a 1s interval; finished
→ `mtimeMs − start`, frozen. Unparseable runId → clock omitted.

**Server list extension** (`src/server/runs.ts`): `listRuns` already stats
`runner-summary.json`; it now also reads + `normalizeSummary`s it when
present. Entry shape:
```ts
export interface RunListEntry {
  runId: string; finished: boolean; mtimeMs: number;
  status: "live" | "halted" | "passed";
  gate?: string; haltKind?: string | null; outputTokens?: number; llmHops?: number;
}
```
Malformed/unreadable summary JSON → `finished: true, status: "passed"` with
the optional fields undefined (never throw; mirrors `readRunSnapshot`'s
try/catch style).

**Deck shell** (`console-deck.tsx`): one `QueryClient` + one trpc client
(pattern of the deleted `run-view/trpc.ts`). Queries: `runs.list` (refetch
5s), `console.state` (refetch 5s). Program runId = URL segment ?? newest
(`runs[0]`). Taking a run = `router.push("/console/" + runId)`. Filter state:
`Set<"live"|"halted"|"passed">`, all on initially; key `1`/`2`/`3` toggles one
bucket, `4` (ALL) re-enables all; `j`/`k` move walk highlight; `Enter` takes;
handler attached on `window` keydown, early-returns when
`event.target` is an input/textarea/contenteditable. Zero runs → empty state
naming `CHAMBER_ARTIFACTS_DIR` (text of the old root page).

**Program monitor** (`program-monitor.tsx`) adapts `RunViewShell`
(run-view.tsx:42-156) unchanged in substance: snapshot seed via seeded index
set, `runs.journalTail` subscription while unfinished with
`lastEventId = lineCount − 1`, dedup by line index, single refetch on
finished, stall = `now − mtimeMs > stallAfterMs`. Header status line
treatments (adapted from `gate-banner.tsx`): MERGED (emerald, feature name
after the colon), HALTED (red, `halt_kind` + gate/error detail), LIVE
(pulsing emerald LED), STALLED (amber tag), INCOMPLETE (dim). Meter row:
`GATE <value or —> · EXEC <summary.execCount or —> · LLM HOPS <n> · OUT TOKENS <n>`
— summary values when finished, `deriveRunView` values while live (exec shows
`—` live; it is not derivable from journal lines). Repo link renders the
`ExternalLink` icon when `repoUrl` resolves.

**Journal pane** (`journal-pane.tsx`): virtualizer setup copied from the
deleted `journal-feed.tsx` (ROW_HEIGHT_PX 32, overscan 12, stick threshold
40px) with the row renderers (LegRow/EvtRow/LogRow/UnknownRow/SourceBadge)
restyled to CRT classes. Pin state machine: pinned by default;
`scrollHeight − scrollTop − clientHeight > 40` → unpinned; while unpinned
arriving lines increment the pill count instead of scrolling; pill click or
scroll-to-bottom repins, clears, jumps to tail. Header right shows
`● PINNED TO TAIL · <n> LINES` (emerald) or
`○ UNPINNED — REVIEWING HISTORY` (amber).

**Stage panel** (`stage-panel.tsx`): props `{ stages, totalMs, live }`.
Header: `[ STAGES ]` micro label left, total clock right —
`formatClock(totalMs)`, emerald glow + `tabular-nums`, ticking only when
`live`. Each stage row: status dot (running=pulse emerald, done=dim,
failed=red), title, leg count micro, right-aligned `formatClock` of its
`stageClocks` entry (emerald + glow when `ticking`); stages render in
`groupStages` order.

**Tiles** (`run-tile.tsx`): props-only. LED per status; runId (truncate with
leading `…` when narrow); `formatDistanceToNowStrict` age; clock per the
run-clock rules; finished tiles show `<tokens>` when known; live tiles show
`<alias> · <phase>` when a `ConsoleRun` with matching runId exists in the
state's `runs` map. Selected tile: emerald border + shadow. Dimmed (filtered
bucket): `opacity-35`, still clickable. Walk highlight: brighter border.

**Ambient strip** (`ambient-strip.tsx`): 4-cell grid (brand CONSOLE /
OPTIMAL NEXT / INTERCOM / FLEET) joined by 1px `bg-[#EAEAEA]/20` gaps like the
old panel grid. Intercom lines: `<KIND> <title> ⏳ <mm:ss>` — countdown from
`expiresAt − nowMs` (nowMs ticks 1s in the deck and flows down as a prop),
red-kind rule reused from `decision-row.tsx` (`halt`, or `verdict` not
recommending Merge). Fleet: `<watched> WATCHED · <drivers> DRIVER · Q:<depth>`
from `state.repos` + `watchQueueDepth`. Link-down: the old panel's red
`── LINK DOWN ── <error>` banner, rendered in the strip's row without
unmounting the rest of the deck.

**Test outline:** all components are prop-driven except `console-deck` and
`program-monitor`, which are tested through mocked trpc the way
`console-panel.test.tsx` and `run-view.test.tsx` do today; timers tested with
`vi.useFakeTimers`; the journal pane's virtualizer tested with the same
scroll-container mocking `journal-feed.test.tsx` uses; route tests assert
redirects via mocked `next/navigation`.
