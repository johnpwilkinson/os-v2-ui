# design.md — contract

## MISSION

design.md is the intent document. Consumers, in order:

1. **kiro-validate-impl-turbo** parses the `## Boundary Commitments` table
   into validation units — one gate-relevant verdict per row
   (core-boundaries.js `scanBoundaryTable` + contract.js `parseBoundaries`,
   kiro-validate-impl-turbo/src/contract.js:17-22; counted into the run plan
   at src/plan.js:57).
2. **Requirements + tasks authoring** (normally the forge's
   kiro-requirements-turbo / kiro-tasks-turbo; under this skill, you) derive
   every acceptance criterion and every task from this document — it is their
   only intent source (kiro-requirements-turbo/SKILL.md:11).
3. **kiro-design-to-rules-turbo** may later derive dependency-cruiser boundary
   rules from the same table.
4. **Humans** review it on the design branch PR.

Pack it accordingly: every constraint, non-goal, and settled decision from the
brainstorm goes here. Anything left in your head does not exist downstream.

## Format contract (parser-derived — violations break the machine)

- **`## Boundary Commitments` section, required.** Located by
  `/Boundary Commitments/i` at any heading level
  (core-boundaries.js:27); the section ends at the next heading of any level
  (core-boundaries.js:31-33) — do not nest sub-headings inside it.
- **A markdown table inside that section.** Rows are `| ... |` lines
  (TABLE_ROW_RE, core-boundaries.js:7). Use a header row whose first cell is
  exactly `Commitment` (skipped by the scanner, core-boundaries.js:42) and a
  `|---|---|` separator (skipped, core-boundaries.js:13-15,38).
- **Each data row: `| <commitment name> | <rule/meaning text> |`.** The first
  cell is the unit name — an empty first cell means the row is silently
  dropped (core-boundaries.js:40-41). The rule text is read from the LAST
  cell, falling back to the second, backticks stripped
  (kiro-validate-impl-turbo/src/contract.js:19) — keep every row at the same
  column count or the rule text silently shifts.
- **Unique commitment names.** Duplicates are silently dropped, first wins
  (core-boundaries.js:43-44).

## Structure (golden-example convention — imitate it)

See `golden-example/design.md`. Sections, in order:

1. `# <Feature Title> — Design` — H1 title.
2. Optional `Source:` link to the brainstorm document, when one exists in the
   repo.
3. `## Overview` — prose: what is being built, the decisions the brainstorm
   settled (with their "per the brainstorm's Q<n> answer" provenance where
   useful), and the layout/architecture consequences. This is where rejected
   alternatives die on the record.
4. `## File Structure` — a table of every file the feature Owns or Touches,
   with a one-line purpose each, plus an explicit "no other files are touched"
   scope fence. Implementers and reviewers treat this as the edit allowlist.
5. `## Boundary Commitments` — the parsed table (contract above). One row per
   enforceable promise: ownership fences, dependency ceilings ("no new npm
   package"), styling/API reuse, non-goals ("static read, not reactive"),
   bounded touches to shared files. Write rows so a validator can check each
   one against the diff.
6. `## Concrete Shape` — the implementation sketch: expected component/module
   code blocks, exact class strings, mount points, test outline. Not parsed;
   read by the humans and agents that author and review the code.

## Brainstorm binding decisions

If the brainstorm produced `**BD-<n>**:` binding decisions and a
`brainstorm.md` is stored at `.kiro/specs/<slug>/brainstorm.md`, every BD id
must appear verbatim somewhere in design.md (a `## GAP` section is the
sanctioned deviation channel) — kiro-tasks-turbo's plan CLI hard-refuses
otherwise (core-brainstorm.js:8-24; kiro-tasks-turbo/src/plan.js:84-91), and
dry_run.sh leg 3 runs that CLI. Simplest correct move: echo each BD id in the
Overview sentence that satisfies it.
