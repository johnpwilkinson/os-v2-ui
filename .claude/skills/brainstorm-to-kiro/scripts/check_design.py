#!/usr/bin/env python3
"""check_design.py <path-to-design.md>

Fast per-doc gate for a kiro design.md. Every parser-derived rule cites the
REAL downstream scanner; paths relative to OS_V2_ROOT (default ~/lab/agents):

  BOUND = os-v2/plugins/os-core/skills/kiro-validate-impl-turbo/src/core-boundaries.js
  MAP   = os-v2/plugins/os-core/skills/kiro-validate-impl-turbo/src/contract.js

This script is fast feedback only. The plan CLIs run by dry_run.sh are the
only authority; on any disagreement the CLI wins and this script gets fixed.

stdlib only. Exit 0 = pass, exit 1 = violations, exit 2 = usage.
"""
import re
import sys

BOUND = "os-v2/plugins/os-core/skills/kiro-validate-impl-turbo/src/core-boundaries.js"
MAP = "os-v2/plugins/os-core/skills/kiro-validate-impl-turbo/src/contract.js"

# Faithful ports of the canonical scanner's shapes (BOUND:7,14,27).
TABLE_ROW_RE = re.compile(r"^\s*\|(.+)\|\s*$")
SEP_CELL_RE = re.compile(r"^:?-{2,}:?$")
SECTION_RE = re.compile(r"^#{1,6}\s+.*Boundary Commitments", re.IGNORECASE)
HEADING_RE = re.compile(r"^#{1,6}\s+")

# D-PATH grammar — mirrors kiro-design-to-rules-turbo/src/contract.js
# deriveFromTo (SOURCE OF TRUTH; three shapes, priority order). Cross-repo
# drift risk accepted in the Wave C design: if deriveFromTo changes, update
# this checker; the deriver's own refuse-loud on underivable rows (plan.js
# underivableBoundaries) is the backstop.
MUSTNOT_RE = re.compile(
    r"([`'\"]?[\w./-]+[`'\"]?)\s+MUST\s+NOT\s+import\s+([`'\"]?[\w./-]+[`'\"]?)", re.I)
# Layer segment uses the deriver's EXACT restrictive alternation (contract.js:85),
# not a loose `.+?`: a looser match bridges multi-word phrases with embedded src
# tokens that the deriver's mVia rejects (to='' -> refused).
VIA_RE = re.compile(
    r"[`'\"]?([\w./-]+)[`'\"]?\s+reaches\s+"
    r"(?:tag\s+rules|the\s+\w+|[\w]+\s+rules|[\w./-]+)"
    r"\s+ONLY\s+via\s+[`'\"]?(src[\w./-]+)[`'\"]?", re.I)
LEAF_RE = re.compile(r"pure\s+leaf|imports?\s+no\s+(?:store|service|api)", re.I)
SRC_TOKEN_RE = re.compile(r"[`'\"]?src[\w./-]+[`'\"]?", re.I)
# depcruise-rule-name override grammar (BOUNDARIES_CONTENT_SCHEMA.ruleName,
# spec-schemas.js:89); the deriver takes cols[last] verbatim as the rule id.
RULE_NAME_RE = re.compile(r"^sdd-[a-z0-9-]+$")


def _clean(tok):
    """Mirror contract.js cleanPath: strip surrounding backticks/quotes, trim."""
    return re.sub(r"^[`'\"]+|[`'\"]+$", "", (tok or "").strip()).strip()


def dpath_compilable(meaning):
    """True iff the deriver (deriveFromTo) compiles this Meaning cell to a
    non-degenerate from/to rule. Mirrors contract.js deriveFromTo, in the same
    priority order (MUST NOT import -> reaches ONLY via -> pure leaf)."""
    # 1) "A MUST NOT import B" — the deriver drops an empty operand or a
    # self-edge (from===to) at contract.js:71. Compare cleaned tokens
    # (toPathRegex is a pure fn of the cleaned token, so token equality is a
    # faithful stand-in for its anchored-regex equality here).
    m = MUSTNOT_RE.search(meaning)
    if m:
        a, b = _clean(m.group(1)), _clean(m.group(2))
        return bool(a) and bool(b) and a != b
    # 2) "<subj> reaches <layer> ONLY via <via>" compiles only when a src token
    # names the BYPASSED layer, distinct from BOTH the via-service AND the
    # subject (contract.js:97 tokens.find(t => t !== via && t !== subj));
    # otherwise the deriver leaves to='' and plan.js refuses the row.
    m = VIA_RE.search(meaning)
    if m:
        subj, via = _clean(m.group(1)), _clean(m.group(2))
        tokens = [_clean(t) for t in SRC_TOKEN_RE.findall(meaning)]
        return any(t != via and t != subj for t in tokens)
    if LEAF_RE.search(meaning):
        return True
    return False


