/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *   FIRST-LOAD-JS BUDGET GUARD — this repo's performance ratchet
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ── WHAT A "FIRST-LOAD-JS BUDGET" IS ──────────────────────────────────────────
 * First-Load JS is every JavaScript file a browser must download before a route
 * becomes interactive. Next.js records that list, per route, in
 * `apps/web/.next/app-build-manifest.json`. This test sums the on-disk size of
 * those files for the main `/product-finder` routes and fails when a route
 * exceeds a fixed kB ceiling.
 *
 * It exists because one careless value-import once shipped an ~18 MB eager
 * dataset chunk to every main route and nothing caught it for weeks
 * (post-mortem: `docs/perf-audit-2026-07-10.md`). The ESLint import ban added by
 * that fix stops the *known* offenders by name; this budget catches the ones
 * nobody has thought of yet.
 *
 * ── HOW TO RUN IT ─────────────────────────────────────────────────────────────
 *     npm run verify:perf        # builds, then runs exactly this test
 *
 * It reads real build output, so it needs a real build. A plain `npm test` on a
 * checkout that has never been built will SKIP this guard (loudly) rather than
 * fail — see the skip path below. Nothing in this repo runs it automatically;
 * `npm run verify:perf` is the ritual, and it is on the human.
 *
 * ── THESE ARE RAW BYTES, NOT `next build` NUMBERS ─────────────────────────────
 * Sizes here are uncompressed bytes on disk. `next build` prints *gzipped*
 * sizes, which are roughly 3.5x smaller (2026-07-26: `/product-finder` totals
 * 1275 kB raw / 349 kB gzipped including shared chunks). Do not compare the two
 * sets of numbers — compare each only against its own history.
 *
 * ── WHY SHARED CHUNKS ARE EXCLUDED ────────────────────────────────────────────
 * The webpack runtime, the React/Next framework chunk and the app shell are
 * downloaded once and reused by every route. Charging them to each route would
 * (a) count the same bytes five times, and (b) make all five budgets lurch in
 * lockstep whenever Next.js is upgraded, which teaches people to ignore the
 * guard. So they are excluded from the per-route budgets and given their own
 * budget instead (see "shared infrastructure budget" below) — excluded, but not
 * unwatched.
 *
 * Which chunks count as shared is DERIVED FROM THE MANIFEST on every run, never
 * hardcoded. The previous version of this file listed content-hashed filenames
 * (`webpack-252f83a42f0da874.js`, …). Those hashes change on any content change,
 * so the exclusion list silently stopped matching after the next build and the
 * shared bytes quietly began counting against every route — a slow drift toward
 * false failures. Deriving the set makes the guard survive a rebuild.
 *
 * ── WHEN THIS TEST GOES RED ───────────────────────────────────────────────────
 * A red budget is a FINDING, not a chore. In order:
 *
 *   1. Read the per-chunk breakdown the failure prints. A regression almost
 *      always shows up as one newly-large chunk, not as everything creeping up.
 *   2. Find what pulled it in: `git diff` the imports on the failing route, and
 *      check whether a client component started value-importing a server module
 *      or a dataset (that is the failure mode this repo has actually had).
 *   3. Fix the import — dynamic `import()`, an API route, or a type-only import.
 *
 * ⚠️  DO NOT REFLEXIVELY RAISE THE NUMBER. Raising the budget to make the suite
 *     green converts a caught regression into a permanent one, and there is no
 *     CI here to argue with you. If you raise a budget you are asserting that
 *     the app is genuinely, intentionally bigger.
 *
 * ── WHEN RE-BASELINING IS LEGITIMATE ──────────────────────────────────────────
 *   • A deliberate feature really does add weight, the added weight has been
 *     looked at, and there is no cheaper way to ship it.
 *   • A dependency or Next.js upgrade moves the floor.
 *   • The measurement method itself changed (as on 2026-07-26 — see below).
 * In all three cases: re-measure, set budget = ceil(measured × 1.15), and update
 * the date and the reason in the table below. Never bump a budget without also
 * updating the `measured:` comment on that line — a budget with a stale
 * measurement is indistinguishable from a budget someone inflated to get green.
 *
 * ── BASELINE: measured 2026-07-26, headroom rule = ceil(measured × 1.15) ──────
 * 15% headroom absorbs ordinary build-to-build jitter (minifier output, chunk
 * re-splitting) without absorbing a real regression; the smallest real
 * regressions this repo has seen were multiples of that, not fractions.
 *
 * NOTE ON THE 2026-07-26 RE-BASELINE — the numbers below are higher than the
 * 2026-07-24 originals, and the app did NOT get bigger. The original guard
 * looked chunks up by `path.basename()` against a non-recursive `readdirSync`
 * of `.next/static/chunks`, so every route's own entry chunk (which lives in the
 * `static/chunks/app/…` subdirectory) was never found and was silently counted
 * as 0 kB. This version resolves each chunk by its full manifest-relative path
 * and FAILS on a file it cannot stat, so the route's own code is now included:
 * +94 kB on `/product-finder`, +52 kB on `/dashboard`, +16 kB on `/quote`,
 * +8 kB on `/login`, +7 kB on `/customer`. The guard now covers strictly more
 * bytes than it did before.
 *
 * ── KNOWN COVERAGE GAP ────────────────────────────────────────────────────────
 * `/product-finder/crosses` (43 kB) and `/product-finder/supplier` (36 kB) are
 * built but deliberately not budgeted here — they were not part of the original
 * guard. They are the two lightest routes and prove the achievable floor; add
 * them if they ever grow real client weight.
 */

