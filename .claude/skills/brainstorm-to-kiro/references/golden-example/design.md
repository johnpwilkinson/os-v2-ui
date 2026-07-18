# Footer Locale Badge — Design

Source: [docs/brainstorming/footer-locale-badge-a-small-badge-in-the.md](../../../docs/brainstorming/footer-locale-badge-a-small-badge-in-the.md)

## Overview

A single, static component fixed to the bottom-right of the viewport,
immediately before (to the left of) the existing `FooterEnvModeBadge`,
showing the browser's locale (`navigator.language`, e.g. `en-US`) inside
the same pill/chip styling already used by the other footer badges. It
renders unconditionally, is non-interactive, is plain screen-reader-visible
text (no `aria-hidden`), and is hidden when printing. The value is read
once on mount (static, not reactive to the `languagechange` event) and is
explicitly lowercased in code (`.toLowerCase()`), per the brainstorm's Q1
and Q3 answers. No label prefix — just the raw locale value. If
`navigator.language` is missing/undefined, the component renders the
literal string `"unknown"` instead, per the brainstorm's Q2 answer. No
config, no settings, no animation, no new dependencies.

`navigator.language` is a standard runtime browser API already covered by
TypeScript's built-in DOM lib types; unlike the version and commit badges,
this feature needs no `vite.config.ts` `define` entry and no new ambient
type declaration.

One layout consequence: the brainstorm asks for this badge to sit
immediately before `FooterEnvModeBadge`, currently at `right-20` (with
`FooterVersionBadge` at `right-3` and `FooterCommitBadge` at `right-44`).
This feature takes over the `right-20` slot for itself (a short locale
code like `en-us` fits the same width budget the commit SHA previously
used at that position) and pushes both `FooterEnvModeBadge` and
`FooterCommitBadge` further left to keep all four badges non-overlapping:
`FooterEnvModeBadge` moves from `right-20` to `right-36` (mode text needs
room up to `development`/`production`, the same width budget it already
had), and `FooterCommitBadge` moves from `right-44` to `right-56` to
preserve a clear gap after it. `FooterVersionBadge` itself is untouched.
Resulting order, closest to the screen edge first: version (`right-3`) →
locale (`right-20`) → env-mode (`right-36`) → commit (`right-56`).

## File Structure

Legend: **Owns** = this feature is the sole, ongoing owner. **Touches** =
existing shared file, edited only to integrate or to make room, not owned.

| Path | Boundary | Purpose |
|---|---|---|
| `src/components/footer-locale-badge/footer-locale-badge.tsx` | Owns | The badge component: reads `navigator.language`, falls back to `"unknown"` if missing, lowercases the final value, renders the fixed pill markup. No props, no state. |
| `src/components/footer-locale-badge/footer-locale-badge.test.tsx` | Owns | Unit tests for render, text content, positioning, styling, and the `"unknown"` fallback path. |
| `src/components/footer-env-mode-badge/footer-env-mode-badge.tsx` | Touches | Offset changed from `right-20` to `right-36` to make room for the new badge. No other change. |
| `src/components/footer-env-mode-badge/footer-env-mode-badge.test.tsx` | Touches | Existing `right-20` assertion updated to `right-36`. No other change. |
| `src/components/footer-commit-badge/footer-commit-badge.tsx` | Touches | Offset changed from `right-44` to `right-56`. No other change. |
| `src/components/footer-commit-badge/footer-commit-badge.test.tsx` | Touches | Existing `right-44` assertion updated to `right-56`. No other change. |
| `src/App.tsx` | Touches | Mounts `<FooterLocaleBadge />` once, immediately before the `<FooterEnvModeBadge />` mount. No other markup changes. |

No other files are touched. `src/vite-env.d.ts`, `vite.config.ts`,
`src/index.css`, `tailwind.config.ts`, and
`src/components/footer-version-badge/` are all out of scope — this feature
adds no build-time plumbing and does not alter the version badge's markup
or offset.

