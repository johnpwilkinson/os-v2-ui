---
name: brainstorm-to-kiro
description: Author the four kiro spec artifacts (design.md, requirements.md, tasks.md, spec.json) directly from a converged brainstorming session, gate them with deterministic checks plus the real os-v2 plan CLIs, and land them on a design/ branch. Use whenever the operator answers a brainstorm's "shall I write the spec?" gate with /brainstorm-to-kiro, and also when they say "write the kiro spec", "turn this brainstorm into a spec", "author the spec artifacts", "spec this feature for the chamber/engine", or approve a brainstormed design that should become a .kiro/specs feature — even if they don't say "kiro".
---

# brainstorm-to-kiro

Turn THIS session's converged brainstorm into the four artifacts the os-v2
build pipeline consumes — `.kiro/specs/<slug>/{design.md, requirements.md,
tasks.md, spec.json}` — then gate them mechanically and land them on a
`design/<slug>` branch in the client repo.

Read `references/mission.md` first if this is your first run in this repo: it
explains WHY the steps are shaped this way, and the artifacts you write are
only as good as the intent you inherit.

## Hard rule: author inline, in this session

**Never dispatch a subagent (or any secondary session) to author or edit these
four artifacts.** The hot brainstorm context IS the value being captured: the
rejected alternatives, the operator's exact answers, the constraints that never
made it into a file. A subagent receives a summary; summaries lose precisely
the long tail that makes downstream implementation mechanical. Scripts and plan
CLIs run via Bash as usual — the rule covers authoring judgment, not
mechanical checking.

Two corollaries:

- Do not re-interview the operator for content the brainstorm already settled;
  the artifacts distill what this session knows.
- Downstream models never rewrite these artifacts (see
  `references/mission.md`); you are writing the final text, not a draft.

## Gate doctrine: scripts are feedback, plan CLIs are law

Two gate layers, run in this order, both required:

1. **Per-doc check scripts** (`scripts/check_*.py`, python3 stdlib) — fast
   feedback immediately after authoring each artifact. Every failure message
   names the violated rule and the os-v2 parser file:line it derives from.
2. **`scripts/dry_run.sh <slug>`** — the AUTHORITATIVE gate: it executes the
   REAL os-v2 plan CLIs (kiro-validate-impl-turbo, kiro-impl-turbo,
   kiro-tasks-turbo `plan.js`) against the client repo working copy.

The scripts exist to make the loop fast; the plan CLIs are the downstream
consumers' own code and are the only authority. **If a script and a CLI ever
disagree, the CLI wins — fix the artifact to satisfy the CLI, and then fix the
script** (in this skill's `scripts/`, never in os-v2). The os-v2 tree the CLIs
live in is read-only ground truth: never modify anything under it to make a
gate pass.

## Prerequisites

- `OS_V2_ROOT` env var pointing at the agents-repo clone that holds `os-v2/`
  (defaults to `~/lab/agents`). `dry_run.sh` fails with a clear message when
  the plan CLIs are not found there.
- The client repo carries the cc-sdd kiro-impl role templates at
  `.claude/skills/kiro-impl/templates/` (implementer/reviewer/debugger
  prompts) — kiro-impl-turbo's plan CLI reads them
  (kiro-impl-turbo/src/contract.js:16-20). `dry_run.sh` pre-checks this.
- `.kiro/.turbo/` is in the client repo's `.gitignore` (the plan CLIs write
  ephemeral run-plans there). Add it if missing.

## Workflow

### 1. Derive the feature slug

Lowercase the feature name, join words with `-`, and confirm it matches the
plan CLIs' allowlist `^[a-z0-9][a-z0-9._-]{0,63}$` (enforced with exit 2 at
kiro-validate-impl-turbo/src/plan.js:83-87 and
kiro-impl-turbo/src/plan.js:141-144). Keep it short and descriptive
(`footer-locale-badge`, not a sentence). Create `.kiro/specs/<slug>/`.

If the slug's spec directory already exists with a COMPLETED/merged feature,
stop and ask the operator — never overwrite a finished spec, and never re-seed
a completed run.

### 2. Author the four artifacts, gating each immediately

Author order matters: design is the intent source for requirements, which is
the id source for tasks. For EACH artifact: read its contract reference, study
the golden example (`references/golden-example/` — a real merged feature;
imitate its shape), write the file, run its check script, fix until exit 0.

