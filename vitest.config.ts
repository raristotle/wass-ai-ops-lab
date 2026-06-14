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