import { describe, it } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─────────────────────────────────────────────────────────────────────────────
// Budgets
// ─────────────────────────────────────────────────────────────────────────────

interface PageEntry {
  /** Key in `app-build-manifest.json` → `pages`. */
  path: string;
  /** Ceiling in kB of raw, uncompressed JS, excluding shared chunks. */
  budget: number;
}

const budgets: PageEntry[] = [
  {
    path: "/product-finder/page",
    budget: 1071, // measured 2026-07-26: 931 kB → ceil(931 × 1.15)
  },
  {
    path: "/product-finder/login/page",
    budget: 309, // measured 2026-07-26: 268 kB → ceil(268 × 1.15)
  },
  {
    path: "/product-finder/quote/page",
    budget: 354, // measured 2026-07-26: 307 kB → ceil(307 × 1.15)
  },
  {
    path: "/product-finder/customer/page",
    budget: 971, // measured 2026-07-26: 844 kB → ceil(844 × 1.15)
  },
  {
    path: "/product-finder/dashboard/page",
    budget: 1456, // measured 2026-07-26: 1266 kB → ceil(1266 × 1.15)
  },
];

/**
 * Budget for the shared chunks that the per-route budgets exclude. Without this
 * the exclusion would be a blind spot: framework/runtime bloat would be charged
 * to nobody. measured 2026-07-26: 344 kB → ceil(344 × 1.15).
 */
const SHARED_BUDGET_KB = 396;

/**
 * A chunk referenced by at least this fraction of the manifest's route entries
 * is treated as shared infrastructure.
 *
 * Why a fraction and not "every route": in the 2026-07-26 build the four true
 * infrastructure chunks appear in 98/98 entries, while the next-most-shared
 * chunk appears in 8/98 (8%). Any threshold between ~10% and 100% selects
 * exactly the same set, so the choice is about robustness, not about which
 * chunks get picked. 0.9 leaves room for one oddball route (a differently
 * bundled route handler, say) to drop a chunk without collapsing the whole
 * exclusion set and firing five false failures at once, while sitting an order
 * of magnitude above the 8% noise floor.
 */
const SHARED_CHUNK_THRESHOLD = 0.9;

// ─────────────────────────────────────────────────────────────────────────────
// Build output location + the skip path
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `PERF_BUDGET_NEXT_DIR` overrides the build directory. It exists so the skip
 * path can be exercised (point it at a directory with no build) without
 * deleting a real `.next`. Unset in normal use.
 */
