# Drill Runway Check — Design

## Overview

A deliberately tiny, throwaway-grade smoke feature whose only purpose is to
exercise the full autonomous build pipeline (spec consumption → lanes →
mechanical gates → PR → review → merge) end to end on this repository for
the first time. It renders one static, muted line of text reading
`os-v2-ui` at the bottom of every page, mounted once in the root layout.
No interactivity, no state, no props, no data fetching, no new
dependencies, no configuration changes, no shadcn additions, no routing.
The `drill-` slug prefix is intentional: it triggers the engine's built-in
one-shot halt lever before the validate stage, proving warm resume on this
repository as part of the same run.

The component is a server component by default (no `"use client"`
directive is needed — it renders static markup only). Styling uses
existing Tailwind utility classes already present in the project's
toolchain: `text-xs` for size and `text-muted-foreground` (the shadcn
neutral token installed by this project's base theme) for the muted
treatment, centered with `text-center`, padded with `py-2`.

## File Structure

Legend: **Owns** = this feature is the sole, ongoing owner. **Touches** =
existing shared file, edited only to integrate, not owned.

| Path | Boundary | Purpose |
|---|---|---|
| `src/components/drill-runway-check/drill-runway-check.tsx` | Owns | The component: renders a `<div className="py-2 text-center text-xs text-muted-foreground">os-v2-ui</div>`. Prop-less, state-less, static. |
| `src/components/drill-runway-check/drill-runway-check.test.tsx` | Owns | Unit tests for render, exact text content, and styling classes, using the existing vitest + jsdom + testing-library setup. |
| `src/app/layout.tsx` | Touches | Mounts `<DrillRunwayCheck />` exactly once, inside `<body>` immediately after `{children}`. No other markup, font, metadata, or class change. |

No other files are touched. `package.json`, `vitest.config.ts`,
`next.config.ts`, `components.json`, `.dependency-cruiser.cjs`, and
everything under `src/components/ui/` are all out of scope — this feature
adds no dependencies and no build-time plumbing.

## Boundary Commitments

| Commitment | Meaning |
|---|---|
| `src/components/drill-runway-check/` is exclusively this feature's | Nothing unrelated gets added there, and this feature adds nothing outside it except the single sanctioned `src/app/layout.tsx` mount line. |
| `src/components/ui/` is a shared shadcn primitives folder, not drill-owned | This feature adds NO primitives there and imports none of them — plain HTML markup only. |
| Declared deps | none — uses only `react` (already a dependency) and existing Tailwind utility classes; no new npm package is added. |
| The root layout is shared project property | The `layout.tsx` touch is one import line and one mount line; fonts, metadata, html/body classes stay byte-identical. |
| Throwaway grade | This is a runway drill. A future cleanup feature may remove it wholesale; nothing may grow to depend on it. |

## Decisions

- **Server component, no directive:** the component renders static text
  only; adding `"use client"` would be gratuitous. The unit test renders it
  directly (it is a plain function component), which the existing
  vitest+jsdom setup handles without any Next runtime.
- **Muted token choice:** `text-muted-foreground` is the project's
  installed shadcn neutral token (globals.css base theme); using it keeps
  the drill visually invisible-by-politeness and exercises the Tailwind v4
  token pipeline in the build.
- **Placement after `{children}`:** guarantees the line lands at the
  document bottom on every route without touching any page component.