DPATH_SELFTEST = [
    ("src/ui/TagBadge MUST NOT import src/store/taskStore", True),
    ("TagBadge MUST NOT import TagStore", True),  # name-form; deriver compiles (CORR-AUTH-02)
    ("TagBadge reaches tag rules ONLY via src/service/tagService; bypassed: src/domain/tagRules", True),
    ("src/domain/tagRules is a pure leaf", True),
    ("src/lib/render imports no store", True),
    ("uses src/lib/helpers for parsing", False),  # the old false-pass class: src token, no shape
    ("Throwaway grade", False),
    ("TagBadge reaches tag rules ONLY via src/service/tagService", False),  # bypassed layer unnamed -> to='' -> deriver refuses
    # Regression: reaches-ONLY-via with a src/ SUBJECT — the only two src tokens
    # are the subject and the via-service, so no distinct bypassed layer exists
    # (contract.js:97 tokens.find(t => t !== via && t !== subj)) -> to='' -> refused.
    ("src/ui/TagBadge reaches tag rules ONLY via src/service/tagService", False),
    # Regression: self-edge MUST NOT import — deriver drops from===to (contract.js:71).
    ("src/foo MUST NOT import src/foo", False),
    ("TagBadge MUST NOT import TagBadge", False),  # name-form self-edge
    # Regression: multi-word "reaches" layer with an embedded src token. The
    # deriver's restrictive layer alternation (contract.js:85) can't bridge the
    # phrase to " ONLY via", so mVia fails -> to='' -> refused. A loose `.+?`
    # layer segment would false-pass these.
    ("src/ui/Badge reaches domain rules src/domain/badgeRules ONLY via src/service/badgeService", False),
    ("src/ui/Badge reaches the tag store src/store/tagStore ONLY via src/service/tagService", False),
    ("src/a reaches the auth cache src/domain/c ONLY via src/service/b", False),
]


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

    # D-PATH — every non-metadata boundary row must compile under the rules
    # deriver's grammar (kiro-design-to-rules-turbo/src/contract.js deriveFromTo),
    # which recognises exactly THREE shapes. A row the deriver leaves with an
    # empty from/to is refused downstream (plan.js underivableBoundaries), so
    # the checker mirrors that grammar exactly via dpath_compilable().
    for n, (lineno, cs, name) in enumerate(data, 1):
        if name.strip("*` ").lower() == "declared deps":
            continue  # metadata row, not a boundary commitment
        # Meaning + rule-name override — mirror parseBoundaries faithfully
        # (kiro-design-to-rules-turbo/src/contract.js:188-201): the Meaning
        # is ALWAYS cols[1]; when the row has >=3 cells the LAST cell is the
        # depcruise-rule-NAME override (cols[cols.length-1]), NOT the meaning.
        # Reading the last cell as the meaning false-FAILs any schema-valid row
        # that authored a `ruleName`. Per SKILL.md Gate doctrine the CLI wins.
        if len(cs) >= 3:
            meaning = cs[1]
            rule_cell = _clean(cs[-1])  # rule-name override (contract.js:193)
            # The override names the rule, not a path, so it is EXEMPT from the
            # D-PATH path-scoping check below; but a non-empty override must be
            # a valid rule id (spec-schemas.js:89 ^sdd-[a-z0-9-]+$), else the
            # downstream insertRules writes a malformed rule name.
            if rule_cell and not RULE_NAME_RE.match(rule_cell):
                failures.append(
                    f'D-PATH row {n} ("{name}"): rule-name override "{rule_cell}" '
                    f"is not a valid rule id (must match ^sdd-[a-z0-9-]+$; the "
                    f"deriver takes the last cell as the rule name, contract.js:193)."
                )
        else:
            meaning = cs[-1] if cs and cs[-1] else (cs[1] if len(cs) > 1 else "")
        if not dpath_compilable(meaning):
            failures.append(
                f'D-PATH row {n} ("{name}"): not compilable by the rules deriver '
                f"(contract.js deriveFromTo). Use one of its three shapes:\n"
                f'  "src/A MUST NOT import src/B"\n'
                f'  "X reaches <layer> ONLY via src/B" (and NAME the bypassed layer as a src/ path)\n'
                f'  "src/A is a pure leaf" / "src/A imports no store/service/api"\n'
                f"or move doctrine prose out of the Boundary Commitments table."
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
    if len(sys.argv) == 2 and sys.argv[1] == "--selftest":
        bad = [(m, want) for m, want in DPATH_SELFTEST if dpath_compilable(m) != want]
        for m, want in bad:
            print(f"FAIL dpath_compilable({m!r}) != {want}", file=sys.stderr)
        print("OK dpath selftest" if not bad else f"{len(bad)} dpath case(s) failed",
              file=sys.stderr if bad else sys.stdout)
        return 1 if bad else 0
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
