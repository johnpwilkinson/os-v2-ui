# Registration Runway Drill — Requirements

## Requirement 1: Drill Marker Document

**User Story:** As the factory operator, I want a throwaway marker document created by the drill feature, so that the full build ladder is proven on this repo without touching product code.

Acceptance Criteria:
- 1.1 WHEN the drill implementation lands THE SYSTEM SHALL create `docs/drills/drill-orbstack-ui.md` containing the literal heading line `# drill-orbstack-ui`.
- 1.2 WHEN the drill implementation lands THE SYSTEM SHALL include, below the heading, one paragraph stating the file is a registration-drill marker created by the factory and safe to delete.
- 1.3 WHEN the drill implementer authors its change THE SYSTEM SHALL add no implementation files outside `docs/drills/` and THE SYSTEM SHALL NOT modify `package.json` or any source file (the spec's own process artifacts under `.kiro/` and `docs/dev-engine/`, and the ladder's mechanical `.dependency-cruiser.cjs` rules splice, are surrounding machinery and exempt).
