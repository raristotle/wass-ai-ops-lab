// Merges agent-extracted cross pairs (data/real/research/xref-extract/*.json)
// into data/real/verified-crosses.ts, and records which registry sources were
// ingested (data/real/research/xref-ingested-urls.json).
//
//   node scripts/merge-extracted-crosses.mjs
//
// Filtering rules (documented in docs/source-registry.md):
//  - OptiFuse guide rows are excluded: their targets are series names, not
//    orderable SKUs, and this dataset is SKU-level only.
//  - Every kept entry must carry brand+MPN on both sides, a fetched https
//    sourceUrl, and valid relation/sourceKind enums.
//  - Same pair from the same source is deduped; same pair from different
//    sources is kept for the runtime conflict-resolution rule.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const crossFile = resolve(root, "data/real/verified-crosses.ts");
const extractDir = resolve(root, "data/real/research/xref-extract");
const VERIFIED_AT = "2026-06-11";

const RELATIONS = new Set(["equivalent", "functional-substitute"]);
const KINDS = new Set(["manufacturer-cross", "datasheet", "distributor-cross", "industry-table"]);

const BRAND_NORMALIZE = {
  "Hoffman (nVent)": "Hoffman",
  "Square D / Schneider": "Square D",
  "AutomationDirect (DINnectors)": "AutomationDirect",
  "Carol/General Cable": "Carol (General Cable)",
  GE: "GE",
};

const decode = (s) =>
  typeof s === "string"
    ? s
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'")
        .trim()
    : s;

