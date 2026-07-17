# dev-engine PR surface — console-state-panel

## Commits

f5c49b7 chore(console-state-panel): promote sdd-* boundary rules warn->error [dev-engine]
753231c docs(console-state-panel): improve plans round 1 [improve-turbo]
ef9b2f0 feat(console-state-panel): Test src/app/console/page.test.tsx naming [req:2.1]: the module exports
d8c078d feat(console-state-panel): Create src/app/console/page.tsx exactly per design Concrete Shape: expor
0d39826 feat(console-state-panel): Tests src/components/console-panel/optimal-next.test.tsx, decision-row.t
957878e feat(console-state-panel): Create src/components/console-panel/trpc.ts (batch-link-only tRPC react
62ac8a8 feat(console-state-panel): Create src/components/console-panel/optimal-next.tsx (props directive: s
b123c10 feat(console-state-panel): Touch src/server/api.ts ONLY to add the console router per design Concre
bd9e5dc feat(console-state-panel): Tests src/server/console.test.ts naming [req:1.1] [req:1.2] [req:1.3] [r
f880cfc feat(console-state-panel): Create src/server/console.ts exactly per design Concrete Shape: bridgeUr
9a3ec93 feat(console-state-panel): Tests src/lib/console/parse.test.ts naming [req:1.4] [req:1.5] [req:4.3]
a18caa8 feat(console-state-panel): Create src/lib/console/types.ts (ConsoleDecision, ConsoleRepo, ConsoleEn

## Tasks

- checked: 10
- unchecked: 0

## Plans

| slug | status |
|------|--------|
| non-iso-ts-expiresat-renders-nan-nan-nan | residual |
| optimalnext-s-linkup-false-red-dot-branc | residual |
| decisionrow-s-null-repo-feature-runid-an | residual |
| engine-null-engine-panel-rendering-is-un | residual |
| live-panel-and-link-down-banner-render-s | deferred |
| linkup-prop-s-false-branch-is-unreachabl | deferred |
| console-state-trpc-procedure-has-zero-te | deferred |
| parseengine-s-non-object-and-watchqueued | deferred |

### Deferred pick-list

- live-panel-and-link-down-banner-render-s
- linkup-prop-s-false-branch-is-unreachabl
- console-state-trpc-procedure-has-zero-te
- parseengine-s-non-object-and-watchqueued

## Residual findings

- [MED] Live panel and LINK DOWN banner render simultaneously on stale error (src/components/console-panel/console-panel.tsx:36)
- [MED] linkUp prop's false branch is unreachable dead code (src/components/console-panel/optimal-next.tsx:6)
- [MED] console.state tRPC procedure has zero test coverage (src/server/api.ts:26)
- [MED] parseEngine's non-object-and-watchQueueDepth-coercion branches are untested (src/lib/console/parse.test.ts:7)

## Gate receipts

- gate: green

## Tokens

- zero point: 0
- impl: 95456
- validate: 106380
- improve: 144490
- gate: 144490
