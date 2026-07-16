# Drill Wave-A Cert — Requirements

## Requirement 1: Static Marker Rendering

**User Story:** As the operator, I want a tiny static text marker rendered by a dedicated component, so that the Wave A hardened pipeline has a minimal real artifact to build, test, and merge under its new gates.

Acceptance Criteria:
- 1.1 WHEN the `DrillWaveACert` component renders THE SYSTEM SHALL render a single `<div>` whose exact text content is `wave-a-certified`.
- 1.2 WHEN the `DrillWaveACert` component renders THE SYSTEM SHALL apply the Tailwind utility classes `py-2`, `text-center`, `text-xs`, and `text-muted-foreground` to that `<div>`.
- 1.3 WHEN the `DrillWaveACert` component is defined THE SYSTEM SHALL accept no props, hold no internal state, attach no event handlers, and contain no interactive elements.
- 1.4 WHEN the `DrillWaveACert` component is authored THE SYSTEM SHALL NOT include a `"use client"` directive and SHALL NOT import anything beyond what the JSX itself requires.

## Requirement 2: Root Layout Integration

**User Story:** As the operator, I want the marker mounted once in the root layout, so that the drill exercises a real shared-file integration touch without disturbing anything else.

Acceptance Criteria:
- 2.1 WHEN the root layout (`src/app/layout.tsx`) renders THE SYSTEM SHALL mount `<DrillWaveACert />` exactly once, inside `<body>`, immediately after the existing `<DrillRunwayCheck />`.
- 2.2 WHEN the root layout is edited for this feature THE SYSTEM SHALL leave every other part of the file unchanged — fonts, metadata, the `{children}` slot, the existing `<DrillRunwayCheck />` mount, and the existing `html`/`body` className values stay byte-identical.

## Requirement 3: Test Coverage

**User Story:** As the operator, I want unit tests proving the marker's behavior, so that the pipeline's mechanical test gate exercises a real red/green surface under the certified image.

Acceptance Criteria:
- 3.1 WHEN the test suite runs THE SYSTEM SHALL include a test asserting the rendered text content equals exactly `wave-a-certified`.
- 3.2 WHEN the test suite runs THE SYSTEM SHALL include a test asserting the rendered `<div>` carries the classes `py-2`, `text-center`, `text-xs`, and `text-muted-foreground`.
- 3.3 WHEN the test suite runs THE SYSTEM SHALL include a test asserting the rendered output contains no interactive elements (`a`, `button`) and no `onClick` handler attribute.
