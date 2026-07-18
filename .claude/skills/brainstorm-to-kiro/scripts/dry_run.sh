#!/usr/bin/env bash
# dry_run.sh <feature-slug> [<client-repo-root>]
#
# AUTHORITATIVE final gate: runs the REAL os-v2 plan CLIs against the client
# repo working copy. The per-doc check_*.py scripts are fast feedback only;
# THESE CLIs are the only authority — on any disagreement the CLI wins.
#
# Legs (all must exit 0):
#   1. kiro-validate-impl-turbo plan.js  — feature-name allowlist, artifact
#      existence (requirements/design/tasks), requirements parse (>=1),
#      boundary scan, toolchain/sourceChecks/tiering declarations.
#   2. kiro-impl-turbo plan.js           — tasks.md parse + wave plan, role
#      prompt templates presence + enum drift gate.
#   3. kiro-tasks-turbo plan.js          — spec.json presence + JSON validity +
#      approvals.design.approved gate (neither leg 1 nor leg 2 reads
#      spec.json; this leg is its only real-CLI gate).
#
# Env: OS_V2_ROOT — the agents-repo clone holding os-v2/ (default ~/lab/agents).
#
# Side effects on the client repo: the CLIs write ephemeral run-plans under
# .kiro/.turbo/ — keep that path in .gitignore (per the turbos' SKILL.md docs).
set -uo pipefail

if [ $# -lt 1 ]; then
  echo "usage: dry_run.sh <feature-slug> [<client-repo-root>]" >&2
  exit 2
fi

SLUG="$1"
ROOT="${2:-.}"
OS_V2_ROOT="${OS_V2_ROOT:-$HOME/lab/agents}"
SKILLS="$OS_V2_ROOT/os-v2/plugins/os-core/skills"

for d in kiro-validate-impl-turbo kiro-impl-turbo kiro-tasks-turbo; do
  if [ ! -f "$SKILLS/$d/src/plan.js" ]; then
    echo "dry_run: missing $SKILLS/$d/src/plan.js — set OS_V2_ROOT to the agents-repo clone" >&2
    exit 2
  fi
done

# Leg 2 hard prerequisite: the impl plan CLI readFileSync()s the three role
# prompt templates at CONTRACT.PATHS (kiro-impl-turbo/src/contract.js:16-20)
# and drift-checks their enum tokens (src/selftest.mjs:16-26). Fail with a
# clear message instead of a Node stack trace.
for f in implementer-prompt.md reviewer-prompt.md debugger-prompt.md; do
  if [ ! -f "$ROOT/.claude/skills/kiro-impl/templates/$f" ]; then
    echo "dry_run: client repo missing .claude/skills/kiro-impl/templates/$f (required by kiro-impl-turbo plan.js, src/contract.js:16-20) — install the cc-sdd kiro-impl templates first" >&2
    exit 2
  fi
done

overall=0
run_leg() {
  local label="$1"; shift
  local out
  echo "== $label: $*"
  out="$("$@" 2>&1)"
  local code=$?
  if [ $code -eq 0 ]; then
    echo "   exit 0"
  else
    echo "   exit $code"
    echo "$out" | sed 's/^/   | /'
    overall=1
  fi
}

run_leg "validate-impl-turbo plan" node "$SKILLS/kiro-validate-impl-turbo/src/plan.js" "$SLUG" --root "$ROOT"
run_leg "impl-turbo plan"          node "$SKILLS/kiro-impl-turbo/src/plan.js" "$SLUG" --root "$ROOT"
run_leg "tasks-turbo plan (spec.json gate)" node "$SKILLS/kiro-tasks-turbo/src/plan.js" "$SLUG" --root "$ROOT"

# Leg 4 (Wave A lesson 6): a design with boundary rows MUST have derived
# sdd-<slug>-* rules in the cjs, or the enforce rung halts fail-closed.
if python3 "$(dirname "$0")/has_boundary_rows.py" "$ROOT/.kiro/specs/$SLUG/design.md"; then
  if ! grep -q "sdd-$SLUG-" "$ROOT/.dependency-cruiser.cjs" 2>/dev/null; then
    echo "dry_run: no sdd-$SLUG-* rules in .dependency-cruiser.cjs — run the fifth artifact step (design-to-rules) before landing" >&2
    exit 1
  fi
fi

if [ $overall -eq 0 ]; then
  echo "DRY RUN GREEN: all three plan CLIs accepted .kiro/specs/$SLUG"
else
  echo "DRY RUN RED: fix the artifacts and re-run (the CLI verdict is authoritative)" >&2
fi
exit $overall
