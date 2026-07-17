# Console State Panel — Implementation Plan

## Tasks

- [ ] 1. Console domain lib
- [x] 1.1 Create src/lib/console/types.ts (ConsoleDecision, ConsoleRepo, ConsoleEngine, ConsoleState exactly per design Concrete Shape), src/lib/console/parse.ts exporting parseConsoleState(raw: unknown): ConsoleState | null (top level needs string ts, string optimalNext, array decisions, object repos else null; watchQueueDepth via Number(...)||0; engine narrows when object else null; decision entries need string id, kind, title, recommendation, ts, expiresAt else the ENTRY is dropped, repo/feature/runId default null; repos values narrow to class string|null, watched from watched OR watch, driver boolean), and src/lib/console/fixtures.ts exporting FIXTURE_STATE_ACTIVE (two decisions: one verdict with recommendation starting Fix, one halt), FIXTURE_STATE_IDLE (zero decisions, optimalNext idle text), FIXTURE_RAW_MALFORMED (decisions not an array); no imports from src/server or src/components anywhere in src/lib/console
  _Requirements: 1.4, 1.5, 4.3_
  _Boundary: src/lib/console_
- [x]* 1.2 Tests src/lib/console/parse.test.ts naming [req:1.4] [req:1.5] [req:4.3]: valid fixture round-trips field-for-field; FIXTURE_RAW_MALFORMED returns null; a decisions array with one malformed entry keeps the valid remainder; watch/watched spelling tolerance; unknown extra fields ignored; import graph of src/lib/console stays free of src/server and src/components
  _Requirements: 1.4, 1.5, 4.3_
  _Boundary: src/lib/console_
  _Depends: 1.1_

- [ ] 2. Server bridge fetch and tRPC
- [x] 2.1 Create src/server/console.ts exactly per design Concrete Shape: bridgeUrl() honoring CHAMBER_BRIDGE_URL with default http://127.0.0.1:8378 and fetchConsoleState(fetchFn: typeof fetch = fetch) returning { ok: false; error } | { ok: true; raw: unknown } with headers X-Chamber-Bridge: 1, cache no-store, AbortSignal.timeout(5000), non-200 mapped to bridge http NNN and throws mapped to bridge unreachable: message
  _Requirements: 1.1, 1.2, 1.3_
  _Boundary: src/server_
- [x]* 2.2 Tests src/server/console.test.ts naming [req:1.1] [req:1.2] [req:1.3] [req:4.1]: injected fake fetch only (never real network); 200 JSON yields ok true with raw; non-200 yields bridge http NNN; throwing fake yields bridge unreachable prefix; fake call args assert the /console/state URL, the X-Chamber-Bridge header value 1, and CHAMBER_BRIDGE_URL override plus default
  _Requirements: 1.1, 1.2, 1.3, 4.1_
  _Boundary: src/server_
  _Depends: 2.1_
- [x] 2.3 Touch src/server/api.ts ONLY to add the console router per design Concrete Shape: console.state = t.procedure.query composing fetchConsoleState from @/server/console then parseConsoleState from @/lib/console/parse, returning { ok: false as const, error } on fetch failure, { ok: false as const, error: 'malformed console state' } on parse null, else { ok: true as const, state }; the runs router and everything else in the file stays byte-identical
  _Requirements: 1.1, 1.4_
  _Boundary: src/server_
  _Depends: 1.1, 2.1_

- [ ] 3. Terminal panel components
- [x] 3.1 Create src/components/console-panel/optimal-next.tsx (props directive: string, linkUp: boolean; caption row with literal [ OPTIMAL NEXT ] micro-label and the LINK dot which is the page's ONLY green element inline-block size-2 bg-[#4AF626] shadow-[0_0_6px_#4AF626] when linkUp else red variant; directive line >>> prefix at text-base) and src/components/console-panel/decision-row.tsx (props decision: ConsoleDecision, nowMs: number; kind uppercase red text-[#E61919] when kind is halt or a verdict whose recommendation does not start with Merge; repo/feature identity and runId decoration; title primary; recommendation bright line; right mono column AGE HH:MM:SS from nowMs minus ts and TTL HH:MM:SS from expiresAt minus nowMs clamped at zero via a local fmtDuration) using the exact class strings from design Concrete Shape terminal design tokens; components are presentational with zero data fetching and no imports from src/server/console
  _Requirements: 2.1, 2.2, 3.2, 3.3_
  _Boundary: src/components/console-panel_
  _Depends: 1.1_
- [ ] 3.2 Create src/components/console-panel/trpc.ts (batch-link-only tRPC react client per design Concrete Shape with type-only AppRouter import) and src/components/console-panel/console-panel.tsx marked use client: provider shell mirroring run-view.tsx QueryClient plus createClient useState pattern wrapping ConsolePanelShell; shell runs trpc.console.state.useQuery(undefined, { refetchInterval: 5000 }) plus a one-second nowMs interval; renders macro CONSOLE header, [ ENGINE ] line, [ FLEET ] strip alias :: class :: WATCHED/UNWATCHED :: DRIVER lines and QUEUE DEPTH, then LINK DOWN red banner on error or ok false, dim NO PENDING DECISIONS row when zero decisions, else OptimalNext plus one DecisionRow per decision, all inside grid gap-px bg-[#EAEAEA]/20 compartments with bg-[#0A0A0A] cells, corner + crosshairs, page root relative min-h-[100dvh] bg-[#0A0A0A] text-[#EAEAEA] font-mono, scanline overlay div exactly per design tokens, zero rounded-* classes anywhere
  _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 3.1, 3.4, 3.5_
  _Boundary: src/components/console-panel_
  _Depends: 3.1, 2.3_
- [ ]* 3.3 Tests src/components/console-panel/optimal-next.test.tsx, decision-row.test.tsx, console-panel.test.tsx naming [req:2.1] [req:2.2] [req:2.3] [req:2.4] [req:2.5] [req:3.2] [req:3.3] [req:4.2]: render from src/lib/console/fixtures only; assert [ OPTIMAL NEXT ] caption and >>> directive; halt row and non-Merge verdict row carry text-[#E61919] while a Merge verdict row does not; idle fixture shows NO PENDING DECISIONS; shell with mocked trpc module shows LINK DOWN plus error on ok false and asserts useQuery was called with refetchInterval 5000; exactly one element with bg-[#4AF626] in the live tree
  _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.2, 3.3, 4.2_
  _Boundary: src/components/console-panel_
  _Depends: 3.1, 3.2_

- [ ] 4. Route
- [ ] 4.1 Create src/app/console/page.tsx exactly per design Concrete Shape: export const dynamic = force-dynamic and a default ConsolePage component returning ConsolePanel from @/components/console-panel/console-panel; no other route or layout files change
  _Requirements: 2.1, 3.1_
  _Boundary: src/app/console_
  _Depends: 3.2_
- [ ]* 4.2 Test src/app/console/page.test.tsx naming [req:2.1]: the module exports dynamic equal to force-dynamic and rendering the page with the trpc module mocked to the active fixture shows the >>> directive text
  _Requirements: 2.1_
  _Boundary: src/app/console_
  _Depends: 4.1_
