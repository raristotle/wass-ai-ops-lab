import { describe, it } from "vitest";
import * as fs from "fs";
import * as path from "path";

interface PageEntry {
  path: string;
  budget: number; // in kilobytes
}

// Define per-route First-Load-JS budgets (in kB)
// Based on current build measurement (2026-07-24) with 15% headroom applied
// These are the actual chunk sizes required for each route (excluding shared chunks)
const budgets: PageEntry[] = [
  {
    path: "/product-finder/page",
    budget: 963, // measured: 837 kB → 837 * 1.15 ≈ 963 kB
  },
  {
    path: "/product-finder/login/page",
    budget: 299, // measured: 260 kB → 260 * 1.15 ≈ 299 kB
  },
  {
    path: "/product-finder/quote/page",
    budget: 335, // measured: 291 kB → 291 * 1.15 ≈ 335 kB
  },
  {
    path: "/product-finder/customer/page",
    budget: 963, // measured: 837 kB → 837 * 1.15 ≈ 963 kB
  },
  {
    path: "/product-finder/dashboard/page",
    budget: 1395, // measured: 1213 kB → 1213 * 1.15 ≈ 1395 kB
  },
];

// Chunks that are shared across all routes and should be excluded from per-route budgets
const sharedChunks = new Set([
  "webpack-252f83a42f0da874.js",
  "87c73c54-09e1ba5c70e60a51.js",
  "18-17d6297770073c19.js",
  "main-app-5200804a59a86a08.js",
]);

describe("Performance budget (First-Load-JS)", () => {
  it("enforces per-route First-Load-JS budgets", async () => {
    const manifestPath = path.resolve(
      __dirname,
      "../apps/web/.next/app-build-manifest.json"
    );
    const chunksDir = path.resolve(__dirname, "../apps/web/.next/static/chunks");

    // Load manifest
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    // Get file sizes for all chunks
    const fileSizes: { [key: string]: number } = {};
    const chunkFiles = fs.readdirSync(chunksDir);

    for (const file of chunkFiles) {
      if (file.endsWith(".js")) {
        const filePath = path.join(chunksDir, file);
        try {
          fileSizes[file] = fs.statSync(filePath).size;
        } catch {
          // ignore files that can't be read
        }
      }
    }

    // Check each budget
    const failures: string[] = [];

    for (const budget of budgets) {
      const manifestEntry = manifest.pages[budget.path];

      if (!manifestEntry) {
        failures.push(
          `Missing manifest entry for ${budget.path}; available keys: ${Object.keys(manifest.pages)
            .filter((k) => k.includes("/product-finder"))
            .slice(0, 5)
            .join(", ")}`
        );
        continue;
      }

      // Sum up chunk sizes, excluding shared chunks
      let totalSize = 0;
      const chunks: string[] = [];

      for (const chunk of manifestEntry) {
        const filename = path.basename(chunk);

        if (sharedChunks.has(filename)) {
          // Exclude shared chunks
          continue;
        }

        const size = fileSizes[filename] || 0;
        totalSize += size;
        chunks.push(`${filename} (${Math.round(size / 1024)} kB)`);
      }

      const totalSizeKb = Math.round(totalSize / 1024);

      if (totalSizeKb > budget.budget) {
        failures.push(
          `${budget.path}: ${totalSizeKb} kB exceeds budget of ${budget.budget} kB` +
            (chunks.length > 0 ? `\n  Chunks: ${chunks.join(", ")}` : "")
        );
      }
    }

    if (failures.length > 0) {
      throw new Error(
        `Performance budget violations detected:\n  ${failures.join("\n  ")}`
      );
    }
  });
});
