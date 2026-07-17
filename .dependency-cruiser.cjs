module.exports = {
  forbidden: [
    // EDIT-ME: sdd-derived rules (begin)
    {
      name: "sdd-drill-runway-check-src-components-drill-runway-check-is-exclusively-this-features",
      comment: "sdd-derived from kiro design commitment \"src/components/drill-runway-check/ is exclusively this feature's\": sibling component folders must not depend on drill internals; the sanctioned src/app/layout.tsx mount lives outside src/components and is unaffected.",
      severity: "error",
      from: { path: "^src/components/(?!drill-runway-check/)" },
      to: { path: "^src/components/drill-runway-check/" },
    },
    {
      name: "sdd-single-run-live-view-run-view-is-exclusively-this-features",
      comment: "sdd-derived from kiro design commitment: src/components/run-view/ is this feature's component tree; sibling component folders must not reach into it (pages/app routes are the sanctioned consumers and live outside src/components).",
      severity: "error",
      from: { path: "^src/components/(?!run-view/)" },
      to: { path: "^src/components/run-view/" },
    },
    {
      name: "sdd-single-run-live-view-ui-primitives-stay-domain-free",
      comment: "sdd-derived from kiro design commitment: src/components/ui/ is the shared shadcn primitives folder; primitives must not depend on the journal domain model.",
      severity: "error",
      from: { path: "^src/components/ui/" },
      to: { path: "^src/lib/journal/" },
    },
    {
      name: "sdd-drill-wave-a-cert-drill-independence",
      comment: "sdd-derived from kiro design commitment \"Drill independence\": `src/components/drill-wave-a-cert` MUST NOT import `src/components/drill-runway-check` — the two drill markers stay fully independent throwaways.",
      severity: "error",
      from: { path: "^src/components/drill-wave-a-cert" },
      to: { path: "^src/components/drill-runway-check" },
    },
    {
      name: "sdd-drill-wave-a-cert-no-ui-primitives",
      comment: "sdd-derived from kiro design commitment \"No ui primitives\": `src/components/drill-wave-a-cert` MUST NOT import `src/components/ui` — plain HTML markup only, no shadcn primitives.",
      severity: "error",
      from: { path: "^src/components/drill-wave-a-cert" },
      to: { path: "^src/components/ui" },
    },
    {
      name: "sdd-drill-wave-a-cert-no-feature-coupling",
      comment: "sdd-derived from kiro design commitment \"No feature coupling\": `src/components/drill-wave-a-cert` MUST NOT import `src/components/run-view` — the drill never touches real feature code.",
      severity: "error",
      from: { path: "^src/components/drill-wave-a-cert" },
      to: { path: "^src/components/run-view" },
    },
    {
      name: "sdd-console-state-panel-console-lib-purity",
      comment: "sdd-derived from kiro design commitment \"console lib purity\": `src/lib/console` MUST NOT import `src/server`",
      severity: "error",
      from: { path: "^src/lib/console" },
      to: { path: "^src/server" },
    },
    {
      name: "sdd-console-state-panel-console-lib-no-ui",
      comment: "sdd-derived from kiro design commitment \"console lib no ui\": `src/lib/console` MUST NOT import `src/components`",
      severity: "error",
      from: { path: "^src/lib/console" },
      to: { path: "^src/components" },
    },
    {
      name: "sdd-console-state-panel-panel-no-server-runtime",
      comment: "sdd-derived from kiro design commitment \"panel no server runtime\": `src/components/console-panel` MUST NOT import `src/server/console`",
      severity: "error",
      from: { path: "^src/components/console-panel" },
      to: { path: "^src/server/console" },
    },
    // EDIT-ME: sdd-derived rules (end)
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    exclude: { path: "\\.(test|spec)\\.(ts|tsx)$" },
  },
};