const NEXT_DIR = process.env.PERF_BUDGET_NEXT_DIR
  ? path.resolve(process.env.PERF_BUDGET_NEXT_DIR)
  : path.resolve(__dirname, "../apps/web/.next");

const MANIFEST_PATH = path.join(NEXT_DIR, "app-build-manifest.json");

/**
 * There is no build to measure. Skip rather than throw: a raw ENOENT out of
 * `readFileSync` tells a newcomer running `npm test` on a fresh checkout
 * nothing about what to do next.
 */
const HAS_BUILD = fs.existsSync(MANIFEST_PATH);

const NO_BUILD_MESSAGE = [
  "",
  "══════════════════════════════════════════════════════════════════════════",
  "  ⚠  FIRST-LOAD-JS BUDGET GUARD SKIPPED — no production build found.",
  "══════════════════════════════════════════════════════════════════════════",
  `  Looked for: ${MANIFEST_PATH}`,
  "",
  "  This guard measures real .next build output, so it needs a build first.",
  "  NOTHING WAS MEASURED. The per-route budgets were NOT checked, and a",
  "  bundle regression would NOT have been caught by this run.",
  "",
  "  Build and check in one step:",
  "",
  "      npm run verify:perf",
  "",
  "  (equivalent to: npm run build && npx vitest run lib/perf-budget.test.ts)",
  "══════════════════════════════════════════════════════════════════════════",
  "",
].join("\n");

if (!HAS_BUILD) {
  // Printed at collection time so it is visible even though the tests below are
  // reported as skipped rather than failed.
  console.warn(NO_BUILD_MESSAGE);
}

// ─────────────────────────────────────────────────────────────────────────────
// Manifest helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of `.next/app-build-manifest.json`: route key → asset paths relative to `.next/`. */
type AppBuildManifest = { pages: Record<string, string[]> };

function readManifest(): AppBuildManifest {
  const raw = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as unknown;

  if (
    typeof raw !== "object" ||
    raw === null ||
    !("pages" in raw) ||
    typeof (raw as AppBuildManifest).pages !== "object"
  ) {
    throw new Error(
      `Unexpected shape in ${MANIFEST_PATH}: expected a { pages: Record<string, string[]> } object. ` +
        `If Next.js changed the manifest format, this guard needs updating — do not delete it.`
    );
  }

  return raw as AppBuildManifest;
}

/**
 * Chunks shared across (nearly) every route — the webpack runtime, the
 * framework chunk and the app shell. Derived, never hardcoded, so the guard
 * survives a rebuild with entirely different content hashes.
 */
function deriveSharedChunks(pages: Record<string, string[]>): Set<string> {
  const entries = Object.values(pages);
  const referenceCount = new Map<string, number>();

  for (const assets of entries) {
    // De-duplicate within a route: a chunk listed twice for one route is still
    // only evidence of one route referencing it.
    for (const asset of new Set(assets)) {
      referenceCount.set(asset, (referenceCount.get(asset) ?? 0) + 1);
    }
  }

  const minRoutes = entries.length * SHARED_CHUNK_THRESHOLD;
  const shared = new Set<string>();

  for (const [asset, count] of referenceCount) {
    if (asset.endsWith(".js") && count >= minRoutes) shared.add(asset);
  }

  return shared;
}

/**
 * Size of a manifest asset, resolved by its FULL manifest-relative path.
 *
 * Resolving by `path.basename()` is wrong twice over: route entry chunks live
 * in `static/chunks/app/**` subdirectories, and Next.js gives every trivial API
 * route handler the SAME basename (`route-<hash>.js`) in a different directory.
 * Returns null when the file is absent, which callers must treat as an error —
 * a silent 0 is how the old version lost every route's own code.
 */
function sizeOnDisk(assetPath: string): number | null {
  try {
    return fs.statSync(path.join(NEXT_DIR, assetPath)).size;
  } catch {
    return null;
  }
}

