# Console State Panel — Design

## Overview

A read-only `/console` page on os-v2-ui that renders the chamber bridge's
`GET /console/state` — the machine's `optimalNext` directive as the lead
banner, every live decision card as a dense telemetry row, and the
watched-repo fleet strip. It is the operator's glanceable peek into the
bridge, styled as a tactical CRT terminal.

Decisions the brainstorm settled (rejected alternatives die here):

- **Read-only, no action verbs.** Approve/merge/resume buttons stay on the
  Telegram/bridge surface by standing doctrine; this page renders state and
  never POSTs. The `actions[]` payloads inside decisions (nonces, propose
  bodies) are deliberately NOT parsed or rendered — the panel shows kind,
  title, recommendation, identity, and timing only.
- **Server-side data path, not browser-direct.** The bridge listens on
  `127.0.0.1:8378` and requires the `X-Chamber-Bridge: 1` header; the
  Next.js server fetches it and re-serves over the app's existing tRPC
  route, so the browser never talks to the bridge and CORS never exists.
  Base URL honors the `CHAMBER_BRIDGE_URL` env override and defaults to
  `http://127.0.0.1:8378` (same env-override pattern as
  `CHAMBER_ARTIFACTS_DIR` in `src/server/runs.ts`).
- **Poll, not subscribe.** The page refetches every 5 seconds via
  react-query `refetchInterval`. Console state is small and slow-moving;
  SSE machinery is not warranted (non-goal).
- **Fixture-driven tests only.** The feature is built inside the
  egress-locked chamber where no bridge exists: `fetchConsoleState` takes
  an injectable fetch, and every component test renders from
  `src/lib/console/fixtures.ts`. No test may contact a live bridge.
- **Own tRPC client copy.** The existing depcruise rule
  `sdd-single-run-live-view-run-view-is-exclusively-this-features`
  mechanically bans sibling components from importing
  `src/components/run-view/`, so the panel carries its own minimal
  `trpc.ts` (batch link only — no subscription link, this feature never
  subscribes). The type-only `AppRouter` import from `@/server/api` is the
  sanctioned pattern proven by run-view.
- **Zero new npm packages.** Everything rides the existing stack (tRPC,
  react-query, Tailwind, vitest).
- **Visual direction: Tactical Telemetry / CRT terminal, committed.**
  Deactivated-CRT black substrate `#0A0A0A` (never pure black), white
  phosphor `#EAEAEA` with a faint glow, hazard red `#E61919` as the ONLY
  alert color, terminal green `#4AF626` on exactly ONE element (the LINK
  indicator dot), monospace + uppercase micro-labels throughout, 1px
  blueprint dividers via `grid gap-px`, zero border-radius, ASCII framing
  (`[ OPTIMAL NEXT ]`, `>>>`, corner `+` crosshairs), CRT scanline overlay
  via `repeating-linear-gradient`. Styling is page-scoped through Tailwind
  arbitrary-value classes — `globals.css`, `layout.tsx`, and the shadcn
  theme are untouched (non-goal: no global theme work).
- **Bridge payload ground truth** is `buildConsoleState`
  (chamber-console.mjs): `{ ts, engine, optimalNext, decisions[],
  watchQueueDepth, repos }` where each live decision carries `{ id, kind,
  repo, feature, runId, title, recommendation, ts, expiresAt, ... }` and
  repos map to `{ class, watched, driver }`. The parser is tolerant of
  extra fields (the bridge may grow) and drops malformed decision entries
  individually; only a malformed top level rejects the payload.

## File Structure

| File | Owns/Touches | Purpose |
|---|---|---|
| `src/lib/console/types.ts` | Owns | `ConsoleState`, `ConsoleDecision`, `ConsoleRepo`, `ConsoleEngine` interfaces |
| `src/lib/console/parse.ts` | Owns | `parseConsoleState(raw: unknown): ConsoleState \| null` — pure narrowing, per-entry decision tolerance |
| `src/lib/console/fixtures.ts` | Owns | `FIXTURE_STATE_ACTIVE`, `FIXTURE_STATE_IDLE`, `FIXTURE_RAW_MALFORMED` test fixtures |
| `src/lib/console/parse.test.ts` | Owns | parse round-trip, tolerance, and rejection tests |
| `src/server/console.ts` | Owns | `bridgeUrl()`, `fetchConsoleState(fetchFn?)` — server-side bridge fetch, typed result union |
| `src/server/console.test.ts` | Owns | injected-fake-fetch tests (success, non-200, throw, malformed) |
| `src/server/api.ts` | Touches | add `console.state` tRPC query composing `fetchConsoleState` + `parseConsoleState` |
| `src/components/console-panel/trpc.ts` | Owns | minimal tRPC react client (batch link only) |
| `src/components/console-panel/optimal-next.tsx` | Owns | `[ OPTIMAL NEXT ]` framed directive banner |
| `src/components/console-panel/decision-row.tsx` | Owns | one telemetry row per live decision |
| `src/components/console-panel/console-panel.tsx` | Owns | provider shell + query + page states (live/idle/link-down) + repo strip |
| `src/components/console-panel/optimal-next.test.tsx` | Owns | banner tests |
| `src/components/console-panel/decision-row.test.tsx` | Owns | row tests |
| `src/components/console-panel/console-panel.test.tsx` | Owns | shell/states tests |
| `src/app/console/page.tsx` | Owns | `/console` route mounting the panel |
| `src/app/console/page.test.tsx` | Owns | route smoke test |

