# dev-engine PR surface — single-run-live-view

## Commits

b12db9c feat(single-run-live-view): task 5.1 complete — checkbox reconciled to verified tree [dev-engine]
7b9a43a chore(single-run-live-view): promote sdd-* boundary rules warn->error [dev-engine]
5f971fa docs(single-run-live-view): plans status [dev-engine]
41e7f9d fix(single-run-live-view): resolverepourl-has-no-test-coverage-anyw [dev-engine]
23122da fix(single-run-live-view): finished-run-nowline-fabricates-now-as-l [dev-engine]
b08c5ce fix(single-run-live-view): live-run-never-adopts-finished-state-fro [dev-engine]
8442046 docs(single-run-live-view): improve plans round 1 [improve-turbo]
bb2f8d7 fix(validate): address 2 findings [dev-engine]
bafa580 fix(validate): address 3 findings [dev-engine]
df47bed docs(single-run-live-view): task note [dev-engine]
e939300 docs(single-run-live-view): task note [dev-engine]
18af5ae feat(single-run-live-view): Author the component tests  src/components/run-view/gate-banner.test.tsx
45d360e feat(single-run-live-view): Implement  src/components/run-view/trpc.ts  and  src/components/run-view
7a49d16 feat(single-run-live-view): Implement  src/server/api.ts  and  src/app/api/trpc/[trpc]/route.ts :  a
93268b5 feat(single-run-live-view): Author  src/server/runs.test.ts  building temp fixture directories (e.g.
73cd7f3 feat(single-run-live-view): Implement  src/server/journal-tail.ts : export  tailJournal(runId: strin
8180747 feat(single-run-live-view): Implement  src/server/runs.ts  (server-only module):  artifactsRoot()  r
25d167c merge lane/single-run-live-view/4.2 [dev-engine]
c7e01d1 merge lane/single-run-live-view/1.4 [dev-engine]
1b7cdfb feat(single-run-live-view): Implement  src/components/run-view/stage-tree.tsx  and  src/components/r
d7cabbc feat(single-run-live-view): Author  src/lib/journal/stages.test.ts  and  src/lib/journal/derive.test
244ccfa feat(single-run-live-view): Implement  src/lib/journal/stages.ts  and  src/lib/journal/derive.ts :
f2e20cc merge lane/single-run-live-view/4.3 [dev-engine]
6246c7b feat(single-run-live-view): Implement  src/components/run-view/run-picker.tsx : a client component
fdb768a merge lane/single-run-live-view/4.1 [dev-engine]
6bec777 merge lane/single-run-live-view/1.3 [dev-engine]
f92a856 feat(single-run-live-view): Implement the props-only status components  src/components/run-view/gate
887a5b2 feat(single-run-live-view): Author  src/lib/journal/parse.test.ts  using the fixtures module: classi
3150e56 feat(single-run-live-view): Implement  src/lib/journal/types.ts ,  src/lib/journal/parse.ts , and  s

## Tasks

- checked: 14
- unchecked: 0

## Plans

| slug | status |
|------|--------|
| gatebanner-s-feature-prop-is-required-bu | residual |
| two-independent-30s-now-tickers-do-the-s | residual |
| failed-leg-s-error-message-text-is-never | residual |
| root-home-page-s-newest-run-empty-state | residual |
| live-run-never-adopts-finished-state-fro | fixed(b08c5ce) |
| finished-run-nowline-fabricates-now-as-l | fixed(23122da) |
| live-run-subscription-path-has-zero-test | skipped(verdict/executor) |
| resolverepourl-has-no-test-coverage-anyw | fixed(41e7f9d) |
| status-dot-classes-duplicated-verbatim-a | deferred |
| fs-helper-functions-duplicated-between-r | deferred |
| gatebanner-s-feature-prop-is-declared-bu | deferred |
| approuter-s-runs-get-merge-logic-is-unte | deferred |
| malformed-lasteventid-silently-drops-all | deferred |
| partial-trailing-line-buffering-is-docum | deferred |
| halted-banner-s-gate-error-detail-text-b | deferred |
| evt-battery-leg-start-row-branches-in-jo | deferred |

### Deferred pick-list

- status-dot-classes-duplicated-verbatim-a
- fs-helper-functions-duplicated-between-r
- gatebanner-s-feature-prop-is-declared-bu
- approuter-s-runs-get-merge-logic-is-unte
- malformed-lasteventid-silently-drops-all
- partial-trailing-line-buffering-is-docum
- halted-banner-s-gate-error-detail-text-b
- evt-battery-leg-start-row-branches-in-jo

## Residual findings

- [MED] STATUS_DOT_CLASSES duplicated verbatim across two files (src/components/run-view/journal-feed.tsx:15)
- [MED] fs helper functions duplicated between runs.ts and journal-tail.ts (src/server/journal-tail.ts:50)
- [MED] GateBanner's `feature` prop is declared but never read (src/components/run-view/gate-banner.tsx:9)
- [MED] appRouter's runs.get merge logic is untested (src/server/api.ts:16)
- [MED] Malformed lastEventId silently drops all replay lines, untested (src/server/journal-tail.ts:78)
- [MED] Partial trailing-line buffering is documented but never tested (src/server/journal-tail.test.ts:216)
- [MED] HALTED banner's gate/error detail text branch is untested (src/components/run-view/gate-banner.test.tsx:21)
- [MED] evt/battery/leg-start row branches in JournalFeed are untested (src/components/run-view/journal-feed.test.tsx:1)

## Gate receipts

- gate: green

## Tokens

- zero point: 0
- impl: 319375
- validate: 236169
- improve: 308141
- fix: 343247
- gate: 0
