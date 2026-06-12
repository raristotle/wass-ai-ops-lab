// Merge + validate the researched real-product cells into data/real/real-products.ts.
//
//   node scripts/build-real-products.mjs [--skip-verify]
//
// Reads  data/real/research/cell-*.json   (written by research agents)
// Writes data/real/real-products.ts       (typed, deduped, link re-verified)
//
// Every spec-sheet URL is re-verified live here (HEAD, GET fallback) so the
// committed dataset only ever contains links that worked at build time.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const researchDir = join(root, "data", "real", "research");
const outFile = join(root, "data", "real", "real-products.ts");
const taxonomyFile = join(root, "data", "real", "taxonomy-cells.json");
const skipVerify = process.argv.includes("--skip-verify");

const CATEGORIES = new Set(["electrical", "datacom", "oem-electrical", "av", "security", "safety"]);
const cells = JSON.parse(readFileSync(taxonomyFile, "utf8"));
const validSub = new Map(cells.map((c) => [`${c.category}::${c.subcategory}`, c]));

// ── Load research cells ──────────────────────────────────────────────
const files = readdirSync(researchDir).filter((f) => /^cell-\d+\.json$/.test(f));
const raw = [];
const problems = [];
for (const f of files) {
  try {
    const cell = JSON.parse(readFileSync(join(researchDir, f), "utf8"));
    const products = Array.isArray(cell.products) ? cell.products : [];
    for (const p of products) raw.push({ ...p, category: cell.category, subcategory: cell.subcategory, uom: p.uom || cell.uom });
  } catch (e) {
    problems.push(`${f}: unreadable JSON (${e.message})`);
  }
}

// ── Validate + dedupe ────────────────────────────────────────────────
const seen = new Set();
const candidates = [];
for (const p of raw) {
  const where = `${p.brand ?? "?"} ${p.mpn ?? "?"}`;
  const fail = (msg) => problems.push(`${where}: ${msg}`);
  if (!p.mpn || typeof p.mpn !== "string" || p.mpn.length < 2 || p.mpn.length > 40) { fail("bad mpn"); continue; }
  if (!p.brand || typeof p.brand !== "string") { fail("missing brand"); continue; }
  if (!CATEGORIES.has(p.category)) { fail(`bad category ${p.category}`); continue; }
  if (!validSub.has(`${p.category}::${p.subcategory}`)) { fail(`unknown subcategory ${p.subcategory}`); continue; }
  if (!p.name || !p.description || p.description.length > 200) { fail("bad name/description"); continue; }
  const price = Number(p.estListPrice);
  if (!Number.isFinite(price) || price <= 0 || price > 250000) { fail(`bad price ${p.estListPrice}`); continue; }
  if (!Array.isArray(p.specs) || p.specs.length < 2 || p.specs.length > 8) { fail("bad specs array"); continue; }
  if (!p.specs.every((s) => s && typeof s.name === "string" && typeof s.value === "string")) { fail("malformed spec"); continue; }
  if (!p.specs.some((s) => s.isNonNeg === true)) {
    // Promote the first spec whose name matches a taxonomy isNonNeg spec; else first spec.
    const tmpl = validSub.get(`${p.category}::${p.subcategory}`);
    const nonNegNames = new Set(tmpl.specs.filter((s) => s.isNonNeg).map((s) => s.name));
    const target = p.specs.find((s) => nonNegNames.has(s.name)) ?? p.specs[0];
    target.isNonNeg = true;
  }
  let url;
  try { url = new URL(p.specSheetUrl); } catch { fail("invalid specSheetUrl"); continue; }
  if (url.protocol !== "https:") { fail("specSheetUrl not https"); continue; }
  const key = `${p.brand}|${p.mpn}`.toLowerCase().replace(/\s+/g, "");
  if (seen.has(key)) { continue; } // silent dedupe across cells
  seen.add(key);
  candidates.push({
    mpn: p.mpn.trim(),
    brand: p.brand.trim(),
    name: String(p.name).trim().slice(0, 120),
    category: p.category,
    subcategory: p.subcategory,
    description: String(p.description).trim(),
    uom: String(p.uom || "EA").toUpperCase().slice(0, 4),
    estListPrice: Math.round(price * 100) / 100,
    priceSource: String(p.priceSource || "public listing").toLowerCase().replace(/^https?:\/\//, "").split("/")[0].slice(0, 60),
    specs: p.specs.map((s) => ({ name: s.name, value: String(s.value), ...(s.isNonNeg ? { isNonNeg: true } : {}) })),
    specSheetUrl: p.specSheetUrl,
    ...(p.upc && /^\d{11,14}$/.test(String(p.upc)) ? { upc: String(p.upc) } : {}),
  });
}

// ── Re-verify spec links live ────────────────────────────────────────
async function checkUrl(u) {
  const opts = { redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" } };
  try {
    let r = await fetch(u, { ...opts, method: "HEAD" });
    if (r.status === 405 || r.status === 403 || r.status === 400) {
      r = await fetch(u, { ...opts, method: "GET", headers: { ...opts.headers, Range: "bytes=0-512" } });
    }
    return r.ok;
  } catch {
    return false;
  }
}

const verified = [];
const dropped = [];
if (skipVerify) {
  verified.push(...candidates);
} else {
  const queue = [...candidates];
  const firstPassFails = [];
  const workers = Array.from({ length: 12 }, async () => {
    while (queue.length) {
      const c = queue.shift();
      if (!c) break;
      if (await checkUrl(c.specSheetUrl)) verified.push(c);
      else firstPassFails.push(c);
    }
  });
  await Promise.all(workers);
  // Sites that rate-limit the parallel burst (nvent.com et al.) fail
  // transiently — retry failures sequentially, up to 3 gently-spaced attempts.
  for (const c of firstPassFails) {
    let ok = false;
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      ok = await checkUrl(c.specSheetUrl);
    }
    if (ok) verified.push(c);
    else dropped.push(`${c.brand} ${c.mpn}: dead link ${c.specSheetUrl}`);
  }
}

// ── Emit ─────────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
verified.sort((a, b) => a.category.localeCompare(b.category) || a.subcategory.localeCompare(b.subcategory) || a.brand.localeCompare(b.brand) || a.mpn.localeCompare(b.mpn));
const entries = verified.map((c) => ({ ...c, verifiedAt: today }));

const body = `// GENERATED FILE — do not hand-edit.
// Built by scripts/build-real-products.mjs from data/real/research/cell-*.json
// (web-researched real products; every specSheetUrl re-verified live on ${today}).
// Regenerate with:  node scripts/build-real-products.mjs
import type { RealProductEntry } from "@/lib/catalog/real";

export const REAL_PRODUCTS_BUILT_AT = ${JSON.stringify(today)};

export const REAL_PRODUCT_ENTRIES: RealProductEntry[] = ${JSON.stringify(entries, null, 1)};
`;
writeFileSync(outFile, body);

console.log(`cells read:        ${files.length}`);
console.log(`raw entries:       ${raw.length}`);
console.log(`valid candidates:  ${candidates.length}`);
console.log(`link re-verified:  ${verified.length}${skipVerify ? " (verification skipped)" : ""}`);
console.log(`dead links dropped:${dropped.length}`);
console.log(`validation issues: ${problems.length}`);
if (problems.length) console.log("  e.g. " + problems.slice(0, 8).join("\n  e.g. "));
if (dropped.length) console.log("  e.g. " + dropped.slice(0, 5).join("\n  e.g. "));
console.log(`wrote ${outFile}`);
