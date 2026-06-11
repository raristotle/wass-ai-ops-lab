/**
 * lib/acceptance-tier1.test.ts — Tier 1 polish acceptance gap-fillers.
 *
 * Each test is tagged with the acceptance criterion (AC#) it proves. Criteria
 * already proven by colocated unit tests are cited in the acceptance report,
 * not duplicated here. Node-only: no DOM, no JSX.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

import { useProductFinder, DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/product-finder-store";
import { parseQuery } from "@/lib/product-finder-nl-search";
import { suggestCorrection } from "@/lib/product-finder-suggest-correction";

const ROOT = process.cwd();

/** The seven lib modules introduced by the Tier 1 polish update. */
const NEW_LIB_MODULES = [
  "lib/product-finder-plate.ts",
  "lib/product-finder-synonyms.ts",
  "lib/product-finder-suggest-correction.ts",
  "lib/product-finder-url.ts",
  "lib/product-finder-voice.ts",
  "lib/product-finder-commands.ts",
  "lib/product-finder-tour-content.ts",
] as const;

// ─── F2: demo accounts & role switching (lib half of AC7–AC10) ────────────────

// AC7–AC10 (lib-level): login(email, DEMO_PASSWORD) succeeds for each demo
// account and sets the matching role on the store user.
describe("AC7–AC10 (lib half) — every demo account logs in with DEMO_PASSWORD and gets its role", () => {
  it("all 3 demo accounts authenticate and land on the right role", () => {
    const expectedRoles: Record<string, string> = {
      "sales@meridiansupply.com": "sales",
      "manager@meridiansupply.com": "manager",
      "admin@meridiansupply.com": "admin",
    };
    expect(DEMO_ACCOUNTS).toHaveLength(3);
    for (const account of DEMO_ACCOUNTS) {
      const ok = useProductFinder.getState().login(account.email, DEMO_PASSWORD);
      expect(ok, `login failed for ${account.email}`).toBe(true);
      const user = useProductFinder.getState().user;
      expect(user?.email).toBe(account.email);
      expect(user?.role).toBe(expectedRoles[account.email]);
      expect(user?.role).toBe(account.role); // DEMO_ACCOUNTS projection agrees
      useProductFinder.getState().logout();
    }
    expect(useProductFinder.getState().user).toBeNull();
  });
});

// ─── F3: synonyms & did-you-mean ──────────────────────────────────────────────

// AC16: parseQuery("romex 12/2") yields a Wire & Cable subcategory chip and
// residual text containing NM-B (with the 12/2 spec preserved, not eaten as a
// price range).
describe('AC16 — parseQuery("romex 12/2")', () => {
  it("produces the subcategory chip and NM-B residual text", () => {
    const r = parseQuery("romex 12/2");
    expect(r.filters).toContainEqual(
      expect.objectContaining({ kind: "subcategory", value: "Wire & Cable" }),
    );
    expect(r.text).toContain("nm-b");
    expect(r.text).toContain("12/2");
    // 12/2 must NOT be misread as a price range
    expect(r.filters.some((f) => f.kind === "priceMin" || f.kind === "priceMax")).toBe(false);
  });
});

// AC19: "swich" → switch ("switch" is in COMMON_TERMS, so in the vocabulary);
// nonsense "zzzzzz" → null.
describe("AC19 — suggestCorrection gap cases", () => {
  it('"swich" corrects to "switch"', () => {
    const r = suggestCorrection("swich");
    expect(r).not.toBeNull();
    expect(r!.corrected).toBe("switch");
  });

  it('nonsense "zzzzzz" → null', () => {
    expect(suggestCorrection("zzzzzz")).toBeNull();
  });
});

