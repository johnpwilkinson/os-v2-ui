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
    // EDIT-ME: sdd-derived rules (end)
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    exclude: { path: "\\.(test|spec)\\.(ts|tsx)$" },
  },
};
