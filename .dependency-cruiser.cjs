module.exports = {
  forbidden: [
    // EDIT-ME: sdd-derived rules (begin)
    {
      name: "sdd-drill-runway-check-src-components-drill-runway-check-is-exclusively-this-features",
      comment: "sdd-derived from kiro design commitment \"`src/components/drill-runway-check/` is exclusively this feature's\": Nothing unrelated gets added there, and this feature adds nothing outside it except the single sanctioned `src/app/layout.tsx` mount line.",
      severity: "warn",
      from: {
        path: "^src/app/layout\\.tsx"
      },
      to: {
        path: ""
      }
    },
    {
      name: "sdd-drill-runway-check-src-components-ui-is-a-shared-shadcn-primitives-folder-not-drill-owned",
      comment: "sdd-derived from kiro design commitment \"`src/components/ui/` is a shared shadcn primitives folder, not drill-owned\": This feature adds NO primitives there and imports none of them \u2014 plain HTML markup only.",
      severity: "warn",
      from: {
        path: ""
      },
      to: {
        path: ""
      }
    },
    {
      name: "sdd-drill-runway-check-declared-deps",
      comment: "sdd-derived from kiro design commitment \"Declared deps\": none \u2014 uses only `react` (already a dependency) and existing Tailwind utility classes; no new npm package is added.",
      severity: "warn",
      from: {
        path: ""
      },
      to: {
        path: ""
      }
    },
    {
      name: "sdd-drill-runway-check-the-root-layout-is-shared-project-property",
      comment: "sdd-derived from kiro design commitment \"The root layout is shared project property\": The `layout.tsx` touch is one import line and one mount line; fonts, metadata, html/body classes stay byte-identical.",
      severity: "warn",
      from: {
        path: ""
      },
      to: {
        path: ""
      }
    },
    {
      name: "sdd-drill-runway-check-throwaway-grade",
      comment: "sdd-derived from kiro design commitment \"Throwaway grade\": This is a runway drill. A future cleanup feature may remove it wholesale; nothing may grow to depend on it.",
      severity: "warn",
      from: {
        path: ""
      },
      to: {
        path: ""
      }
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