const toKb = (bytes: number): number => Math.round(bytes / 1024);

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Performance budget (First-Load-JS)", () => {
  it.skipIf(!HAS_BUILD)("enforces per-route First-Load-JS budgets", () => {
    const manifest = readManifest();
    const sharedChunks = deriveSharedChunks(manifest.pages);

    if (sharedChunks.size === 0) {
      throw new Error(
        `No shared chunks could be derived from ${MANIFEST_PATH}. Every route's ` +
          `framework and runtime bytes would be charged to that route, so the ` +
          `budgets below would be meaningless. Investigate how Next.js is ` +
          `chunking this build before touching the numbers.`
      );
    }

    const failures: string[] = [];

    for (const { path: routeKey, budget } of budgets) {
      const assets = manifest.pages[routeKey];

      if (!assets) {
        const nearby = Object.keys(manifest.pages)
          .filter((k) => k.includes("/product-finder"))
          .join(", ");
        failures.push(
          `${routeKey}: missing from the manifest. Either the route was renamed ` +
            `(update this list) or the build is stale. Product-finder keys present: ${nearby}`
        );
        continue;
      }

      let totalBytes = 0;
      const breakdown: string[] = [];

      for (const asset of assets) {
        if (sharedChunks.has(asset)) continue; // charged to the shared budget instead
        if (!asset.endsWith(".js")) continue; // CSS and other assets are not a JS budget

        const bytes = sizeOnDisk(asset);

        if (bytes === null) {
          failures.push(
            `${routeKey}: manifest references ${asset}, which does not exist on disk. ` +
              `This is a stale or partial build, not a size regression — re-run \`npm run verify:perf\`.`
          );
          continue;
        }

        totalBytes += bytes;
        breakdown.push(`${path.basename(asset)} (${toKb(bytes)} kB)`);
      }

      const totalKb = toKb(totalBytes);

      if (totalKb > budget) {
        failures.push(
          `${routeKey}: ${totalKb} kB exceeds budget of ${budget} kB (over by ${totalKb - budget} kB)` +
            (breakdown.length > 0 ? `\n      chunks: ${breakdown.join(", ")}` : "")
        );
      }
    }

    if (failures.length > 0) {
      throw new Error(
        `First-Load-JS budget violations:\n  ${failures.join("\n  ")}\n\n` +
          `  Investigate the regression before touching the budgets — find what ` +
          `newly entered the client graph (usually a client component ` +
          `value-importing a server module or dataset). Raising a budget to get ` +
          `green makes the regression permanent; nothing else in this repo is watching.\n`
      );
    }
  });

  it.skipIf(!HAS_BUILD)("enforces a budget on the shared chunks it excludes", () => {
    const manifest = readManifest();
    const sharedChunks = deriveSharedChunks(manifest.pages);

    let totalBytes = 0;
    const breakdown: string[] = [];

    for (const asset of sharedChunks) {
      const bytes = sizeOnDisk(asset);

      if (bytes === null) {
        throw new Error(
          `Shared chunk ${asset} is in the manifest but not on disk — stale or ` +
            `partial build. Re-run \`npm run verify:perf\`.`
        );
      }

      totalBytes += bytes;
      breakdown.push(`${path.basename(asset)} (${toKb(bytes)} kB)`);
    }

    const totalKb = toKb(totalBytes);

    if (totalKb > SHARED_BUDGET_KB) {
      throw new Error(
        `Shared First-Load-JS infrastructure is ${totalKb} kB, over the ${SHARED_BUDGET_KB} kB budget ` +
          `(by ${totalKb - SHARED_BUDGET_KB} kB).\n      chunks: ${breakdown.join(", ")}\n\n` +
          `  These bytes are downloaded on EVERY route, so a regression here is the ` +
          `most expensive kind. Usual causes: a new dependency imported from the root ` +
          `layout, or a Next.js/React upgrade. Confirm which before re-baselining.\n`
      );
    }
  });
});
