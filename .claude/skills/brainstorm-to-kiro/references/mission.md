# Mission: the distillation doctrine

Why this skill exists, so a session using it inherits the intent — not just
the format.

## The one-sentence mission

The most capable model in the pipeline (you, right now, with the brainstorm
context hot) distills everything the session knows into four artifacts that
lesser models can execute mechanically — and once written, nothing downstream
ever rewrites them.

## Why the brainstorm session authors, inline

By the time the brainstorming skill asks "shall I write the spec?", this
session holds knowledge that exists nowhere else: the rejected alternatives,
the operator's exact answers, the edge cases surfaced and resolved, the
implicit constraints ("don't touch the version badge") that never made it into
any file. A subagent gets a summary of that context; a forge chamber gets a
design doc distilled from a summary. Every hop loses the long tail, and the
long tail is precisely what implementer agents need to not re-litigate settled
questions. So the rule is hard: **the authoring happens inline, in this
session, while the context is hot. Never dispatch a subagent to write these
artifacts.**

## Why the gates are mechanical

The counterweight to hot-context authoring is deterministic gating. Judgment
wrote the artifacts; code checks them. The per-doc scripts and the real plan
CLIs (dry_run.sh) parse the artifacts with the exact grammar the downstream
consumers use, so "it passed the gate" means "the machine that will consume
this can consume this" — not "an agent thought it looked fine". A model
verifying its own prose is the failure mode this replaces. On any disagreement
between a check script and a plan CLI, the CLI wins and the script gets fixed;
the CLIs are the consumers' own code.

## Why downstream models never rewrite

The four artifacts are the ONLY channel from this session to the build
pipeline. The session ends; the artifacts persist. Downstream, cheaper models
read them to implement, review, and validate — and every one of them is
forbidden from rewriting the spec, because a less-capable model "fixing" a
distilled constraint is information loss disguised as progress. If an artifact
is wrong, the fix flows back through a human gate to a capable session, never
sideways through an implementer. (Mechanical state updates are the sanctioned
exception: the impl turbo flips task checkboxes and appends implementation
notes — kiro-impl-turbo/src/contract.js:28-38 — it never touches task
descriptions, requirements, or design.)

## The knowledge channels, ranked

1. **tasks.md task descriptions** — travel VERBATIM into implementer agent
   prompts (each lane agent receives its task's text as the work order). This
   is the highest-bandwidth channel: exact file paths, exact class strings,
   exact markup, exact test assertions. Write each description so an
   implementer with zero conversation context cannot get it wrong. Look at the
   golden example's task 1.1 — it is one sentence, and it is the whole
   implementation.
2. **design.md Boundary Commitments** — each table row becomes a validation
   unit the validate turbo checks the implementation against
   (kiro-validate-impl-turbo/src/contract.js:17-22). Every "we decided NOT to"
   from the brainstorm belongs here; an unwritten constraint is an unenforced
   constraint.
3. **requirements.md acceptance criteria** — each dotted id becomes one
   validation agent's PASS/FAIL question, and the ids are the join keys for
   tasks.md `_Requirements:_` annotations and `[req:N.M]` test tags.
4. **spec.json** — pure state: the machine-readable record that a human
   approved each phase. No knowledge lives here.

## Portability

This skill is a template that travels into client repos. Nothing in it may
hard-code a client name, repo path, or branch: repo identity derives from
`git remote`, the integration branch from the repo's default branch, and the
os-v2 tooling location from `OS_V2_ROOT`. The frozen ground truth it validates
against (the os-v2 parsers) is read-only by doctrine: this skill READS those
parsers to stay honest and never instructs modifying them.
