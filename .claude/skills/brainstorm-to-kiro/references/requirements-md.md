# requirements.md — contract

## MISSION

requirements.md is the verification contract. Consumers:

1. **kiro-validate-impl-turbo** parses every dotted-id criterion and spawns
   ONE validation agent per criterion, which reads the implemented code and
   returns PASS/FAIL/UNCERTAIN with file:line evidence
   (core-requirements.js `parseRequirements`; the CLI refuses outright when
   zero criteria parse — kiro-validate-impl-turbo/src/plan.js:131-134).
2. **tasks.md** joins on the ids: `_Requirements: 1.1, 1.2_` annotations and
   `[req:N.M]` test-title tags reference these ids verbatim; the validate
   turbo's risk-tier scan matches tagged tests back to them
   (kiro-validate-impl-turbo/src/plan.js:41-47).
3. **kiro-impl-turbo lane briefs** slice criterion text verbatim into each
   implementer's orientation brief (kiro-impl-turbo/src/contract.js:52-91).

Write each criterion as a question a validator can answer from the diff alone:
concrete, observable, single-behavior. If a criterion needs conversation
context to judge, it is not finished.

## Format contract (parser-derived)

- **Primary grammar — dotted-id bullets** (this is what you write):
  `- N.M <criterion text>` matching
  `/^\s*(?:[-*]\s+)?(\d+\.\d+)\s+(.*\S)\s*$/` (REQ_RE,
  core-requirements.js:7). The id is `<major>.<minor>`, both plain integers.
- **Continuation:** an indented following line is appended to the criterion
  text; a blank line, a heading, or the next criterion ends it
  (core-requirements.js:28-33). Safer: keep each criterion on one line.
- **Unique ids.** The parser dedups by id, first wins, silently
  (core-requirements.js:25) — a duplicate id is a lost criterion.
- **At least one criterion must parse**, or the validate CLI exits 1 with
  `no parseable requirements` (kiro-validate-impl-turbo/src/plan.js:131-134).
- A secondary recovery grammar exists for stock cc-sdd docs
  (`### Requirement N` + `#### Acceptance Criteria` + plain `M.` lists,
  core-requirements.js:37-55). Do not target it; write dotted ids.
- **Trap:** REQ_RE matches ANY line whose bullet starts `N.M ` — a stray
  "- 3.5 inch drive" in prose becomes a phantom requirement. Keep dotted-id
  bullets exclusively inside Acceptance Criteria blocks.

## Structure (golden-example convention — imitate it)

See `golden-example/requirements.md`. Per requirement group N:

```
## Requirement N: <Title>

**User Story:** As a <role>, I want <capability>, so that <benefit>.

Acceptance Criteria:
- N.1 WHEN <trigger> THE SYSTEM SHALL <observable behavior>.
- N.2 IF <condition> THE SYSTEM SHALL <observable behavior>.
- N.3 WHILE <state> THE SYSTEM SHALL NOT <forbidden behavior>.
```

- EARS keywords (WHEN / IF / WHILE / WHERE + THE SYSTEM SHALL) are the house
  style — the parser only needs the dotted id, but downstream validators are
  prompted around EARS phrasing.
- Criterion majors match their heading number (`## Requirement 3` owns
  3.1, 3.2, …) — check_requirements.py enforces this as drift protection.
- Cover every design surface: each File Structure row and each Boundary
  Commitment should be verifiable through at least one criterion (that is the
  coverage bar the forge's evaluator judges — kiro-requirements-turbo/
  SKILL.md:23-27). Include a final "Test Coverage" requirement group that
  enumerates the tests tasks.md will tag with `[req:N.M]` — see golden
  Requirement 9.