// AC18 (import hygiene): the suggest-correction module imports ONLY
// lib/catalog/taxonomy — never the catalog generator or catalog index.
describe("AC18 — buildVocabulary input boundary", () => {
  it("suggest-correction imports only @/lib/catalog/taxonomy (no generate / catalog index)", () => {
    const src = readFileSync(path.join(ROOT, "lib/product-finder-suggest-correction.ts"), "utf8");
    const importLines = src.split("\n").filter((l) => /^\s*import\s/.test(l));
    expect(importLines).toHaveLength(1);
    expect(importLines[0]).toContain('from "@/lib/catalog/taxonomy"');
    expect(src).not.toContain("catalog/generate");
    expect(src).not.toContain('from "@/lib/catalog/index"');
    expect(src).not.toContain("catalog-products");
  });
});

// ─── F5: AC38 (partial) — no new routes were added ────────────────────────────

// AC38 (filesystem half): the dashboard wires into EXISTING surfaces — no new
// route directories under apps/web/app/product-finder, api routes unchanged.
describe("AC38 (partial) — route surface is frozen", () => {
  it("apps/web/app/product-finder contains exactly the 3 known pages + layout", () => {
    const dir = path.join(ROOT, "apps/web/app/product-finder");
    const entries = readdirSync(dir).sort();
    expect(entries).toEqual(["dashboard", "layout.tsx", "login", "page.tsx"]);
    expect(readdirSync(path.join(dir, "dashboard"))).toEqual(["page.tsx"]);
    expect(readdirSync(path.join(dir, "login"))).toEqual(["page.tsx"]);
    expect(statSync(path.join(dir, "page.tsx")).isFile()).toBe(true);
  });

  it("the api/products route files are exactly the 6 known routes", () => {
    const apiDir = path.join(ROOT, "apps/web/app/api/products");
    const files: string[] = [];
    const walk = (d: string) => {
      for (const entry of readdirSync(d)) {
        const full = path.join(d, entry);
        if (statSync(full).isDirectory()) walk(full);
        else files.push(path.relative(apiDir, full).replace(/\\/g, "/"));
      }
    };
    walk(apiDir);
    expect(files.sort()).toEqual([
      "[id]/goeswith/route.ts",
      "[id]/live/route.ts",
      "[id]/route.ts",
      "resolve/route.ts",
      "search/route.ts",
      "suggest/route.ts",
    ]);
  });
});

// ─── F7: AC45 — zero new dependencies ─────────────────────────────────────────

// AC45: no dependency was ADDED to root or apps/web package.json vs git HEAD.
describe("AC45 — zero new dependencies vs git HEAD", () => {
  function depNames(json: string): string[] {
    const pkg = JSON.parse(json) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
  }

  it.each(["package.json", "apps/web/package.json"])("%s has no added deps", (rel) => {
    const headJson = execSync(`git show HEAD:${rel}`, { cwd: ROOT, encoding: "utf8" });
    const headDeps = new Set(depNames(headJson));
    const currentDeps = depNames(readFileSync(path.join(ROOT, rel), "utf8"));
    const added = currentDeps.filter((d) => !headDeps.has(d));
    expect(added, `new dependencies added in ${rel}`).toEqual([]);
  });
});

// ─── Cross-cutting: AC55 / AC56 ───────────────────────────────────────────────

// AC55 (new-modules half): none of the 7 new lib modules touch localStorage at
// all. (Store accesses are guarded — verified by inspection, see report.)
describe("AC55 — new lib modules never touch localStorage", () => {
  it.each(NEW_LIB_MODULES)("%s has no localStorage reference", (rel) => {
    const src = readFileSync(path.join(ROOT, rel), "utf8");
    expect(src.includes("localStorage")).toBe(false);
  });
});

// AC56: no Date.now() / Math.random() calls in any new lib module (pure &
// deterministic). Matches call sites, not prose comments.
describe("AC56 — new lib modules are deterministic (no Date.now / Math.random calls)", () => {
  it.each(NEW_LIB_MODULES)("%s has no nondeterministic calls", (rel) => {
    const src = readFileSync(path.join(ROOT, rel), "utf8");
    expect(/Date\.now\s*\(/.test(src)).toBe(false);
    expect(/Math\.random\s*\(/.test(src)).toBe(false);
  });
});
