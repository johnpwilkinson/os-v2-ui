module.exports = {
  forbidden: [
    // EDIT-ME: sdd-derived rules (begin)
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
    // EDIT-ME: sdd-derived rules (end)
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    exclude: { path: "\\.(test|spec)\\.(ts|tsx)$" },
  },
};
