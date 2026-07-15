# os-v2 Observability Data Inventory

Every data surface the dark-factory UI can consume, with exact paths, shapes,
availability windows, and read recipes. All facts verified live 2026-07-15
against real runs (engine source: `~/lab/agents`, referenced below as
`$ENGINE`). The UI is a **read-only consumer** — nothing here requires an
engine change, and the UI must never write to any of these paths.

**Host:** everything lives on the M1 Mac. The UI's server component must run
there (browser JS cannot read the filesystem). Phone access = serve on LAN /
tailnet.

---

## 1. The artifacts root — `~/chamber-artifacts/`

One directory per run, named by runId timestamp (`20260715T183125921`).
Newest run = lexicographically greatest name (names sort chronologically).
Multiple concurrent chambers (fleet future) = multiple fresh runIds; watch
the directory for creation events (chokidar).

Per-run layout (driver-mode run, the rich case):

```
~/chamber-artifacts/<runId>/
├── journal.jsonl        # THE live feed (append-only during the run)
├── runner-summary.json  # scoreboard (written at exit; crash-path variant too)
├── result.json          # full run result (at exit)
├── repo.bundle          # git bundle incl. the driver ledger ref (at exit)
├── egress-denied.log    # blocked network attempts (append during run)
└── session/             # CC session artifacts
```

Child-turbo-era runs may also contain `turbo-<stage>-<feature>/`
subdirectories with their own journal.jsonl + runner-summary.json — as of
2026-07-15 all three turbos are driver-native, so NEW runs put everything in
the top-level journal; old run dirs keep the nested shape (render both).

## 2. `journal.jsonl` — the live heartbeat (line-delimited JSON, streams during run)

Appended line-by-line while the chamber works; bind-mounted to the host, so
tailing it IS live observability. Line kinds observed (fields vary by kind;
parse defensively — unknown kinds must render harmlessly):

- **Leg start:** `{"label":"val:9.1","kind":"validate","phase":"start"}` —
  an LLM dispatch began. Labels are the stage vocabulary:
  `impl:<taskId>`, `debug:<taskId>`, `val:<reqId>`, `refute:<reqId>#<n>`,
  `vfix:<feature>`, improve-stage reviewer labels, etc.
- **Leg completion:** `{"label":"val:9.1","kind":"validate","ok":true,
  "tokens":956,"ms":12443}` — same label, with outcome + output tokens +
  wall ms. Failed legs carry `"ok":false` and an `"error"` string.
- **Battery boundary (native validate):** `{"kind":"battery",
  "label":"mech:build","start":true}` then `{"kind":"battery",
  "label":"mech:build","ok":true,"exitCode":0,"ms":3037}` — REAL subprocess
  exit codes (depcruise / build / test).
- **fx receipts (effector ops):** boundary lines for deterministic hops —
  labels like `setup:<feature>`, `finalize:<taskId>`, `merge:<taskId>`,
  `note:<taskId>`, `enforce:<feature>`, `gate:<feature>`,
  `prsurface:<feature>` (start + ok/ms pairs).
- **Log lines:** `{"log":"<free text>"}` — includes the structured `EVT `
  lines: `{"log":"EVT {\"v\":1,\"type\":\"gate\",\"turbo\":\"validate-impl\",
  \"feature\":\"...\",...}"}`. EVT types: `tier-summary`, `degrade`,
  `breaker`, `gate` — parse the inner JSON after the `EVT ` prefix. Also
  human `GATE: GO (...)` lines.

This one file supports: the vertical stage tree (group by label prefix),
live token/latency meters, per-leg status dots, the "what is it doing right
now" line (last start-without-completion), and stall detection (file mtime
quiet > N minutes — the same signal the bridge watchdog uses).

## 3. `runner-summary.json` — the scoreboard (at exit)

```json
{
  "mode": "driver",              // or "runner" (child-era) / task chambers
  "backend": "claude-cli",
  "dispatch_counts": {
    "execCount": 13,             // effector hops
    "llmHops": 21,               // every LLM dispatch (honest since spec 2)
    "turboRuns": 0,              // prose children spawned (0 = all-native)
    "perLabel": { "finalize:1.1": 1, ... }
  },
  "live_output_tokens": 52062,
  "live_input_tokens": 282,
  "gate": "MERGED:footer-locale-badge",  // or GO / halt gates
  "halt_kind": null,             // e.g. "manual-verify", "degraded-evidence",
                                 // "rate-limit", "drill", "validate-nogo"
  "rate_limit_reset": null,
  "error": null
}
```

Child-era summaries use `{"exec":0,"llm_live":15,"llm_replayed":0}` count
keys — support both shapes.