## Boundary Commitments

Every row below is an import edge the rules deriver
(kiro-design-to-rules-turbo `deriveFromTo`) can compile into a depcruise
forbidden rule: its Detail cell states `<module> MUST NOT import <module>`
with both operands as `src/` paths. Constraints that are not import edges
(behavior, markup, file-edit scope) live in the prose subsection below the
table, not in it — a row the deriver cannot compile REFUSES the whole spec.

| Commitment | Detail |
|---|---|
| Standalone from version badge | `src/components/footer-locale-badge` MUST NOT import `src/components/footer-version-badge` — the locale badge renders independently; sibling badges never import each other. |
| Standalone from env-mode badge | `src/components/footer-locale-badge` MUST NOT import `src/components/footer-env-mode-badge` — the env-mode badge is touched only for its offset (see File Structure), never imported. |
| Standalone from commit badge | `src/components/footer-locale-badge` MUST NOT import `src/components/footer-commit-badge` — the commit badge is touched only for its offset (see File Structure), never imported. |
| Declared deps | none — uses only `react` (already a dependency), the browser's built-in `navigator.language`, and Tailwind utility classes; no new npm package is added. |

### Behavioral commitments (doctrine, not module boundaries)

These constrain the badge's behavior, markup, and file-edit scope rather than
import edges depcruise can enforce, so they are stated as prose, not as
derivable table rows:

- **`src/components/footer-locale-badge/` is exclusively this feature's** —
  this feature owns `src/components/footer-locale-badge/` and adds nothing
  outside it except the integration touches listed in File Structure
  (`src/App.tsx`, `src/components/footer-env-mode-badge/`,
  `src/components/footer-commit-badge/`). Nothing unrelated is added under it.
- **No build-time plumbing** — no edit to `vite.config.ts` or
  `src/vite-env.d.ts`: no `define` entry, no new ambient type declaration.
  `navigator.language` is already typed by TypeScript's built-in DOM lib.
- **One mount point** — mounted exactly once, from `src/App.tsx`, immediately
  before `<FooterEnvModeBadge />`. No other file mounts it.
- **Bounded layout touch** — the only allowed edit to
  `src/components/footer-env-mode-badge/` is the `right-20` → `right-36`
  offset (and its matching test assertion); the only allowed edit to
  `src/components/footer-commit-badge/` is the `right-44` → `right-56` offset
  (and its matching test assertion). No styling, text, or behavior change to
  either module beyond that.
- **Version badge untouched** — this feature does not edit
  `src/components/footer-version-badge/`; the version badge's markup and its
  `right-3` offset are out of scope (its import isolation is the first table
  row).
- **Reuses existing pill styling verbatim** — same classes as the other footer
  badges: `rounded-full border border-[var(--border)] bg-[var(--code-bg)] px-2 py-0.5 text-xs text-[var(--text)]`.
  No new CSS custom properties, no distinct visual treatment.
- **Raw text, explicitly lowercased** — renders `.toLowerCase()` of the resolved
  value (either `navigator.language` or the `"unknown"` fallback) with no label
  prefix (e.g. `en-us`, not `locale: en-us`).
- **Static read, not reactive** — `navigator.language` is read once during
  render/mount; no `languagechange` event listener, no state update after mount.
- **Fallback on missing value** — if `navigator.language` is falsy/undefined, the
  component renders the literal string `unknown` instead (still passed through
  `.toLowerCase()` for a single code path).
- **Static, non-interactive** — no `onClick`, no `<a>`/`<Link>`, no tooltip.
  Purely presentational markup.
- **No `aria-hidden`** — the locale text is a plain visible text node, reachable
  by screen readers like any other static text.
- **Always rendered** — no environment or feature-flag gating; the same markup
  renders in every build.
- **No config surface** — no props on `FooterLocaleBadge`, no new
  settings/context/store entry.
- **`title` attribute fixed** — the text-carrying `<span>` carries
  `title="browser locale"` (static string, not derived).
