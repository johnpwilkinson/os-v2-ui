# Drill Runway Check — Implementation Plan

## Tasks

- [ ] 1. Drill marker component
- [ ] 1.1 Implement `DrillRunwayCheck` in `src/components/drill-runway-check/drill-runway-check.tsx`: a prop-less, state-less server component (no `"use client"` directive, no imports beyond what the JSX requires) whose entire render is `<div className="py-2 text-center text-xs text-muted-foreground">os-v2-ui</div>` — exact text `os-v2-ui`, no interactive elements, no event handlers, no additional markup.
  _Requirements: 1.1, 1.2, 1.3, 1.4_
  _Boundary: src/components/drill-runway-check_

- [ ] 1.2 Author `src/components/drill-runway-check/drill-runway-check.test.tsx` using the existing vitest + jsdom + testing-library setup (mirror `src/components/ui/button.test.tsx`'s import style) covering: rendered text content equals exactly `os-v2-ui` [req:3.1]; the rendered `<div>` carries `py-2`, `text-center`, `text-xs`, and `text-muted-foreground` [req:3.2]; the rendered output contains no `<a>` or `<button>` elements and no `onclick` attribute [req:3.3]. All tests pass against the component from 1.1 via `npx vitest run`.
  _Requirements: 3.1, 3.2, 3.3_
  _Boundary: src/components/drill-runway-check_
  _Depends: 1.1_

- [ ] 2. Root layout mount
- [ ] 2.1 Edit `src/app/layout.tsx` to import `DrillRunwayCheck` from `@/components/drill-runway-check/drill-runway-check` and mount `<DrillRunwayCheck />` exactly once inside `<body>`, immediately after `{children}`. Every other part of the file — fonts, metadata, and the existing `html`/`body` className values — stays byte-identical. Verify `npm run build` passes.
  _Requirements: 2.1, 2.2_
  _Boundary: src/app/layout.tsx_
  _Depends: 1.1_