## 4. `result.json` — full run result (at exit)

The complete driver return. Redundant with summary for headline numbers;
useful for deep drill-downs. Does NOT carry the per-stage ledger (see §5).

## 5. `repo.bundle` — the per-stage ledger (at exit; the richest post-run data)

The driver's ledger is a git ref inside the bundle:
`refs/heads/dev-engine/ledger/<feature>`, file `.client-os/dev-engine.json`.
Read recipe (verified):

```
git clone -q --bare <runId>/repo.bundle /tmp/b.git
git -C /tmp/b.git show refs/heads/dev-engine/ledger/<feature>:.client-os/dev-engine.json
```

Yields per-spec: `status` (pending → impl → validating → pr_open → improving
→ fixing → enforcing → gating → merged, or halted), `validate_rounds`,
`halted`/`halt_kind`/`halt_reason`, `base_sha`, and the two attribution
tables:

- `driver_metrics`: per stage `{execCount, llmHops, turboRuns}` — e.g.
  `impl {8,5,0}, validate {0,12,0}, improve {0,4,0}, gate {3,0,0}`.
- `stage_tokens`: CUMULATIVE output-token snapshots per stage — stage cost =
  delta between consecutive rows (validate = 39720 − 24392 = 15328).

This is the per-stage cost breakdown the UI's run-economics view wants.

## 6. `~/chamber-artifacts/.engine-state.json` — phase + event history

Ground truth over any chat lag. Shape:

```json
{
  "phase": "running",            // proposed | running | done (terminal)
  "kind": "build",               // design | forge | build | fix | review ...
  "feature": "footer-locale-badge",
  "gate": "...",
  "events": [
    {"seq":1,"ts":"...","type":"proposed","text":"build run: ...","seen":true},
    {"seq":2,"ts":"...","type":"started","text":"launched ..."},
    {"seq":3,"ts":"...","type":"done","text":"gate: MERGED:... (0 auto-resumes, 845s)"},
    {"seq":4,"ts":"...","type":"pr-opened","text":"PR #24 dev-engine/integration → main"}
  ]
}
```

Watcher events also land here / in the watcher's feed: `offer`,
`review-started`, `review-done` (verdict text like
`PR #24 <feature>: FIX (0h/1m/1l)`), `rereview-skipped`, `rebaked`. The
events array outlives Hermes' consume-once verbs — it is the durable
timeline for the run-history rail.

## 7. `egress-denied.log` — the security rail

Append-only list of blocked network attempts during the run. Normally
empty/noise; any unexpected entry is a red-flag surface worth a badge.

## 8. Docker + bridge (live process surfaces)

- `docker logs <container>` — phase narration (the chamber's own stdout).
  Container discovery via `docker ps`.
- **chamber-bridge** on `127.0.0.1:8378` (launchd
  `com.jp.hermes-chamber-bridge`): engine status/health endpoints; POST
  endpoints require `X-Chamber-Bridge: 1` + `Content-Type:
  application/json` headers (bare GET/POST returns 400 — that 400 is itself
  a liveness signal). The bridge also runs the journal-stall watchdog
  (`newestJournalQuiet`) — the UI should replicate that mtime-quiet logic
  client-side rather than depend on bridge internals. NOTE: the UI must be
  read-only; do NOT call action endpoints (abort etc.) in v1.

## 9. Known gaps (design around, don't fight)

- **Task-mode chambers** (brainstorm, design rung, fix, review) emit their
  CC output only at exit (`cc-output.json`) — no live stream today (an
  entrypoint change is gated engine-side, backlogged). v1: render these as
  start/end events with duration; the rich live view is for driver runs.
- **Hermes status parity** is a known engine backlog item — the UI solves
  the same problem from the other side and does NOT depend on it.
- Ledger is post-run only (bundle at exit). During a run, stage progress
  comes from journal labels + engine-state, not the ledger.
- Timestamps: journal/engine-state are UTC; host is EDT — render in viewer
  local time.

## 10. Reference implementations (read-only, in `$ENGINE`)

- Journal writer: `os-v2/driver/legs.mjs` (leg lines), `os-v2/driver/receipts.mjs`
  (fx boundary lines), `os-v2/driver/validate.mjs` (battery lines).
- Summary writer: `os-v2/driver/main.mjs`.
- Ledger writer: `os-v2/driver/rungs.mjs` (stampStage/driverMeter).
- Stall watchdog: chamber-bridge (`newestJournalQuiet`).
- Analysis docs for all of the above: `$ENGINE/docs/os-v2/analysis/driver/`.
