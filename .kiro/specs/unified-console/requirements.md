# Unified Console — Requirements

## Introduction

Fuse the focal run view and the ambient CRT console into one surface at /console: a filmstrip of every run with status bus filters, a dominant program monitor carrying the live journal machinery, running timers derived without bridge changes, and graceful degradation when either data source fails. Consumes the merged console-multi-run parse layer (ConsoleRun/parseRuns) as-is.

### Requirement 1: Route unification and selection

**User Story:** As the operator, I want one console URL surface for every run, so that deep links and the ambient board never diverge.

#### Acceptance Criteria

- 1.1 WHEN /console is requested without a run segment THE SYSTEM SHALL render the deck with the newest run from the runs list taken as program
- 1.2 WHEN /console/<runId> is requested THE SYSTEM SHALL render the deck with that run taken as program
- 1.3 WHEN /run/<runId> is requested THE SYSTEM SHALL redirect to /console/<runId>
- 1.4 WHEN the root path / is requested THE SYSTEM SHALL redirect to /console
- 1.5 IF the runs list is empty THE SYSTEM SHALL render an empty state naming CHAMBER_ARTIFACTS_DIR in place of the program monitor
- 1.6 WHEN a tile is taken as program THE SYSTEM SHALL push /console/<runId> so the selection is deep-linkable

### Requirement 2: Run list status extension

**User Story:** As the deck, I want each run list entry to carry its summary-derived status, so that tiles and filters classify runs without extra round trips.

#### Acceptance Criteria

- 2.1 WHEN runner-summary.json exists for a run THE SYSTEM SHALL include normalized gate, haltKind, outputTokens, and llmHops on that runs list entry
- 2.2 IF runner-summary.json is absent THE SYSTEM SHALL mark the entry unfinished with status live and no summary fields
- 2.3 IF runner-summary.json is unreadable or malformed JSON THE SYSTEM SHALL keep the entry with finished true and the summary fields undefined instead of throwing
- 2.4 WHEN deriving entry status THE SYSTEM SHALL yield halted for finished entries with non-null haltKind and passed for every other finished entry

### Requirement 3: Ambient strip

**User Story:** As the operator, I want the directive, pending decisions, and fleet state always visible above the run surfaces, so that the console stays glanceable from across the room.

#### Acceptance Criteria

- 3.1 WHEN console state is available THE SYSTEM SHALL render the optimalNext directive in the ambient strip
- 3.2 WHEN pending decisions exist THE SYSTEM SHALL render each as a compact intercom line with kind, title, and a TTL countdown ticking every second
- 3.3 IF no pending decisions exist THE SYSTEM SHALL render a dimmed NO PENDING DECISIONS line
- 3.4 WHEN console state is available THE SYSTEM SHALL render a fleet summary with watched count, driver count, and watch queue depth
- 3.5 IF the console state query errors or returns not-ok THE SYSTEM SHALL render a LINK DOWN banner with the error message while run selection and the program monitor keep working

### Requirement 4: Bus filters

**User Story:** As the operator, I want status filters that dim rather than remove, so that tile positions stay stable spatial anchors.

#### Acceptance Criteria

- 4.1 WHEN the deck renders THE SYSTEM SHALL render LIVE, HALTED, PASSED, and ALL bus buttons each showing its bucket count
- 4.2 WHEN a status bucket is toggled off THE SYSTEM SHALL dim that bucket's tiles without unmounting them so tile positions stay stable
- 4.3 WHEN ALL is pressed THE SYSTEM SHALL re-enable every bucket
- 4.4 WHILE a tile is dimmed by the bus filter THE SYSTEM SHALL keep it mounted and selectable

### Requirement 5: Filmstrip tiles

**User Story:** As the operator, I want every run visible as a live-feeling tile, so that concurrent builds are readable at a glance.

#### Acceptance Criteria

- 5.1 WHEN runs exist THE SYSTEM SHALL render one tile per run newest-first with a status LED, the runId, relative age, and per-status treatment of live glow, halted red, and passed dimmed
- 5.2 WHEN a run is finished THE SYSTEM SHALL show a frozen elapsed clock of journal mtime minus the runId-encoded start plus output tokens when known
- 5.3 WHILE a run is live THE SYSTEM SHALL tick its tile clock every second from the runId-encoded start
- 5.4 WHEN a live tile's runId matches a ConsoleRun entry THE SYSTEM SHALL show that entry's repo alias and phase on the tile
- 5.5 WHEN a tile is the program run THE SYSTEM SHALL render it with the selected treatment
- 5.6 IF a runId does not parse as a timestamp THE SYSTEM SHALL omit that tile's clock

### Requirement 6: Program monitor

**User Story:** As the operator, I want the selected run's full live detail dominant on screen, so that leaning in never requires leaving the console.

#### Acceptance Criteria

- 6.1 WHEN a run is program THE SYSTEM SHALL load its snapshot and render the header with runId, a status line, and a repo link when resolvable
- 6.2 WHILE the program run is unfinished THE SYSTEM SHALL subscribe to the journal tail and append only unseen line indices
- 6.3 WHEN the tail reports finished THE SYSTEM SHALL refetch the snapshot once and adopt its summary
- 6.4 WHEN a summary exists THE SYSTEM SHALL render the meter row from the summary exec count, llm hops, and output tokens
- 6.5 WHILE unfinished THE SYSTEM SHALL derive output tokens and llm hops from journal lines for the meter row and show the exec count as an em dash
- 6.6 WHEN the summary gate starts with MERGED THE SYSTEM SHALL render the emerald MERGED treatment with the feature name taken from after the gate value's colon
- 6.7 IF the summary haltKind is non-null THE SYSTEM SHALL render the red HALTED treatment carrying haltKind and the gate or error detail
- 6.8 WHILE unfinished within the stall window THE SYSTEM SHALL render the pulsing LIVE treatment and IF the stall window is exceeded THE SYSTEM SHALL render an amber STALLED marker
- 6.9 IF the program runId has no run directory THE SYSTEM SHALL render a no-run-found state while the filmstrip and ambient strip stay rendered

