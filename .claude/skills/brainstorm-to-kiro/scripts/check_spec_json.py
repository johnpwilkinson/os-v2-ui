#!/usr/bin/env python3
"""check_spec_json.py <path-to-spec.json>

Fast per-doc gate for a kiro spec.json. Rules derive from the REAL downstream
gates; paths relative to OS_V2_ROOT (default ~/lab/agents):

  GATE = os-v2/plugins/os-core/skills/kiro-tasks-turbo/src/gate.js            (design approval)
  ENG  = os-v2/plugins/os-core/skills/kiro-full-auto/dev-engine/contract.mjs

This script is fast feedback only. The plan CLIs run by dry_run.sh are the
only authority; on any disagreement the CLI wins and this script gets fixed.

stdlib only. Exit 0 = pass, exit 1 = violations, exit 2 = usage.
"""
import json
import sys

GATE = "os-v2/plugins/os-core/skills/kiro-tasks-turbo/src/gate.js"
ENG = "os-v2/plugins/os-core/skills/kiro-full-auto/dev-engine/contract.mjs"


def check(text):
    failures = []

    # S1 — must be valid JSON: the engine flags 'spec.json is not valid JSON'
    # (ENG:49-51); the design-approval gate returns false on any parse error
    # (GATE:8-10), silently blocking downstream turbos.
    try:
        spec = json.loads(text)
    except ValueError as e:
        failures.append(
            f"S1 invalid-json: spec.json does not parse ({e}) — engine launch "
            f"gate refuses ({ENG}:49-51); approval gates read false ({GATE}:8-10)."
        )
        return failures

    # S2 — top level must be an object holding 'approvals'.
    if not isinstance(spec, dict) or not isinstance(spec.get("approvals"), dict):
        failures.append(
            f"S2 no-approvals: top level must be an object with an 'approvals' "
            f"object ({GATE}:7; {ENG}:45-48)."
        )
        return failures

    # S3 — the engine requires approvals.<phase>.approved === true for ALL of
    # requirements, design, tasks (ENG:45-48); tasks-turbo and design-to-rules
    # additionally hard-gate on approvals.design.approved (GATE:7). This skill
    # writes spec.json only after the operator approved the brainstorm's spec,
    # so all three must be true at authoring time.
    a = spec["approvals"]
    for k in ("requirements", "design", "tasks"):
        v = a.get(k)
        if not isinstance(v, dict) or v.get("approved") is not True:
            failures.append(
                f"S3 unapproved-{k}: approvals.{k}.approved !== true — engine "
                f"launch gate refuses ({ENG}:45-48"
                + ("; tasks-turbo/design-to-rules also refuse, " + GATE + ":7" if k == "design" else "")
                + ")."
            )

    return failures


def main():
    if len(sys.argv) != 2:
        print(__doc__.strip().split("\n")[0], file=sys.stderr)
        return 2
    try:
        text = open(sys.argv[1], encoding="utf-8").read()
    except OSError as e:
        print(f"FAIL cannot read {sys.argv[1]}: {e}", file=sys.stderr)
        return 1
    failures = check(text)
    if failures:
        for f in failures:
            print(f"FAIL {f}", file=sys.stderr)
        return 1
    print(f"OK {sys.argv[1]}: approvals.requirements/design/tasks all true")
    return 0


if __name__ == "__main__":
    sys.exit(main())
