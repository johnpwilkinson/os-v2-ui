# Drill Wave-A Cert — Design

## Overview

A deliberately tiny, throwaway-grade drill feature whose only purpose is to
prove the Wave A hardened runway end to end on this repository: certified
image at propose, launch-ref gate, drill halt + warm resume, and the new
five-artifact spec contract (path-scoped boundary rows, derived sdd rules
committed with the spec). It renders one static, muted line of text reading
`wave-a-certified` at the bottom of every page, mounted once in the root
layout immediately after the existing `<DrillRunwayCheck />` marker. No
interactivity, no state, no props, no data fetching, no new dependencies,
no configuration changes, no routing. The `drill-` slug prefix triggers the
engine's built-in one-shot halt lever before validate, proving warm resume
as part of the same run.

The component is a server component by default (no `"use client"`
directive — static markup only). Styling uses existing Tailwind utility
classes already present in the project: `text-xs`, `text-muted-foreground`,
`text-center`, `py-2`.

## File Structure

Legend: **Owns** = this feature is the sole, ongoing owner. **Touches** =
existing shared file, edited only to integrate, not owned.

| Path | Boundary | Purpose |
|---|---|---|
| `src/components/drill-wave-a-cert/drill-wave-a-cert.tsx` | Owns | The component: renders a `<div className="py-2 text-center text-xs text-muted-foreground">wave-a-certified</div>`. Prop-less, state-less, static. |
| `src/components/drill-wave-a-cert/drill-wave-a-cert.test.tsx` | Owns | Unit tests for render, exact text content, and styling classes, using the existing vitest + jsdom + testing-library setup. |
| `src/app/layout.tsx` | Touches | Mounts `<DrillWaveACert />` exactly once, inside `<body>`, immediately after the existing `<DrillRunwayCheck />`. No other markup, font, metadata, or class change. |

No other files are touched. `package.json`, `vitest.config.ts`,
`components.json`, and everything under `src/components/ui/` are out of
scope — this feature adds no dependencies and no build-time plumbing.

## Boundary Commitments

Every row below is path-scoped so the rules deriver compiles it verbatim;
doctrine that is not path-expressible lives in Behavioral commitments.

| Commitment | Meaning |
|---|---|
| Drill independence | `src/components/drill-wave-a-cert` MUST NOT import `src/components/drill-runway-check` — the two drill markers stay fully independent throwaways. |
| No ui primitives | `src/components/drill-wave-a-cert` MUST NOT import `src/components/ui` — plain HTML markup only, no shadcn primitives. |
| No feature coupling | `src/components/drill-wave-a-cert` MUST NOT import `src/components/run-view` — the drill never touches real feature code. |
| Declared deps | none — uses only `react` (already a dependency) and existing Tailwind utility classes; no new npm package is added. |

### Behavioral commitments

- `src/components/drill-wave-a-cert/` is exclusively this feature's:
  nothing unrelated gets added there, and this feature adds nothing outside
  it except the single sanctioned `src/app/layout.tsx` mount line.
- The root layout is shared project property: the `layout.tsx` touch is one
  import line and one mount line; fonts, metadata, and existing html/body
  classes stay byte-identical.
- Throwaway grade: this is a runway drill. A future cleanup feature may
  remove it wholesale; nothing may grow to depend on it.

## Decisions

- **Server component, no directive:** static text only; the unit test
  renders the plain function component under the existing vitest+jsdom
  setup.
- **Placement after `<DrillRunwayCheck />`:** keeps both drill markers
  adjacent at the document bottom and makes the layout touch a one-line
  append, byte-preserving everything else.
- **Path-scoped boundary rows:** authored in the deriver's compilable
  `MUST NOT import` shape per the Wave A five-artifact contract; the
  derived `sdd-drill-wave-a-cert-*` rules ride this spec into the repo.
