#!/usr/bin/env python3
"""check_tasks.py <path-to-tasks.md> [<path-to-requirements.md>]

Fast per-doc gate for a kiro tasks.md. Rules are ports of the REAL consumer
grammar + the forge's authoring validator; paths relative to OS_V2_ROOT
(default ~/lab/agents):

  GRAM  = os-v2/plugins/os-core/skills/kiro-impl-turbo/src/core-tasks.js      (consumer grammar)
  WAVE  = os-v2/plugins/os-core/skills/kiro-impl-turbo/src/core-waves.js      (wave scheduler)
  VALID = os-v2/plugins/os-core/skills/kiro-tasks-turbo/src/contract.js       (validateTasksMd)
  ENG   = os-v2/plugins/os-core/skills/kiro-full-auto/dev-engine/contract.mjs

If a requirements.md path is given (or a sibling requirements.md exists), every
_Requirements:_ id and [req:N.M] tag is cross-checked against its parsed ids.

DELIBERATE DEVIATION from validateTasksMd: the wave/cycle check here runs with
all checkboxes normalized to UNCHECKED. buildWavePlan filters checked tasks
out of scheduling (WAVE:5-6), so a merged/executed doc would false-fail the
'0 waves' authoring rule (VALID:80). Authoring emits unchecked docs; this
normalization makes the schedulability check state-independent.

This script is fast feedback only. The plan CLIs run by dry_run.sh are the
only authority; on any disagreement the CLI wins and this script gets fixed.

stdlib only. Exit 0 = pass, exit 1 = violations, exit 2 = usage.
"""
import os
import re
import sys

GRAM = "os-v2/plugins/os-core/skills/kiro-impl-turbo/src/core-tasks.js"
WAVE = "os-v2/plugins/os-core/skills/kiro-impl-turbo/src/core-waves.js"
VALID = "os-v2/plugins/os-core/skills/kiro-tasks-turbo/src/contract.js"
ENG = "os-v2/plugins/os-core/skills/kiro-full-auto/dev-engine/contract.mjs"

# Faithful ports of the consumer grammar (GRAM:4,5,6).
SUB_RE = re.compile(r"^- \[([ x])\](\*?) (\d+)\.(\d+) (\(P\) )?(.*)$")
MAJOR_RE = re.compile(r"^- \[[ x]\] \d+\. ")
ANNO_RE = re.compile(r"^\s*(?:-\s+)?_([A-Za-z]+):\s*(.*?)_\s*$")

# Loose detector for anything checkbox-shaped, incl. forms the strict grammar
# rejects (leading indent, uppercase X, missing spaces). What matches here but
# NOT the strict grammar is silently invisible to the impl turbo.
LOOSE_BOX_RE = re.compile(r"^\s*-\s*\[[^\]]*\]")

REQ_ID_RE = re.compile(r"^\d+\.\d+$")
REQ_TAG_RE = re.compile(r"\[req:(\d+\.\d+)\]")
# Red-until-later declarations, verbatim from VALID:74.
RED_RE = re.compile(
    r"(expected to fail|will fail until|red until|fails? until task|"
    r"(fixed|made to pass) in (task )?\d+\.\d+|decoy test|deliberately failing|"
    r"temporarily red)",
    re.IGNORECASE,
)

KNOWN_ANNO = {"Requirements", "Boundary", "Depends", "Blocked"}


def csv(s):
    return [x.strip() for x in s.split(",") if x.strip()]


def parse_tasks(md):
    """Port of parseTasks (GRAM:10-38)."""
    lines = md.split("\n")
    tasks = []
    for i, line in enumerate(lines):
        m = SUB_RE.match(line)
        if not m:
            continue
        t = {
            "id": f"{m.group(3)}.{m.group(4)}",
            "line": i + 1,
            "desc": m.group(6).strip(),
            "parallel": bool(m.group(5)),
            "star": m.group(2) == "*",
            "checked": m.group(1) == "x",
            "requirements": [],
            "boundary": [],
            "depends": [],
            "blocked": False,
            "unknown_annos": [],
        }
        for j in range(i + 1, len(lines)):
            nxt = lines[j]
            if SUB_RE.match(nxt) or MAJOR_RE.match(nxt) or nxt.startswith("#"):
                break
            a = ANNO_RE.match(nxt)
            if not a:
                continue
            key, val = a.group(1), a.group(2)
            if key == "Requirements":
                t["requirements"] = csv(val)
            elif key == "Boundary":
                t["boundary"] = csv(val)
            elif key == "Depends":
                t["depends"] = csv(val)
            elif key == "Blocked":
                t["blocked"] = True
            else:
                t["unknown_annos"].append((j + 1, key))
        tasks.append(t)
    return tasks


