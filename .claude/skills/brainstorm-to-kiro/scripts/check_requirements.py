#!/usr/bin/env python3
"""check_requirements.py <path-to-requirements.md>

Fast per-doc gate for a kiro requirements.md. Every rule below is derived from
the REAL downstream parser; each failure names the rule AND the parser line it
derives from. Parser paths are relative to OS_V2_ROOT (default ~/lab/agents):

  CANON = os-v2/skills/kiro-validate-impl-turbo/src/core-requirements.js
  PLAN  = os-v2/skills/kiro-validate-impl-turbo/src/plan.js

This script is fast feedback only. The plan CLIs run by dry_run.sh are the
only authority; on any disagreement the CLI wins and this script gets fixed.

stdlib only. Exit 0 = pass, exit 1 = violations (printed), exit 2 = usage.
"""
import re
import sys

CANON = "os-v2/skills/kiro-validate-impl-turbo/src/core-requirements.js"
PLAN = "os-v2/skills/kiro-validate-impl-turbo/src/plan.js"

# Faithful ports of the canonical parser's regexes (CANON:7,10,11,12,13).
REQ_RE = re.compile(r"^\s*(?:[-*]\s+)?(\d+\.\d+)\s+(.*\S)\s*$")
REQ_HEADING_RE = re.compile(r"^#{1,4}\s+(?:Requirement\s+)?(\d+)\b", re.IGNORECASE)
AC_HEADING_RE = re.compile(r"^#{1,6}\s+.*Acceptance\s+Criteria", re.IGNORECASE)
ANY_HEADING_RE = re.compile(r"^#{1,6}\s+")
PLAIN_CRIT_RE = re.compile(r"^\s*(\d+)[.)]\s+(.*\S)\s*$")

# Authoring-defect detector (NOT in the parser — the parser SILENTLY skips
# these lines, which is exactly why they must be caught here): a bullet that
# starts with a dotted-id-looking token that REQ_RE does not accept.
BROKEN_ID_RE = re.compile(r"^\s*[-*]\s+(\d+\.\S*)")


def parse_requirements(md):
    """Port of parseRequirements (CANON:15-58). Returns (reqs, duplicates)."""
    lines = md.split("\n")
    reqs = []
    seen = set()
    dups = []

    # PRIMARY: dotted-id lines (CANON:21-35). Duplicate ids are silently
    # skipped by the parser (CANON:25) — recorded here as authoring defects.
    for i, line in enumerate(lines):
        m = REQ_RE.match(line)
        if not m:
            continue
        rid = m.group(1)
        if rid in seen:
            dups.append((i + 1, rid))
            continue
        seen.add(rid)
        reqs.append({"id": rid, "text": m.group(2).strip(), "line": i + 1})

    # SECONDARY: stock cc-sdd recovery (CANON:44-55) — "### Requirement N" +
    # "#### Acceptance Criteria" + plain "M." lines synthesize id N.M.
    cur_req = None
    in_ac = False
    for i, line in enumerate(lines):
        rh = REQ_HEADING_RE.match(line)
        if rh:
            cur_req = rh.group(1)
            in_ac = False
            continue
        if ANY_HEADING_RE.match(line):
            in_ac = cur_req is not None and AC_HEADING_RE.match(line) is not None
            continue
        if not in_ac or cur_req is None:
            continue
        cm = PLAIN_CRIT_RE.match(line)
        if not cm:
            continue
        rid = f"{cur_req}.{cm.group(1)}"
        if rid in seen:
            continue
        seen.add(rid)
        reqs.append({"id": rid, "text": cm.group(2).strip(), "line": i + 1})

    return reqs, dups


def check(md):
    failures = []
    lines = md.split("\n")
    reqs, dups = parse_requirements(md)

    # R1 — at least one parseable requirement. The validate CLI hard-refuses
    # otherwise: "no parseable requirements" (PLAN:131-134, exit 1).
    if not reqs:
        failures.append(
            f"R1 zero-criteria: no acceptance criterion parses. Every criterion "
            f"must be a line like '- 1.1 WHEN ... THE SYSTEM SHALL ...' matching "
            f"REQ_RE ({CANON}:7); the validate CLI refuses with 'no parseable "
            f"requirements' ({PLAN}:131-134)."
        )

    # R2 — duplicate dotted ids. The parser keeps the FIRST and silently drops
    # the rest (CANON:25) — a duplicate means one criterion can never be
    # validated or referenced from tasks.md.
    for lineno, rid in dups:
        failures.append(
            f"R2 duplicate-id: line {lineno} re-declares criterion id {rid}; the "
            f"parser dedups by id and silently drops this line ({CANON}:25)."
        )

    # R3 — a bullet that LOOKS like a dotted criterion but does not parse
    # (e.g. '- 1.x WHEN ...', '- 2.10.1 ...'). The parser skips it silently;
    # downstream it simply vanishes from validation coverage.
    for i, line in enumerate(lines):
        b = BROKEN_ID_RE.match(line)
        if not b or REQ_RE.match(line):
            continue
        failures.append(
            f"R3 malformed-id: line {i + 1} bullet starts with "
            f"'{b.group(1)}' which is not a parseable '<major>.<minor>' dotted "
            f"id followed by text (REQ_RE, {CANON}:7); this criterion would be "
            f"silently invisible to validation."
        )

    # R4 — criterion major number must match its enclosing '## Requirement N'
    # heading when one is present. Not a parser rule (the parser takes any
    # dotted id) — an authoring-drift check: a 3.x criterion under
    # 'Requirement 2' is a renumbering slip that corrupts tasks.md references.
    cur_heading = None
    for i, line in enumerate(lines):
        rh = REQ_HEADING_RE.match(line)
        if rh:
            cur_heading = rh.group(1)
            continue
        if ANY_HEADING_RE.match(line):
            continue
        m = REQ_RE.match(line)
        if m and cur_heading is not None:
            major = m.group(1).split(".")[0]
            if major != cur_heading:
                failures.append(
                    f"R4 major-mismatch: line {i + 1} criterion {m.group(1)} sits "
                    f"under heading 'Requirement {cur_heading}' — renumbering "
                    f"slip; ids are consumed verbatim by tasks.md annotations "
                    f"and the tier scan ({PLAN}:41-47)."
                )

    return failures, reqs


def main():
    if len(sys.argv) != 2:
        print(__doc__.strip().split("\n")[0], file=sys.stderr)
        return 2
    try:
        md = open(sys.argv[1], encoding="utf-8").read()
    except OSError as e:
        print(f"FAIL cannot read {sys.argv[1]}: {e}", file=sys.stderr)
        return 1
    failures, reqs = check(md)
    if failures:
        for f in failures:
            print(f"FAIL {f}", file=sys.stderr)
        return 1
    print(f"OK {sys.argv[1]}: {len(reqs)} acceptance criteria parse cleanly")
    return 0


if __name__ == "__main__":
    sys.exit(main())
