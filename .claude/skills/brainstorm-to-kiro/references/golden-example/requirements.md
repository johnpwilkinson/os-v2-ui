# Footer Locale Badge — Requirements

## Requirement 1: Locale Value Resolution and Display

**User Story:** As a site visitor, I want to see the browser's detected locale in the footer, so that I can quickly confirm which language/region the app believes I'm using.

Acceptance Criteria:
- 1.1 WHEN the `FooterLocaleBadge` component renders THE SYSTEM SHALL read the value of `navigator.language`.
- 1.2 WHEN `navigator.language` holds a truthy value THE SYSTEM SHALL render that value, converted with `.toLowerCase()`, as the badge's text content (e.g. `en-US` renders as `en-us`).
- 1.3 IF `navigator.language` is falsy or undefined THE SYSTEM SHALL render the literal string `unknown`, passed through the same `.toLowerCase()` code path, as the badge's text content.
- 1.4 WHEN the badge renders its text content THE SYSTEM SHALL NOT prepend any label or prefix (e.g. it SHALL render `en-us`, not `locale: en-us`).
- 1.5 WHEN the `FooterLocaleBadge` component is defined THE SYSTEM SHALL accept no props and hold no internal state.

## Requirement 2: Static, Non-Reactive Read

**User Story:** As a maintainer, I want the locale badge to read its value once and never update afterward, so that its behavior stays simple and predictable regardless of runtime locale changes.

Acceptance Criteria:
- 2.1 WHEN the `FooterLocaleBadge` component mounts THE SYSTEM SHALL read `navigator.language` exactly once during render/mount.
- 2.2 WHILE the component remains mounted THE SYSTEM SHALL NOT attach a `languagechange` event listener.
- 2.3 WHILE the component remains mounted THE SYSTEM SHALL NOT update its rendered text after the initial render, even if the browser's locale changes.

## Requirement 3: Visual Styling Consistency

**User Story:** As a user, I want the locale badge to look like the other footer badges, so that the footer reads as one coherent set of indicators.

Acceptance Criteria:
- 3.1 WHEN the `FooterLocaleBadge` renders its text-carrying element THE SYSTEM SHALL apply the classes `rounded-full border border-[var(--border)] bg-[var(--code-bg)] px-2 py-0.5 text-xs text-[var(--text)]`, identical to the other footer badges.
- 3.2 WHEN the `FooterLocaleBadge` renders THE SYSTEM SHALL NOT introduce any new CSS custom properties or a visually distinct treatment from the existing footer badges.
- 3.3 WHEN the `FooterLocaleBadge` renders its outer wrapper THE SYSTEM SHALL NOT set an explicit `z-index`, matching the other footer badges.
- 3.4 WHEN the page is printed THE SYSTEM SHALL hide the `FooterLocaleBadge` via a `print:hidden` class on its outer wrapper.

## Requirement 4: Accessibility and Non-Interactivity

**User Story:** As a user relying on assistive technology, I want the locale badge to be plain, discoverable text with no interactive behavior, so that it doesn't confuse screen readers or invite unintended interaction.

Acceptance Criteria:
- 4.1 WHEN the `FooterLocaleBadge` renders its text content THE SYSTEM SHALL expose it as a plain, visible text node with no `aria-hidden` attribute anywhere in the component.
- 4.2 WHEN the `FooterLocaleBadge` renders THE SYSTEM SHALL NOT include any interactive elements or handlers (no `<a>`, no `<button>`, no `onClick`, no tooltip beyond the static `title` attribute).
- 4.3 WHEN the `FooterLocaleBadge` renders its text-carrying `<span>` THE SYSTEM SHALL set a static `title="browser locale"` attribute (a fixed string, not derived from the locale value).

## Requirement 5: Always-Rendered, No Configuration Surface

**User Story:** As a maintainer, I want the locale badge to always render with no configuration knobs, so that there is no hidden state or environment gating to reason about.

Acceptance Criteria:
- 5.1 WHEN the application runs in any build or environment THE SYSTEM SHALL render the `FooterLocaleBadge` markup unconditionally, with no environment or feature-flag gating.
- 5.2 WHEN the `FooterLocaleBadge` component is defined THE SYSTEM SHALL expose no props, and THE SYSTEM SHALL NOT introduce any new settings, context, or store entry to configure it.

## Requirement 6: Component Ownership and Dependency Boundaries

**User Story:** As a maintainer, I want the new badge's code and dependencies tightly scoped, so that the feature doesn't leak into unrelated files or introduce build-time complexity.

Acceptance Criteria:
- 6.1 WHERE new files are added for this feature THE SYSTEM SHALL place them exclusively under `src/components/footer-locale-badge/` (`footer-locale-badge.tsx` and `footer-locale-badge.test.tsx`).
- 6.2 WHEN implementing the `FooterLocaleBadge` THE SYSTEM SHALL use only `react` (already a dependency), the browser's built-in `navigator.language`, and existing Tailwind utility classes, and THE SYSTEM SHALL NOT add any new npm package.
- 6.3 WHEN implementing this feature THE SYSTEM SHALL NOT add a `vite.config.ts` `define` entry and THE SYSTEM SHALL NOT add a new ambient type declaration to `src/vite-env.d.ts`, since `navigator.language` is already covered by TypeScript's built-in DOM lib types.
- 6.4 WHEN implementing this feature THE SYSTEM SHALL leave `src/index.css`, `tailwind.config.ts`, and `src/components/footer-version-badge/` untouched.

