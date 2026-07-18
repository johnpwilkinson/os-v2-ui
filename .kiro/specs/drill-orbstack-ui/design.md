# Registration Runway Drill — Design

## Overview

Throwaway drill feature proving the full build ladder on a freshly
registered repo: exactly one marker document under `docs/drills/`, no
product code touched, no dependencies added. Authored mechanically by
chamber-register (Wave D registration beat); safe to delete after the
drill PR merges.

## File Structure

| Path | Boundary | Purpose |
|---|---|---|
| `docs/drills/drill-orbstack-ui.md` | Owns | The drill marker document; the sole artifact of this feature. |

## Boundary Commitments

| Commitment | Detail |
|---|---|
| Drill isolation | `src/drill/drill-orbstack-ui` MUST NOT import `src/components` — the drill owns no source modules; this guards the reserved drill source path. |
| Product isolation | `src/components` MUST NOT import `src/drill/drill-orbstack-ui` — product code never depends on a throwaway drill marker. |
| Declared deps | none — docs-only drill; no new packages. |

### Behavioral commitments (doctrine, not module boundaries)

- **Docs-only implementation** — the implementer creates exactly one file,
  `docs/drills/drill-orbstack-ui.md`, and does not modify `package.json` or any
  source file. The spec's own process artifacts (`.kiro/specs/drill-orbstack-ui/`,
  PR meta-docs) and the ladder's mechanical `.dependency-cruiser.cjs`
  rules splice are part of the surrounding machinery, not the
  implementation, and are in scope by design.
- **Inert boundary rules by construction** — the two table commitments
  compile to depcruise rules guarding the RESERVED path
  `src/drill/drill-orbstack-ui`, which this drill never creates. They are meant to
  match nothing: they prove the derive→splice→enforce runway end-to-end
  without touching product code, and they leave with the drill.
- **Throwaway grade** — the marker exists to prove the runway; deleting it
  (and the `sdd-drill-orbstack-ui-*` rules) after the drill PR merges is
  sanctioned.

## Concrete Shape

`docs/drills/drill-orbstack-ui.md` renders as a heading line `# drill-orbstack-ui` followed
by one short paragraph. An acceptable rendering (any wording that states
marker + safe-to-delete is conformant):

    # drill-orbstack-ui

    Registration-drill marker created by the os-v2 dark factory
    registration beat. This file proves the build ladder end-to-end on
    this repo and is safe to delete.
