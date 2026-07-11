import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

// Source lives at the repo root (lib/, features/, components/, data/) while the
// Next app is in apps/web. A single root config lets one `eslint .` lint it all.
const eslintConfig = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/*.config.{js,mjs,ts}",
      "**/next-env.d.ts",
      "prisma/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    settings: { next: { rootDir: "apps/web/" } },
    rules: {
      // Allow intentional `_`-prefixed discards (e.g. omitting a field via rest destructuring).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Standalone CommonJS Node tooling (e.g. scripts/ingest-xref/*.cjs) runs directly
    // under `node`, never through the Next/ESM app build. `require()` is the correct
    // module system there, so the ESM-only rule that forbids it does not apply.
    files: ["**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // Bundle-weight guard (docs/perf-audit-2026-07-10.md): client code must never
    // VALUE-import the packed datasets — one such import shipped an ~18 MB chunk on
    // every main route. Server code (apps/web/app/api, lib/server) is exempt below.
    // Type-only imports stay allowed (they erase at compile time).
    files: [
      "features/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "lib/product-finder-*.ts",
      "lib/store.ts",
      // Client pages/layouts too (the dashboard once imported the catalog barrel);
      // API routes live under apps/web/app/api and are deliberately NOT listed.
      "apps/web/app/product-finder/**/*.{ts,tsx}",
    ],
    // Tests run in Node and may exercise server modules directly — the guard is for
    // code that reaches the browser bundle.
    ignores: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/catalog/xref-index",
              message:
                "xref-index embeds the packed xref dataset (~18 MB in the client bundle). Client code calls the /api/crosses/* routes; UI meta lives in @/lib/catalog/xref-meta.",
              allowTypeImports: true,
            },
            {
              name: "@/lib/catalog/external-products",
              message: "external-products embeds the external catalogs — server-only. Fetch via an API route.",
              allowTypeImports: true,
            },
            {
              name: "@/lib/catalog/generate",
              message: "generate pulls the external catalogs — server-only (getCatalog lives behind the API).",
              allowTypeImports: true,
            },
            {
              name: "@/lib/catalog/index",
              message: "the catalog barrel builds the full generated catalog — server-only. Fetch via an API route.",
              allowTypeImports: true,
            },
            {
              name: "@/lib/integration/catalog-index",
              message:
                "the catalog-graph provider registry is server-only (its graph embeds the datasets). Client code fetches /api/catalog/source etc.",
              allowTypeImports: true,
            },
            {
              name: "@/lib/integration/cross-reference",
              message:
                "cross-reference builds over the full catalog — server-only. Client code fetches /api/products/competitor-refs.",
              allowTypeImports: true,
            },
            {
              name: "@/lib/catalog/equivalence",
              message:
                "equivalence imports the catalog barrel (functionalEquivalents scans it). Client code imports the pure comparators from @/lib/catalog/equivalence-core.",
              allowTypeImports: true,
            },
            {
              name: "@/lib/catalog/goeswith",
              message:
                "goeswith scans the catalog — server-only. Client code fetches /api/products/[id]/goeswith and injects into suggestCompletions.",
              allowTypeImports: true,
            },
          ],
          patterns: [
            {
              group: ["@/data/real/*"],
              message:
                "data/real/* are server datasets — never bundle them into client code. Fetch via an API route (see docs/perf-audit-2026-07-10.md).",
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