| # | Artifact | Contract | Check (run from the skill dir) |
|---|---|---|---|
| a | `design.md` | `references/design-md.md` | `python3 scripts/check_design.py <spec>/design.md` |
| b | `requirements.md` | `references/requirements-md.md` | `python3 scripts/check_requirements.py <spec>/requirements.md` |
| c | `tasks.md` | `references/tasks-md.md` | `python3 scripts/check_tasks.py <spec>/tasks.md <spec>/requirements.md` |
| d | `spec.json` | `references/spec-json.md` | `python3 scripts/check_spec_json.py <spec>/spec.json` |

Knowledge-packing bar (the reason this skill exists): design.md's Boundary
Commitments carry every constraint and non-goal the brainstorm settled;
tasks.md descriptions travel VERBATIM to implementer agents and must be
executable by a model with zero conversation context. When in doubt, write the
extra sentence into the task description — that channel is cheap here and
priceless downstream.

spec.json's three `approved: true` booleans record the operator's spec-gate
approval that invoked this skill. If that approval was partial or conditional,
resolve it with the operator before writing them.

### 3. Authoritative dry run — loop until green

```
OS_V2_ROOT=<agents-repo> bash scripts/dry_run.sh <slug> <client-repo-root>
```

All three plan CLIs must exit 0. On RED: read the CLI's stderr (it names the
defect), fix the ARTIFACT, re-run the artifact's check script, re-run
`dry_run.sh`. Loop author → check → fix until green. Do not proceed, and do
not weaken any gate, while RED.

### 4. Land on the design branch

Only after DRY RUN GREEN:

1. From the repo's default branch (up to date with origin), create
   `design/<slug>`.
2. Commit exactly the four artifact files (plus `.gitignore` if you added
   `.kiro/.turbo/`). Conventional Commit subject, e.g.
   `feat: add <slug> kiro spec`. Never commit `.kiro/.turbo/` contents.
3. Push: `git push -u origin design/<slug>`.

### 5. Print the operator's next steps

The engine builds the spec COMMITTED ON THE INTEGRATION BRANCH — a spec that
only lives on `design/<slug>` is invisible to it
(dev-engine-plan.js:380-391 refuses CONTRACT RED when the four files are not
blobs on that branch). So the merge comes FIRST. Derive `<repo>` from
`git remote get-url origin` and `<default>` from the origin default branch,
then print, as plain copy-paste lines (no block quotes, no hedging):

1. Open a PR from design/<slug> to <default> on <repo> and merge it.
2. When it is merged, send Hermes: build <slug> on <repo>.

If this client repo is not driven by a Hermes/watcher setup, replace line 2
with the manual equivalent: run `/kiro-impl-turbo <slug>` (or stock
`/kiro-impl <slug>`) from a session in the repo after the merge.

## Failure modes

- A plan CLI exits non-zero naming `unsafe feature name` → back to step 1.
- `brainstorm decision(s) not covered by design.md` (exit 2 from the
  tasks-turbo leg) → a `**BD-<n>**` binding decision from
  `.kiro/specs/<slug>/brainstorm.md` is missing from design.md; satisfy it or
  record it under a `## GAP` section there (kiro-tasks-turbo/src/plan.js:84-91).
  Never bypass this by deleting brainstorm.md.
- `impl-turbo SELFTEST FAILED` / `DRIFT` → the os-v2 install itself is broken;
  stop and surface to the operator. Never edit os-v2 to unblock.
- Repeated RED you cannot reconcile with a contract reference → suspect the
  reference or check script is stale against os-v2; trust the CLI, fix the
  artifact, then update this skill's reference/script and tell the operator.

## Reference map

- `references/mission.md` — why: the distillation doctrine. Read first.
- `references/design-md.md`, `references/requirements-md.md`,
  `references/tasks-md.md`, `references/spec-json.md` — per-artifact MISSION +
  exact format contract, every rule cited to the os-v2 parser file:line.
- `references/golden-example/` — the four artifacts of a real merged feature
  (chamber-sim `footer-locale-badge`), vendored verbatim. Note its tasks.md is
  post-merge (`[x]` leaves); author yours unchecked.
- `scripts/` — the four per-doc checks + `dry_run.sh`.