- **Test scope matches brainstorm** — unit tests cover render/text content
  against a single active `navigator.language` value (no multi-value locale
  mocking), plus exactly one dedicated test mocking `navigator.language` as
  undefined to cover the `"unknown"` fallback.

## Concrete Shape

**Component** (`src/components/footer-locale-badge/footer-locale-badge.tsx`):
```tsx
export function FooterLocaleBadge() {
  const locale = (navigator.language || 'unknown').toLowerCase()

  return (
    <div className="fixed right-20 bottom-3 print:hidden">
      <span
        title="browser locale"
        className="rounded-full border border-[var(--border)] bg-[var(--code-bg)] px-2 py-0.5 text-xs text-[var(--text)]"
      >
        {locale}
      </span>
    </div>
  )
}
```
- Offset: `right-20 bottom-3` — the new slot immediately before (left of)
  `FooterEnvModeBadge`'s relocated `right-36`, reusing the same `bottom-3`
  baseline as every other footer badge.
- Pill: identical classes to the other footer badges (`rounded-full`,
  `border`, `bg-[var(--code-bg)]`, `text-xs`, `text-[var(--text)]`) —
  visually identical apart from content, per the brainstorm's scope.
- `print:hidden` on the outer wrapper hides it when printing.
- No `z-index` set, matching the other footer badges.
- `title="browser locale"` on the `<span>` carrying the text.
- `navigator.language || 'unknown'` is the entire fallback: read once
  during render (no `useEffect`, no `languagechange` listener), single
  `.toLowerCase()` call covers both the real value and the fallback
  string.

**Offset adjustments**:
`src/components/footer-env-mode-badge/footer-env-mode-badge.tsx`:
```tsx
<div className="fixed right-36 bottom-3 print:hidden">
```
`src/components/footer-commit-badge/footer-commit-badge.tsx`:
```tsx
<div className="group relative fixed right-56 bottom-3 print:hidden">
```
Only the offset values change in each file; tooltip, mode text, SHA
display, and fallback handling are all untouched. The matching test
assertions (`toContain('right-20')` → `toContain('right-36')` in
`footer-env-mode-badge.test.tsx`, `toContain('right-44')` →
`toContain('right-56')` in `footer-commit-badge.test.tsx`) are updated to
match.

**Mount point** (`src/App.tsx`):
```tsx
import { FooterLocaleBadge } from './components/footer-locale-badge/footer-locale-badge'
// ...
<FooterVersionBadge />
<FooterLocaleBadge />
<FooterEnvModeBadge />
<FooterCommitBadge />
```
Added between the version and env-mode badge mounts, matching the visual
order closest-to-edge-first: version (`right-3`) → locale (`right-20`) →
env-mode (`right-36`) → commit (`right-56`).

**Tests** (`src/components/footer-locale-badge/footer-locale-badge.test.tsx`):
Mirrors `footer-env-mode-badge.test.tsx`'s structure, against a single
stubbed `navigator.language` value (no multi-value mocking), plus one
dedicated fallback test:
- Renders the lowercased locale value as plain text, with a stubbed
  `navigator.language` (e.g. `vi.stubGlobal` or
  `Object.defineProperty(navigator, 'language', ...)` set to `en-US`,
  asserting the rendered text is `en-us`).
- Wrapper is `fixed right-20 bottom-3` and `print:hidden`.
- Text carries `title="browser locale"`.
- Pill styling matches (`rounded-full`, `border`, `bg-[var(--code-bg)]`,
  `text-xs`, `text-[var(--text)]`), via the shared custom properties, no
  new tokens.
- No explicit `z-index`.
- No interactive elements (no `<a>`, `<button>`, `onClick`).
- No `aria-hidden` anywhere.
- Text is exposed as plain, discoverable text (`textContent` equals the
  resolved locale value).
- Dedicated fallback test: with `navigator.language` stubbed as
  `undefined`, the badge renders the literal text `unknown`.
