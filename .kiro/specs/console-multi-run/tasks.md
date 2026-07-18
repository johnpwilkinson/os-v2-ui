# Console multi-run board — Implementation Plan

## Tasks

- [ ] 1. Parse layer
- [x] 1.1 In ONE change so the repo compiles at task end: in src/lib/console/types.ts add export interface ConsoleRun { active: boolean; phase: string | null; feature: string | null; runId: string | null } and add runs: Record<string, ConsoleRun> to ConsoleState; in the same task update every ConsoleState producer to satisfy the new field — in src/lib/console/parse.ts add parseRuns(raw: unknown): Record<string, ConsoleRun> returning {} for non-plain-object input and dropping non-plain-object entries (parse each entry with the same field tolerance as parseEngine: active Boolean, phase/feature/runId string-or-null) and wire runs: parseRuns(raw.runs) into parseConsoleState; in src/lib/console/fixtures.ts add runs to existing fixtures plus a fixture with sim and ui both active and a legacy fixture omitting the runs field; tsc --noEmit must be green over the whole repo when this task finalizes
  _Requirements: 1.1, 1.2, 1.3_
  _Boundary: src/lib/console_
- [x]* 1.2 In src/lib/console/parse.test.ts add tests named with [req:1.1] [req:1.2] [req:1.3]: two-active fixture parses both aliases with correct fields; runs-absent and runs-non-object inputs yield empty map with the rest of the state intact; a malformed entry among well-formed ones is dropped while others survive
  _Requirements: 1.1, 1.2, 1.3_
  _Boundary: src/lib/console_
  _Depends: 1.1_

- [ ] 2. Runs board component
- [x] 2.1 Create src/components/console-panel/runs-board.tsx: pure presentational RunsBoard({ runs, engine }) with no trpc import and no data fetching; sort Object.entries(runs) by Number(b.active)-Number(a.active) then aliasA.localeCompare(aliasB); empty runs renders the legacy line exactly as console-panel.tsx's current ENGINE cell text (engine ? phase-uppercased :: repo/feature :: runId : em-dash); non-empty renders one row per alias formatted ALIAS :: PHASE :: feature :: runId with active rows using class text-sm [text-shadow:0_0_6px_rgba(234,234,234,0.22)] and inactive rows text-sm text-[#EAEAEA]/40; cell micro-label is [ RUNS ] using the existing micro-label class string
  _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1_
  _Boundary: src/components/console-panel_
  _Depends: 1.1_
- [x]* 2.2 Create src/components/console-panel/runs-board.test.tsx with tests named with [req:2.1] [req:2.2] [req:2.3] [req:2.4] [req:3.1]: two active rows both rendered with the glow class; an inactive row carries the dimmed class; ordering puts active rows first then alphabetical; empty runs with an engine prop renders text equal to the legacy ENGINE cell string for that engine
  _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1_
  _Boundary: src/components/console-panel_
  _Depends: 2.1_

- [ ] 3. Panel integration
- [x] 3.1 In src/components/console-panel/console-panel.tsx replace the [ ENGINE ] cell block with <RunsBoard runs={state.runs} engine={state.engine} /> inside the same grid cell div; import RunsBoard from @/components/console-panel/runs-board; no other JSX or class changes in the file
  _Requirements: 2.1, 3.2_
  _Boundary: src/components/console-panel_
  _Depends: 2.1_
- [ ]* 3.2 In src/components/console-panel/console-panel.test.tsx add tests named with [req:2.2] [req:3.2]: driving the two-active fixture through the shell renders both repo rows; driving the legacy runs-absent fixture renders the same engine summary text the pre-feature panel produced for that state
  _Requirements: 2.2, 3.2_
  _Boundary: src/components/console-panel_
  _Depends: 3.1_
