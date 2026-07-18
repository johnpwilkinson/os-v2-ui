# Console multi-run board — Requirements

## Introduction

The Wave F bridge serves a per-repo runs map on /console/state; the CRT panel must parse it tolerantly, render one row per repo with active runs visually dominant, and fall back to the legacy engine summary byte-for-byte when the runs map is empty or absent so older bridges render exactly as before.

### Requirement 1: Tolerant runs parsing

**User Story:** As the console panel, I want the runs map parsed defensively so a malformed or missing field can never blank the whole state view.

#### Acceptance Criteria

- 1.1 WHEN /console/state carries a runs object THE SYSTEM SHALL parse each entry into a ConsoleRun keyed by its repo alias
- 1.2 IF the runs field is absent or not a plain object THE SYSTEM SHALL yield an empty runs map while the remainder of the state parse succeeds unchanged
- 1.3 IF an individual runs entry is not a plain object THE SYSTEM SHALL drop that entry while retaining every well-formed entry

### Requirement 2: Runs board rendering

**User Story:** As the operator, I want every concurrent run visible as its own row so two overlapping builds are readable at a glance.

#### Acceptance Criteria

- 2.1 WHEN the parsed runs map has at least one entry THE SYSTEM SHALL render one row per alias showing the alias, phase, feature, and runId
- 2.2 WHEN two or more entries are active THE SYSTEM SHALL render every active row simultaneously with the panel's primary glow treatment
- 2.3 WHILE an entry is inactive THE SYSTEM SHALL render its row dimmed relative to active rows
- 2.4 WHEN rendering rows THE SYSTEM SHALL order active rows before inactive rows and alphabetically by alias within each group

### Requirement 3: Legacy fallback parity

**User Story:** As an operator on an older bridge, I want the panel unchanged so the feature can never regress the existing view.

#### Acceptance Criteria

- 3.1 IF the parsed runs map is empty THE SYSTEM SHALL render the legacy engine summary line with text identical to the pre-feature ENGINE cell
- 3.2 WHEN the bridge response omits the runs field entirely THE SYSTEM SHALL render output identical to the pre-feature panel for the same state