def build_wave_plan(tasks, max_parallel=2):
    """Port of buildWavePlan (WAVE:4-36), non-sequential branch."""
    actionable = [t for t in tasks if not t["blocked"] and not t["checked"]]
    scheduled = {t["id"] for t in tasks if t["checked"]}
    waves = []
    remaining = list(actionable)
    while remaining:
        ready = [t for t in remaining if all(d in scheduled for d in t["depends"])]
        if not ready:  # unmet deps / cycle: flush serially (WAVE:13-15)
            for t in remaining:
                waves.append({"parallel": False, "tasks": [t]})
            break
        group = []
        used = set()
        for t in ready:
            if t["parallel"] and t["boundary"] and all(c not in used for c in t["boundary"]):
                group.append(t)
                used.update(t["boundary"])
        if len(group) >= 2 and max_parallel >= 2:
            waves.append({"parallel": True, "tasks": group})
            for t in group:
                scheduled.add(t["id"])
                remaining.remove(t)
        else:
            t = ready[0]
            waves.append({"parallel": False, "tasks": [t]})
            scheduled.add(t["id"])
            remaining.remove(t)
    return waves


def parse_requirement_ids(md):
    """Primary dotted-id pass of the canonical requirements parser
    (os-v2/plugins/os-core/skills/kiro-validate-impl-turbo/src/core-requirements.js:7,21-35)."""
    req_re = re.compile(r"^\s*(?:[-*]\s+)?(\d+\.\d+)\s+(.*\S)\s*$")
    ids = set()
    for line in md.split("\n"):
        m = req_re.match(line)
        if m:
            ids.add(m.group(1))
    return ids


