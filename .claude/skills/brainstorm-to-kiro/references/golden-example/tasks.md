# Footer Locale Badge — Implementation Plan

## Tasks

- [ ] 1. Footer Locale Badge component
- [x] 1.1 Implement `FooterLocaleBadge` in `src/components/footer-locale-badge/footer-locale-badge.tsx`: a prop-less, state-less component that reads `navigator.language` once during render, falls back to the literal string `unknown` when it is falsy, lowercases the resolved value with a single `.toLowerCase()` call, and renders it with no label prefix inside a `<span title="browser locale" className="rounded-full border border-[var(--border)] bg-[var(--code-bg)] px-2 py-0.5 text-xs text-[var(--text)]">` wrapped in a `<div className="fixed right-20 bottom-3 print:hidden">` (no `z-index`, no `aria-hidden`, no interactive elements/handlers, no `useEffect`/`languagechange` listener, no new npm package, no `vite-env.d.ts` or `vite.config.ts` changes).
  _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.1, 5.2, 6.1, 6.2, 6.3, 6.4, 7.1_
  _Boundary: src/components/footer-locale-badge_

- [x] 1.2 Author `src/components/footer-locale-badge/footer-locale-badge.test.tsx` covering: rendered text equals the lowercased stubbed `navigator.language` value [req:9.1]; outer wrapper carries `fixed right-20 bottom-3` and `print:hidden` [req:9.2]; text-carrying element carries `title="browser locale"` [req:9.3]; pill styling classes (`rounded-full`, `border`, `bg-[var(--code-bg)]`, `text-xs`, `text-[var(--text)]`) are present [req:9.4]; no explicit `z-index` is set [req:9.5]; no interactive elements or handlers (`<a>`, `<button>`, `onClick`) are present [req:9.6]; no `aria-hidden` attribute is present anywhere in the rendered output [req:9.7]; rendered `textContent` equals the resolved locale value exactly [req:9.8]; and exactly one dedicated test stubbing `navigator.language` as `undefined` asserting the badge renders the literal text `unknown` [req:9.9]. All tests pass against the component from 1.1.
  _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 6.1_
  _Boundary: src/components/footer-locale-badge_
  _Depends: 1.1_

- [ ] 2. Reposition existing footer badges to make room
- [x] 2.1 (P) Change `src/components/footer-env-mode-badge/footer-env-mode-badge.tsx`'s outer wrapper offset from `right-20` to `right-36` (no other styling, text, or behavior change), and update the matching assertion in `src/components/footer-env-mode-badge/footer-env-mode-badge.test.tsx` from `right-20` to `right-36`, naming that updated test [req:9.10]. Confirm all other existing assertions in the file are untouched and pass.
  _Requirements: 7.2, 7.6, 9.10_
  _Boundary: src/components/footer-env-mode-badge_

- [x] 2.2 (P) Change `src/components/footer-commit-badge/footer-commit-badge.tsx`'s outer wrapper offset from `right-44` to `right-56` (no other styling, text, or behavior change), and update the matching assertion in `src/components/footer-commit-badge/footer-commit-badge.test.tsx` from `right-44` to `right-56`, naming that updated test [req:9.11]. Confirm all other existing assertions in the file are untouched and pass.
  _Requirements: 7.3, 7.7, 9.11_
  _Boundary: src/components/footer-commit-badge_

- [ ] 3. Mount the locale badge in the app tree
- [x] 3.1 Edit `src/App.tsx` to import `FooterLocaleBadge` from `./components/footer-locale-badge/footer-locale-badge` and mount `<FooterLocaleBadge />` exactly once, immediately after `<FooterVersionBadge />` and before `<FooterEnvModeBadge />`, with no other markup change (leaving `FooterVersionBadge`'s markup and offset untouched). Verify the full build passes and the resulting closest-to-edge-first order is version → locale → env-mode → commit.
  _Requirements: 7.4, 7.5, 8.1, 8.2, 8.3_
  _Boundary: src/App.tsx_
  _Depends: 1.1_
