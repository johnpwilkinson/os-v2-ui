# tasks.md — contract

## MISSION

tasks.md is the execution program AND the highest-bandwidth knowledge channel.
Consumers:

1. **kiro-impl-turbo** parses it with `parseTasks`
   (core-tasks.js:4-38), schedules waves with `buildWavePlan`
   (core-waves.js:4-36), and dispatches ONE implementer agent per sub-task.
   **The task description travels verbatim into that agent's work order** —
   an implementer with zero conversation context gets exactly the words you
   write here, plus a size-capped orientation brief built from the criteria
   you reference (kiro-impl-turbo/src/contract.js:52-91). This is where the
   session's implementation-plan-grade knowledge must land: exact file paths,
   exact identifiers, exact strings, exact assertions, explicit negative
   space ("no X, no Y").
2. **The impl turbo writes back** only mechanically: it flips checkboxes and
   appends `_Blocked:_`/Implementation Notes (kiro-impl-turbo/src/
   contract.js:28-43). Descriptions are never edited downstream.
3. **The engine's launch gate** re-parses it (dev-engine/contract.mjs
   `verifySpec`: checkbox floor :25-27, childless majors :81-92).
4. **kiro-validate-impl-turbo's tier scan** consumes the `[req:N.M]` tags
   your test tasks demand (kiro-validate-impl-turbo/src/plan.js:41-47).

## Format contract (parser-derived — the grammar is EXACT)

Leaf sub-tasks (the only lines the impl turbo executes), from SUB_RE
(core-tasks.js:4) `/^- \[([ x])\](\*?) (\d+)\.(\d+) (\(P\) )?(.*)$/`:

```
- [ ] N.M <description on one line>
- [ ]* N.M <description>          (starred = deferrable-test sub-task)
- [ ] N.M (P) <description>       ((P) = eligible for a parallel wave)
```

- Column 0 — **no leading indentation**, exactly `- [ ] ` / `- [x] `,
  lowercase `x` only. Anything else (uppercase `X`, `-[ ]`, `- []`, indented
  leaf) does NOT parse and the impl turbo silently skips the task.
- Major grouping lines, from MAJOR_RE (core-tasks.js:5): `- [ ] N. <Title>`.
  Majors are structure only — the turbo executes leaves. An unchecked major
  with zero `N.M` leaves is rejected (kiro-tasks-turbo/src/contract.js:44-46;
  dev-engine/contract.mjs:81-92).
- New specs are authored with EVERY box unchecked `[ ]` — checking is the
  impl turbo's job.

Annotations — indented lines under a leaf, until the next leaf/major/heading,
from ANNO_RE (core-tasks.js:6) `/^\s*(?:-\s+)?_([A-Za-z]+):\s*(.*?)_\s*$/`:

```
  _Requirements: 1.1, 1.2, 3.4_
  _Boundary: src/components/foo_
  _Depends: 1.1_
```

- Keys are case-sensitive; only `Requirements`, `Boundary`, `Depends`,
  `Blocked` are read (core-tasks.js:30-33) — anything else is silently
  ignored. Values are comma-separated (core-tasks.js:8).
- `_Requirements:_` — REQUIRED, >=1 dotted id per task, each an id that
  parses from requirements.md (kiro-tasks-turbo/src/contract.js:51).
- `_Boundary:_` — REQUIRED, >=1 path-ish label per task
  (kiro-tasks-turbo/src/contract.js:52). Boundary DISJOINTNESS is what lets
  `(P)` tasks share a wave (core-waves.js:20-23): two tasks may run in
  parallel only when both carry `(P)` and their boundary sets do not overlap.
- `_Depends:_` — every target must be a real task id
  (kiro-tasks-turbo/src/contract.js:53-55); the scheduler runs a dependent
  only after its dependency (core-waves.js:12), and an unmet dep or cycle
  degrades the whole remainder to serial (core-waves.js:13-15).

Content rules (kiro-tasks-turbo/src/contract.js `validateTasksMd`):

- A starred `- [ ]*` test task must name its `[req:a.b]` tags in the
  description (contract.js:65-66).
- Never author a task that edits `.dependency-cruiser.cjs`
  (contract.js:56-58) — boundary-rule derivation is the design-to-rules
  turbo's job.
- Never split work so a sub-task leaves the tree deliberately red for a later
  task to fix ("will fail until", "fixed in 2.3", …) — every sub-task must be
  standalone-green (contract.js:68-76).

## Structure (golden-example convention — imitate it)

See `golden-example/tasks.md` (note: the golden doc is post-merge, so its
leaves are `[x]`; author yours `[ ]`):

```
# <Feature Title> — Implementation Plan

## Tasks

- [ ] 1. <Major title: the component>
- [ ] 1.1 <Full implementation spec of the component, one line: file path,
  exact behavior, exact markup/classes, explicit exclusions.>
  _Requirements: <every criterion this task satisfies>_
  _Boundary: <the directory this task owns>_

- [ ] 1.2 <Test task naming each test and its [req:N.M] tag.>
  _Requirements: 9.1, 9.2_
  _Boundary: <same directory>_
  _Depends: 1.1_

- [ ] 2. <Major title: adjacent touches>
- [ ] 2.1 (P) <Bounded touch to shared file A.>
  _Requirements: 7.2_
  _Boundary: <file A's directory>_
```

Description quality bar (the knowledge channel): golden task 1.1 specifies the
component in ONE sentence — path, props policy, fallback literal, exact
className strings, and seven explicit "no X" exclusions. That density is the
target. Each `[req:N.M]` tag in a test task's description tells the
implementer the exact test title tag to emit, which later buys the requirement
a cheaper validation tier (kiro-validate-impl-turbo/SKILL.md risk tiers).