def check(md, req_ids):
    failures = []
    lines = md.split("\n")
    tasks = parse_tasks(md)

    # T1 — checkbox lint: anything checkbox-shaped that the strict consumer
    # grammar does not parse. The impl turbo would SILENTLY skip such a line
    # (SUB_RE/MAJOR_RE, GRAM:4-5: no leading indent, lowercase 'x' or space,
    # exact '- [ ] N.M ' spacing); the engine's own floor only catches a doc
    # with ZERO parseable checkboxes (ENG:25-27).
    for i, line in enumerate(lines):
        if LOOSE_BOX_RE.match(line) and not SUB_RE.match(line) and not MAJOR_RE.match(line):
            failures.append(
                f"T1 unparseable-checkbox: line {i + 1} looks like a task line "
                f"but does not match the consumer grammar (SUB_RE/MAJOR_RE, "
                f"{GRAM}:4-5 — column 0, '- [ ] N.M desc' or '- [x] N. Title', "
                f"lowercase x only); the impl turbo would silently skip it."
            )

    # T2 — at least one sub-task (VALID:27).
    if not tasks:
        failures.append(
            f"T2 zero-subtasks: no sub-task parses (grammar mismatch) — "
            f"validateTasksMd rejects this at authoring ({VALID}:27)."
        )
        return failures, tasks

    # T3 — duplicate task ids. parseTasks does not dedup; the checkbox
    # flipper matches EVERY line with that id (kiro-impl-turbo/src/
    # contract.js:23-31), so duplicates corrupt completion state.
    seen = {}
    for t in tasks:
        if t["id"] in seen:
            failures.append(
                f"T3 duplicate-task-id: line {t['line']} re-declares task "
                f"{t['id']} (first at line {seen[t['id']]}); flipCheckbox flips "
                f"every matching line (kiro-impl-turbo/src/contract.js:23-31)."
            )
        else:
            seen[t["id"]] = t["line"]

    # T4 — childless unchecked major: work the impl turbo silently skips (it
    # executes only N.M leaves). Authoring gate VALID:35-47; engine launch
    # gate childlessMajors ENG:81-92.
    leaf_majors = set()
    majors = []
    for i, line in enumerate(lines):
        maj = re.match(r"^\s*- \[([ xX])\]\*? (\d+)\.(?:\s|$)", line)
        if maj:
            if maj.group(1) == " ":
                majors.append((i + 1, maj.group(2)))
            continue
        leaf = re.match(r"^\s*- \[[ xX]\]\*? (\d+)\.\d+(?:\s|$)", line)
        if leaf:
            leaf_majors.add(leaf.group(1))
    for lineno, n in majors:
        if n not in leaf_majors:
            failures.append(
                f"T4 childless-major: line {lineno} major task {n} has no N.M "
                f"sub-tasks — silently skipped work ({VALID}:44-46; {ENG}:81-92)."
            )

    ids = {t["id"] for t in tasks}
    for t in tasks:
        # T5 — every sub-task needs >=1 _Requirements:_ id (VALID:51).
        if not t["requirements"]:
            failures.append(
                f"T5 no-requirements: task {t['id']} (line {t['line']}) has no "
                f"_Requirements:_ annotation ({VALID}:51)."
            )
        # T6 — every sub-task needs a _Boundary:_ set (VALID:52); boundary
        # disjointness is what buildWavePlan parallelizes on (WAVE:20-23).
        if not t["boundary"]:
            failures.append(
                f"T6 no-boundary: task {t['id']} (line {t['line']}) has no "
                f"_Boundary:_ annotation ({VALID}:52)."
            )
        # T7 — _Depends:_ targets must be real task ids (VALID:53-55).
        for d in t["depends"]:
            if d not in ids:
                failures.append(
                    f"T7 unknown-dependency: task {t['id']} depends on unknown "
                    f"task {d} ({VALID}:53-55)."
                )
        # T8 — never edit .dependency-cruiser.cjs from a task (VALID:56-58).
        if re.search(r"\.dependency-cruiser", t["desc"], re.IGNORECASE):
            failures.append(
                f"T8 depcruise-edit: task {t['id']} edits .dependency-cruiser.cjs "
                f"— that is the design-to-rules turbo's job ({VALID}:56-58)."
            )
        # T9 — a starred (deferrable-test) sub-task must name its [req:a.b]
        # test-title tags (VALID:65-66); the tags feed the validate turbo's
        # risk-tier scan.
        if t["star"] and not REQ_TAG_RE.search(t["desc"]):
            failures.append(
                f"T9 star-without-tag: sub-task {t['id']} is a test task (*) but "
                f"names no [req:a.b] test-title tag ({VALID}:65-66)."
            )
        # T10 — no red-until-later splits (VALID:68-76): every sub-task must
        # leave the tree green standalone.
        if RED_RE.search(t["desc"]):
            failures.append(
                f"T10 red-until-later: sub-task {t['id']} declares a "
                f"deliberately-red state deferred to a later task ({VALID}:74-76)."
            )
        # T11 — annotation keys the parser ignores (parseTasks recognizes only
        # Requirements/Boundary/Depends/Blocked, GRAM:30-33). An ignored
        # '_requirements:_' etc. silently drops its payload.
        for lineno, key in t["unknown_annos"]:
            failures.append(
                f"T11 unknown-annotation: line {lineno} annotation key '{key}' "
                f"is ignored by the parser (only Requirements/Boundary/Depends/"
                f"Blocked are read, {GRAM}:30-33)."
            )
        # T12 — cross-check against requirements.md when available: every
        # referenced id must exist. The validate turbo reports tags for
        # unknown ids as staleTags, never scored (kiro-validate-impl-turbo/
        # src/plan.js:46-47) — at authoring time that is a defect.
        if req_ids is not None:
            for rid in t["requirements"]:
                if not REQ_ID_RE.match(rid):
                    failures.append(
                        f"T12 bad-requirement-ref: task {t['id']} _Requirements:_ "
                        f"entry '{rid}' is not a dotted N.M id (ids come from "
                        f"core-requirements.js REQ_RE)."
                    )
                elif rid not in req_ids:
                    failures.append(
                        f"T12 unknown-requirement-ref: task {t['id']} references "
                        f"requirement {rid} which does not parse from "
                        f"requirements.md (would be a stale ref; cf. staleTags, "
                        f"kiro-validate-impl-turbo/src/plan.js:46-47)."
                    )
            for m in REQ_TAG_RE.finditer(t["desc"]):
                if m.group(1) not in req_ids:
                    failures.append(
                        f"T12 unknown-req-tag: task {t['id']} names test tag "
                        f"[req:{m.group(1)}] which does not parse from "
                        f"requirements.md (tier scan would report it as a stale "
                        f"tag, kiro-validate-impl-turbo/src/plan.js:46-47)."
                    )

    # T13 — schedulability: on an all-unchecked copy (see DELIBERATE DEVIATION
    # in the module docstring), buildWavePlan must yield >=1 wave and schedule
    # every dependency before its dependent (VALID:79-99).
    fresh = [dict(t, checked=False) for t in tasks]
    waves = build_wave_plan(fresh)
    if fresh and not waves:
        failures.append(f"T13 zero-waves: buildWavePlan produced 0 waves ({VALID}:80).")
    scheduled = set()
    for w in waves:
        for t in w["tasks"]:
            for d in t["depends"]:
                if d in ids and d not in scheduled:
                    failures.append(
                        f"T13 dependency-cycle: {t['id']} scheduled before {d} "
                        f"({VALID}:90-98)."
                    )
        for t in w["tasks"]:
            scheduled.add(t["id"])

    return failures, tasks


def main():
    if len(sys.argv) not in (2, 3):
        print(__doc__.strip().split("\n")[0], file=sys.stderr)
        return 2
    tasks_path = sys.argv[1]
    req_path = sys.argv[2] if len(sys.argv) == 3 else os.path.join(
        os.path.dirname(os.path.abspath(tasks_path)), "requirements.md")
    try:
        md = open(tasks_path, encoding="utf-8").read()
    except OSError as e:
        print(f"FAIL cannot read {tasks_path}: {e}", file=sys.stderr)
        return 1
    req_ids = None
    if os.path.exists(req_path):
        try:
            req_ids = parse_requirement_ids(open(req_path, encoding="utf-8").read())
        except OSError:
            req_ids = None
    failures, tasks = check(md, req_ids)
    if failures:
        for f in failures:
            print(f"FAIL {f}", file=sys.stderr)
        return 1
    xref = "cross-checked" if req_ids is not None else "no requirements.md found — ids NOT cross-checked"
    print(f"OK {tasks_path}: {len(tasks)} sub-tasks parse cleanly ({xref})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
