# Unified Console — Implementation Plan

## Tasks

- [ ] 1. Run-clock lib
- [x] 1.1 Create src/lib/run-clock/run-clock.ts exporting parseRunIdStart(runId) that matches /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(\d{3})$/ and returns new Date(y, m-1, d, hh, mm, ss, ms).getTime() as a local-time epoch or null on mismatch; formatClock(ms) returning m:ss below one hour and h:mm:ss at or above it with negatives clamped to 0:00; and stageClocks(stages: StageNode[], totalElapsedMs) returning a Map keyed by stage.key of { ms, ticking } where ms is the sum of that stage's done/failed legs' ms values (a missing ms counts as 0) and exactly the stage owning the most recently opened still-running leg (last leg with status running in stage-then-leg order) gets ticking true with ms increased by max(0, totalElapsedMs minus the sum of ALL completed leg ms across all stages); import StageNode from @/lib/journal/types only — no React, no component imports, no new packages.
  _Requirements: 7.1, 7.4, 7.5, 7.6_
  _Boundary: src/lib/run-clock_
- [x]* 1.2 Create src/lib/run-clock/run-clock.test.ts with tests tagged [req:11.1]: parseRunIdStart parses 20260719T180530657 to the expected local epoch and returns null for garbage and for a runId missing the millisecond digits; formatClock renders 0:00 for negatives and 90000 as 1:30 and 3661000 as 1:01:01; stageClocks sums completed leg ms per stage and counts missing ms as zero and attributes the remainder tick only to the stage of the most recently opened running leg and returns ticking false everywhere when no leg is running.
  _Requirements: 11.1_
  _Boundary: src/lib/run-clock_
  _Depends: 1.1_

- [ ] 2. Run list status extension
- [x] 2.1 In src/server/runs.ts extend RunListEntry with status: "live" | "halted" | "passed" plus optional gate, haltKind (string or null), outputTokens, and llmHops, and extend listRuns so each entry with an existing runner-summary.json reads the file and maps it through the existing normalizeSummary to fill gate, haltKind (from halt_kind), outputTokens (from live_output_tokens), and llmHops, deriving status halted when finished with non-null haltKind and passed for every other finished entry and live when unfinished; an unreadable or malformed summary keeps finished true and status passed with the optional fields undefined via try/catch mirroring readRunSnapshot's style; no change to readRunSnapshot, resolveRepoUrl, or the tRPC router.
  _Requirements: 2.1, 2.2, 2.3, 2.4_
  _Boundary: src/server_
- [x]* 2.2 In src/server/runs.test.ts add listRuns tests tagged [req:11.2]: an entry with a well-formed runner-summary.json carries gate, haltKind, outputTokens, llmHops and status passed or halted per halt_kind; an entry without the file is finished false with status live and no summary fields; an entry with malformed JSON in the file is finished true with status passed and undefined summary fields and the call does not throw.
  _Requirements: 11.2_
  _Boundary: src/server_
  _Depends: 2.1_

