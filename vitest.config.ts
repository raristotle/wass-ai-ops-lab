import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@/lib": path.resolve(__dirname, "./lib"),
      "@/data": path.resolve(__dirname, "./data"),
      "@/features": path.resolve(__dirname, "./features"),
      "@/components": path.resolve(__dirname, "./components"),
    },
  },
});
