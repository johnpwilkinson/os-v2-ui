# spec.json — contract

## MISSION

spec.json is pure state: the machine-readable record that a human approved
each spec phase. No knowledge lives here. Consumers:

1. **The autonomous engine's launch gate** requires
   `approvals.requirements.approved`, `approvals.design.approved`, and
   `approvals.tasks.approved` all `=== true`, and refuses CONTRACT RED
   otherwise (dev-engine/contract.mjs:39-52). It also requires spec.json to
   be committed on the integration branch alongside the three .md files
   (dev-engine-plan.js:380-391).
2. **kiro-tasks-turbo** and **kiro-design-to-rules-turbo** hard-gate on
   `approvals.design.approved === true` (kiro-tasks-turbo/src/gate.js:4-11,
   src/plan.js:65-70; kiro-design-to-rules-turbo/src/plan.js:84,129).
3. **The forge's approval writer** (what this skill replaces at the top of
   funnel) sets keys additively, preserving others
   (kiro-spec-forge/spec-forge.workflow.js:25).

## Format contract

Exact golden shape (`golden-example/spec.json`) — write it verbatim:

```json
{
  "approvals": {
    "design": {
      "approved": true
    },
    "requirements": {
      "approved": true
    },
    "tasks": {
      "approved": true
    }
  }
}
```

- Valid JSON, top-level object (dev-engine/contract.mjs:43-51 flags
  `spec.json is not valid JSON`; a broken file also makes every approval gate
  read false — kiro-tasks-turbo/src/gate.js:8-10).
- The three approval booleans must be literally `true` (strict `=== true`
  comparisons at dev-engine/contract.mjs:47 and gate.js:7 — the string
  "true" fails).
- Extra keys are permitted (consumers read only what they need and the forge
  preserves unknown keys), but this skill has no reason to add any.

## When to write `true`

This skill runs at the brainstorming skill's spec-approval gate — the
operator's go-ahead there IS the human approval for all three phases, so all
three booleans are written `true` in one shot. If the operator approved only
part of the spec, stop and resolve that with them before writing spec.json;
never write an approval the operator did not give.
