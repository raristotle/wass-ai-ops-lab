import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    // Node by default (pure libs); component tests (*.test.tsx) run under jsdom.
    environment: "node",
    environmentMatchGlobs: [["**/*.test.tsx", "jsdom"]],
    include: ["lib/**/*.test.ts", "features/**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      // Scope: the MERIDIAN PRODUCT FINDER (the product-recommender app) — its
      // libraries + its own components. This repo also contains a separate,
      // unrouted "AI ops lab" demo (lib/risk, win-loss, pricing-insights, autobom,
      // store, schemas, utils + the features/ folders listed below) that the
      // product finder imports nothing from; it is excluded so the coverage number
      // reflects the shipped app, not the legacy demo.
      include: ["lib/**", "features/**"],
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.d.ts",
        "features/**/types.ts",
        "lib/**/types.ts",
        // ── separate AI-ops-lab demo (not the product recommender) ──
        "lib/risk/**",
        "lib/win-loss.ts",
        "lib/pricing-insights.ts",
        "lib/autobom.ts",
        "lib/store.ts",
        "lib/schemas.ts",
        "lib/utils.ts",
        "lib/parsers/autobom-parser.ts",
        "features/dashboard/**",
        "features/governance/**",
        "features/incidents/**",
        "features/pipelines/**",
        "features/shell/**",
        "features/dc-control-tower/**",
        "features/eproc-risk/**",
        "features/imt-risk/**",
        "features/project-orchestrator/**",
        "features/sales-nba/**",
        "features/win-loss-workbench/**",
        "features/autobom-assistant/**",
      ],
      reporter: ["text-summary", "json-summary", "json"],
      reportsDirectory: "./coverage",
    },
  },
  // Use React's automatic JSX runtime (matches the Next build) so component
  // tests don't need React in scope.
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  resolve: {
    alias: {
      "@/lib": path.resolve(__dirname, "./lib"),
      "@/data": path.resolve(__dirname, "./data"),
      "@/features": path.resolve(__dirname, "./features"),
      "@/components": path.resolve(__dirname, "./components"),
    },
  },
});
