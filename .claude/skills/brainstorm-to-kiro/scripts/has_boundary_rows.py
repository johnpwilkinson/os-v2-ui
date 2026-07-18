#!/usr/bin/env python3
"""has_boundary_rows.py <design.md> — exit 0 if the Boundary Commitments table
has >=1 non-metadata data row (a row other than 'Declared deps'), else exit 1.
Used by dry_run.sh to decide whether sdd-<slug>-* rules are REQUIRED."""
import re
import sys

md = open(sys.argv[1], encoding="utf-8").read()
lines = md.split("\n")
in_section = False
rows = 0
for i, line in enumerate(lines):
    if re.match(r"^#{1,6}\s+.*Boundary Commitments", line, re.IGNORECASE):
        in_section = True
        continue
    if in_section and re.match(r"^#{1,6}\s+", line):
        break
    m = re.match(r"^\s*\|(.+)\|\s*$", line)
    if not (in_section and m):
        continue
    cells = [c.strip() for c in m.group(1).split("|")]
    if all(c == "" or re.match(r"^:?-{2,}:?$", c) for c in cells):
        continue  # separator
    first = cells[0].strip("*` ").lower()
    if first in ("commitment", "declared deps", "name"):
        continue  # header / metadata
    rows += 1
sys.exit(0 if rows else 1)
