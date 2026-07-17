# Console State Panel — Requirements

## Introduction

Read-only /console page rendering the chamber bridge's console state as a tactical CRT terminal: the optimalNext directive, live decision telemetry rows, engine line, and fleet strip. Server-side data path over the existing tRPC route; fixture-driven tests only (the chamber build has no bridge).

### Requirement 1: Bridge data path

**User Story:** As the operator, I want the app server to fetch and narrow the bridge's console state so the browser never talks to the bridge directly.

#### Acceptance Criteria

- 1.1 WHEN the console state tRPC procedure is queried THE SYSTEM SHALL fetch the bridge /console/state endpoint server-side with the X-Chamber-Bridge header set to 1
- 1.2 WHEN the CHAMBER_BRIDGE_URL environment variable is set THE SYSTEM SHALL use it as the bridge base URL and SHALL default to the local bridge address otherwise
- 1.3 IF the bridge fetch throws or returns a non-200 status THE SYSTEM SHALL return an ok false result carrying a one-line error instead of throwing
- 1.4 WHEN raw bridge JSON arrives THE SYSTEM SHALL narrow it to the typed ConsoleState and SHALL reject a malformed top level as ok false
- 1.5 IF an individual decision entry is malformed THE SYSTEM SHALL drop that entry while keeping every valid remaining decision

### Requirement 2: Panel rendering and states

**User Story:** As the operator, I want a glanceable page that leads with the machine's recommended move and shows every pending decision with its timing.

#### Acceptance Criteria

- 2.1 WHEN console data is live THE SYSTEM SHALL lead with the optimalNext directive inside the OPTIMAL NEXT framed banner prefixed by the triple chevron
- 2.2 WHEN live decisions exist THE SYSTEM SHALL render one telemetry row per decision showing kind, title, recommendation, repo and feature identity, age, and expiry countdown
- 2.3 IF zero decisions are live THE SYSTEM SHALL render the dim NO PENDING DECISIONS row inside the decisions compartment
- 2.4 IF the console query errors or returns ok false THE SYSTEM SHALL render the full-width red LINK DOWN banner naming the error
- 2.5 WHILE the page is open THE SYSTEM SHALL refetch the console state every five seconds
- 2.6 WHEN repos are present THE SYSTEM SHALL render the fleet strip with class, watched, and driver flags plus the engine phase line and queue depth

### Requirement 3: Tactical terminal aesthetic

**User Story:** As the operator, I want the console to read as a military CRT terminal, page-scoped, without touching the global theme.

#### Acceptance Criteria

- 3.1 WHEN the console page renders THE SYSTEM SHALL use the deactivated-CRT background, white-phosphor foreground, and monospace type across the entire page
- 3.2 WHEN alert-grade content renders such as fix verdicts, halts, or link-down THE SYSTEM SHALL use hazard red as the only alert color on the page
- 3.3 WHEN the bridge link is up THE SYSTEM SHALL render exactly one terminal-green element which is the LINK indicator dot
- 3.4 WHEN compartments render THE SYSTEM SHALL draw one-pixel dividers via the grid gap-px technique and SHALL use zero border radius everywhere
- 3.5 WHEN the page renders THE SYSTEM SHALL overlay CRT scanlines using the repeating-linear-gradient utility and SHALL leave globals and layout untouched

### Requirement 4: Test isolation and purity

**User Story:** As the factory, I want every test runnable inside the egress-locked chamber with no live bridge.

#### Acceptance Criteria

- 4.1 WHEN server fetch tests run THE SYSTEM SHALL exercise fetchConsoleState only through an injected fake fetch and SHALL never contact a live bridge
- 4.2 WHEN component tests run THE SYSTEM SHALL render from the console fixtures module rather than live data
- 4.3 WHEN console lib modules are imported THE SYSTEM SHALL remain free of imports from the server and components trees