No other files are touched. Explicitly untouched: `globals.css`,
`layout.tsx`, `src/components/ui/*`, `src/components/run-view/*`,
`.dependency-cruiser.cjs` (rules are derived mechanically, never by an
implementation task).

## Boundary Commitments

| Commitment | Meaning | depcruise rule |
| --- | --- | --- |
| console lib purity | `src/lib/console` MUST NOT import `src/server` |  |
| console lib no ui | `src/lib/console` MUST NOT import `src/components` |  |
| panel no server runtime | `src/components/console-panel` MUST NOT import `src/server/console` |  |

## Concrete Shape

### Terminal design tokens (exact class strings — transcribe, do not restyle)

- Page root: `relative min-h-[100dvh] bg-[#0A0A0A] text-[#EAEAEA] font-mono`
- Scanline overlay (one div, last child of root):
  `pointer-events-none fixed inset-0 z-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.18)_2px,rgba(0,0,0,0.18)_4px)]`
- Macro header (`CONSOLE`):
  `text-[clamp(2.5rem,8vw,7rem)] font-bold uppercase leading-[0.9] tracking-[-0.04em] [text-shadow:0_0_8px_rgba(234,234,234,0.25)]`
- Micro-label (all metadata captions): `text-[11px] uppercase tracking-[0.08em] text-[#EAEAEA]/60`
- Primary telemetry text: `text-sm [text-shadow:0_0_6px_rgba(234,234,234,0.22)]`
- Hazard red (FIX verdicts, halt kinds, LINK DOWN): `text-[#E61919]` /
  `border-[#E61919]` — red is the ONLY alert color anywhere on the page.
