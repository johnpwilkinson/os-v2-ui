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
      severity: "warn",
      from: { path: "^src/components/(?!run-view/)" },
      to: { path: "^src/components/run-view/" },
    },
    {
      name: "sdd-single-run-live-view-ui-primitives-stay-domain-free",
      comment: "sdd-derived from kiro design commitment: src/components/ui/ is the shared shadcn primitives folder; primitives must not depend on the journal domain model.",
      severity: "warn",
      from: { path: "^src/components/ui/" },
      to: { path: "^src/lib/journal/" },
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
