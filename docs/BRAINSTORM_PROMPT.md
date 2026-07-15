# Prompt for the os-v2-ui founding brainstorm session

Paste everything below the line into a fresh Fable session started in
`~/lab/os-v2-ui`.

---

You are in ~/lab/os-v2-ui — a freshly scaffolded, chamber-ready Next.js 16 /
React 19 / Tailwind v4 / full-shadcn (60 components, radix base, nova
preset) / tRPC v11 / vitest+depcruise repo. The battery (npm run build, npx
vitest run, depcruise src) is green. Nothing product-shaped exists yet.

MISSION: this repo becomes the observability UI for an autonomous coding
system ("the dark factory"): Docker chambers, driven by an orchestration
engine, build real features end-to-end — plan, implement, validate, review,
merge — while the operator is away. Today its only windows are terminal
logs, JSON files, and Telegram one-liners. This app is the real window: pull
up a URL on a phone or MacBook and KNOW, in one glance, what the factory is
doing — current run, current stage, what each agent is spending, what
merged, what halted and why. One chamber today; a fleet of 10 on 10 repos
later. Design for the fleet, ship for the one.

READ FIRST, in order:
1. docs/observability-data-inventory.md — every data surface available,
   with exact paths, line-level shapes, live-vs-post-run availability, and
   read recipes. This is ground truth, verified against real runs. The UI
   is a READ-ONLY consumer of these host paths; it never writes to them and
   never calls engine action endpoints.
2. The scaffold itself (package.json, src/components/ui inventory,
   vitest.config.ts, .kiro/toolchain.json) — know what you have.

PRODUCT BAR: Apple-level UI/UX is a primary requirement, not polish for
later. The operator may be the only user forever, or coworkers join, or
this becomes a commercial product — in every scenario the bar is the same:
glanceable, calm, beautiful, zero-manual-needed. Think: the factory floor
at night, one wall of glass. Prefer information-dense calm (one screen that
answers "is everything okay and what is it doing") over dashboard sprawl.
If a frontend-design or design-directions skill is available in this
session, use it when the design phase reaches visuals; commit to ONE
aesthetic direction rather than blending.

TECHNICAL FRAME (constraints, not solutions):
- Server component must run on the M1 host (the data is host filesystem);
  phone/MacBook access over LAN/tailnet. Auth can be trivial for v1 (it is
  a private tool on a private network) but note the commercial path.
- Live-ness: journal.jsonl is append-only line-JSON — tail it server-side
  (chokidar is installed) and push to the client (SSE is dependency-free;
  choose deliberately). tRPC v11 is installed and REQUIRED for the API
  layer (operator pick — subscriptions or SSE alongside queries is a
  design decision for you).
- Parse defensively: journal line kinds vary and will grow; unknown kinds
  must render harmlessly. Old runs have a nested turbo-* layout; new runs
  are flat. Support both without ceremony.
- The engine repo is READ-ONLY reference (~/lab/agents); never propose
  changes to it. Known gaps in the inventory doc's §9 are design-around
  facts, not problems to fix.

PROCESS — this is the important part:
1. Run the full brainstorming process (superpowers:brainstorming):
   interview me, one question at a time, converge scope. Product questions
   I care about: what the ONE glance-screen shows; run detail view (stage
   tree, live leg feed, token/latency meters); run history; halt/alert
   surfacing; fleet grid (later); phone-first vs desktop-first.
2. SCOPE DISCIPLINE: the deliverable of THIS session is the spec for
   feature #1 ONLY — one chamber-buildable slice (reference size: one
   component tree + wiring + tests; think "single-run live view: run
   picker + stage tree + live journal tail"). The app is built
   feature-by-feature by the factory itself; do not spec the whole product.
   Capture the bigger map briefly in the design doc's context section, then
   cut hard.
3. When you would normally ask "shall I write the spec and plan?" — I will
   answer with `/brainstorm-to-kiro`. That skill (installed in this repo at
   .claude/skills/brainstorm-to-kiro) makes YOU author the four kiro
   artifacts (.kiro/specs/<slug>/design.md, requirements.md, tasks.md,
   spec.json) INLINE with this session's hot context, then gate them with
   its per-doc scripts and the real plan CLIs (OS_V2_ROOT=~/lab/agents),
   then commit them to a design/<slug> branch and push. Follow it exactly;
   its gates are the law. Pack your implementation-plan-grade knowledge
   into design.md constraints and RICH tasks.md task descriptions — task
   descriptions travel verbatim to the implementer agents downstream; they
   are the knowledge channel.
4. STOP after the design branch is pushed. Do NOT implement anything. The
   chambers build it after the operator registers this repo with the
   engine. Print the operator's next step and end.

HARD RULES: never touch ~/lab/agents or /Users/jp/dev/os-stack; never
commit secrets; this repo pushes to its own remote only; scaffold files
(components/ui, configs) are project property — feature specs must not
claim ownership of them.