## Requirement 7: Footer Layout Repositioning

**User Story:** As a user, I want all four footer badges to remain distinct and non-overlapping after the new badge is added, so that each indicator stays legible.

Acceptance Criteria:
- 7.1 WHEN the `FooterLocaleBadge` renders its outer wrapper THE SYSTEM SHALL position it at `fixed right-20 bottom-3`.
- 7.2 WHEN `FooterEnvModeBadge` renders its outer wrapper THE SYSTEM SHALL position it at `right-36` (moved from `right-20`), with no other styling, text, or behavior change.
- 7.3 WHEN `FooterCommitBadge` renders its outer wrapper THE SYSTEM SHALL position it at `right-56` (moved from `right-44`), with no other styling, text, or behavior change.
- 7.4 WHEN this feature is implemented THE SYSTEM SHALL leave `FooterVersionBadge`'s markup and `right-3` offset unchanged.
- 7.5 WHEN all four footer badges are rendered together THE SYSTEM SHALL order them, closest-to-edge first, as: version (`right-3`) → locale (`right-20`) → env-mode (`right-36`) → commit (`right-56`).
- 7.6 WHERE the offset of `footer-env-mode-badge.tsx` is edited THE SYSTEM SHALL limit that edit strictly to the `right-20` → `right-36` class change.
- 7.7 WHERE the offset of `footer-commit-badge.tsx` is edited THE SYSTEM SHALL limit that edit strictly to the `right-44` → `right-56` class change.

## Requirement 8: Single Mount Point Integration

**User Story:** As a maintainer, I want the locale badge mounted from exactly one place, so that there is a single source of truth for where it appears in the app tree.

Acceptance Criteria:
- 8.1 WHEN `src/App.tsx` renders the footer badges THE SYSTEM SHALL mount `<FooterLocaleBadge />` exactly once, immediately before the `<FooterEnvModeBadge />` mount and after `<FooterVersionBadge />`.
- 8.2 WHEN this feature is implemented THE SYSTEM SHALL NOT mount `FooterLocaleBadge` from any file other than `src/App.tsx`.
- 8.3 WHEN `src/App.tsx` is edited to integrate this feature THE SYSTEM SHALL limit the change to importing and mounting `FooterLocaleBadge`, with no other markup changes.

## Requirement 9: Test Coverage

**User Story:** As a maintainer, I want automated tests covering the badge's rendering, styling, and fallback behavior, so that regressions are caught without manual verification.

Acceptance Criteria:
- 9.1 WHEN `footer-locale-badge.test.tsx` is authored THE SYSTEM SHALL include a test that stubs a single active `navigator.language` value (e.g. `en-US`) and asserts the rendered text equals its lowercased form (e.g. `en-us`).
- 9.2 WHEN `footer-locale-badge.test.tsx` is authored THE SYSTEM SHALL include a test asserting the outer wrapper carries `fixed right-20 bottom-3` and `print:hidden`.
- 9.3 WHEN `footer-locale-badge.test.tsx` is authored THE SYSTEM SHALL include a test asserting the text-carrying element carries `title="browser locale"`.
- 9.4 WHEN `footer-locale-badge.test.tsx` is authored THE SYSTEM SHALL include a test asserting the pill styling classes (`rounded-full`, `border`, `bg-[var(--code-bg)]`, `text-xs`, `text-[var(--text)]`) are present.
- 9.5 WHEN `footer-locale-badge.test.tsx` is authored THE SYSTEM SHALL include a test asserting no explicit `z-index` is set.
- 9.6 WHEN `footer-locale-badge.test.tsx` is authored THE SYSTEM SHALL include a test asserting no interactive elements (`<a>`, `<button>`, `onClick`) are present.
- 9.7 WHEN `footer-locale-badge.test.tsx` is authored THE SYSTEM SHALL include a test asserting no `aria-hidden` attribute is present anywhere in the rendered output.
- 9.8 WHEN `footer-locale-badge.test.tsx` is authored THE SYSTEM SHALL include a test asserting the rendered `textContent` equals the resolved locale value exactly.
- 9.9 WHEN `footer-locale-badge.test.tsx` is authored THE SYSTEM SHALL include exactly one dedicated test that stubs `navigator.language` as `undefined` and asserts the badge renders the literal text `unknown`.
- 9.10 WHEN `footer-env-mode-badge.test.tsx` is updated THE SYSTEM SHALL change its existing `right-20` assertion to `right-36`, with no other change.
- 9.11 WHEN `footer-commit-badge.test.tsx` is updated THE SYSTEM SHALL change its existing `right-44` assertion to `right-56`, with no other change.