- LINK indicator dot (the page's ONLY green element):
  `inline-block size-2 bg-[#4AF626] shadow-[0_0_6px_#4AF626]` — rendered
  next to the literal micro-label `LINK` when the query has fresh data;
  when link-down the dot is `bg-[#E61919] shadow-[0_0_6px_#E61919]`.
- Blueprint compartments: wrap sections in
  `grid gap-px bg-[#EAEAEA]/20` with each cell `bg-[#0A0A0A] p-4` — the
  1px gaps ARE the dividing lines. No borders elsewhere, no
  border-radius anywhere (never use `rounded-*`).
- Corner crosshairs: absolutely-positioned `+` glyphs
  (`absolute text-[#EAEAEA]/40 text-xs`) at the four corners of the main
  panel container (`-top-2 -left-1`, `-top-2 -right-1`, `-bottom-2 -left-1`,
  `-bottom-2 -right-1`).
- ASCII framing literals: banner caption `[ OPTIMAL NEXT ]`, directive
  prefix `>>>`, repo strip caption `[ FLEET ]`, decisions caption
  `[ PENDING DECISIONS ]`, engine caption `[ ENGINE ]`.

### `src/lib/console/types.ts`

```ts
export interface ConsoleDecision {
  id: string;
  kind: string;            // 'propose' | 'verdict' | 'halt' | 'offer' | future kinds
  repo: string | null;
  feature: string | null;
  runId: string | null;
  title: string;
  recommendation: string;
  ts: string;              // ISO mint time
  expiresAt: string;       // ISO expiry
}

export interface ConsoleRepo {
  class: string | null;
  watched: boolean;
  driver: boolean;
}

export interface ConsoleEngine {
  active: boolean;
  phase: string | null;
  repo: string | null;
  feature: string | null;
  runId: string | null;
}

export interface ConsoleState {
  ts: string;
  engine: ConsoleEngine | null;
  optimalNext: string;
  decisions: ConsoleDecision[];
  watchQueueDepth: number;
  repos: Record<string, ConsoleRepo>;
}
```

### `src/lib/console/parse.ts` (pure — no imports beyond types)

`parseConsoleState(raw: unknown): ConsoleState | null`. Top level must be
an object with string `ts`, string `optimalNext`, array `decisions`,
object `repos`; otherwise return `null`. `watchQueueDepth` coerces via
`Number(...) || 0`. `engine` narrows when object (`active` coerced with
`Boolean`, missing strings → `null`), else `null`. Each decision entry
must have string `id`, `kind`, `title`, `recommendation`, `ts`,
`expiresAt` — entries failing that are DROPPED (tolerance), with
`repo`/`feature`/`runId` defaulting to `null` when absent. Each repos
value narrows to `{ class: string | null, watched: !!watch OR !!watched,
driver: !!driver }` — the bridge serves `watched`; tolerate both spellings.

### `src/server/console.ts`

```ts
export type FetchConsoleStateResult =
  | { ok: false; error: string }
  | { ok: true; raw: unknown };

export function bridgeUrl(): string {
  const env = process.env.CHAMBER_BRIDGE_URL;
  return env && env.length > 0 ? env : "http://127.0.0.1:8378";
}

export async function fetchConsoleState(
  fetchFn: typeof fetch = fetch,
): Promise<FetchConsoleStateResult> {
  try {
    const res = await fetchFn(`${bridgeUrl()}/console/state`, {
      headers: { "X-Chamber-Bridge": "1" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { ok: false, error: `bridge http ${res.status}` };
    return { ok: true, raw: await res.json() };
  } catch (e) {
    return { ok: false, error: `bridge unreachable: ${e instanceof Error ? e.message : String(e)}` };
  }
}
```

### `src/server/api.ts` touch (the only shared-file edit)

Add to `appRouter` (sibling of the `runs` router), importing
`fetchConsoleState` from `@/server/console` and `parseConsoleState` from
`@/lib/console/parse`:

```ts
console: t.router({
  state: t.procedure.query(async () => {
    const res = await fetchConsoleState();
    if (!res.ok) return { ok: false as const, error: res.error };
    const state = parseConsoleState(res.raw);
    if (!state) return { ok: false as const, error: "malformed console state" };
    return { ok: true as const, state };
  }),
}),
```

### `src/components/console-panel/`

`trpc.ts` mirrors run-view's minus the subscription link:

```ts
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/api";

export const trpc = createTRPCReact<AppRouter>();

export function createClient() {
  return trpc.createClient({ links: [httpBatchLink({ url: "/api/trpc" })] });
}
```

`optimal-next.tsx` — props `{ directive: string; linkUp: boolean }`.
Micro-label caption row `[ OPTIMAL NEXT ]` + LINK dot per tokens above;
directive line `>>> {directive}` in primary telemetry text at
`text-base`.

`decision-row.tsx` — props `{ decision: ConsoleDecision; nowMs: number }`.
One compartment cell: caption row with uppercase `kind` (red when kind is
`halt` or the recommendation does NOT start with `Merge` for verdicts —
i.e. alert grade), `repo/feature` identity, `runId` when present as
mechanical decoration; `title` as primary text; `recommendation` as the
bright line (`[text-shadow:0_0_6px_rgba(234,234,234,0.3)]`); right-aligned
mono column with age (`AGE 00:04:12`, from `nowMs - Date.parse(ts)`) and
expiry countdown (`TTL 23:55:48`, from `Date.parse(expiresAt) - nowMs`,
clamped at zero, format HH:MM:SS via a small local `fmtDuration`).

`console-panel.tsx` — `"use client"`. Provider shell exactly like
run-view.tsx's (`QueryClient` + `createClient` in `useState`, `<trpc.Provider>`
+ `<QueryClientProvider>`) wrapping `ConsolePanelShell`. Shell:
`trpc.console.state.useQuery(undefined, { refetchInterval: 5000 })`, a 1s
`setInterval` `nowMs` state for countdowns. States: (a) query error OR
`data.ok === false` → full-width link-down banner
`── LINK DOWN ── {error}` in hazard red with red dot; (b) `ok` with zero
decisions → `[ PENDING DECISIONS ]` compartment containing the dim row
`NO PENDING DECISIONS` (`text-[#EAEAEA]/40`); (c) live → `OptimalNext` +
one `DecisionRow` per decision. Always renders when data present: macro
`CONSOLE` header, engine line under `[ ENGINE ]` (phase, repo/"feature",
runId), `[ FLEET ]` strip — one line per repo alias:
`{alias} :: {class ?? '—'} :: {watched ? 'WATCHED' : 'UNWATCHED'} ::
{driver ? 'DRIVER' : '—'}`, and `QUEUE DEPTH {watchQueueDepth}`.

`src/app/console/page.tsx`:

```tsx
import { ConsolePanel } from "@/components/console-panel/console-panel";

export const dynamic = "force-dynamic";

export default function ConsolePage() {
  return <ConsolePanel />;
}
```

### Test outline

- `parse.test.ts` — valid fixture round-trips field-for-field; malformed
  top level → `null`; one malformed decision entry dropped, valid
  remainder kept; `watched`/`watch` spelling tolerance; extra unknown
  fields ignored.
- `console.test.ts` — fake fetch 200+JSON → `{ok:true, raw}`; non-200 →
  `bridge http NNN`; fetch throw → `bridge unreachable: ...`; env
  override respected + default URL + header `X-Chamber-Bridge: 1`
  asserted on the fake's call args. Never a real fetch.
- Component tests render with `FIXTURE_STATE_ACTIVE` / `FIXTURE_STATE_IDLE`
  props (presentational components tested directly; shell test may mock
  the trpc hook module). Assert: directive text + `[ OPTIMAL NEXT ]`
  caption; decision row shows title/recommendation/kind and red class on
  a halt row; idle state shows `NO PENDING DECISIONS`; link-down banner
  shows `LINK DOWN` + error text; exactly one `bg-[#4AF626]` element in
  the live tree.
- `page.test.tsx` — route module exports a component and
  `dynamic === "force-dynamic"` (smoke; the panel itself is covered by
  component tests).