const idKey = (s) => (s ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
// Brand-agnostic, matching validateCrossEntries: the same MPN pair from the
// same source is a duplicate even if brand spellings differ across sessions.
const pairKey = (e) => {
  const ka = idKey(e.aMpn);
  const kb = idKey(e.bMpn);
  return ka < kb ? `${ka}↔${kb}` : `${kb}↔${ka}`;
};

// ── existing dataset ──
const src = readFileSync(crossFile, "utf8");
const startIdx = src.indexOf("= [");
const endIdx = src.lastIndexOf("];");
const existing = JSON.parse(src.slice(startIdx + 2, endIdx + 1));
const existingKeys = new Set(existing.map((e) => `${pairKey(e)}@${e.sourceUrl}`));

// ── registry (for sourceId + ingested marks) ──
const regSrc = readFileSync(resolve(root, "data/real/cross-source-registry.ts"), "utf8");
const registry = JSON.parse(regSrc.slice(regSrc.indexOf("= [") + 2, regSrc.lastIndexOf("];") + 1));
const pathOf = (u) => {
  try {
    return new URL(u).pathname;
  } catch {
    return u;
  }
};
const domainOf = (u) => {
  try {
    const h = new URL(u).hostname.split(".");
    return h.slice(-2).join(".");
  } catch {
    return "";
  }
};
// Manual maps for sources whose registry URL differs from the fetched document.
const MANUAL_REGISTRY_MATCH = [
  { match: (u) => u.includes("assets.signify.com") && u.includes("cross-reference-guide"), registryUrl: "https://www.signify.com/advance/en-us/solutions/ballasts" },
  { match: (u) => u.includes("ELE-0003"), registryUrl: (regs) => regs.find((r) => r.url.includes("ELE-0003"))?.url },
];
function registryFor(url) {
  for (const r of registry) {
    if (url === r.url || url.startsWith(`${r.url}?`) || url.startsWith(`${r.url}#`)) return r;
  }
  for (const r of registry.filter((r) => r.urlTruncated)) {
    const prefix = pathOf(r.url.slice(0, -3)); // strip "..."
    if (domainOf(url) === domainOf(r.url) && pathOf(url).startsWith(prefix)) return r;
  }
  for (const m of MANUAL_REGISTRY_MATCH) {
    if (m.match(url)) {
      const target = typeof m.registryUrl === "function" ? m.registryUrl(registry) : m.registryUrl;
      const r = registry.find((x) => x.url === target);
      if (r) return r;
    }
  }
  return null;
}

// ── collect ──
const families = readdirSync(extractDir).filter((f) => f.endsWith(".json"));
const added = [];
const skipped = [];
const ingestedNotes = new Map(); // registry url → {families:Set, pairs:n}
for (const f of families) {
  const family = f.replace(/\.json$/, "");
  const data = JSON.parse(readFileSync(join(extractDir, f), "utf8"));
  for (const c of data.crosses ?? []) {
    const e = {
      aBrand: BRAND_NORMALIZE[decode(c.aBrand)] ?? decode(c.aBrand),
      aMpn: decode(c.aMpn),
      bBrand: BRAND_NORMALIZE[decode(c.bBrand)] ?? decode(c.bBrand),
      bMpn: decode(c.bMpn),
      relation: c.relation,
      sourceKind: c.sourceKind,
      sourceUrl: decode(c.sourceUrl),
      ...(c.notes ? { notes: decode(c.notes) } : {}),
      verifiedAt: VERIFIED_AT,
    };
    const stated = Object.fromEntries(
      Object.entries(c.statedAttributes ?? {}).map(([k, v]) => [decode(k), decode(v)])
    );
    if (Object.keys(stated).length > 0) e.statedAttributes = stated;

    const why = (reason) => skipped.push({ family, pair: `${e.aBrand} ${e.aMpn} ↔ ${e.bBrand} ${e.bMpn}`, reason });
    if (e.sourceUrl.includes("optifuse.com")) { why("series-level target, not an orderable SKU"); continue; }
    if (!e.aMpn || !e.bMpn || e.aMpn.length > 40 || e.bMpn.length > 40) { why("bad MPN"); continue; }
    if (!RELATIONS.has(e.relation)) { why(`bad relation ${e.relation}`); continue; }
    if (!KINDS.has(e.sourceKind)) { why(`bad sourceKind ${e.sourceKind}`); continue; }
    if (!/^https:\/\/\S+$/.test(e.sourceUrl)) { why("sourceUrl not https"); continue; }
    if (idKey(e.aMpn) === idKey(e.bMpn) && e.aBrand === e.bBrand) { why("self-cross"); continue; }
    const dup = `${pairKey(e)}@${e.sourceUrl}`;
    if (existingKeys.has(dup)) { why("already in dataset (same pair, same source)"); continue; }
    existingKeys.add(dup);

    const reg = registryFor(e.sourceUrl);
    if (reg) {
      e.sourceId = reg.id;
      const note = ingestedNotes.get(reg.url) ?? { families: new Set(), pairs: 0 };
      note.families.add(family);
      note.pairs += 1;
      ingestedNotes.set(reg.url, note);
    }
    added.push(e);
  }
}

added.sort((a, b) => a.aBrand.localeCompare(b.aBrand) || a.aMpn.localeCompare(b.aMpn) || a.bMpn.localeCompare(b.bMpn));

// ── write outputs ──
const all = [...existing, ...added];
const header = src.slice(0, src.indexOf("export const VERIFIED_CROSS_ENTRIES"));
writeFileSync(
  crossFile,
  header +
    "export const VERIFIED_CROSS_ENTRIES: VerifiedCrossEntry[] = " +
    JSON.stringify(all, null, 1) +
    ";\n"
);

const ingestedJson = {};
for (const [url, n] of ingestedNotes) {
  ingestedJson[url] = `${n.pairs} SKU-level pairs extracted (${[...n.families].join(", ")}) on ${VERIFIED_AT}`;
}
writeFileSync(resolve(root, "data/real/research/xref-ingested-urls.json"), JSON.stringify(ingestedJson, null, 1) + "\n");

// ── summary ──
console.log(`existing: ${existing.length}  added: ${added.length}  total: ${all.length}  skipped: ${skipped.length}`);
console.log(`registry sources marked ingested: ${ingestedNotes.size}`);
for (const s of skipped) console.log(`  SKIP [${s.family}] ${s.pair} — ${s.reason}`);

// anchor check against stocked products
const rp = readFileSync(resolve(root, "data/real/real-products.ts"), "utf8");
const stocked = new Set([...rp.matchAll(/"mpn":\s*"([^"]+)"/g)].map((m) => idKey(m[1])));
let both = 0, one = 0, zero = 0;
for (const e of added) {
  const a = stocked.has(idKey(e.aMpn));
  const b = stocked.has(idKey(e.bMpn));
  if (a && b) both += 1;
  else if (a || b) one += 1;
  else zero += 1;
}
console.log(`new pairs anchored: both-sides=${both} one-side=${one} unanchored=${zero}`);