### Requirement 7: Clocks and stage timers

**User Story:** As the operator, I want running timers on the run and on every stage, so that duration anomalies are visible without reading the journal.

#### Acceptance Criteria

- 7.1 WHEN a runId matches the YYYYMMDDTHHMMSSmmm shape THE SYSTEM SHALL parse it as a local-time epoch start and return null otherwise
- 7.2 WHILE the program run is live THE SYSTEM SHALL tick the total run clock as now minus start every second in the stages panel header
- 7.3 WHEN the program run is finished THE SYSTEM SHALL freeze the total clock at journal mtime minus start
- 7.4 WHEN all of a stage's legs are done or failed THE SYSTEM SHALL show that stage's duration as the sum of its legs' ms values
- 7.5 WHILE a stage owns the most recently opened running leg THE SYSTEM SHALL tick that stage as its completed-legs sum plus the total elapsed minus all completed leg ms across all stages
- 7.6 IF a completed leg carries no ms value THE SYSTEM SHALL count that leg as zero rather than producing NaN

### Requirement 8: Journal pane

**User Story:** As the operator, I want the full journal history scrollable with the tail still live, so that reviewing the past never means losing the present.

#### Acceptance Criteria

- 8.1 WHEN the program run renders THE SYSTEM SHALL show the full journal history in a virtualized pane pinned to the tail by default
- 8.2 WHILE pinned THE SYSTEM SHALL auto-scroll to each appended line and show a pinned indicator with the total line count
- 8.3 WHEN the user scrolls up past the stick threshold THE SYSTEM SHALL unpin and show the reviewing-history indicator
- 8.4 WHILE unpinned THE SYSTEM SHALL accumulate arriving lines into a new-lines count pill instead of scrolling
- 8.5 WHEN the pill is clicked or the pane is scrolled back to the bottom THE SYSTEM SHALL repin, clear the pill, and jump to the tail

### Requirement 9: Keyboard bindings

**User Story:** As the operator, I want to drive the console from the keyboard, so that switching runs and filters never needs the mouse.

#### Acceptance Criteria

- 9.1 WHEN j or k is pressed THE SYSTEM SHALL move the walk highlight to the next or previous tile in filmstrip order
- 9.2 WHEN Enter is pressed with a walk highlight active THE SYSTEM SHALL take the highlighted run as program
- 9.3 WHEN the 1 or 2 or 3 or 4 key is pressed THE SYSTEM SHALL toggle LIVE or HALTED or PASSED or re-enable ALL respectively
- 9.4 WHILE focus is inside an editable element THE SYSTEM SHALL ignore the deck key bindings

### Requirement 10: CRT skin and consolidation

**User Story:** As the operator, I want the deck to keep the console's CRT identity and fully replace the old surfaces, so that no zombie UI survives.

#### Acceptance Criteria

- 10.1 WHEN the deck renders THE SYSTEM SHALL apply the CRT treatment of near-black background, mono glow text, the fixed scanline overlay, and corner crosshairs
- 10.2 WHEN the feature is complete THE SYSTEM SHALL contain no source imports of the run-view or console-panel component directories and both directories SHALL be deleted

### Requirement 11: Test coverage

**User Story:** As the validate gate, I want every behavior pinned by a tagged test, so that requirement verification is mechanical.

#### Acceptance Criteria

- 11.1 WHEN the run-clock tests run THE SYSTEM SHALL cover runId parse success and failure, clock formatting, per-stage sums, missing ms as zero, and remainder attribution to the most recent running leg's stage
- 11.2 WHEN the runs list tests run THE SYSTEM SHALL cover summary fields present, absent, and malformed plus status derivation for live, halted, and passed
- 11.3 WHEN the ambient strip tests run THE SYSTEM SHALL cover the optimalNext directive, intercom countdown ticking, empty decisions, fleet summary, and the link-down banner
- 11.4 WHEN the bus filter tests run THE SYSTEM SHALL cover bucket counts, toggle callbacks, and the ALL re-enable
- 11.5 WHEN the tile and filmstrip tests run THE SYSTEM SHALL cover status treatments, frozen and ticking clocks, unparseable runId clock omission, alias and phase enrichment, selected treatment, and dim-without-unmount
- 11.6 WHEN the stage panel tests run THE SYSTEM SHALL cover the header clock live and frozen states plus per-stage static and ticking values
- 11.7 WHEN the journal pane tests run THE SYSTEM SHALL cover default pin, unpin on scroll-up, pill accumulation while unpinned, and repin via pill click and via scroll-to-bottom
- 11.8 WHEN the program monitor tests run THE SYSTEM SHALL cover the merged, halted, live, stalled, and no-run states plus live versus summary meter derivation
- 11.9 WHEN the route tests run THE SYSTEM SHALL cover the newest-run default, segment selection, the empty state, and both redirects
- 11.10 WHEN the deck shell tests run THE SYSTEM SHALL cover keyboard walk, take, filter keys, and the editable-element guard
