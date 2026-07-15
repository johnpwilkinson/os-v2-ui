#!/usr/bin/env python3
"""check_design.py <path-to-design.md>

Fast per-doc gate for a kiro design.md. Every parser-derived rule cites the
REAL downstream scanner; paths relative to OS_V2_ROOT (default ~/lab/agents):

  BOUND = os-v2/skills/kiro-validate-impl-turbo/src/core-boundaries.js
  MAP   = os-v2/skills/kiro-validate-impl-turbo/src/contract.js

This script is fast feedback only. The plan CLIs run by dry_run.sh are the
only authority; on any disagreement the CLI wins and this script gets fixed.

stdlib only. Exit 0 = pass, exit 1 = violations, exit 2 = usage.
"""
import re
import sys

BOUND = "os-v2/skills/kiro-validate-impl-turbo/src/core-boundaries.js"
MAP = "os-v2/skills/kiro-validate-impl-turbo/src/contract.js"

# Faithful ports of the canonical scanner's shapes (BOUND:7,14,27).
TABLE_ROW_RE = re.compile(r"^\s*\|(.+)\|\s*$")
SEP_CELL_RE = re.compile(r"^:?-{2,}:?$")
SECTION_RE = re.compile(r"^#{1,6}\s+.*Boundary Commitments", re.IGNORECASE)
HEADING_RE = re.compile(r"^#{1,6}\s+")


def cells(inner):
    return [c.strip() for c in inner.split("|")]


def is_separator(inner):
    return all(c == "" or SEP_CELL_RE.match(c) for c in cells(inner))


def check(md):
    failures = []
    lines = md.split("\n")

    # D1 — the 'Boundary Commitments' section must exist (any heading level,
    # BOUND:27); without it the validate turbo scans ZERO boundaries and the
    # boundary dimension of the gate is vacuous.
    start = None
    for i, line in enumerate(lines):
        if SECTION_RE.match(line):
            start = i + 1
            break
    if start is None:
        failures.append(
            f"D1 no-boundary-section: no '## Boundary Commitments' heading found "
            f"(section located by /Boundary Commitments/i at any heading level, "
            f"{BOUND}:27); the validate gate's boundary scan would be empty."
        )
        return failures, 0

    # Section ends at the next heading (BOUND:31-33).
    end = len(lines)
    for i in range(start, len(lines)):
        if HEADING_RE.match(lines[i]):
            end = i
            break

    rows = []  # (lineno, cells) in section, separator excluded
    for i in range(start, end):
        m = TABLE_ROW_RE.match(lines[i])
        if not m:
            continue
        if is_separator(m.group(1)):
            continue
        rows.append((i + 1, cells(m.group(1))))

    header = None
    data = []
    seen = set()
    for lineno, cs in rows:
        name = cs[0] if cs else ""
        if header is None and re.match(r"^commitment$", name, re.IGNORECASE):
            header = (lineno, cs)  # header row, skipped by the scanner (BOUND:42)
            continue
        data.append((lineno, cs, name))

    # D2 — at least one data row. Rows are the boundary units the validate
    # turbo derives verdicts for (scanBoundaryTable, BOUND:21-48).
    if not data:
        failures.append(
            f"D2 empty-boundary-table: the Boundary Commitments section has no "
            f"data rows (rows extracted by TABLE_ROW_RE, {BOUND}:7,35-46); "
            f"every commitment made in the brainstorm must land here."
        )

    # D3 — every data row needs a non-empty first cell (the commitment name);
    # the scanner silently DROPS a row whose first cell is empty (BOUND:40-41).
    for lineno, cs, name in data:
        if not name:
            failures.append(
                f"D3 unnamed-commitment: line {lineno} table row has an empty "
                f"first cell; the scanner silently drops it ({BOUND}:40-41)."
            )

    # D4 — duplicate commitment names: the scanner keeps the FIRST and drops
    # the rest (BOUND:43-44); the later row's rule text is silently lost.
    for lineno, cs, name in data:
        if not name:
            continue
        if name in seen:
            failures.append(
                f"D4 duplicate-commitment: line {lineno} re-declares commitment "
                f"'{name}'; the scanner dedups by name and drops this row "
                f"({BOUND}:43-44)."
            )
        seen.add(name)

    # D5 — column-count integrity. The rule text is taken from the LAST cell
    # (falling back to cell 2) with backticks stripped (MAP:17-22); a dropped
    # column silently shifts which text becomes the rule. Baseline = the
    # header row when present, else the widest row.
    base = len(header[1]) if header else (max(len(cs) for _, cs, _ in data) if data else 0)
    if base < 2:
        failures.append(
            f"D5 too-few-columns: the boundary table needs >=2 columns "
            f"(commitment name + rule/meaning text — the mapper reads "
            f"cols[last] || cols[1], {MAP}:19)."
        )
    else:
        for lineno, cs, name in data:
            if len(cs) != base:
                failures.append(
                    f"D5 column-drop: line {lineno} row '{name}' has {len(cs)} "
                    f"column(s), table baseline is {base}; the mapper takes the "
                    f"LAST cell as the rule ({MAP}:19), so a missing column "
                    f"silently swaps the rule text."
                )

    # D6 — mission rule (not parser-derived): an '## Overview' section must
    # exist. requirements.md and tasks.md are authored FROM this document
    # (kiro-requirements-turbo SKILL.md:11 derives requirements from design);
    # a design without an overview starves every downstream author of intent.
    if not any(re.match(r"^#{1,6}\s+Overview\b", l) for l in lines):
        failures.append(
            "D6 no-overview: design.md has no '## Overview' section; downstream "
            "authors (requirements, tasks, implementers) consume the design as "
            "their only intent source — see references/design-md.md."
        )

    return failures, len(data)


def main():
    if len(sys.argv) != 2:
        print(__doc__.strip().split("\n")[0], file=sys.stderr)
        return 2
    try:
        md = open(sys.argv[1], encoding="utf-8").read()
    except OSError as e:
        print(f"FAIL cannot read {sys.argv[1]}: {e}", file=sys.stderr)
        return 1
    failures, n = check(md)
    if failures:
        for f in failures:
            print(f"FAIL {f}", file=sys.stderr)
        return 1
    print(f"OK {sys.argv[1]}: boundary table clean ({n} commitments)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