- [ ] 3. CRT constants
- [x] 3.1 Create src/components/console-deck/crt.ts exporting the shared CRT class-string constants carried verbatim from console-panel.tsx: MICRO_LABEL = "text-[11px] uppercase tracking-[0.08em] text-[#EAEAEA]/60"; PRIMARY_TEXT = "text-sm [text-shadow:0_0_6px_rgba(234,234,234,0.22)]"; SCANLINES = "pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.18)_2px,rgba(0,0,0,0.18)_4px)]"; FRAME = "min-h-[100dvh] bg-[#0A0A0A] text-[#EAEAEA] font-mono"; plus STATUS text/led class maps for live (emerald-400 with pulse), halted (#E61919 with blink via animate-pulse), passed (text-[#EAEAEA]/40), and stalled/amber (text-amber-400); constants only — no components, no JSX, no trpc import.
  _Requirements: 10.1_
  _Boundary: src/components/console-deck/crt.ts_

- [ ] 4. Ambient strip
- [x] 4.1 (P) Create src/components/console-deck/ambient-strip.tsx: pure presentational AmbientStrip({ state, error, nowMs }) with no trpc import and no data fetching, rendering a 4-cell grid joined by 1px bg-[#EAEAEA]/20 gaps — a CONSOLE brand cell, an [ OPTIMAL NEXT ] cell showing state.optimalNext in PRIMARY_TEXT, an [ INTERCOM ] cell listing each pending decision as one compact line of uppercase kind plus title plus a TTL countdown formatted mm:ss from Date.parse(decision.expiresAt) minus nowMs (kind styled #E61919 when kind is halt or when kind is verdict and recommendation does not start with Merge, mirroring the deleted decision-row.tsx) or a dimmed NO PENDING DECISIONS line when empty, and a [ FLEET ] cell showing watched count, driver count, and Q:<watchQueueDepth> derived from state.repos; when error is non-null render the red "── LINK DOWN ── <error>" banner row in place of the state cells without throwing.
  _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  _Boundary: src/components/console-deck/ambient-strip_
  _Depends: 3.1_
- [x]* 4.2 Create src/components/console-deck/ambient-strip.test.tsx with tests tagged [req:11.3]: optimalNext text renders; a pending decision renders kind, title, and a countdown that changes when nowMs advances by 1000; empty decisions renders NO PENDING DECISIONS; the fleet cell renders watched/driver counts and queue depth from a fixture state; a non-null error renders the LINK DOWN banner containing the error text.
  _Requirements: 11.3_
  _Boundary: src/components/console-deck/ambient-strip_
  _Depends: 4.1_

- [ ] 5. Bus filter
- [x] 5.1 (P) Create src/components/console-deck/bus-filter.tsx: pure presentational BusFilter({ enabled, counts, onToggle, onAll }) with no trpc import, rendering four toggle buttons LIVE, HALTED, PASSED (each showing its counts value and an on/off treatment — emerald border/glow for enabled live/passed, #E61919 treatment for enabled halted, plain dim border when off) and ALL which calls onAll; each status button calls onToggle with its bucket key; buttons carry type="button" and the bucket name plus count as accessible text.
  _Requirements: 4.1, 4.3_
  _Boundary: src/components/console-deck/bus-filter_
  _Depends: 3.1_
- [x]* 5.2 Create src/components/console-deck/bus-filter.test.tsx with tests tagged [req:11.4]: each bucket button shows its count from the counts prop; clicking a bucket button calls onToggle with that bucket key; clicking ALL calls onAll; an off bucket carries the dim treatment class.
  _Requirements: 11.4_
  _Boundary: src/components/console-deck/bus-filter_
  _Depends: 5.1_

- [ ] 6. Filmstrip and tiles
- [x] 6.1 (P) Create src/components/console-deck/run-tile.tsx: pure presentational RunTile({ entry, consoleRun, selected, highlighted, dimmed, nowMs, onTake }) with no trpc import, rendering a status LED per entry.status (emerald pulse for live, #E61919 for halted, dim for passed), the runId, relative age via formatDistanceToNowStrict(entry.mtimeMs), and a clock from parseRunIdStart(entry.runId) — live entries render formatClock(nowMs minus start) and finished entries render formatClock(entry.mtimeMs minus start) frozen, and an unparseable runId renders no clock at all; finished tiles append entry.outputTokens when defined; live tiles append the repo alias and phase when a consoleRun prop with matching runId is passed (prop shape { alias: string; phase: string | null }); selected renders an emerald border+shadow treatment, highlighted renders a brighter border, dimmed renders opacity-35 while the tile stays mounted and clickable; clicking calls onTake(entry.runId).
  _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  _Boundary: src/components/console-deck/run-tile_
  _Depends: 1.1, 2.1, 3.1_
- [x] 6.2 (P) Create src/components/console-deck/filmstrip.tsx: pure presentational Filmstrip({ entries, runsByRunId, enabled, selectedRunId, highlightedRunId, nowMs, onTake }) with no trpc import, rendering one RunTile per entry in the given newest-first order inside a horizontal flex row, passing dimmed when the entry's status bucket is not in the enabled set (never filtering entries out of the array), selected when entry.runId equals selectedRunId, highlighted when it equals highlightedRunId, and the matching consoleRun lookup from runsByRunId.
  _Requirements: 4.2, 4.4, 5.1, 5.5_
  _Boundary: src/components/console-deck/filmstrip_
  _Depends: 6.1_
- [x]* 6.3 Create src/components/console-deck/run-tile.test.tsx and src/components/console-deck/filmstrip.test.tsx with tests tagged [req:11.5] using vi.useFakeTimers where clocks tick: live tile clock string changes when nowMs advances and finished tile clock is frozen at mtime minus start; a non-timestamp runId renders no clock element; halted and passed treatments apply their classes; alias and phase render when consoleRun is passed; selected treatment applies; a disabled bucket's tile carries opacity-35 yet remains in the document and clicking it still calls onTake.
  _Requirements: 11.5_
  _Boundary: src/components/console-deck/run-tile, src/components/console-deck/filmstrip_
  _Depends: 6.2_

- [ ] 7. Stage panel
- [x] 7.1 (P) Create src/components/console-deck/stage-panel.tsx: pure presentational StagePanel({ stages, totalMs, live }) with no trpc import — header row with [ STAGES ] micro label left and the total run clock right rendered as formatClock(totalMs) in emerald glow with tabular-nums (the parent ticks totalMs while live and freezes it when finished); one row per StageNode in groupStages order showing a status dot (running pulse emerald, done dim, failed #E61919), the stage title, a leg-count micro label, and a right-aligned tabular-nums duration from stageClocks(stages, totalMs) — static dim text for non-ticking stages and emerald glow for the ticking stage; failed legs surface their error text in #E61919 under the row like the deleted stage-tree.
  _Requirements: 7.2, 7.3, 7.4, 7.5_
  _Boundary: src/components/console-deck/stage-panel_
  _Depends: 1.1, 3.1_
- [x]* 7.2 Create src/components/console-deck/stage-panel.test.tsx with tests tagged [req:11.6] via rerenders with advanced totalMs: header clock renders formatClock(totalMs) and changes across rerenders while live; completed stages show their static leg-ms sums; the stage owning the most recent running leg shows the ticking emerald treatment and its value grows with totalMs.
  _Requirements: 11.6_
  _Boundary: src/components/console-deck/stage-panel_
  _Depends: 7.1_

- [ ] 8. Journal pane
- [x] 8.1 (P) Create src/components/console-deck/journal-pane.tsx: presentational JournalPane({ lines }) with no trpc import — virtualized full-history pane copying the deleted journal-feed.tsx setup (useVirtualizer, ROW_HEIGHT_PX 32, overscan 12, 40px stick threshold) with the LegRow/EvtRow/LogRow/UnknownRow/SourceBadge renderers adapted to CRT classes; pinned-to-tail state machine: pinned by default and on each appended line scrollToIndex(last) while pinned; a scroll event leaving the bottom threshold unpins and shows an amber "○ UNPINNED — REVIEWING HISTORY" header state; while unpinned arriving lines increment a green "▼ N NEW LINES" pill button instead of scrolling; clicking the pill or scrolling back within the threshold repins, clears the pill, and jumps to the tail; header right shows the emerald "● PINNED TO TAIL" state with the total line count.
  _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  _Boundary: src/components/console-deck/journal-pane_
  _Depends: 3.1_
- [x]* 8.2 Create src/components/console-deck/journal-pane.test.tsx with tests tagged [req:11.7] using the scroll-container mocking style of the deleted journal-feed.test.tsx: renders pinned by default with the line count; simulated scroll away from the bottom unpins and shows the reviewing-history indicator; appending lines while unpinned increments the pill count and does not scroll; clicking the pill repins, clears the count, and the pinned indicator returns; scrolling back to the bottom also repins.
  _Requirements: 11.7_
  _Boundary: src/components/console-deck/journal-pane_
  _Depends: 8.1_

- [ ] 9. Program monitor
- [x] 9.1 Create src/components/console-deck/program-monitor.tsx: stateful ProgramMonitor({ runId, isNewestRun, nowMs }) adapting RunViewShell's machinery from the deleted run-view.tsx — runs.get snapshot query, seeded line-index Set, runs.journalTail subscription while unfinished with lastEventId lineCount-1 appending only unseen indices, single snapshot refetch when the tail reports finished, live = (isNewestRun && engine phase running) || mtime within stallAfterMs, stall detection per the deleted now-line.tsx — rendering inside an emerald-bordered PROGRAM frame: header with the runId, a status line (MERGED emerald with the post-colon feature name, HALTED #E61919 with haltKind plus gate-or-error detail, LIVE pulsing emerald, STALLED amber tag, INCOMPLETE dim — logic adapted from the deleted gate-banner.tsx), and an ExternalLink repo anchor when snapshot.repoUrl resolves; a meter row GATE/EXEC/LLM HOPS/OUT TOKENS taking summary execCount, llmHops, live_output_tokens when finished and deriveRunView values with EXEC as an em dash while live; body grid composing StagePanel (totalMs from parseRunIdStart ticked via nowMs while live and frozen at mtimeMs minus start when finished) and JournalPane; a not-ok snapshot renders the no-run-found state for that runId only.
  _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_
  _Boundary: src/components/console-deck/program-monitor_
  _Depends: 7.1, 8.1_
- [x]* 9.2 Create src/components/console-deck/program-monitor.test.tsx with tests tagged [req:11.8] driving mocked trpc the way the deleted run-view.test.tsx did: a finished MERGED summary renders the emerald treatment with the feature name; a haltKind summary renders HALTED with the detail; an unfinished fresh-mtime snapshot renders the pulsing LIVE treatment and derived meter values with EXEC as an em dash; an unfinished stale-mtime snapshot renders STALLED; a not-ok snapshot renders the no-run-found state; a finished summary renders meter values from the summary.
  _Requirements: 11.8_
  _Boundary: src/components/console-deck/program-monitor_
  _Depends: 9.1_

- [ ] 10. Deck shell
- [x] 10.1 Create src/components/console-deck/trpc.ts copying the deleted run-view/trpc.ts split-link client verbatim, and src/components/console-deck/console-deck.tsx: ConsoleDeck({ runId }) wrapping a shell in trpc.Provider plus QueryClientProvider (the deleted run-view.tsx provider pattern); the shell queries runs.list and console.state each with refetchInterval 5000, ticks a nowMs state every 1000ms, resolves the program runId as the prop or runs[0].runId when null, owns the enabled-bucket Set state (all on initially) with bucket counts computed from entries, owns the walk-highlight index, binds a window keydown handler that early-returns when event.target is an input, textarea, or contenteditable and otherwise maps j/k to move the highlight across filmstrip order, Enter to router.push("/console/" + the highlighted runId), and 1/2/3/4 to toggle live/halted/passed/re-enable-all; renders the CRT FRAME with the SCANLINES overlay and corner crosshairs composing AmbientStrip (state, error, nowMs), BusFilter, ProgramMonitor, and Filmstrip (runsByRunId built by matching ConsoleRun.runId across state.runs entries); zero runs renders the empty state naming CHAMBER_ARTIFACTS_DIR instead of the program monitor; console.state failure passes the error to AmbientStrip while runs surfaces keep rendering.
  _Requirements: 1.1, 1.5, 1.6, 9.1, 9.2, 9.3, 9.4, 10.1_
  _Boundary: src/components/console-deck_
  _Depends: 2.1, 4.1, 5.1, 6.2, 9.1_
- [x]* 10.2 Create src/components/console-deck/console-deck.test.tsx with tests tagged [req:11.10] driving mocked trpc: pressing j then Enter pushes /console/<second-run>; k moves the highlight back; pressing 2 dims halted tiles (opacity class present, tile still in document); pressing 4 re-enables all buckets; keydown originating from an input element changes nothing; zero runs renders the CHAMBER_ARTIFACTS_DIR empty state.
  _Requirements: 11.10_
  _Boundary: src/components/console-deck_
  _Depends: 10.1_

- [ ] 11. Routes and consolidation
- [ ] 11.1 In ONE change so the repo compiles at task end: create src/app/console/[[...runId]]/page.tsx (dynamic force-dynamic, awaits params, renders <ConsoleDeck runId={runId?.[0] ?? null} />) and delete src/app/console/page.tsx plus src/app/console/page.test.tsx; rewrite src/app/page.tsx to redirect("/console") and src/app/run/[runId]/page.tsx to await params then redirect("/console/" + runId) using next/navigation, updating src/app/page.test.tsx and src/app/run/[runId]/page.test.tsx to assert the redirects; delete the src/components/run-view and src/components/console-panel directories entirely including their tests and the merged runs-board.tsx (the filmstrip supersedes it); repo-wide grep confirms zero remaining imports of run-view or console-panel and tsc --noEmit plus the full vitest suite are green when this task finalizes.
  _Requirements: 1.1, 1.2, 1.3, 1.4, 10.2_
  _Boundary: src/app, src/components/run-view, src/components/console-panel_
  _Depends: 10.1_
- [ ]* 11.2 Create src/app/console/[[...runId]]/page.test.tsx with tests tagged [req:11.9]: a params Promise with a segment renders ConsoleDeck with that runId; no segment renders ConsoleDeck with runId null; plus assertions in the rewritten src/app/page.test.tsx that / redirects to /console and in src/app/run/[runId]/page.test.tsx that /run/x redirects to /console/x via mocked next/navigation.
  _Requirements: 11.9_
  _Boundary: src/app_
  _Depends: 11.1_

## Implementation Notes
- mechanical verify RED: { ok :false, detail : finalize-task: unsafe file path \ src/app/console/[[...runId]]/page.tsx (new)\  (must be repo-relative, no '..') , data :{}}
